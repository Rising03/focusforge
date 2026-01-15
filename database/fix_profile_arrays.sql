-- Fix academic_goals and skill_goals to be arrays instead of text
-- Also add missing behavioral_analytics table

-- Step 1: Add behavioral_analytics table
CREATE TABLE IF NOT EXISTS behavioral_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    context JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for behavioral_analytics
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_user_id ON behavioral_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_timestamp ON behavioral_analytics(user_id, timestamp DESC);

-- Step 2: Convert academic_goals and skill_goals from TEXT to TEXT[]
-- First, create temporary columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS academic_goals_new TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS skill_goals_new TEXT[];

-- Convert existing data (handle both array-like strings and JSON arrays)
UPDATE user_profiles 
SET academic_goals_new = CASE 
    WHEN academic_goals IS NULL THEN ARRAY[]::TEXT[]
    WHEN academic_goals LIKE '{%}' THEN string_to_array(trim(both '{}' from academic_goals), ',')
    WHEN academic_goals LIKE '[%]' THEN ARRAY(SELECT jsonb_array_elements_text(academic_goals::jsonb))
    ELSE ARRAY[academic_goals]
END;

UPDATE user_profiles 
SET skill_goals_new = CASE 
    WHEN skill_goals IS NULL THEN ARRAY[]::TEXT[]
    WHEN skill_goals LIKE '{%}' THEN string_to_array(trim(both '{}' from skill_goals), ',')
    WHEN skill_goals LIKE '[%]' THEN ARRAY(SELECT jsonb_array_elements_text(skill_goals::jsonb))
    ELSE ARRAY[skill_goals]
END;

-- Drop old columns and rename new ones
ALTER TABLE user_profiles DROP COLUMN IF EXISTS academic_goals;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS skill_goals;
ALTER TABLE user_profiles RENAME COLUMN academic_goals_new TO academic_goals;
ALTER TABLE user_profiles RENAME COLUMN skill_goals_new TO skill_goals;

-- Log completion
INSERT INTO health_check (status) VALUES ('profile_arrays_fixed');

COMMIT;
