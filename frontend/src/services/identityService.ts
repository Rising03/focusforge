import {
  CalculateIdentityAlignmentRequest,
  IdentityAlignmentResponse,
  TaskAcknowledgmentRequest,
  TaskAcknowledgmentResponse,
  ActivitySuggestionRequest,
  ActivitySuggestionResponse,
  EnvironmentAssessmentRequest,
  EnvironmentAssessmentResponse,
  DistractionReportRequest,
  DistractionReportResponse,
  EnvironmentCorrelationResponse
} from '../types/identity';

import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class IdentityService {
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

  async calculateIdentityAlignment(request: CalculateIdentityAlignmentRequest = {}): Promise<IdentityAlignmentResponse> {
    const queryParams = new URLSearchParams();
    if (request.days) {
      queryParams.append('days', request.days.toString());
    }

    const endpoint = `/identity/alignment${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<IdentityAlignmentResponse>(endpoint);
  }

  async acknowledgeTask(request: TaskAcknowledgmentRequest): Promise<TaskAcknowledgmentResponse> {
    return this.makeRequest<TaskAcknowledgmentResponse>('/identity/acknowledge-task', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async suggestActivities(request: ActivitySuggestionRequest = {}): Promise<ActivitySuggestionResponse> {
    const queryParams = new URLSearchParams();
    if (request.context) {
      queryParams.append('context', request.context);
    }
    if (request.available_time) {
      queryParams.append('available_time', request.available_time.toString());
    }
    if (request.energy_level) {
      queryParams.append('energy_level', request.energy_level);
    }

    const endpoint = `/identity/suggest-activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<ActivitySuggestionResponse>(endpoint);
  }

  async assessEnvironment(request: EnvironmentAssessmentRequest): Promise<EnvironmentAssessmentResponse> {
    return this.makeRequest<EnvironmentAssessmentResponse>('/identity/assess-environment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async reportDistraction(request: DistractionReportRequest): Promise<DistractionReportResponse> {
    return this.makeRequest<DistractionReportResponse>('/identity/report-distraction', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getEnvironmentCorrelations(): Promise<EnvironmentCorrelationResponse> {
    return this.makeRequest<EnvironmentCorrelationResponse>('/identity/environment-correlations');
  }

  async trackEnvironmentCorrelation(
    environmentFactor: string, 
    factorValue: string, 
    productivityImpact: number
  ): Promise<void> {
    await this.makeRequest<void>('/identity/track-environment-correlation', {
      method: 'POST',
      body: JSON.stringify({
        environment_factor: environmentFactor,
        factor_value: factorValue,
        productivity_impact: productivityImpact,
      }),
    });
  }
}

export const identityService = new IdentityService();