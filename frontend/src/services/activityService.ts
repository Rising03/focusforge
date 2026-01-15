import { 
  StartActivityRequest,
  StopActivityRequest,
  LogActivityRequest,
  ActivitySessionResponse,
  TimeUtilizationResponse,
  DailyStatsResponse,
  ActivityHistoryResponse
} from '../types/activity';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class ActivityService {
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

  // Activity session management
  async startActivity(request: StartActivityRequest): Promise<ActivitySessionResponse> {
    return this.makeRequest<ActivitySessionResponse>('/activities/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async stopActivity(sessionId: string, request: StopActivityRequest): Promise<ActivitySessionResponse> {
    return this.makeRequest<ActivitySessionResponse>(`/activities/${sessionId}/stop`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async logActivity(request: LogActivityRequest): Promise<ActivitySessionResponse> {
    return this.makeRequest<ActivitySessionResponse>('/activities/log', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getActiveSession(): Promise<ActivitySessionResponse | null> {
    try {
      return await this.makeRequest<ActivitySessionResponse>('/activities/active');
    } catch (error) {
      // Return null if no active session found
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Time utilization and stats
  async getTimeUtilization(date: string): Promise<TimeUtilizationResponse> {
    return this.makeRequest<TimeUtilizationResponse>(`/activities/utilization/${date}`);
  }

  async getTodayUtilization(): Promise<TimeUtilizationResponse> {
    return this.makeRequest<TimeUtilizationResponse>('/activities/utilization/today');
  }

  async getDailyStats(date: string): Promise<DailyStatsResponse> {
    return this.makeRequest<DailyStatsResponse>(`/activities/stats/${date}`);
  }

  // Activity history
  async getActivityHistory(params?: {
    start_date?: string;
    end_date?: string;
    activity_filter?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityHistoryResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.activity_filter) queryParams.append('activity_filter', params.activity_filter);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/activities/history?${queryString}` : '/activities/history';

    return this.makeRequest<ActivityHistoryResponse>(endpoint);
  }

  // Utility methods
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

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getFocusQualityColor(quality: 'high' | 'medium' | 'low'): string {
    switch (quality) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getFocusQualityBgColor(quality: 'high' | 'medium' | 'low'): string {
    switch (quality) {
      case 'high': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }

  calculateFocusPercentage(focusedTime: number, totalTime: number): number {
    if (totalTime === 0) return 0;
    return Math.round((focusedTime / totalTime) * 100);
  }

  getProductivityInsight(focusPercentage: number): string {
    if (focusPercentage >= 80) {
      return 'Excellent focus quality';
    } else if (focusPercentage >= 60) {
      return 'Good focus quality';
    } else if (focusPercentage >= 40) {
      return 'Moderate focus quality';
    } else {
      return 'Low focus quality';
    }
  }
}

export const activityService = new ActivityService();