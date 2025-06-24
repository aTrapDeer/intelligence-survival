const { createClient } = require('@supabase/supabase-js');

// Database setup script for Intelligence Survival
console.log('🚀 Intelligence Survival - Database Setup');
console.log('=========================================');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration!');
  console.log('Please set the following environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('');
  console.log('You can find these in your Supabase project settings.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createTablesSQL = `
-- Mission Sessions Table (Enhanced)
CREATE TABLE IF NOT EXISTS mission_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  mission_briefing TEXT NOT NULL,
  mission_category TEXT NOT NULL,
  mission_context TEXT NOT NULL,
  foreign_threat TEXT NOT NULL,
  current_round INTEGER DEFAULT 0,
  max_rounds INTEGER DEFAULT 10,
  operational_status TEXT DEFAULT 'GREEN',
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  mission_outcome TEXT CHECK (mission_outcome IN ('A', 'B', 'C', 'D')),
  success_score INTEGER CHECK (success_score >= 0 AND success_score <= 100),
  mission_steps_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Decisions Table (Enhanced)
CREATE TABLE IF NOT EXISTS user_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_session_id UUID REFERENCES mission_sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('OPTION_SELECTED', 'CUSTOM_INPUT')),
  selected_option INTEGER CHECK (selected_option IN (1, 2, 3, 4)),
  custom_input TEXT,
  ai_response TEXT NOT NULL,
  decision_context TEXT NOT NULL,
  was_operationally_sound BOOLEAN NOT NULL,
  threat_level_after TEXT NOT NULL,
  risk_assessment TEXT CHECK (risk_assessment IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission Analytics View
CREATE OR REPLACE VIEW mission_analytics AS
SELECT 
  ms.mission_category,
  ms.foreign_threat,
  COUNT(*) as total_missions,
  AVG(ms.current_round) as avg_rounds,
  AVG(ms.success_score) as avg_success_score,
  COUNT(CASE WHEN ms.mission_outcome IN ('A', 'B') THEN 1 END) * 100.0 / COUNT(*) as success_rate,
  AVG(CASE WHEN ud.was_operationally_sound THEN 1 ELSE 0 END) * 100.0 as operational_soundness_rate
FROM mission_sessions ms
JOIN user_decisions ud ON ms.id = ud.mission_session_id
WHERE ms.is_completed = true
GROUP BY ms.mission_category, ms.foreign_threat;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mission_sessions_user_id ON mission_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_active ON mission_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_completed ON mission_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_category ON mission_sessions(mission_category);
CREATE INDEX IF NOT EXISTS idx_user_decisions_session_id ON user_decisions(mission_session_id);
CREATE INDEX IF NOT EXISTS idx_user_decisions_round ON user_decisions(round_number);
CREATE INDEX IF NOT EXISTS idx_user_decisions_type ON user_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_user_decisions_risk ON user_decisions(risk_assessment);

-- Mission Metadata Table (Backend-only sensitive data)
CREATE TABLE IF NOT EXISTS mission_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_session_id UUID NOT NULL REFERENCES mission_sessions(id) ON DELETE CASCADE,
  full_mission_briefing TEXT NOT NULL,
  detailed_phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  success_conditions TEXT[] NOT NULL DEFAULT '{}'::text[],
  failure_conditions TEXT[] NOT NULL DEFAULT '{}'::text[],
  possible_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_phase_index INTEGER NOT NULL DEFAULT 0,
  phase_objectives_completed TEXT[] NOT NULL DEFAULT '{}'::text[],
  backend_notes TEXT NOT NULL DEFAULT ''::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for mission_metadata
CREATE INDEX IF NOT EXISTS idx_mission_metadata_session_id ON mission_metadata(mission_session_id);
CREATE INDEX IF NOT EXISTS idx_mission_metadata_current_phase ON mission_metadata(current_phase_index);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update mission_metadata updated_at timestamp
CREATE OR REPLACE FUNCTION update_mission_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic updated_at on mission_sessions
DROP TRIGGER IF EXISTS update_mission_sessions_updated_at ON mission_sessions;
CREATE TRIGGER update_mission_sessions_updated_at
    BEFORE UPDATE ON mission_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for automatic updated_at on mission_metadata
DROP TRIGGER IF EXISTS trigger_mission_metadata_updated_at ON mission_metadata;
CREATE TRIGGER trigger_mission_metadata_updated_at
    BEFORE UPDATE ON mission_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_mission_metadata_updated_at();

-- Enable Row Level Security on mission_metadata (backend-only access)
ALTER TABLE mission_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow backend operations (no direct frontend access)
DROP POLICY IF EXISTS "Backend only access" ON mission_metadata;
CREATE POLICY "Backend only access" ON mission_metadata
    FOR ALL USING (false);

-- Function to update mission completion stats
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
        WHEN p_was_successful THEN FLOOR(p_success_score / 10.0) -- Success adds reputation
        ELSE -FLOOR((100 - p_success_score) / 20.0) -- Failure reduces reputation
      END
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no stats record exists, create one (shouldn't happen if character is initialized)
  IF NOT FOUND THEN
    INSERT INTO character_stats (
      user_id,
      base_level,
      base_xp,
      total_missions_completed,
      total_successful_missions,
      reputation_score
    ) VALUES (
      p_user_id,
      3, -- Starting level
      0, -- Starting XP
      1, -- First mission completed
      CASE WHEN p_was_successful THEN 1 ELSE 0 END,
      GREATEST(0, FLOOR(p_success_score / 10.0))
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
`;

async function setup() {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Execute the setup SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.error('❌ Database setup failed:', error.message);
      console.log('');
      console.log('🔧 Manual Setup Required:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL from SETUP.md');
      console.log('');
      process.exit(1);
    }
    
    console.log('✅ Database tables created successfully!');
    
    // Test the setup
    console.log('🧪 Testing database connection...');
    
    const { data: testData, error: testError } = await supabase
      .from('mission_sessions')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database test failed:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection test passed!');
    console.log('');
    console.log('🎮 Your Intelligence Survival game is ready!');
    console.log('✨ Enhanced features now available:');
    console.log('  - Mission progression tracking');
    console.log('  - Decision analytics');
    console.log('  - Performance insights');
    console.log('  - Risk assessment logging');
    console.log('');
    console.log('🚀 Run `npm run dev` to start the game!');
    
    console.log('🗄️  Creating database tables...');
    
    // Create user profiles table for authentication
    const userProfilesSQL = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE,
        full_name TEXT,
        avatar_url TEXT,
        provider TEXT NOT NULL DEFAULT 'google',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: userProfilesError } = await supabase.rpc('exec', { 
      sql: userProfilesSQL 
    });
    
    if (userProfilesError) {
      console.error('❌ Error creating user_profiles table:', userProfilesError);
    } else {
      console.log('✅ User profiles table created successfully');
    }

    // Create mission sessions table
    const missionSessionsSQL = `
      CREATE TABLE IF NOT EXISTS mission_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id),
        mission_briefing TEXT NOT NULL,
        mission_category TEXT NOT NULL,
        mission_context TEXT NOT NULL,
        foreign_threat TEXT NOT NULL,
        current_round INTEGER DEFAULT 0,
        operational_status TEXT DEFAULT 'GREEN',
        is_active BOOLEAN DEFAULT TRUE,
        is_completed BOOLEAN DEFAULT FALSE,
        mission_outcome TEXT CHECK (mission_outcome IN ('A', 'B', 'C', 'D')),
        success_score INTEGER CHECK (success_score >= 0 AND success_score <= 100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: missionSessionsError } = await supabase.rpc('exec', { 
      sql: missionSessionsSQL 
    });
    
    if (missionSessionsError) {
      console.error('❌ Error creating mission_sessions table:', missionSessionsError);
    } else {
      console.log('✅ Mission sessions table created successfully');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('');
    console.log('📝 Please follow the manual setup instructions in SETUP.md');
    process.exit(1);
  }
}

// Check if we're being run directly
if (require.main === module) {
  setup();
}

module.exports = { setup }; 