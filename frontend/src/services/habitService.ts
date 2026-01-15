import { 
  CreateHabitRequest,
  UpdateHabitRequest,
  LogHabitCompletionRequest,
  HabitResponse,
  HabitCompletionResponse,
  HabitsListResponse,
  HabitStreaksResponse,
  HabitStackSuggestionsResponse,
  TodayHabitsResponse,
  HabitAnalyticsResponse,
  ConsistencyScore
} from '../types/habit';

import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class HabitService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
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

  // Habit CRUD operations
  async createHabit(request: CreateHabitRequest): Promise<HabitResponse> {
    return this.makeRequest<HabitResponse>('/habits', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateHabit(habitId: string, request: UpdateHabitRequest): Promise<HabitResponse> {
    return this.makeRequest<HabitResponse>(`/habits/${habitId}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async deleteHabit(habitId: string): Promise<void> {
    await this.makeRequest<void>(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  async getUserHabits(includeInactive: boolean = false): Promise<HabitsListResponse> {
    const queryParams = includeInactive ? '?include_inactive=true' : '';
    return this.makeRequest<HabitsListResponse>(`/habits${queryParams}`);
  }

  // Habit completion
  async logHabitCompletion(request: LogHabitCompletionRequest): Promise<HabitCompletionResponse> {
    return this.makeRequest<HabitCompletionResponse>('/habits/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTodayHabits(): Promise<TodayHabitsResponse> {
    return this.makeRequest<TodayHabitsResponse>('/habits/today');
  }

  // Analytics and insights
  async getHabitStreaks(): Promise<HabitStreaksResponse> {
    return this.makeRequest<HabitStreaksResponse>('/habits/streaks');
  }

  async getConsistencyScore(): Promise<ConsistencyScore> {
    return this.makeRequest<ConsistencyScore>('/habits/consistency');
  }

  async getHabitAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    habit_ids?: string[];
  }): Promise<HabitAnalyticsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.habit_ids) queryParams.append('habit_ids', params.habit_ids.join(','));

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/habits/analytics?${queryString}` : '/habits/analytics';

    return this.makeRequest<HabitAnalyticsResponse>(endpoint);
  }

  // Habit stacking
  async getHabitStackSuggestions(): Promise<HabitStackSuggestionsResponse> {
    return this.makeRequest<HabitStackSuggestionsResponse>('/habits/stack-suggestions');
  }

  // Utility methods
  formatFrequency(frequency: 'daily' | 'weekly'): string {
    return frequency === 'daily' ? 'Daily' : 'Weekly';
  }

  formatStreak(streak: number): string {
    if (streak === 0) return 'No streak';
    if (streak === 1) return '1 day';
    return `${streak} days`;
  }

  formatConsistencyPercentage(percentage: number): string {
    return `${Math.round(percentage)}%`;
  }

  getStreakColor(streak: number): string {
    if (streak >= 21) return 'text-green-600';
    if (streak >= 7) return 'text-blue-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  }

  getStreakBgColor(streak: number): string {
    if (streak >= 21) return 'bg-green-100';
    if (streak >= 7) return 'bg-blue-100';
    if (streak >= 3) return 'bg-yellow-100';
    return 'bg-gray-100';
  }

  getConsistencyColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  getConsistencyBgColor(percentage: number): string {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-blue-100';
    if (percentage >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  getQualityColor(quality: 'excellent' | 'good' | 'poor' | null): string {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }

  getQualityBgColor(quality: 'excellent' | 'good' | 'poor' | null): string {
    switch (quality) {
      case 'excellent': return 'bg-green-100';
      case 'good': return 'bg-blue-100';
      case 'poor': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  formatDisplayDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  isToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  getHabitIcon(habitName: string): string {
    const name = habitName.toLowerCase();
    
    if (name.includes('exercise') || name.includes('workout') || name.includes('run')) {
      return '🏃‍♂️';
    } else if (name.includes('read') || name.includes('book')) {
      return '📚';
    } else if (name.includes('meditat') || name.includes('mindful')) {
      return '🧘‍♂️';
    } else if (name.includes('water') || name.includes('drink')) {
      return '💧';
    } else if (name.includes('sleep') || name.includes('bed')) {
      return '😴';
    } else if (name.includes('journal') || name.includes('write')) {
      return '✍️';
    } else if (name.includes('study') || name.includes('learn')) {
      return '📖';
    } else if (name.includes('clean') || name.includes('tidy')) {
      return '🧹';
    } else if (name.includes('vitamin') || name.includes('supplement')) {
      return '💊';
    } else if (name.includes('stretch') || name.includes('yoga')) {
      return '🤸‍♂️';
    } else {
      return '✅';
    }
  }

  getMotivationalMessage(streak: number, consistency: number): string {
    if (streak >= 21 && consistency >= 80) {
      return "Outstanding! You've built a strong habit. Keep it up!";
    } else if (streak >= 7) {
      return "Great streak! You're building momentum.";
    } else if (streak >= 3) {
      return "Good start! Keep the momentum going.";
    } else if (consistency >= 60) {
      return "You're doing well overall. Focus on consistency.";
    } else {
      return "Every day is a new opportunity. You've got this!";
    }
  }

  getNeverMissTwiceMessage(): string {
    return "Remember: Never miss twice! Get back on track today.";
  }

  getHabitStackingTip(existingHabit: string, newHabit: string): string {
    return `After I ${existingHabit.toLowerCase()}, I will ${newHabit.toLowerCase()}.`;
  }

  calculateCompletionRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  generateHabitInsight(habitData: any): string {
    const { completion_rate, streak_data, quality_distribution } = habitData;
    
    if (completion_rate >= 80) {
      return `Excellent consistency at ${completion_rate.toFixed(1)}%`;
    } else if (completion_rate >= 60) {
      return `Good progress with room for improvement`;
    } else if (streak_data.streak_breaks > 2) {
      return `Focus on consistency - avoid missing twice in a row`;
    } else {
      return `Building the habit - stay patient and consistent`;
    }
  }

  sortHabitsByPriority(habits: any[]): any[] {
    return habits.sort((a, b) => {
      // Sort by: 1) Active status, 2) Current streak (desc), 3) Consistency (desc), 4) Name
      if (a.habit.is_active !== b.habit.is_active) {
        return a.habit.is_active ? -1 : 1;
      }
      
      if (a.current_streak !== b.current_streak) {
        return b.current_streak - a.current_streak;
      }
      
      if (a.completion_rate_30_days !== b.completion_rate_30_days) {
        return b.completion_rate_30_days - a.completion_rate_30_days;
      }
      
      return a.habit.name.localeCompare(b.habit.name);
    });
  }
}

export const habitService = new HabitService();