import { 
  DailyRoutine,
  RoutineResponse,
  CreateRoutineRequest,
  RoutineUpdateRequest,
  FocusScreenData,
  RoutineSegment
} from '../types/routine';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class RoutineService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }
  // Routine management
  async generateDailyRoutine(request: CreateRoutineRequest): Promise<RoutineResponse> {
    const response = await this.makeRequest<any>('/routines/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Handle both old and new response formats
    return {
      routine: response.data?.routine || response.routine || response,
      complexity_level: response.complexity_level || 'medium',
      adaptations_applied: response.adaptations_applied || [],
      estimated_completion_time: response.estimated_completion_time || 0
    };
  }

  // V3: Generate routine from natural language
  async generateFromNaturalLanguage(input: string, date?: string): Promise<RoutineResponse> {
    const response = await this.makeRequest<any>('/routines/generate', {
      method: 'POST',
      body: JSON.stringify({
        date: date || new Date().toISOString().split('T')[0],
        mode: 'automatic',
        naturalLanguageRequest: input
      }),
    });
    
    // Handle both old and new response formats
    return {
      routine: response.data?.routine || response.routine || response,
      complexity_level: response.complexity_level || 'medium',
      adaptations_applied: response.adaptations_applied || [],
      estimated_completion_time: response.estimated_completion_time || 0
    };
  }

  // V3: Generate routine with manual time slots
  async generateWithManualSlots(manualSlots: any[], date?: string): Promise<RoutineResponse> {
    const response = await this.makeRequest<any>('/routines/generate', {
      method: 'POST',
      body: JSON.stringify({
        date: date || new Date().toISOString().split('T')[0],
        mode: 'manual',
        manualSlots
      }),
    });
    
    // Handle both old and new response formats
    return {
      routine: response.data?.routine || response.routine || response,
      complexity_level: response.complexity_level || 'medium',
      adaptations_applied: response.adaptations_applied || [],
      estimated_completion_time: response.estimated_completion_time || 0
    };
  }

  async getTodayRoutine(): Promise<DailyRoutine | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.makeRequest<DailyRoutine>(`/routines/date/${today}`);
    } catch (error) {
      // Return null if no routine found for today
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getRoutineByDate(date: string): Promise<DailyRoutine | null> {
    try {
      return await this.makeRequest<DailyRoutine>(`/routines/date/${date}`);
    } catch (error) {
      // Return null if no routine found
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async updateRoutineSegment(routineId: string, update: RoutineUpdateRequest): Promise<void> {
    await this.makeRequest(`/routines/${routineId}/segments`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }

  // Focus screen specific methods
  async getFocusScreenData(): Promise<FocusScreenData> {
    const routine = await this.getTodayRoutine();
    
    if (!routine) {
      return {
        currentTask: null,
        nextTask: null,
        timeRemaining: 0,
        totalProgress: 0,
        completedTasks: 0,
        totalTasks: 0
      };
    }

    const currentTime = new Date();
    const currentTask = this.getCurrentTask(routine, currentTime);
    const nextTask = this.getNextTask(routine, currentTask);
    const timeRemaining = this.calculateTimeRemaining(currentTask, currentTime);
    const completedTasks = routine.segments.filter(s => s.completed).length;
    const totalTasks = routine.segments.length;
    const totalProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      currentTask,
      nextTask,
      timeRemaining,
      totalProgress,
      completedTasks,
      totalTasks
    };
  }

  private getCurrentTask(routine: DailyRoutine, currentTime: Date): RoutineSegment | null {
    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Find the segment that should be active right now
    for (const segment of routine.segments) {
      const startMinutes = this.parseTime(segment.time_slot.start_time);
      const endMinutes = this.parseTime(segment.time_slot.end_time);
      
      if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes && !segment.completed) {
        return segment;
      }
    }

    // If no current task, return the next incomplete task
    return routine.segments.find(s => !s.completed) || null;
  }

  private getNextTask(routine: DailyRoutine, currentTask: RoutineSegment | null): RoutineSegment | null {
    if (!currentTask) {
      return routine.segments.find(s => !s.completed) || null;
    }

    const currentIndex = routine.segments.findIndex(s => s.id === currentTask.id);
    if (currentIndex === -1) return null;

    // Find the next incomplete task
    for (let i = currentIndex + 1; i < routine.segments.length; i++) {
      if (!routine.segments[i].completed) {
        return routine.segments[i];
      }
    }

    return null;
  }

  private calculateTimeRemaining(task: RoutineSegment | null, currentTime: Date): number {
    if (!task) return 0;

    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const endTimeMinutes = this.parseTime(task.time_slot.end_time);
    
    return Math.max(0, endTimeMinutes - currentTimeMinutes);
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Utility methods
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  getPriorityBgColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'bg-red-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  }

  getActivityTypeIcon(type: RoutineSegment['type']): string {
    switch (type) {
      case 'deep_work': return '🧠';
      case 'study': return '📚';
      case 'skill_practice': return '🎯';
      case 'break': return '☕';
      case 'personal': return '🏠';
      default: return '📝';
    }
  }

  getActivityTypeColor(type: RoutineSegment['type']): string {
    switch (type) {
      case 'deep_work': return 'text-purple-600';
      case 'study': return 'text-blue-600';
      case 'skill_practice': return 'text-green-600';
      case 'break': return 'text-orange-600';
      case 'personal': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  getNextActionSuggestion(currentTask: RoutineSegment | null, nextTask: RoutineSegment | null): string {
    if (!currentTask && !nextTask) {
      return "No tasks scheduled. Consider creating a routine for today.";
    }

    if (!currentTask && nextTask) {
      return `Get ready for: ${nextTask.activity}`;
    }

    if (currentTask && !nextTask) {
      return "Focus on completing your current task. You're almost done for today!";
    }

    if (currentTask && nextTask) {
      const timeRemaining = this.calculateTimeRemaining(currentTask, new Date());
      if (timeRemaining < 15) {
        return `Prepare for next: ${nextTask.activity}`;
      } else {
        return `Stay focused on: ${currentTask.activity}`;
      }
    }

    return "Keep up the great work!";
  }
}

export const routineService = new RoutineService();