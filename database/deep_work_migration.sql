-- Deep Work and Attention Management Tables Migration
-- Add tables for deep work scheduling, attention training, and work quality measurement

-- Deep work sessions table
CREATE TABLE deep_work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    planned_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    planned_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER, -- in minutes
    activity TEXT NOT NULL,
    preparation_time INTEGER DEFAULT 10, -- in minutes
    cognitive_load VARCHAR(10) NOT NULL CHECK (cognitive_load IN ('light', 'medium', 'heavy')),
    energy_requirement VARCHAR(10) NOT NULL CHECK (energy_requirement IN ('low', 'medium', 'high')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(15) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'preparing', 'active', 'completed', 'cancelled')),
    work_quality_score DECIMAL(3,1) CHECK (work_quality_score >= 0 AND work_quality_score <= 10),
    cognitive_output_metrics JSONB,
    interruptions INTEGER DEFAULT 0,
    preparation_notes TEXT,
    session_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deep work blocks table (for time slot protection)
CREATE TABLE deep_work_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    energy_level DECIMAL(2,1) NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    cognitive_capacity DECIMAL(2,1) NOT NULL CHECK (cognitive_capacity >= 1 AND cognitive_capacity <= 5),
    is_protected BOOLEAN DEFAULT TRUE,
    protection_level VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (protection_level IN ('soft', 'medium', 'hard')),
    assigned_session_id UUID REFERENCES deep_work_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work quality measurements table
CREATE TABLE work_quality_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES deep_work_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measurement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    focus_depth DECIMAL(3,1) NOT NULL CHECK (focus_depth >= 1 AND focus_depth <= 10),
    cognitive_load_handled DECIMAL(3,1) NOT NULL CHECK (cognitive_load_handled >= 1 AND cognitive_load_handled <= 10),
    output_quality DECIMAL(3,1) NOT NULL CHECK (output_quality >= 1 AND output_quality <= 10),
    mental_clarity DECIMAL(3,1) NOT NULL CHECK (mental_clarity >= 1 AND mental_clarity <= 10),
    problem_complexity DECIMAL(3,1) NOT NULL CHECK (problem_complexity >= 1 AND problem_complexity <= 10),
    creative_output DECIMAL(3,1) NOT NULL CHECK (creative_output >= 1 AND creative_output <= 10),
    overall_score DECIMAL(3,1) NOT NULL CHECK (overall_score >= 1 AND overall_score <= 10),
    notes TEXT
);

-- Attention training sessions table
CREATE TABLE attention_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL CHECK (exercise_type IN ('focus_breathing', 'attention_restoration', 'cognitive_control', 'sustained_attention')),
    duration INTEGER NOT NULL, -- in minutes
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    performance_score DECIMAL(5,2) NOT NULL CHECK (performance_score >= 0 AND performance_score <= 100),
    attention_span_measured DECIMAL(5,2) NOT NULL, -- in minutes
    improvement_from_baseline DECIMAL(5,2) DEFAULT 0, -- percentage
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Attention metrics table (for tracking progress)
CREATE TABLE attention_metrics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    baseline_attention_span DECIMAL(5,2) NOT NULL DEFAULT 15, -- in minutes
    current_attention_span DECIMAL(5,2) NOT NULL DEFAULT 15, -- in minutes
    improvement_percentage DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 50 CHECK (consistency_score >= 0 AND consistency_score <= 100),
    training_sessions_completed INTEGER DEFAULT 0,
    last_assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trend VARCHAR(10) DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining'))
);

-- Create indexes for deep work tables
CREATE INDEX idx_deep_work_sessions_user_time ON deep_work_sessions(user_id, planned_start_time DESC);
CREATE INDEX idx_deep_work_sessions_status ON deep_work_sessions(user_id, status);
CREATE INDEX idx_deep_work_blocks_user_date ON deep_work_blocks(user_id, date DESC);
CREATE INDEX idx_work_quality_measurements_session ON work_quality_measurements(session_id);
CREATE INDEX idx_work_quality_measurements_user_time ON work_quality_measurements(user_id, measurement_time DESC);
CREATE INDEX idx_attention_training_user_time ON attention_training_sessions(user_id, completed_at DESC);

-- Create partial indexes for performance
CREATE INDEX idx_deep_work_sessions_active ON deep_work_sessions(user_id, planned_start_time) WHERE status IN ('scheduled', 'preparing', 'active');
CREATE INDEX idx_deep_work_blocks_protected ON deep_work_blocks(user_id, date, start_time) WHERE is_protected = TRUE;

-- Create GIN index for cognitive output metrics JSONB
CREATE INDEX idx_deep_work_sessions_metrics ON deep_work_sessions USING GIN (cognitive_output_metrics);

-- Add updated_at triggers for deep work sessions
CREATE TRIGGER update_deep_work_sessions_updated_at BEFORE UPDATE ON deep_work_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for deep work analytics
CREATE VIEW deep_work_analytics AS
SELECT 
    dws.user_id,
    DATE(dws.planned_start_time) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN dws.status = 'completed' THEN 1 END) as completed_sessions,
    AVG(CASE WHEN dws.status = 'completed' THEN dws.actual_duration END) as avg_duration,
    AVG(CASE WHEN dws.status = 'completed' THEN dws.work_quality_score END) as avg_quality_score,
    SUM(CASE WHEN dws.status = 'completed' THEN dws.actual_duration ELSE 0 END) as total_deep_work_minutes
