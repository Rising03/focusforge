export interface EveningReview {
  id: string;
  user_id: string;
  date: Date;
  accomplished: string[];
  missed: string[];
  reasons: string[];
  tomorrow_tasks: string[];
  mood: number; // 1-10 scale
  energy_level: number; // 1-10 scale
  insights: string;
  created_at: Date;
}

export interface CreateEveningReviewRequest {
  date: string; // YYYY-MM-DD format
  accomplished: string[];
  missed: string[];
  reasons: string[];
  tomorrow_tasks: string[];
  mood: number;
  energy_level: number;
  insights: string;
}

export interface EveningReviewResponse {
  review: EveningReview;
  routine_adaptations: RoutineAdaptation[];
  performance_insights: PerformanceInsight[];
}

export interface RoutineAdaptation {
  type: 'simplify' | 'increase_complexity' | 'adjust_timing' | 'change_focus';
  description: string;
  reason: string;
  impact_score: number; // 0-1 scale
}

export interface PerformanceInsight {
  category: 'productivity' | 'energy' | 'focus' | 'habits' | 'mood';
  insight: string;
  trend: 'improving' | 'declining' | 'stable';
  recommendation: string;
}

export interface ReviewAnalysis {
  completion_rate: number;
  common_obstacles: string[];
  energy_patterns: EnergyPattern[];
  mood_trends: MoodTrend[];
  productivity_insights: string[];
}

export interface EnergyPattern {
  time_period: string;
  average_energy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MoodTrend {
  period: string;
  average_mood: number;
  correlation_with_productivity: number;
}

export interface ReviewHistoryResponse {
  reviews: EveningReview[];
  analysis: ReviewAnalysis;
  date_range: {
    start: string;
    end: string;
  };
  total_reviews: number;
}

export interface UpdateEveningReviewRequest {
  accomplished?: string[];
  missed?: string[];
  reasons?: string[];
  tomorrow_tasks?: string[];
  mood?: number;
  energy_level?: number;
  insights?: string;
}

export interface ReviewPrompts {
  reflection_prompts: string[];
  mood_check: {
    question: string;
    scale: string;
  };
  energy_check: {
    question: string;
    scale: string;
  };
  tomorrow_planning: string[];
}

// UI State types
export interface EveningReviewState {
  currentReview: EveningReview | null;
  reviewHistory: EveningReview[];
  analysis: ReviewAnalysis | null;
  prompts: ReviewPrompts | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
}

export interface ReviewFormData {
  accomplished: string[];
  missed: string[];
  reasons: string[];
  tomorrow_tasks: string[];
  mood: number;
  energy_level: number;
  insights: string;
}

export interface ReviewVisualizationData {
  completion_trend: { date: string; rate: number }[];
  mood_trend: { date: string; mood: number }[];
  energy_trend: { date: string; energy: number }[];
  common_obstacles: { obstacle: string; count: number }[];
}