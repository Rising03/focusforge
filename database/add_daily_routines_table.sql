-- Create daily_routines table
CREATE TABLE IF NOT EXISTS daily_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    segments JSONB NOT NULL,
    adaptations TEXT[],
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_routines_user_date ON daily_routines(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_routines_date ON daily_routines(date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_routines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_routines_updated_at
    BEFORE UPDATE ON daily_routines
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_routines_updated_at();
