-- Intelligence Survival - Leveling & XP Schema
-- ===============================================
-- This schema implements a comprehensive leveling system with:
-- - Base level progression (like Runescape hitpoints)
-- - Individual skill levels with specialized bonuses
-- - Exponential XP requirements
-- - Success rate modifiers based on levels
-- - XP tracking and animation support

-- Base Character Stats Table
CREATE TABLE IF NOT EXISTS character_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  base_level INTEGER DEFAULT 3 CHECK (base_level >= 1 AND base_level <= 100),
  base_xp BIGINT DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  total_successful_missions INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills Definition Table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  skill_code TEXT UNIQUE NOT NULL,
  skill_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  is_toggleable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Skills Progress Table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  skill_level INTEGER DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 100),
  skill_xp BIGINT DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE, -- For toggleable skills like Greatest Alley
  times_used INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- XP Gains Log for Animation and Tracking
CREATE TABLE IF NOT EXISTS xp_gains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_session_id UUID REFERENCES mission_sessions(id) ON DELETE CASCADE,
  base_xp_gained INTEGER DEFAULT 0,
  skill_id INTEGER REFERENCES skills(id),
  skill_xp_gained INTEGER DEFAULT 0,
  reason TEXT NOT NULL, -- e.g., "Successful tech infiltration", "Mission completion"
  multiplier DECIMAL(3,2) DEFAULT 1.00, -- XP multipliers for bonuses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Level Requirements Table (Exponential like Runescape)
CREATE TABLE IF NOT EXISTS level_requirements (
  level INTEGER PRIMARY KEY CHECK (level >= 1 AND level <= 100),
  xp_required BIGINT NOT NULL,
  xp_to_next BIGINT NOT NULL
);

-- Skill Bonuses Configuration
CREATE TABLE IF NOT EXISTS skill_bonuses (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  mission_category TEXT NOT NULL, -- e.g., "tech", "military", "stealth"
  success_bonus_per_level DECIMAL(4,2) NOT NULL, -- % bonus per level
  xp_bonus_multiplier DECIMAL(3,2) DEFAULT 1.00,
  penalty_categories TEXT[], -- Categories that get penalties (for Greatest Alley)
  penalty_per_level DECIMAL(4,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined skills
INSERT INTO skills (skill_code, skill_name, description, icon_name, is_toggleable) VALUES
('risk_taker', 'Risk Taker', 'Increased success rate for high-risk decisions. Each level provides better odds when taking dangerous actions.', 'dice', false),
('q_tech', 'Q Tech', 'Enhanced success rate for technology-related missions. Expertise in cyber warfare, hacking, and tech infiltration.', 'computer', false),
('bourne', 'Bourne', 'Superior performance in physical action and stealth missions. Increased success while maintaining operational security.', 'eye-off', false),
('carrie', 'Carrie', 'Expert asset management with high risk/reward. Success brings major benefits, but failures have severe consequences.', 'users', false),
('greatest_alley', 'Greatest Alley', 'Enhanced success and XP bonus for Israel/Mossad operations, but penalties for Middle East adversaries. Can be toggled off.', 'flag', true),
('brody', 'Brody', 'Military operations specialist. Improved success rates for all military-related missions and combat scenarios.', 'shield', false),
('ghost_protocol', 'Ghost Protocol', 'Master of disappearing and false identities. Increased success in extraction and infiltration missions.', 'user-x', false),
('honey_trap', 'Honey Trap', 'Social manipulation and seduction specialist. Higher success rates in missions requiring human intelligence.', 'heart', false),
('crypto_king', 'Crypto King', 'Financial warfare expert. Enhanced success in economic espionage and asset seizure missions.', 'dollar-sign', false),
('deep_throat', 'Deep Throat', 'Information broker extraordinaire. Bonus XP and success rates when gathering intelligence from sources.', 'message-circle', false)
ON CONFLICT (skill_code) DO NOTHING;

-- Populate level requirements (exponential growth similar to Runescape)
INSERT INTO level_requirements (level, xp_required, xp_to_next)
SELECT 
  level,
  CASE 
    WHEN level = 1 THEN 0
    ELSE FLOOR(SUM(FLOOR(level_calc + 300 * POWER(2, level_calc/7.0))) OVER (ORDER BY level_calc ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)) / 4
  END as xp_required,
  CASE 
    WHEN level = 100 THEN 0
    ELSE FLOOR(level + 300 * POWER(2, level/7.0)) / 4
  END as xp_to_next
FROM generate_series(1, 100) as level_calc(level)
ON CONFLICT (level) DO NOTHING;

-- Insert skill bonuses configuration
INSERT INTO skill_bonuses (skill_id, mission_category, success_bonus_per_level, xp_bonus_multiplier, penalty_categories, penalty_per_level) VALUES
((SELECT id FROM skills WHERE skill_code = 'risk_taker'), 'high_risk', 0.50, 1.00, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'q_tech'), 'technology', 0.75, 1.10, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'q_tech'), 'cyber', 0.75, 1.15, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'bourne'), 'stealth', 0.60, 1.05, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'bourne'), 'physical', 0.60, 1.05, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'carrie'), 'asset_management', 1.00, 1.20, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'greatest_alley'), 'israel', 0.80, 1.25, ARRAY['iran', 'iraq', 'pakistan', 'palestine'], 0.30),
((SELECT id FROM skills WHERE skill_code = 'greatest_alley'), 'mossad', 0.80, 1.25, ARRAY['iran', 'iraq', 'pakistan', 'palestine'], 0.30),
((SELECT id FROM skills WHERE skill_code = 'brody'), 'military', 0.65, 1.10, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'brody'), 'combat', 0.65, 1.10, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'ghost_protocol'), 'extraction', 0.70, 1.15, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'ghost_protocol'), 'infiltration', 0.70, 1.15, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'honey_trap'), 'social', 0.85, 1.20, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'honey_trap'), 'humint', 0.85, 1.20, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'crypto_king'), 'financial', 0.75, 1.25, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'crypto_king'), 'economic', 0.75, 1.25, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'deep_throat'), 'intelligence', 0.60, 1.30, NULL, 0),
((SELECT id FROM skills WHERE skill_code = 'deep_throat'), 'information', 0.60, 1.30, NULL, 0)
ON CONFLICT DO NOTHING;

