-- Skills System Update: Make all skills active except Greatest Alley
-- This script makes all skills active by default and non-toggleable except for "Greatest Alley"

-- Step 1: Update all skills to be non-toggleable except Greatest Alley
UPDATE skills 
SET is_toggleable = false 
WHERE skill_code != 'greatest_alley';

-- Step 2: Ensure all users have all skills enabled by default (except Greatest Alley)
UPDATE user_skills 
SET is_enabled = true 
WHERE skill_id IN (
    SELECT id FROM skills WHERE skill_code != 'greatest_alley'
);

-- Step 3: Update the award_xp function to check skill enablement for XP awards
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
  skill_enabled BOOLEAN := true;
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
  
  -- Award skill XP if specified and skill is enabled
  IF p_skill_code IS NOT NULL AND p_skill_xp > 0 THEN
    -- Check if skill is enabled for this user
    SELECT us.is_enabled INTO skill_enabled
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE us.user_id = p_user_id AND s.skill_code = p_skill_code;
    
    -- Only award skill XP if skill is enabled (or if skill doesn't exist yet - new users)
    IF skill_enabled IS NULL OR skill_enabled = true THEN
      SELECT s.*, us.skill_level, us.skill_xp INTO skill_record
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id AND us.user_id = p_user_id
      WHERE s.skill_code = p_skill_code;
      
      old_skill_level := COALESCE(skill_record.skill_level, 1);
      
      -- Insert or update user skill
      INSERT INTO user_skills (user_id, skill_id, skill_level, skill_xp, is_enabled)
      VALUES (p_user_id, skill_record.id, 1, FLOOR(p_skill_xp * p_multiplier), 
              CASE WHEN skill_record.skill_code = 'greatest_alley' THEN COALESCE(skill_enabled, false) ELSE true END)
      ON CONFLICT (user_id, skill_id)
      DO UPDATE SET 
        skill_xp = user_skills.skill_xp + FLOOR(p_skill_xp * p_multiplier),
        skill_level = get_level_from_xp(user_skills.skill_xp + FLOOR(p_skill_xp * p_multiplier)),
        times_used = user_skills.times_used + 1,
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
      
      -- Log the XP gain
      INSERT INTO xp_gains (user_id, mission_session_id, base_xp_gained, skill_id, skill_xp_gained, reason, multiplier)
      VALUES (p_user_id, p_mission_session_id, FLOOR(p_base_xp * p_multiplier), 
              skill_record.id, 
              FLOOR(p_skill_xp * p_multiplier), p_reason, p_multiplier);
    ELSE
      -- Skill is disabled, don't award XP but still log the attempt
      SELECT s.skill_name INTO skill_record
      FROM skills s
      WHERE s.skill_code = p_skill_code;
      
      result := result || json_build_object(
        'skill_xp_gained', 0,
        'skill_level_up', false,
        'skill_name', skill_record,
        'skill_code', p_skill_code,
        'skill_disabled', true
      );
      
      -- Log base XP only (no skill XP)
      INSERT INTO xp_gains (user_id, mission_session_id, base_xp_gained, skill_id, skill_xp_gained, reason, multiplier)
      VALUES (p_user_id, p_mission_session_id, FLOOR(p_base_xp * p_multiplier), 
              NULL, 0, p_reason || ' (skill disabled)', p_multiplier);
    END IF;
  ELSE
    -- No skill XP to award, just log base XP
    INSERT INTO xp_gains (user_id, mission_session_id, base_xp_gained, skill_id, skill_xp_gained, reason, multiplier)
    VALUES (p_user_id, p_mission_session_id, FLOOR(p_base_xp * p_multiplier), 
            NULL, 0, p_reason, p_multiplier);
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update the initialize_character function to set correct default states
CREATE OR REPLACE FUNCTION initialize_character(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create character stats if not exists
  INSERT INTO character_stats (user_id, base_level, base_xp)
  VALUES (p_user_id, 3, get_xp_for_level(3))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize all skills at level 1 with correct enabled states
  INSERT INTO user_skills (user_id, skill_id, skill_level, skill_xp, is_enabled)
  SELECT 
    p_user_id, 
    s.id, 
    1, 
    0,
    CASE 
      WHEN s.skill_code = 'greatest_alley' THEN false  -- Greatest Alley starts disabled
      ELSE true  -- All other skills start enabled
    END
  FROM skills s
  ON CONFLICT (user_id, skill_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Apply the new character initialization to existing users who don't have skill data
-- This ensures existing users get the new skill states
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT cs.user_id
        FROM character_stats cs
        LEFT JOIN user_skills us ON cs.user_id = us.user_id
        WHERE us.user_id IS NULL
    LOOP
        PERFORM initialize_character(user_record.user_id);
    END LOOP;
END $$;

-- Step 6: Update existing Greatest Alley skills to be disabled by default for existing users
-- (only if they haven't already been explicitly enabled)
UPDATE user_skills 
SET is_enabled = false
WHERE skill_id = (SELECT id FROM skills WHERE skill_code = 'greatest_alley')
  AND created_at = updated_at; -- Only update if never been modified by user

COMMENT ON FUNCTION award_xp IS 'Awards XP to user. Checks if skills are enabled before awarding skill XP. Greatest Alley skill can be disabled to prevent XP gain.';
COMMENT ON FUNCTION initialize_character IS 'Initialize character with all skills enabled except Greatest Alley which starts disabled.';

-- Display summary of changes
DO $$
BEGIN
    RAISE NOTICE 'Skills System Update Complete:';
    RAISE NOTICE '- All skills except "greatest_alley" are now non-toggleable and active';
    RAISE NOTICE '- Greatest Alley skill remains toggleable and starts disabled';
    RAISE NOTICE '- XP award function now respects skill enablement';
    RAISE NOTICE '- Existing users updated with correct skill states';
END $$; 