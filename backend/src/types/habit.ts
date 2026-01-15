export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  cue?: string;
  reward?: string;
  stacked_after?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  date: Date;
  completed: boolean;
  quality?: 'excellent' | 'good' | 'poor';
  notes?: string;
  created_at: Date;
}

export interface HabitDefinition {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  cue?: string;
  reward?: string;
  stacked_after?: string;
}

export interface HabitStreak {
  habit_id: string;
  habit_name: string;
  current_streak: number;
  longest_streak: number;
  last_completed: Date | null;
  consistency_percentage: number;
}

export interface HabitStackSuggestion {
  existing_habit_id: string;
  existing_habit_name: string;
  suggested_new_habit: string;
  reason: string;
  confidence_score: number;
}

export interface ConsistencyScore {
  overall_score: number;
  habit_scores: {
    habit_id: string;
    habit_name: string;
    score: number;
    streak: number;
  }[];
  insights: string[];
  recommendations: string[];
}

// Request/Response types for API
export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  cue?: string;
  reward?: string;
  stacked_after?: string;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  frequency?: 'daily' | 'weekly';
  cue?: string;
  reward?: string;
  stacked_after?: string;
  is_active?: boolean;
}

export interface LogHabitCompletionRequest {
  habit_id: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  quality?: 'excellent' | 'good' | 'poor';
  notes?: string;
}

export interface HabitResponse {
  habit: Habit;
  current_streak: number;
  completion_rate_30_days: number;
  last_completed: Date | null;
}

export interface HabitCompletionResponse {
  completion: HabitCompletion;
  streak_updated: boolean;
  new_streak_length: number;
  never_miss_twice_triggered: boolean;
}

export interface HabitsListResponse {
  habits: HabitResponse[];
  overall_consistency: number;
  total_active_habits: number;
  habits_completed_today: number;
}

export interface HabitStreaksResponse {
  streaks: HabitStreak[];
  overall_consistency: number;
  longest_current_streak: number;
  most_consistent_habit: string;
}

export interface HabitStackSuggestionsResponse {
  suggestions: HabitStackSuggestion[];
  existing_stacks: {
    parent_habit: string;
    stacked_habits: string[];
  }[];
}

export interface HabitAnalyticsRequest {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  habit_ids?: string[];
}

export interface HabitAnalyticsResponse {
  period: {
    start_date: Date;
    end_date: Date;
  };
  habits: {
    habit_id: string;
    habit_name: string;
    total_opportunities: number;
    completed_count: number;
    completion_rate: number;
    streak_data: {
      current_streak: number;
      longest_streak_in_period: number;
      streak_breaks: number;
    };
    quality_distribution: {
      excellent: number;
      good: number;
      poor: number;
    };
  }[];
  insights: string[];
  recommendations: string[];
}