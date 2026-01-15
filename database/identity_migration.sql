-- Identity-Based Progress and Environment Design Migration
-- Adds tables for identity alignment tracking, task acknowledgments, and environment management

-- Identity alignments table
CREATE TABLE identity_alignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_identity TEXT NOT NULL,
    alignment_score DECIMAL(3,2) NOT NULL CHECK (alignment_score >= 0 AND alignment_score <= 1),
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contributing_activities JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One alignment record per user, updated over time
);

-- Task acknowledgments table
CREATE TABLE task_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    identity_context TEXT NOT NULL,
    acknowledgment_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Environment assessments table
CREATE TABLE environment_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    environment_type VARCHAR(10) NOT NULL CHECK (environment_type IN ('physical', 'digital')),
    assessment_data JSONB NOT NULL,
    productivity_correlation DECIMAL(3,2) DEFAULT 0.5 CHECK (productivity_correlation >= 0 AND productivity_correlation <= 1),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distraction reports table
CREATE TABLE distraction_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    distraction_type TEXT NOT NULL,
    context TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    impact_level VARCHAR(10) NOT NULL CHECK (impact_level IN ('low', 'medium', 'high')),
    suggested_solutions JSONB NOT NULL,
    friction_points JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Environment productivity correlations table
CREATE TABLE environment_productivity_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    environment_factor TEXT NOT NULL,
    factor_value TEXT NOT NULL,
    productivity_impact DECIMAL(3,2) NOT NULL CHECK (productivity_impact >= 0 AND productivity_impact <= 1),
    confidence_level DECIMAL(3,2) DEFAULT 0.1 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    sample_size INTEGER DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, environment_factor, factor_value) -- One correlation per user-factor-value combination
);

-- Create indexes for performance optimization
CREATE INDEX idx_identity_alignments_user ON identity_alignments(user_id);
CREATE INDEX idx_identity_alignments_score ON identity_alignments(alignment_score DESC);
CREATE INDEX idx_task_acknowledgments_user_time ON task_acknowledgments(user_id, created_at DESC);
CREATE INDEX idx_environment_assessments_user_type ON environment_assessments(user_id, environment_type);
CREATE INDEX idx_distraction_reports_user_time ON distraction_reports(user_id, created_at DESC);
CREATE INDEX idx_distraction_reports_type ON distraction_reports(distraction_type);
CREATE INDEX idx_environment_correlations_user ON environment_productivity_correlations(user_id);
CREATE INDEX idx_environment_correlations_impact ON environment_productivity_correlations(productivity_impact DESC);
CREATE INDEX idx_environment_correlations_confidence ON environment_productivity_correlations(confidence_level DESC);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_identity_alignments_activities ON identity_alignments USING GIN (contributing_activities);
CREATE INDEX idx_environment_assessments_data ON environment_assessments USING GIN (assessment_data);
CREATE INDEX idx_distraction_reports_solutions ON distraction_reports USING GIN (suggested_solutions);
CREATE INDEX idx_distraction_reports_friction ON distraction_reports USING GIN (friction_points);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_identity_alignments_updated_at BEFORE UPDATE ON identity_alignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environment_assessments_updated_at BEFORE UPDATE ON environment_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environment_correlations_updated_at BEFORE UPDATE ON environment_productivity_correlations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common identity analytics queries
CREATE VIEW user_identity_progress AS
SELECT 
    ia.user_id,
    up.target_identity,
    ia.alignment_score,
    ia.last_calculated,
    COUNT(ta.id) as total_acknowledgments,
    COUNT(ta.id) FILTER (WHERE ta.created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_acknowledgments
FROM identity_alignments ia
JOIN user_profiles up ON ia.user_id = up.user_id
LEFT JOIN task_acknowledgments ta ON ia.user_id = ta.user_id
GROUP BY ia.user_id, up.target_identity, ia.alignment_score, ia.last_calculated;

CREATE VIEW environment_optimization_insights AS
SELECT 
    epc.user_id,
    epc.environment_factor,
    epc.factor_value,
    epc.productivity_impact,
    epc.confidence_level,
    epc.sample_size,
    CASE 
        WHEN epc.productivity_impact >= 0.7 AND epc.confidence_level >= 0.5 THEN 'highly_beneficial'
        WHEN epc.productivity_impact <= 0.3 AND epc.confidence_level >= 0.5 THEN 'detrimental'
        WHEN epc.confidence_level < 0.3 THEN 'insufficient_data'
        ELSE 'neutral'
    END as impact_category
FROM environment_productivity_correlations epc
ORDER BY epc.user_id, epc.productivity_impact DESC;

CREATE VIEW distraction_patterns AS
SELECT 
    dr.user_id,
    dr.distraction_type,
    COUNT(*) as report_count,
    AVG(dr.frequency) as average_frequency,
    MODE() WITHIN GROUP (ORDER BY dr.impact_level) as most_common_impact,
    MAX(dr.created_at) as last_reported
FROM distraction_reports dr
WHERE dr.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dr.user_id, dr.distraction_type
ORDER BY dr.user_id, report_count DESC;

-- Add comments for documentation
COMMENT ON TABLE identity_alignments IS 'Tracks user identity alignment scores and contributing activities';
COMMENT ON TABLE task_acknowledgments IS 'Stores identity-based task acknowledgments and motivational messages';
COMMENT ON TABLE environment_assessments IS 'Records environment assessments for productivity optimization';
COMMENT ON TABLE distraction_reports IS 'Tracks reported distractions and suggested solutions';
COMMENT ON TABLE environment_productivity_correlations IS 'Correlates environment factors with productivity outcomes';

COMMENT ON VIEW user_identity_progress IS 'Comprehensive view of user identity alignment progress';
COMMENT ON VIEW environment_optimization_insights IS 'Categorized environment factors by productivity impact';
COMMENT ON VIEW distraction_patterns IS 'Analysis of user distraction patterns over time';