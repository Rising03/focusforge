export interface DailyRoutine {
  id: string;
  user_id: string;
  date: Date;
  segments: RoutineSegment[];
  adaptations: string[];
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoutineSegment {
  id: string;
  time_slot: TimeSlot;
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

// V3: Manual time slot definition
export interface ManualTimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  purpose: string; // What the user wants to do in this slot
}

// V3: Time range preset
export interface TimeRange {
  start?: string; // HH:MM format
  end?: string; // HH:MM format
  preset?: 'morning' | 'afternoon' | 'evening' | 'full-day';
}

export interface CreateRoutineRequest {
  date: string; // YYYY-MM-DD format
  
  // V2 fields (backward compatible)
  energy_level?: 'low' | 'medium' | 'high';
  available_time_override?: number;
  focus_areas?: string[];
  has_classes?: boolean;
  university_hours?: number;
  class_start_time?: string; // HH:MM format
  class_end_time?: string; // HH:MM format
  
  // V3 fields
  mode?: 'automatic' | 'manual'; // Generation mode
  timeRange?: TimeRange; // Time range for routine
  priorityFocus?: 'critical' | 'high' | 'medium' | 'low'; // Priority level
  manualSlots?: ManualTimeSlot[]; // User-defined time slots (manual mode)
  naturalLanguageRequest?: string; // Natural language input for AI parsing
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

// UI State types
export interface RoutineState {
  currentRoutine: DailyRoutine | null;
  isLoading: boolean;
  error: string | null;
}

export interface FocusScreenData {
  currentTask: RoutineSegment | null;
  nextTask: RoutineSegment | null;
  timeRemaining: number; // in minutes
  totalProgress: number; // percentage
  completedTasks: number;
  totalTasks: number;
}