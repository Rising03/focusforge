export interface ParsedCommand {
  type: 'log_activity' | 'add_task' | 'request_plan' | 'ask_question';
  parameters: Record<string, any>;
  confidence: number;
  fallbackRequired: boolean;
}

export interface UserContext {
  userId: string;
  currentTime: Date;
  timezone: string;
  recentActivities: string[];
  activeRoutine?: any;
  preferences: {
    targetIdentity: string;
    academicGoals: string[];
    skillGoals: string[];
  };
}

export interface UserState {
  currentTask?: string;
  todayProgress: {
    completedTasks: number;
    totalTasks: number;
    focusedTime: number;
  };
  recentHabits: string[];
  energyLevel: 'low' | 'medium' | 'high';
}

export interface ManualInputOptions {
  suggestedActions: Array<{
    label: string;
    action: string;
    parameters?: Record<string, any>;
  }>;
  fallbackMessage: string;
  inputFields: Array<{
    name: string;
    type: 'text' | 'number' | 'select' | 'datetime';
    label: string;
    options?: string[];
    required: boolean;
  }>;
}

export interface AIResponse {
  success: boolean;
  data?: ParsedCommand;
  error?: string;
  fallbackOptions?: ManualInputOptions;
}