export interface DailyRoutine {
  id: string;
  user_id: string;
  date: Date | string; // Allow both Date and string to handle timezone issues
  segments: RoutineSegment[];
  adaptations: string[];
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoutineSegment {
  id: string;
  time_slot: TimeSlot;
  timeSlot?: { start: string; end: string }; // Camel case alias for test compatibility
  type: 'deep_work' | 'study' | 'skill_practice' | 'break' | 'personal';
  activity: string;
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface TimeSlot {
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
}

export interface RoutineGenerationRequest {
  user_id: string;
  date: Date;
  energy_level?: 'low' | 'medium' | 'high';
  available_time_override?: number; // in hours
  focus_areas?: string[];
}

export interface RoutineGenerationContext {
  user_profile: any; // UserProfile from profile types
  historical_performance?: PerformanceData;
  current_habits?: any[];
  contextual_factors?: ContextualFactors;
}

export interface PerformanceData {
  completion_rate: number;
  consistency_score: number;
  recent_failures: number;
  recent_successes: number;
  average_focus_quality: number;
  preferred_activity_types: string[];
}

export interface ContextualFactors {
  day_of_week: string;
  season: string;
  weather?: string;
  life_circumstances?: string[];
}

export interface RoutineComplexity {
  level: 'simple' | 'moderate' | 'complex';
  task_count: number;
  deep_work_blocks: number;
  break_frequency: number;
  multitasking_allowed: boolean;
}

export interface ActivityDistribution {
  deep_work_percentage: number;
  study_percentage: number;
  skill_practice_percentage: number;
  break_percentage: number;
  personal_percentage: number;
}

export interface RoutineAdaptation {
  trigger: string;
  adaptation_type: 'simplify' | 'increase_complexity' | 'adjust_timing' | 'change_focus';
  description: string;
  effectiveness_score?: number;
}

// Request/Response types for API
export interface CreateRoutineRequest {
  date: string; // YYYY-MM-DD format
  energy_level?: 'low' | 'medium' | 'high';
  available_time_override?: number;
  focus_areas?: string[];
}

export interface RoutineResponse {
  routine: DailyRoutine;
  complexity_level: string;
  adaptations_applied: string[];
  estimated_completion_time: number;
}

export interface RoutineUpdateRequest {
  segment_id: string;
  completed?: boolean;
  actual_duration?: number;
  focus_quality?: 'high' | 'medium' | 'low';
  notes?: string;
}