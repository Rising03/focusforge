export interface DeepWorkSession {
  id: string;
  user_id: string;
  planned_start_time: string;
  planned_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  planned_duration: number; // in minutes
  actual_duration?: number; // in minutes
  activity: string;
  preparation_time: number; // in minutes
  cognitive_load: 'light' | 'medium' | 'heavy';
  energy_requirement: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'preparing' | 'active' | 'completed' | 'cancelled';
  work_quality_score?: number; // 0-10 scale
  cognitive_output_metrics?: CognitiveOutputMetrics;
  interruptions: number;
  preparation_notes?: string;
  session_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CognitiveOutputMetrics {
  complexity_handled: 'low' | 'medium' | 'high';
  problem_solving_depth: number; // 1-5 scale
  creative_insights: number;
  decision_quality: number; // 1-5 scale
  mental_fatigue_level: number; // 1-5 scale
  flow_state_achieved: boolean;
  flow_duration?: number; // in minutes
}

export interface EnergyPattern {
  time_slot: string; // "09:00"
  day_of_week: string; // "monday"
  energy_level: number; // 1-5 scale
  cognitive_capacity: number; // 1-5 scale
  historical_performance: number; // 1-5 scale
  sample_size: number;
  last_updated: string;
}

export interface AttentionTrainingSession {
  id: string;
  user_id: string;
  exercise_type: 'focus_breathing' | 'attention_restoration' | 'cognitive_control' | 'sustained_attention';
  duration: number; // in minutes
  difficulty_level: number; // 1-5 scale
  performance_score: number; // 0-100 scale
  attention_span_measured: number; // in minutes
  improvement_from_baseline: number; // percentage
  completed_at: string;
  notes?: string;
}

export interface AttentionMetrics {
  user_id: string;
  baseline_attention_span: number; // in minutes
  current_attention_span: number; // in minutes
  improvement_percentage: number;
  consistency_score: number; // 0-100 scale
  training_sessions_completed: number;
  last_assessment_date: string;
  trend: 'improving' | 'stable' | 'declining';
}

// Request types
export interface ScheduleDeepWorkRequest {
  activity: string;
  planned_duration: number;
  cognitive_load: 'light' | 'medium' | 'heavy';
  energy_requirement: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  preferred_time_slots?: string[]; // ["09:00", "14:00"]
  preparation_time?: number;
  preparation_notes?: string;
}

export interface StartDeepWorkRequest {
  session_id: string;
  preparation_notes?: string;
}

export interface CompleteDeepWorkRequest {
  session_id: string;
  work_quality_score: number;
  cognitive_output_metrics: CognitiveOutputMetrics;
  interruptions: number;
  session_notes?: string;
}

export interface WorkQualityAssessmentRequest {
  session_id: string;
  focus_depth: number;
  cognitive_load_handled: number;
  output_quality: number;
  mental_clarity: number;
  problem_complexity: number;
  creative_output: number;
  notes?: string;
}

export interface AttentionTrainingRequest {
  exercise_type: 'focus_breathing' | 'attention_restoration' | 'cognitive_control' | 'sustained_attention';
  duration: number;
  difficulty_level: number;
}

// Response types
export interface DeepWorkScheduleResponse {
  session: DeepWorkSession;
  optimal_time_slot: string;
  energy_prediction: number;
  preparation_suggestions: string[];
}

export interface DeepWorkAnalyticsResponse {
  total_deep_work_hours: number;
  average_session_quality: number;
  optimal_time_slots: string[];
  energy_pattern_insights: string[];
  productivity_trends: {
    weekly_average: number;
    monthly_trend: 'improving' | 'stable' | 'declining';
    best_performing_days: string[];
  };
  attention_metrics: AttentionMetrics;
}

export interface OptimalSchedulingResponse {
  recommended_slots: Array<{
    time_slot: string;
    energy_prediction: number;
    cognitive_capacity: number;
    confidence_score: number;
    reasoning: string;
  }>;
  energy_pattern: EnergyPattern[];
  scheduling_insights: string[];
}

export interface EnergyPatternsResponse {
  patterns: EnergyPattern[];
  insights: string[];
}

// UI State types
export interface DeepWorkState {
  currentSession: DeepWorkSession | null;
  upcomingSessions: DeepWorkSession[];
  isLoading: boolean;
  error: string | null;
}

export interface AttentionTrainingState {
  currentExercise: AttentionTrainingSession | null;
  metrics: AttentionMetrics | null;
  isTraining: boolean;
  isLoading: boolean;
  error: string | null;
}