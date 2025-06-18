-- Intelligence Survival - Database Repair Script
-- Run this in your Supabase SQL Editor to fix missing XP system components

-- First, let's add missing columns to existing tables
ALTER TABLE public.mission_sessions 
ADD COLUMN IF NOT EXISTS max_rounds INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS mission_steps_completed TEXT[] DEFAULT '{}';

ALTER TABLE public.user_decisions 
ADD COLUMN IF NOT EXISTS decision_context TEXT,
ADD COLUMN IF NOT EXISTS risk_assessment TEXT CHECK (risk_assessment IN ('LOW', 'MEDIUM', 'HIGH'));

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.skills (
  id SERIAL PRIMARY KEY,
  skill_code TEXT NOT NULL UNIQUE,
  skill_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'star',
  is_toggleable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.xp_gains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_session_id UUID REFERENCES mission_sessions(id) ON DELETE CASCADE,
  base_xp_gained INTEGER NOT NULL DEFAULT 0,
  skill_id INTEGER REFERENCES skills(id),
  skill_xp_gained INTEGER DEFAULT 0,
  reason TEXT NOT NULL,
  multiplier NUMERIC(3,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.level_requirements (
  level INTEGER PRIMARY KEY,
  xp_required BIGINT NOT NULL,
  xp_to_next BIGINT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_gains_user_id ON public.xp_gains(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_gains_created_at ON public.xp_gains(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);

-- Insert skills data
INSERT INTO public.skills (skill_code, skill_name, description, icon_name, is_toggleable) VALUES
('RISK_TAKER', 'Risk Taker', 'Thrives under high-pressure situations with maximum stakes', 'zap', false),
('Q_TECH', 'Q Tech', 'Advanced technology and gadget expertise for modern operations', 'cpu', false),
('BOURNE', 'Bourne', 'Physical action and stealth capabilities for field operations', 'shield', false),
('CARRIE', 'Carrie', 'Asset management with high risk/reward operational style', 'users', false),
('GREATEST_ALLEY', 'Greatest Alley', 'Israel/Mossad cooperation specialist (toggleable)', 'flag', true),
('BRODY', 'Brody', 'Military operations and combat tactics expertise', 'target', false),
('GHOST_PROTOCOL', 'Ghost Protocol', 'Deep cover and disavowed operations specialist', 'eye-off', false),
('HONEY_TRAP', 'Honey Trap', 'Social engineering and seduction operations', 'heart', false),
('CRYPTO_KING', 'Crypto King', 'Cryptocurrency and financial intelligence operations', 'dollar-sign', false),
('DEEP_THROAT', 'Deep Throat', 'Information gathering and source development', 'mic', false)
ON CONFLICT (skill_code) DO NOTHING;

-- Populate level requirements (Runescape-style exponential)
INSERT INTO public.level_requirements (level, xp_required, xp_to_next)
SELECT 
  level,
  CASE 
    WHEN level = 1 THEN 0
    ELSE FLOOR(SUM(FLOOR(level_calc + 300 * POWER(2, level_calc / 7.0))) OVER (ORDER BY level_calc ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / 4.0)
  END as xp_required,
  CASE 
    WHEN level = 100 THEN 0
    ELSE FLOOR(level + 300 * POWER(2, level / 7.0)) / 4
  END as xp_to_next
FROM (
  SELECT generate_series(1, 100) as level, generate_series(1, 100) as level_calc
) levels
ON CONFLICT (level) DO NOTHING;

-- Create database views for easy data access
CREATE OR REPLACE VIEW public.user_character_overview AS
SELECT 
  cs.*,
  lr.xp_to_next as base_xp_to_next,
  COALESCE(recent_xp.recent_xp_count, 0) as recent_xp_gains
FROM character_stats cs
LEFT JOIN level_requirements lr ON lr.level = cs.base_level
LEFT JOIN (
  SELECT 
    user_id, 
    COUNT(*) as recent_xp_count
  FROM xp_gains 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
) recent_xp ON recent_xp.user_id = cs.user_id;

CREATE OR REPLACE VIEW public.user_skills_overview AS
SELECT 
  us.*,
  s.skill_name,
  s.skill_code,
  s.description,
  s.icon_name,
  s.is_toggleable,
  lr.xp_to_next as skill_xp_to_next
FROM user_skills us
JOIN skills s ON s.id = us.skill_id
LEFT JOIN level_requirements lr ON lr.level = us.skill_level;

-- Create essential functions
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp_amount BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(level) FROM level_requirements WHERE xp_required <= xp_amount),
    1
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.initialize_character(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert character stats if not exists
  INSERT INTO character_stats (user_id, base_level, base_xp, total_missions_completed, total_successful_missions, reputation_score)
  VALUES (p_user_id, 3, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert all skills for the user if not exists
  INSERT INTO user_skills (user_id, skill_id, skill_level, skill_xp, is_enabled, times_used, success_rate)
  SELECT 
    p_user_id,
    s.id,
    1, -- Starting level
    0, -- Starting XP
    NOT s.is_toggleable OR s.skill_code != 'GREATEST_ALLEY', -- Greatest Alley starts disabled
    0, -- Times used
    0.00 -- Success rate
  FROM skills s
  ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_mission_session_id UUID,
  p_base_xp INTEGER,
  p_skill_code TEXT DEFAULT NULL,
  p_skill_xp INTEGER DEFAULT 0,
  p_reason TEXT DEFAULT 'Mission activity',
  p_multiplier NUMERIC DEFAULT 1.0
)
RETURNS JSON AS $$
DECLARE
  v_skill_id INTEGER;
  v_old_base_level INTEGER;
  v_new_base_level INTEGER;
  v_old_skill_level INTEGER;
  v_new_skill_level INTEGER;
  v_final_base_xp INTEGER;
  v_final_skill_xp INTEGER;
  v_base_level_up BOOLEAN := FALSE;
  v_skill_level_up BOOLEAN := FALSE;
  v_skill_name TEXT;
BEGIN
  -- Calculate final XP amounts with multiplier
  v_final_base_xp := FLOOR(p_base_xp * p_multiplier);
  v_final_skill_xp := FLOOR(p_skill_xp * p_multiplier);
  
  -- Get skill ID if skill code provided
  IF p_skill_code IS NOT NULL THEN
    SELECT id, skill_name INTO v_skill_id, v_skill_name
    FROM skills WHERE skill_code = p_skill_code;
  END IF;
  
  -- Update base XP and level
  SELECT base_level INTO v_old_base_level 
  FROM character_stats WHERE user_id = p_user_id;
  
  UPDATE character_stats 
  SET 
    base_xp = base_xp + v_final_base_xp,
    base_level = calculate_level_from_xp(base_xp + v_final_base_xp),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  SELECT base_level INTO v_new_base_level 
  FROM character_stats WHERE user_id = p_user_id;
  
  v_base_level_up := v_new_base_level > v_old_base_level;
  
  -- Update skill XP and level if skill specified
  IF v_skill_id IS NOT NULL AND v_final_skill_xp > 0 THEN
    SELECT skill_level INTO v_old_skill_level
    FROM user_skills 
    WHERE user_id = p_user_id AND skill_id = v_skill_id;
    
    UPDATE user_skills
    SET 
      skill_xp = skill_xp + v_final_skill_xp,
      skill_level = calculate_level_from_xp(skill_xp + v_final_skill_xp),
      times_used = times_used + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id AND skill_id = v_skill_id;
    
    SELECT skill_level INTO v_new_skill_level
    FROM user_skills 
    WHERE user_id = p_user_id AND skill_id = v_skill_id;
    
    v_skill_level_up := v_new_skill_level > v_old_skill_level;
  END IF;
  
  -- Log XP gain
  INSERT INTO xp_gains (
    user_id, 
    mission_session_id, 
    base_xp_gained, 
    skill_id, 
    skill_xp_gained, 
    reason, 
    multiplier
  ) VALUES (
    p_user_id, 
    p_mission_session_id, 
    v_final_base_xp, 
    v_skill_id, 
    v_final_skill_xp, 
    p_reason, 
    p_multiplier
  );
  
  -- Return result
  RETURN json_build_object(
    'base_xp_gained', v_final_base_xp,
    'base_level_up', v_base_level_up,
    'old_base_level', v_old_base_level,
    'new_base_level', v_new_base_level,
    'skill_xp_gained', v_final_skill_xp,
    'skill_level_up', v_skill_level_up,
    'old_skill_level', v_old_skill_level,
    'new_skill_level', v_new_skill_level,
    'skill_name', v_skill_name,
    'skill_code', p_skill_code
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.calculate_success_bonus(
  p_user_id UUID,
  p_mission_category TEXT,
  p_risk_level TEXT DEFAULT 'MEDIUM'
)
RETURNS NUMERIC AS $$
DECLARE
  v_bonus NUMERIC := 0;
BEGIN
  -- Calculate success bonus based on relevant skill levels
  SELECT COALESCE(SUM(
    CASE 
      WHEN s.skill_code = 'RISK_TAKER' AND p_risk_level = 'HIGH' THEN us.skill_level * 2.0
      WHEN s.skill_code = 'Q_TECH' AND p_mission_category ILIKE '%tech%' THEN us.skill_level * 1.5
      WHEN s.skill_code = 'BOURNE' AND p_mission_category ILIKE '%stealth%' THEN us.skill_level * 1.5
      WHEN s.skill_code = 'BRODY' AND p_mission_category ILIKE '%military%' THEN us.skill_level * 1.5
      ELSE us.skill_level * 0.5
    END
  ), 0) INTO v_bonus
  FROM user_skills us
  JOIN skills s ON s.id = us.skill_id
  WHERE us.user_id = p_user_id AND us.is_enabled = TRUE;
  
  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_mission_completion_stats(
  p_user_id UUID,
  p_was_successful BOOLEAN,
  p_success_score INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE character_stats 
  SET 
    total_missions_completed = total_missions_completed + 1,
    total_successful_missions = CASE 
      WHEN p_was_successful THEN total_successful_missions + 1 
      ELSE total_successful_missions 
    END,
    reputation_score = GREATEST(0, reputation_score + 
      CASE 
        WHEN p_was_successful THEN FLOOR(p_success_score / 10.0)
        ELSE -FLOOR((100 - p_success_score) / 20.0)
      END
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO character_stats (
      user_id, base_level, base_xp, total_missions_completed,
      total_successful_missions, reputation_score
    ) VALUES (
      p_user_id, 3, 0, 1,
      CASE WHEN p_was_successful THEN 1 ELSE 0 END,
      GREATEST(0, FLOOR(p_success_score / 10.0))
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that have updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_character_stats_updated_at') THEN
    CREATE TRIGGER update_character_stats_updated_at
      BEFORE UPDATE ON character_stats
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_skills_updated_at') THEN
    CREATE TRIGGER update_user_skills_updated_at
      BEFORE UPDATE ON user_skills
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_mission_sessions_updated_at') THEN
    CREATE TRIGGER update_mission_sessions_updated_at
      BEFORE UPDATE ON mission_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Test the initialization (replace with your actual user ID)
-- SELECT initialize_character('your-user-id-here');

NOTIFY pgrst, 'reload schema'; 