-- Fix Habits System - Add Missing Columns and Tables
-- This migration adds all missing habit tracking functionality

-- 1. Add missing columns to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS target_identity VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completed_date DATE,
ADD COLUMN IF NOT EXISTS times_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_missed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS reminder_time TIME,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create habit_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL,
    completion_date DATE NOT NULL,
    completion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    mood VARCHAR(50),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completion_date ON habit_logs(completion_date);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);

-- 4. Create function to update habit streaks
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true THEN
        -- Update times completed
        UPDATE habits 
        SET times_completed = times_completed + 1,
            last_completed_date = NEW.completion_date
        WHERE id = NEW.habit_id;
        
        -- Calculate streak
        WITH recent_logs AS (
            SELECT completion_date, completed
            FROM habit_logs
            WHERE habit_id = NEW.habit_id
            AND completion_date <= NEW.completion_date
            ORDER BY completion_date DESC
        ),
        streak_calc AS (
            SELECT 
                COUNT(*) as current_streak
            FROM (
                SELECT 
                    completion_date,
                    completed,
                    ROW_NUMBER() OVER (ORDER BY completion_date DESC) as rn,
                    completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) || ' days')::INTERVAL as grp
                FROM recent_logs
                WHERE completed = true
            ) sub
            WHERE grp = (
                SELECT completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC) || ' days')::INTERVAL
                FROM recent_logs
                WHERE completed = true
                ORDER BY completion_date DESC
                LIMIT 1
            )
        )
        UPDATE habits h
        SET 
            current_streak = COALESCE((SELECT current_streak FROM streak_calc), 0),
            longest_streak = GREATEST(longest_streak, COALESCE((SELECT current_streak FROM streak_calc), 0))
        WHERE h.id = NEW.habit_id;
    ELSE
        -- Habit was missed
        UPDATE habits 
        SET times_missed = times_missed + 1,
            current_streak = 0
        WHERE id = NEW.habit_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for automatic streak updates
DROP TRIGGER IF EXISTS trigger_update_habit_streak ON habit_logs;
CREATE TRIGGER trigger_update_habit_streak
    AFTER INSERT ON habit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_habit_streak();

-- 6. Migrate existing habit_completions data to habit_logs (if any)
INSERT INTO habit_logs (habit_id, user_id, completed, completion_date, completion_time, notes)
SELECT 
    hc.habit_id,
    hc.user_id,
    hc.completed,
    hc.date,
    hc.created_at,
    hc.notes
FROM habit_completions hc
WHERE NOT EXISTS (
    SELECT 1 FROM habit_logs hl 
    WHERE hl.habit_id = hc.habit_id 
    AND hl.completion_date = hc.date
);

-- 7. Update existing habits with calculated streaks
UPDATE habits h
SET 
    times_completed = (
        SELECT COUNT(*) 
        FROM habit_logs hl 
        WHERE hl.habit_id = h.id AND hl.completed = true
    ),
    times_missed = (
        SELECT COUNT(*) 
        FROM habit_logs hl 
        WHERE hl.habit_id = h.id AND hl.completed = false
    ),
    last_completed_date = (
        SELECT MAX(completion_date)
        FROM habit_logs hl
        WHERE hl.habit_id = h.id AND hl.completed = true
    );

-- 8. Add comments for documentation
COMMENT ON TABLE habits IS 'User habits with tracking and streak information';
COMMENT ON TABLE habit_logs IS 'Detailed log of habit completions and misses';
COMMENT ON COLUMN habits.target_identity IS 'The identity this habit reinforces (e.g., "Disciplined Student")';
COMMENT ON COLUMN habits.current_streak IS 'Current consecutive days of completion';
COMMENT ON COLUMN habits.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN habits.stacked_after IS 'Reference to another habit this one is stacked after';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Habits system fixed successfully!';
    RAISE NOTICE 'Added columns: target_identity, current_streak, longest_streak, and more';
    RAISE NOTICE 'Created table: habit_logs';
    RAISE NOTICE 'Created automatic streak tracking';
END $$;
