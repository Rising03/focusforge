-- Student Discipline System Database Initialization
-- This script creates the basic database structure

-- Create database if it doesn't exist (handled by Docker environment)
-- The database 'student_discipline' is created automatically by Docker

-- Basic health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health check record
INSERT INTO health_check (status) VALUES ('initialized') ON CONFLICT DO NOTHING;

-- Users table (basic structure)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table (basic structure)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_identity TEXT,
    academic_goals TEXT[],
    skill_goals TEXT[],
    wake_up_time TIME,
    sleep_time TIME,
    available_hours INTEGER,
    energy_pattern TEXT,
    detailed_profile JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habits table (basic structure)
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(50),
    cue TEXT,
    reward TEXT,
    stacked_after UUID REFERENCES habits(id),
    is_active BOOLEAN DEFAULT true,
    target_identity VARCHAR(255),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    times_completed INTEGER DEFAULT 0,
    times_missed INTEGER DEFAULT 0,
    difficulty_level VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100),
    reminder_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity sessions table (basic structure)
CREATE TABLE IF NOT EXISTS activity_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER, -- in minutes
    focus_quality INTEGER CHECK (focus_quality >= 1 AND focus_quality <= 10),
    distractions INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    quality VARCHAR(20) CHECK (quality IN ('excellent', 'good', 'poor')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(habit_id, date)
);

-- Habit logs table (detailed tracking)
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

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completion_date ON habit_logs(completion_date);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);

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

-- Behavioral analytics table
CREATE TABLE IF NOT EXISTS behavioral_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    context JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_id ON activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_start_time ON activity_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_evening_reviews_user_id ON evening_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_evening_reviews_date ON evening_reviews(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_user_id ON behavioral_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_timestamp ON behavioral_analytics(user_id, timestamp DESC);

-- Log successful initialization
INSERT INTO health_check (status) VALUES ('tables_created');

COMMIT;