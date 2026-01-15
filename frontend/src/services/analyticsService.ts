import { BaseService } from './baseService';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

export interface AnalyticsData {
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  consistency_score: number;
  identity_alignment: number;
  deep_work_trend: number[];
  habit_streaks: HabitStreak[];
  productivity_pattern: ProductivityMetrics;
  behavioral_insights: BehavioralInsight[];
  personalization_metrics: PersonalizationMetrics;
}

export interface HabitStreak {
  habit_id: string;
  habit_name: string;
  current_streak: number | null;
  longest_streak: number | null;
  consistency_percentage: number | null;
}

export interface ProductivityMetrics {
  daily_completion_rates: number[];
  focus_quality_trend: number[];
  deep_work_hours_trend: number[];
  energy_patterns: EnergyPattern[];
  most_productive_hours: string[];
  distraction_patterns: DistractionPattern[];
}

export interface EnergyPattern {
  time_period: string;
  average_energy: number;
  productivity_correlation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DistractionPattern {
  time_period: string;
  average_distractions: number;
  common_triggers: string[];
  impact_on_focus: number;
}

export interface BehavioralInsight {
  category: 'productivity' | 'habits' | 'focus' | 'energy' | 'patterns';
  insight: string;
  confidence: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendation: string;
  data_points: number;
}

export interface PersonalizationMetrics {
  profile_completeness: number;
  adaptation_effectiveness: number;
  suggestion_acceptance_rate: number;
  routine_modification_frequency: number;
  learning_progression: LearningProgression;
}

export interface LearningProgression {
  weeks_active: number;
  skill_improvements: SkillImprovement[];
  habit_formation_rate: number;
  system_mastery_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillImprovement {
  skill_area: string;
  improvement_percentage: number;
  time_period: string;
}

export interface PerformancePatternAnalysis {
  declining_patterns: PatternAlert[];
  improvement_opportunities: ImprovementOpportunity[];
  system_adjustments: SystemAdjustment[];
  optimization_suggestions: OptimizationSuggestion[];
}

export interface PatternAlert {
  pattern_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_metrics: string[];
  suggested_actions: string[];
}

export interface ImprovementOpportunity {
  area: string;
  potential_impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  action_steps: string[];
}

export interface SystemAdjustment {
  adjustment_type: 'routine_simplification' | 'complexity_increase' | 'timing_optimization' | 'habit_stacking';
  reason: string;
  expected_impact: number;
  implementation_steps: string[];
}

export interface OptimizationSuggestion {
  category: string;
  suggestion: string;
  confidence: number;
  expected_benefit: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

export interface DashboardSummary {
  overview: {
    consistency_score: number;
    identity_alignment: number;
    total_habits: number;
    strong_habits: number;
    avg_deep_work_hours: number;
  };
  key_insights: BehavioralInsight[];
  alerts: PatternAlert[];
  opportunities: ImprovementOpportunity[];
  recommendations: OptimizationSuggestion[];
}

export interface DeepWorkTrendResponse {
  deep_work_trend: number[];
  statistics: {
    average_hours: number;
    recent_average: number;
    trend: 'improving' | 'declining' | 'stable';
    total_days: number;
  };
  period_days: number;
  date_range: {
    start: Date;
    end: Date;
  };
}

export interface HabitStreaksAnalytics {
  habit_streaks: HabitStreak[];
  analytics: {
    total_habits: number;
    strong_habits: number;
    struggling_habits: number;
    average_consistency: number;
    longest_current_streak: number;
  };
}

class AnalyticsService extends BaseService {
  // Dashboard analytics
  async getDashboardAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<AnalyticsData> {
    return this.makeRequest<AnalyticsData>(`/analytics/dashboard?period=${period}`);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.makeRequest<DashboardSummary>('/analytics/dashboard/summary');
  }

  // Core metrics
  async getConsistencyScore(days: number = 30): Promise<{ consistency_score: number; period_days: number; date_range: { start: Date; end: Date } }> {
    return this.makeRequest<{ consistency_score: number; period_days: number; date_range: { start: Date; end: Date } }>(`/analytics/consistency?days=${days}`);
  }

  async getIdentityAlignment(days: number = 30): Promise<{ identity_alignment: number; period_days: number; date_range: { start: Date; end: Date } }> {
    return this.makeRequest<{ identity_alignment: number; period_days: number; date_range: { start: Date; end: Date } }>(`/analytics/identity-alignment?days=${days}`);
  }

  async getProductivityPatterns(days: number = 30): Promise<{ productivity_pattern: ProductivityMetrics; period_days: number; date_range: { start: Date; end: Date } }> {
    return this.makeRequest<{ productivity_pattern: ProductivityMetrics; period_days: number; date_range: { start: Date; end: Date } }>(`/analytics/productivity-patterns?days=${days}`);
  }

  async getDeepWorkTrend(days: number = 30): Promise<DeepWorkTrendResponse> {
    return this.makeRequest<DeepWorkTrendResponse>(`/analytics/deep-work-trend?days=${days}`);
  }

  // Insights and analysis
  async getBehavioralInsights(days: number = 30): Promise<{ insights: BehavioralInsight[]; period_days: number; date_range: { start: Date; end: Date } }> {
    return this.makeRequest<{ insights: BehavioralInsight[]; period_days: number; date_range: { start: Date; end: Date } }>(`/analytics/behavioral-insights?days=${days}`);
  }

  async getPersonalizationMetrics(days: number = 30): Promise<{ personalization_metrics: PersonalizationMetrics; period_days: number; date_range: { start: Date; end: Date } }> {
    return this.makeRequest<{ personalization_metrics: PersonalizationMetrics; period_days: number; date_range: { start: Date; end: Date } }>(`/analytics/personalization-metrics?days=${days}`);
  }

  async getPerformanceAnalysis(): Promise<PerformancePatternAnalysis> {
    return this.makeRequest<PerformancePatternAnalysis>('/analytics/performance-analysis');
  }

  // Habit analytics
  async getHabitStreaksAnalytics(): Promise<HabitStreaksAnalytics> {
    return this.makeRequest<HabitStreaksAnalytics>('/analytics/habit-streaks');
  }
}

// Create and export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;