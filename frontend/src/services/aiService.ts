import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

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

export interface AIServiceStatus {
  available: boolean;
  usage: {
    requestsThisMinute: number;
    requestsToday: number;
    available: boolean;
  };
  features: {
    naturalLanguageProcessing: boolean;
    responseGeneration: boolean;
    fallbackOptions: boolean;
  };
}

class AIService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}/ai${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async parseInput(
    input: string, 
    context?: Partial<UserContext>
  ): Promise<AIResponse> {
    try {
      const fullContext: UserContext = {
        userId: '', // Will be filled by backend from token
        currentTime: new Date(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        recentActivities: [],
        preferences: {
          targetIdentity: 'disciplined student',
          academicGoals: [],
          skillGoals: []
        },
        ...context
      };

      return await this.makeRequest<AIResponse>('/parse', {
        method: 'POST',
        body: JSON.stringify({
          input,
          ...fullContext
        }),
      });
    } catch (error) {
      console.error('AI parsing error:', error);
      
      // Return fallback options on error
      const fallbackOptions = await this.getFallbackOptions(input);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackOptions
      };
    }
  }

  async generateResponse(
    command: ParsedCommand, 
    userState?: Partial<UserState>
  ): Promise<string> {
    try {
      const fullUserState: UserState = {
        todayProgress: {
          completedTasks: 0,
          totalTasks: 0,
          focusedTime: 0
        },
        recentHabits: [],
        energyLevel: 'medium',
        ...userState
      };

      const response = await this.makeRequest<{ response: string }>('/respond', {
        method: 'POST',
        body: JSON.stringify({
          command,
          userState: fullUserState
        }),
      });

      return response.response;
    } catch (error) {
      console.error('AI response generation error:', error);
      
      // Return fallback response
      return this.getFallbackResponse(command);
    }
  }

  async getServiceStatus(): Promise<AIServiceStatus> {
    try {
      return await this.makeRequest<AIServiceStatus>('/status');
    } catch (error) {
      console.error('AI status check error:', error);
      
      // Return offline status
      return {
        available: false,
        usage: {
          requestsThisMinute: 0,
          requestsToday: 0,
          available: false
        },
        features: {
          naturalLanguageProcessing: false,
          responseGeneration: false,
          fallbackOptions: true
        }
      };
    }
  }

  async getFallbackOptions(input: string): Promise<ManualInputOptions> {
    try {
      return await this.makeRequest<ManualInputOptions>('/fallback', {
        method: 'POST',
        body: JSON.stringify({ input }),
      });
    } catch (error) {
      console.error('Fallback options error:', error);
      
      // Return default fallback options
      return {
        suggestedActions: [
          { label: 'Log Activity', action: 'log_activity' },
          { label: 'Add Task', action: 'add_task' },
          { label: 'Request Plan', action: 'request_plan' },
          { label: 'Ask Question', action: 'ask_question' }
        ],
        fallbackMessage: 'AI service is unavailable. Please choose one of these actions:',
        inputFields: [
          { name: 'input', type: 'text', label: 'Please describe what you\'d like to do', required: true }
        ]
      };
    }
  }

  private getFallbackResponse(command: ParsedCommand): string {
    const responses = {
      log_activity: "Great work! Logging your activities helps build awareness of how you spend your time.",
      add_task: "Task added. Breaking down your goals into specific actions is a key habit of disciplined students.",
      request_plan: "I'll help you create a structured plan. Consistent planning is what separates successful students from the rest.",
      ask_question: "That's a thoughtful question. Seeking clarity shows you're taking ownership of your learning."
    };

    return responses[command.type] || "I understand. Let's keep building these disciplined habits together.";
  }

  // Check if AI features are available
  async isAvailable(): Promise<boolean> {
    try {
      const status = await this.getServiceStatus();
      return status.available;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();