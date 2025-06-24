const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createMissionMetadataTableSQL = `
-- Create mission_metadata table for backend-only mission data
-- This stores sensitive mission information that should NEVER be exposed to frontend

CREATE TABLE IF NOT EXISTS mission_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_session_id UUID NOT NULL REFERENCES mission_sessions(id) ON DELETE CASCADE,
    full_mission_briefing TEXT NOT NULL,
    detailed_phases JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_conditions TEXT[] NOT NULL DEFAULT '{}',
    failure_conditions TEXT[] NOT NULL DEFAULT '{}',
    possible_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_phase_index INTEGER NOT NULL DEFAULT 0,
    phase_objectives_completed TEXT[] NOT NULL DEFAULT '{}',
    backend_notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mission_metadata_session_id ON mission_metadata(mission_session_id);
CREATE INDEX IF NOT EXISTS idx_mission_metadata_current_phase ON mission_metadata(current_phase_index);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_mission_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS trigger_mission_metadata_updated_at ON mission_metadata;
CREATE TRIGGER trigger_mission_metadata_updated_at
    BEFORE UPDATE ON mission_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_mission_metadata_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE mission_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow backend operations (no direct frontend access)
-- This table should NEVER be accessed directly from frontend code
DROP POLICY IF EXISTS "Backend only access" ON mission_metadata;
CREATE POLICY "Backend only access" ON mission_metadata
    FOR ALL USING (false); -- No direct access allowed - only via backend functions

-- Add comments for documentation
COMMENT ON TABLE mission_metadata IS 'Backend-only mission data - contains success/failure conditions, detailed phases, and outcomes that should NEVER be exposed to users';
COMMENT ON COLUMN mission_metadata.full_mission_briefing IS 'Complete mission briefing with all sensitive details';
COMMENT ON COLUMN mission_metadata.detailed_phases IS 'Structured phase data with objectives and threat escalation';
COMMENT ON COLUMN mission_metadata.success_conditions IS 'Specific conditions that determine mission success';
COMMENT ON COLUMN mission_metadata.failure_conditions IS 'Specific conditions that constitute mission failure';
COMMENT ON COLUMN mission_metadata.possible_outcomes IS 'All four possible outcomes (A/B/C/D) with detailed descriptions';
COMMENT ON COLUMN mission_metadata.current_phase_index IS 'Current phase index (0-based) for tracking progress';
COMMENT ON COLUMN mission_metadata.phase_objectives_completed IS 'List of completed phase objectives';
COMMENT ON COLUMN mission_metadata.backend_notes IS 'Additional GM notes and mission context';
`;

async function createMissionMetadataTable() {
  try {
    console.log('🔧 Creating mission_metadata table...');
    
    // Execute the SQL using a stored function for complex operations
    const { data, error } = await supabase.rpc('sql', {
      query: createMissionMetadataTableSQL
    });
    
    if (error) {
      console.error('❌ Error creating mission_metadata table:', error);
      console.log('');
      console.log('🔧 Manual Setup Required:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Open SQL Editor');
      console.log('3. Run the SQL from scripts/mission-metadata-table.sql');
      console.log('');
      process.exit(1);
    }
    
    console.log('✅ Mission metadata table created successfully!');
    
    // Test if we can access the table
    console.log('🧪 Testing table creation...');
    const { error: testError } = await supabase
      .from('mission_metadata')
      .select('count', { count: 'exact' })
      .limit(0);
    
    if (testError) {
      console.error('❌ Table test failed:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Mission metadata table is accessible and ready!');
    console.log('');
    console.log('🔒 Security features enabled:');
    console.log('  - Row Level Security (RLS) enabled');
    console.log('  - Backend-only access policy applied');
    console.log('  - Automatic timestamps with triggers');
    console.log('  - Performance indexes created');
    console.log('');
    console.log('🎮 Your mission system is now ready for secure operation!');
    
  } catch (err) {
    console.error('❌ Failed to create mission_metadata table:', err);
    console.log('');
    console.log('📝 Please run the SQL manually from scripts/mission-metadata-table.sql');
    process.exit(1);
  }
}

// Check if we're being run directly
if (require.main === module) {
  createMissionMetadataTable();
}

module.exports = { createMissionMetadataTable }; 