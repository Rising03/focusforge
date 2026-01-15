export interface ActivitySession {
  id: string;
  user_id: string;
  activity: string;
  start_time: Date;
  end_time?: Date;
  duration?: number; // in minutes
  focus_quality: 'high' | 'medium' | 'low';
  distractions: number;
  notes?: string;
  created_at: Date;
}

export interface ActivityStart {
  activity: string;
  notes?: string;
}

export interface ActivityLog {
  activity: string;
  start_time: Date;
  end_time: Date;
  focus_quality: 'high' | 'medium' | 'low';
  distractions: number;
  notes?: string;
}

export interface TimeUtilization {
  date: Date;
  focused_time: number; // in minutes
  distracted_time: number; // in minutes
  unused_time: number; // in minutes
  deep_work_hours: number;
  categories: CategoryTime[];
}

export interface CategoryTime {
  category: string;
  time: number; // in minutes
  percentage: number;
}

export interface DailyStats {
  date: Date;
  total_tracked_time: number; // in minutes
  focus_sessions: number;
  average_focus_quality: number;
  distraction_count: number;
  most_productive_hour: string;
  activity_breakdown: ActivityBreakdown[];
}

export interface ActivityBreakdown {
  activity: string;
  time: number; // in minutes
  sessions: number;
  average_focus: number;
}

// Request/Response types for API
export interface StartActivityRequest {
  activity: string;
  notes?: string;
}

export interface StopActivityRequest {
  focus_quality: 'high' | 'medium' | 'low';
  distractions: number;
  notes?: string;
}

export interface LogActivityRequest {
  activity: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  focus_quality: 'high' | 'medium' | 'low';
  distractions: number;
  notes?: string;
}

export interface ActivitySessionResponse {
  session: ActivitySession;
  duration_minutes?: number;
  is_active: boolean;
}

export interface TimeUtilizationResponse {
  utilization: TimeUtilization;
  insights: string[];
  recommendations: string[];
}

export interface DailyStatsResponse {
  stats: DailyStats;
  comparison_to_average: {
    total_time_diff: number;
    focus_quality_diff: number;
    productivity_trend: 'improving' | 'declining' | 'stable';
  };
}

export interface ActivityHistoryRequest {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  activity_filter?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityHistoryResponse {
  sessions: ActivitySession[];
  total_count: number;
  summary: {
    total_time: number;
    average_session_length: number;
    most_common_activity: string;
    best_focus_day: string;
  };
}