FROM deep_work_sessions dws
GROUP BY dws.user_id, DATE(dws.planned_start_time);

CREATE VIEW energy_patterns AS
SELECT 
    as_data.user_id,
    EXTRACT(HOUR FROM as_data.start_time) as hour,
    EXTRACT(DOW FROM as_data.start_time) as day_of_week,
    AVG(
        CASE 
            WHEN as_data.focus_quality = 'high' THEN 5
            WHEN as_data.focus_quality = 'medium' THEN 3
            ELSE 1
        END
    ) as avg_energy_level,
    AVG(
        CASE 
            WHEN as_data.focus_quality = 'high' AND as_data.duration > 45 THEN 5
            WHEN as_data.focus_quality = 'high' THEN 4
            WHEN as_data.focus_quality = 'medium' THEN 3
            ELSE 2
        END
    ) as avg_cognitive_capacity,
    COUNT(*) as sample_size
FROM activity_sessions as_data
WHERE as_data.end_time IS NOT NULL 
    AND as_data.start_time >= NOW() - INTERVAL '30 days'
GROUP BY as_data.user_id, EXTRACT(HOUR FROM as_data.start_time), EXTRACT(DOW FROM as_data.start_time)
HAVING COUNT(*) >= 3; -- Only include patterns with sufficient data

CREATE VIEW attention_progress AS
SELECT 
    ats.user_id,
    ats.exercise_type,
    COUNT(*) as sessions_completed,
    AVG(ats.performance_score) as avg_performance,
    AVG(ats.attention_span_measured) as avg_attention_span,
    MAX(ats.completed_at) as last_session,
    CASE 
        WHEN AVG(ats.performance_score) > 80 THEN 'excellent'
        WHEN AVG(ats.performance_score) > 60 THEN 'good'
        ELSE 'needs_improvement'
    END as performance_level
FROM attention_training_sessions ats
WHERE ats.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY ats.user_id, ats.exercise_type;

-- Add comments for documentation
COMMENT ON TABLE deep_work_sessions IS 'Scheduled and tracked deep work sessions with quality metrics';
COMMENT ON TABLE deep_work_blocks IS 'Protected time blocks for deep work scheduling';
COMMENT ON TABLE work_quality_measurements IS 'Detailed work quality assessments for deep work sessions';
COMMENT ON TABLE attention_training_sessions IS 'Attention training exercises and performance tracking';
COMMENT ON TABLE attention_metrics IS 'User attention span progress and metrics over time';

-- Add constraints to ensure data integrity
ALTER TABLE deep_work_sessions ADD CONSTRAINT check_planned_times 
    CHECK (planned_end_time > planned_start_time);

ALTER TABLE deep_work_sessions ADD CONSTRAINT check_actual_times 
    CHECK (actual_end_time IS NULL OR actual_start_time IS NULL OR actual_end_time > actual_start_time);

ALTER TABLE deep_work_blocks ADD CONSTRAINT check_block_times 
    CHECK (end_time > start_time);

-- Create function to automatically update attention metrics
CREATE OR REPLACE FUNCTION update_attention_metrics_on_training()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO attention_metrics (user_id, current_attention_span, training_sessions_completed, last_assessment_date)
    VALUES (NEW.user_id, NEW.attention_span_measured, 1, NEW.completed_at)
    ON CONFLICT (user_id) DO UPDATE SET
        current_attention_span = (
            SELECT AVG(attention_span_measured) 
            FROM attention_training_sessions 
            WHERE user_id = NEW.user_id 
                AND completed_at >= NOW() - INTERVAL '30 days'
        ),
        training_sessions_completed = attention_metrics.training_sessions_completed + 1,
        improvement_percentage = (
            (SELECT AVG(attention_span_measured) 
             FROM attention_training_sessions 
             WHERE user_id = NEW.user_id 
                 AND completed_at >= NOW() - INTERVAL '30 days') - attention_metrics.baseline_attention_span
        ) / attention_metrics.baseline_attention_span * 100,
        last_assessment_date = NEW.completed_at,
        trend = CASE 
            WHEN (SELECT AVG(attention_span_measured) 
                  FROM attention_training_sessions 
                  WHERE user_id = NEW.user_id 
                      AND completed_at >= NOW() - INTERVAL '30 days') > attention_metrics.current_attention_span * 1.1 
            THEN 'improving'
            WHEN (SELECT AVG(attention_span_measured) 
                  FROM attention_training_sessions 
                  WHERE user_id = NEW.user_id 
                      AND completed_at >= NOW() - INTERVAL '30 days') < attention_metrics.current_attention_span * 0.9 
            THEN 'declining'
            ELSE 'stable'
        END;
    RETURN NEW;
END;
$ language 'plpgsql';

-- Create trigger to automatically update attention metrics
CREATE TRIGGER update_attention_metrics_trigger 
    AFTER INSERT ON attention_training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_attention_metrics_on_training();