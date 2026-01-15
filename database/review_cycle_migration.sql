-- Review Cycle Migration
-- Creates tables for weekly and monthly reviews

-- Weekly Reviews Table
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    system_effectiveness_score INTEGER NOT NULL CHECK (system_effectiveness_score >= 0 AND system_effectiveness_score <= 100),
    habit_consistency_analysis JSONB NOT NULL,
    routine_performance_analysis JSONB NOT NULL,
    identified_patterns JSONB NOT NULL,
    system_adjustments JSONB NOT NULL,
    insights TEXT[] NOT NULL DEFAULT '{}',
    goals_for_next_week TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Reviews Table
CREATE TABLE IF NOT EXISTS monthly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_start_date DATE NOT NULL,
    month_end_date DATE NOT NULL,
    identity_alignment_score INTEGER NOT NULL CHECK (identity_alignment_score >= 0 AND identity_alignment_score <= 100),
    long_term_goal_progress JSONB NOT NULL,
    habit_evolution_analysis JSONB NOT NULL,
    productivity_trend_analysis JSONB NOT NULL,
    behavioral_pattern_insights JSONB NOT NULL,
    systematic_adjustments JSONB NOT NULL,
    identity_reinforcement_plan JSONB NOT NULL,
    goals_for_next_month TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_date ON weekly_reviews(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_user_date ON monthly_reviews(user_id, month_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_created_at ON weekly_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_created_at ON monthly_reviews(created_at DESC);

-- Unique constraints to prevent duplicate reviews
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_reviews_unique ON weekly_reviews(user_id, week_start_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_reviews_unique ON monthly_reviews(user_id, month_start_date);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_reviews_updated_at 
    BEFORE UPDATE ON weekly_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reviews_updated_at 
    BEFORE UPDATE ON monthly_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();