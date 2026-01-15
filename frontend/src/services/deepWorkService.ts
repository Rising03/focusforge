import {
  ScheduleDeepWorkRequest,
  StartDeepWorkRequest,
  CompleteDeepWorkRequest,
  WorkQualityAssessmentRequest,
  AttentionTrainingRequest,
  DeepWorkScheduleResponse,
  DeepWorkAnalyticsResponse,
  OptimalSchedulingResponse,
  EnergyPatternsResponse,
  AttentionMetrics,
  AttentionTrainingSession,
  DeepWorkSession
} from '../types/deepWork';

import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class DeepWorkService {
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

  // Energy pattern analysis
  async analyzeEnergyPatterns(): Promise<EnergyPatternsResponse> {
    return this.makeRequest<EnergyPatternsResponse>('/deep-work/energy-patterns');
  }

  async getOptimalTimeSlots(date?: string): Promise<OptimalSchedulingResponse> {
    const queryParams = date ? `?date=${date}` : '';
    return this.makeRequest<OptimalSchedulingResponse>(`/deep-work/optimal-slots${queryParams}`);
  }

  // Deep work session management
  async scheduleDeepWork(request: ScheduleDeepWorkRequest): Promise<DeepWorkScheduleResponse> {
    return this.makeRequest<DeepWorkScheduleResponse>('/deep-work/schedule', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async startDeepWorkSession(request: StartDeepWorkRequest): Promise<{ session: DeepWorkSession; message: string; tips: string[] }> {
    return this.makeRequest('/deep-work/start', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async completeDeepWorkSession(request: CompleteDeepWorkRequest): Promise<{ session: DeepWorkSession; message: string; insights: string[] }> {
    return this.makeRequest('/deep-work/complete', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async getUserDeepWorkSessions(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ sessions: DeepWorkSession[]; total_count: number }> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/deep-work/sessions?${queryString}` : '/deep-work/sessions';

    return this.makeRequest(endpoint);
  }

  // Work quality assessment
  async recordWorkQualityAssessment(request: WorkQualityAssessmentRequest): Promise<{ measurement: any; message: string; overall_score: number }> {
    return this.makeRequest('/deep-work/quality-assessment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Attention training
  async createAttentionTrainingSession(request: AttentionTrainingRequest): Promise<{ session: AttentionTrainingSession; message: string; performance_feedback: string }> {
    return this.makeRequest('/deep-work/attention-training', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAttentionMetrics(): Promise<{ metrics?: AttentionMetrics; message?: string; suggested_exercises?: string[]; insights?: string[] }> {
    return this.makeRequest('/deep-work/attention-metrics');
  }

  // Analytics and insights
  async getDeepWorkAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<DeepWorkAnalyticsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/deep-work/analytics?${queryString}` : '/deep-work/analytics';

    return this.makeRequest<DeepWorkAnalyticsResponse>(endpoint);
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

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  getCognitiveLoadColor(load: 'light' | 'medium' | 'heavy'): string {
    switch (load) {
      case 'light': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'heavy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getCognitiveLoadBgColor(load: 'light' | 'medium' | 'heavy'): string {
    switch (load) {
      case 'light': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'heavy': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }

  getPriorityColor(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'low': return 'text-gray-600';
      case 'medium': return 'text-blue-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getPriorityBgColor(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'low': return 'bg-gray-100';
      case 'medium': return 'bg-blue-100';
      case 'high': return 'bg-orange-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }

  getStatusColor(status: 'scheduled' | 'preparing' | 'active' | 'completed' | 'cancelled'): string {
    switch (status) {
      case 'scheduled': return 'text-blue-600';
      case 'preparing': return 'text-yellow-600';
      case 'active': return 'text-green-600';
      case 'completed': return 'text-gray-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getStatusBgColor(status: 'scheduled' | 'preparing' | 'active' | 'completed' | 'cancelled'): string {
    switch (status) {
      case 'scheduled': return 'bg-blue-100';
      case 'preparing': return 'bg-yellow-100';
      case 'active': return 'bg-green-100';
      case 'completed': return 'bg-gray-100';
      case 'cancelled': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }

  getEnergyLevelText(level: number): string {
    if (level >= 4.5) return 'Very High';
    if (level >= 3.5) return 'High';
    if (level >= 2.5) return 'Medium';
    if (level >= 1.5) return 'Low';
    return 'Very Low';
  }

  getAttentionTrendColor(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getAttentionTrendIcon(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving': return '↗️';
      case 'stable': return '→';
      case 'declining': return '↘️';
      default: return '→';
    }
  }

  getExerciseTypeLabel(type: 'focus_breathing' | 'attention_restoration' | 'cognitive_control' | 'sustained_attention'): string {
    switch (type) {
      case 'focus_breathing': return 'Focus Breathing';
      case 'attention_restoration': return 'Attention Restoration';
      case 'cognitive_control': return 'Cognitive Control';
      case 'sustained_attention': return 'Sustained Attention';
      default: return type;
    }
  }

  getPerformanceLevel(score: number): { level: string; color: string } {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600' };
    return { level: 'Needs Improvement', color: 'text-red-600' };
  }

  calculateSessionProgress(session: DeepWorkSession): number {
    if (session.status === 'completed') return 100;
    if (session.status === 'cancelled') return 0;
    
    const now = new Date();
    const startTime = new Date(session.planned_start_time);
    const endTime = new Date(session.planned_end_time);
    
    if (now < startTime) return 0;
    if (now > endTime) return 100;
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  getNextOptimalSlot(slots: Array<{ time_slot: string; energy_prediction: number }>): string | null {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find the next available slot after current time
    const futureSlots = slots.filter(slot => {
      const slotHour = parseInt(slot.time_slot.split(':')[0]);
      return slotHour > currentHour;
    });
    
    if (futureSlots.length === 0) {
      // If no slots today, return the first slot for tomorrow
      return slots[0]?.time_slot || null;
    }
    
    // Return the slot with highest energy prediction among future slots
    const bestSlot = futureSlots.sort((a, b) => b.energy_prediction - a.energy_prediction)[0];
    return bestSlot.time_slot;
  }
}

export const deepWorkService = new DeepWorkService();