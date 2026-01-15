-- Evening Review Migration
-- Creates tables for evening review functionality

-- Evening reviews table
CREATE TABLE IF NOT EXISTS evening_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    accomplished TEXT[] DEFAULT '{}',
    missed TEXT[] DEFAULT '{}',
    reasons TEXT[] DEFAULT '{}',
    tomorrow_tasks TEXT[] DEFAULT '{}',
    mood INTEGER CHECK (mood >= 1 AND mood <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    insights TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_evening_reviews_user_id ON evening_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_evening_reviews_date ON evening_reviews(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_evening_reviews_created_at ON evening_reviews(user_id, created_at DESC);

-- Log successful migration
INSERT INTO health_check (status) VALUES ('evening_reviews_table_created');

COMMIT;
