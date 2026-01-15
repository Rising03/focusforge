export interface IdentityAlignment {
  id: string;
  user_id: string;
  target_identity: string;
  alignment_score: number;
  last_calculated: Date;
  contributing_activities: IdentityActivity[];
  created_at: Date;
  updated_at: Date;
}

export interface IdentityActivity {
  activity: string;
  alignment_weight: number;
  frequency: number;
  recent_performance: number;
  identity_relevance: 'high' | 'medium' | 'low';
}

export interface TaskAcknowledgment {
  id: string;
  user_id: string;
  task: string;
  identity_context: string;
  acknowledgment_message: string;
  created_at: Date;
}

export interface ActivitySuggestion {
  id: string;
  activity: string;
  identity_question: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  estimated_duration: number;
  identity_alignment_boost: number;
}

export interface EnvironmentAssessment {
  id: string;
  user_id: string;
  environment_type: 'physical' | 'digital';
  assessment_data: EnvironmentData;
  productivity_correlation: number;
  last_updated: Date;
  created_at: Date;
}

export interface EnvironmentData {
  location?: string;
  noise_level?: 'silent' | 'quiet' | 'moderate' | 'noisy';
  lighting?: 'bright' | 'moderate' | 'dim';
  temperature?: 'cool' | 'moderate' | 'warm';
  organization_level?: 'minimal' | 'organized' | 'cluttered';
  digital_distractions?: string[];
  physical_distractions?: string[];
  focus_aids?: string[];
}

export interface DistractionReport {
  id: string;
  user_id: string;
  distraction_type: string;
  context: string;
  frequency: number;
  impact_level: 'low' | 'medium' | 'high';
  suggested_solutions: string[];
  friction_points: FrictionPoint[];
  created_at: Date;
}

export interface FrictionPoint {
  description: string;
  elimination_strategy: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_impact: number;
}

export interface EnvironmentProductivityCorrelation {
  id: string;
  user_id: string;
  environment_factor: string;
  factor_value: string;
  productivity_impact: number;
  confidence_level: number;
  sample_size: number;
  last_updated: Date;
}

// Request/Response types for API
export interface CalculateIdentityAlignmentRequest {
  days?: number;
}

export interface IdentityAlignmentResponse {
  alignment: IdentityAlignment;
  insights: string[];
  recommendations: string[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface TaskAcknowledgmentRequest {
  task: string;
  activity_type?: string;
}

export interface TaskAcknowledgmentResponse {
  acknowledgment: TaskAcknowledgment;
  identity_boost: number;
}

export interface ActivitySuggestionRequest {
  context?: string;
  available_time?: number;
  energy_level?: 'low' | 'medium' | 'high';
}

export interface ActivitySuggestionResponse {
  suggestions: ActivitySuggestion[];
  identity_question: string;
  reasoning: string;
}

export interface EnvironmentAssessmentRequest {
  environment_type: 'physical' | 'digital';
  environment_data: EnvironmentData;
  current_productivity?: number;
}

export interface EnvironmentAssessmentResponse {
  assessment: EnvironmentAssessment;
  suggestions: string[];
  optimization_score: number;
}

export interface DistractionReportRequest {
  distraction_type: string;
  context: string;
  frequency?: number;
  impact_level?: 'low' | 'medium' | 'high';
}

export interface DistractionReportResponse {
  report: DistractionReport;
  immediate_solutions: string[];
  long_term_strategies: string[];
}

export interface EnvironmentCorrelationResponse {
  correlations: EnvironmentProductivityCorrelation[];
  insights: string[];
  optimization_recommendations: string[];
}