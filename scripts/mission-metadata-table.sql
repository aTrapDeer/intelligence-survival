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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mission_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mission_metadata_updated_at
    BEFORE UPDATE ON mission_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_mission_metadata_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE mission_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow backend operations (no direct frontend access)
-- This table should NEVER be accessed directly from frontend code
CREATE POLICY "Backend only access" ON mission_metadata
    FOR ALL USING (false); -- No direct access allowed - only via backend functions

-- Grant necessary permissions (adjust based on your auth setup)
-- These permissions are for backend service accounts only
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mission_metadata TO service_role;

COMMENT ON TABLE mission_metadata IS 'Backend-only mission data - contains success/failure conditions, detailed phases, and outcomes that should NEVER be exposed to users';
COMMENT ON COLUMN mission_metadata.full_mission_briefing IS 'Complete mission briefing with all sensitive details';
COMMENT ON COLUMN mission_metadata.detailed_phases IS 'Structured phase data with objectives and threat escalation';
COMMENT ON COLUMN mission_metadata.success_conditions IS 'Specific conditions that determine mission success';
COMMENT ON COLUMN mission_metadata.failure_conditions IS 'Specific conditions that constitute mission failure';
COMMENT ON COLUMN mission_metadata.possible_outcomes IS 'All four possible outcomes (A/B/C/D) with detailed descriptions';
COMMENT ON COLUMN mission_metadata.current_phase_index IS 'Current phase index (0-based) for tracking progress';
COMMENT ON COLUMN mission_metadata.phase_objectives_completed IS 'List of completed phase objectives';
COMMENT ON COLUMN mission_metadata.backend_notes IS 'Additional GM notes and mission context'; 