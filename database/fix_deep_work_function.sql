-- Fix the function syntax error
CREATE OR REPLACE FUNCTION update_attention_metrics_on_training()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

-- Create trigger to automatically update attention metrics
CREATE TRIGGER update_attention_metrics_trigger 
    AFTER INSERT ON attention_training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_attention_metrics_on_training();