-- Function to calculate XP needed for a specific level
CREATE OR REPLACE FUNCTION get_xp_for_level(target_level INTEGER)
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT xp_required FROM level_requirements WHERE level = target_level);
END;
$$ LANGUAGE plpgsql;

-- Function to get current level from XP
CREATE OR REPLACE FUNCTION get_level_from_xp(current_xp BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT level 
    FROM level_requirements 
    WHERE xp_required <= current_xp 
    ORDER BY level DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate success rate bonus for a user
CREATE OR REPLACE FUNCTION calculate_success_bonus(
  p_user_id UUID,
  p_mission_category TEXT,
  p_risk_level TEXT DEFAULT 'MEDIUM'
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_bonus DECIMAL(5,2) := 0;
  skill_bonus DECIMAL(5,2);
  skill_penalty DECIMAL(5,2);
  user_skill_record RECORD;
BEGIN
  -- Base level bonus (small universal bonus)
  SELECT (get_level_from_xp(base_xp) - 3) * 0.10 INTO skill_bonus
  FROM character_stats 
  WHERE user_id = p_user_id;
  
  total_bonus := total_bonus + COALESCE(skill_bonus, 0);
  
  -- Skill-specific bonuses
  FOR user_skill_record IN 
    SELECT us.skill_level, us.is_enabled, s.skill_code, sb.success_bonus_per_level, sb.penalty_categories, sb.penalty_per_level
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    LEFT JOIN skill_bonuses sb ON s.id = sb.skill_id AND sb.mission_category = p_mission_category
    WHERE us.user_id = p_user_id AND us.is_enabled = true
  LOOP
    -- Add bonuses
    IF user_skill_record.success_bonus_per_level IS NOT NULL THEN
      skill_bonus := (user_skill_record.skill_level - 1) * user_skill_record.success_bonus_per_level;
      total_bonus := total_bonus + skill_bonus;
    END IF;
    
    -- Check for penalties (Greatest Alley skill)
    IF user_skill_record.penalty_categories IS NOT NULL AND 
       p_mission_category = ANY(user_skill_record.penalty_categories) THEN
      skill_penalty := (user_skill_record.skill_level - 1) * user_skill_record.penalty_per_level;
      total_bonus := total_bonus - skill_penalty;
    END IF;
    
    -- Risk Taker bonus for high-risk missions
    IF user_skill_record.skill_code = 'risk_taker' AND p_risk_level = 'HIGH' THEN
      skill_bonus := (user_skill_record.skill_level - 1) * 0.75; -- Extra bonus for high risk
      total_bonus := total_bonus + skill_bonus;
    END IF;
  END LOOP;
  
  RETURN GREATEST(total_bonus, -50.00); -- Cap at -50% penalty max
END;
$$ LANGUAGE plpgsql;

-- Function to award XP
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_mission_session_id UUID,
  p_base_xp INTEGER,
  p_skill_code TEXT DEFAULT NULL,
  p_skill_xp INTEGER DEFAULT 0,
  p_reason TEXT DEFAULT 'Mission activity',
  p_multiplier DECIMAL(3,2) DEFAULT 1.00
)
RETURNS JSON AS $$
DECLARE
  skill_record RECORD;
  old_base_level INTEGER;
  new_base_level INTEGER;
  old_skill_level INTEGER;
  new_skill_level INTEGER;
  result JSON;
BEGIN
  -- Get current base level
  SELECT get_level_from_xp(base_xp) INTO old_base_level
  FROM character_stats WHERE user_id = p_user_id;
  
  -- Award base XP
  UPDATE character_stats 
  SET base_xp = base_xp + FLOOR(p_base_xp * p_multiplier),
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Get new base level
  SELECT get_level_from_xp(base_xp) INTO new_base_level
  FROM character_stats WHERE user_id = p_user_id;
  
  -- Initialize result
  result := json_build_object(
    'base_xp_gained', FLOOR(p_base_xp * p_multiplier),
    'base_level_up', new_base_level > old_base_level,
    'old_base_level', old_base_level,
    'new_base_level', new_base_level
  );
  
  -- Award skill XP if specified
  IF p_skill_code IS NOT NULL AND p_skill_xp > 0 THEN
    SELECT s.*, us.skill_level, us.skill_xp INTO skill_record
    FROM skills s
    LEFT JOIN user_skills us ON s.id = us.skill_id AND us.user_id = p_user_id
    WHERE s.skill_code = p_skill_code;
    
    old_skill_level := COALESCE(skill_record.skill_level, 1);
    
    -- Insert or update user skill
    INSERT INTO user_skills (user_id, skill_id, skill_level, skill_xp)
    VALUES (p_user_id, skill_record.id, 1, FLOOR(p_skill_xp * p_multiplier))
    ON CONFLICT (user_id, skill_id)
    DO UPDATE SET 
      skill_xp = user_skills.skill_xp + FLOOR(p_skill_xp * p_multiplier),
      skill_level = get_level_from_xp(user_skills.skill_xp + FLOOR(p_skill_xp * p_multiplier)),
      updated_at = NOW();
    
    -- Get new skill level
    SELECT skill_level INTO new_skill_level
    FROM user_skills 
    WHERE user_id = p_user_id AND skill_id = skill_record.id;
    
    -- Update result with skill info
    result := result || json_build_object(
      'skill_xp_gained', FLOOR(p_skill_xp * p_multiplier),
      'skill_level_up', new_skill_level > old_skill_level,
      'old_skill_level', old_skill_level,
      'new_skill_level', new_skill_level,
      'skill_name', skill_record.skill_name,
      'skill_code', p_skill_code
    );
  END IF;
  
  -- Log the XP gain
  INSERT INTO xp_gains (user_id, mission_session_id, base_xp_gained, skill_id, skill_xp_gained, reason, multiplier)
  VALUES (p_user_id, p_mission_session_id, FLOOR(p_base_xp * p_multiplier), 
          (SELECT id FROM skills WHERE skill_code = p_skill_code), 
          FLOOR(p_skill_xp * p_multiplier), p_reason, p_multiplier);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize character for new user
CREATE OR REPLACE FUNCTION initialize_character(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create character stats if not exists
  INSERT INTO character_stats (user_id, base_level, base_xp)
  VALUES (p_user_id, 3, get_xp_for_level(3))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize all skills at level 1
  INSERT INTO user_skills (user_id, skill_id, skill_level, skill_xp)
  SELECT p_user_id, id, 1, 0
  FROM skills
  ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize character when user is created
CREATE OR REPLACE FUNCTION trigger_initialize_character()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_character(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_xp_gains_user_id ON xp_gains(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_gains_mission_id ON xp_gains(mission_session_id);
CREATE INDEX IF NOT EXISTS idx_level_requirements_xp ON level_requirements(xp_required);

-- Views for easy querying
CREATE OR REPLACE VIEW user_character_overview AS
SELECT 
  cs.user_id,
  cs.base_level,
  cs.base_xp,
  (SELECT xp_required FROM level_requirements WHERE level = cs.base_level + 1) - cs.base_xp as xp_to_next_level,
  cs.total_missions_completed,
  cs.total_successful_missions,
  CASE 
    WHEN cs.total_missions_completed > 0 
    THEN ROUND((cs.total_successful_missions::DECIMAL / cs.total_missions_completed) * 100, 2)
    ELSE 0 
  END as success_rate,
  cs.reputation_score,
  cs.created_at,
  cs.updated_at
FROM character_stats cs;

CREATE OR REPLACE VIEW user_skills_overview AS
SELECT 
  us.user_id,
  s.skill_code,
  s.skill_name,
  s.description,
  s.icon_name,
  s.is_toggleable,
  us.skill_level,
  us.skill_xp,
  (SELECT xp_required FROM level_requirements WHERE level = us.skill_level + 1) - us.skill_xp as xp_to_next_level,
  us.is_enabled,
  us.times_used,
  us.success_rate,
  us.updated_at
FROM user_skills us
JOIN skills s ON us.skill_id = s.id;

-- Update triggers for automatic timestamp updates
CREATE TRIGGER update_character_stats_updated_at
    BEFORE UPDATE ON character_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 