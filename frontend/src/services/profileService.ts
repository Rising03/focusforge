import { 
  CreateProfileRequest, 
  UpdateProfileRequest, 
  ProfileResponse,
  DetailedUserProfile 
} from '../types/profile';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class ProfileService {
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
  async createProfile(profileData: CreateProfileRequest): Promise<ProfileResponse> {
    return this.makeRequest<ProfileResponse>('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getProfile(): Promise<ProfileResponse> {
    return this.makeRequest<ProfileResponse>('/profile');
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<ProfileResponse> {
    return this.makeRequest<ProfileResponse>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async deleteProfile(): Promise<void> {
    await this.makeRequest<void>('/profile', {
      method: 'DELETE',
    });
  }

  async updateDetailedProfile(detailedProfile: Partial<DetailedUserProfile>): Promise<ProfileResponse> {
    return this.makeRequest<ProfileResponse>('/profile/detailed', {
      method: 'PUT',
      body: JSON.stringify(detailedProfile),
    });
  }

  async trackBehavioralEvent(eventType: string, eventData: any, context?: any): Promise<void> {
    await this.makeRequest<void>('/profile/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventType, eventData, context }),
    });
  }

  async getBehavioralAnalytics(days: number = 30): Promise<any[]> {
    return this.makeRequest<any[]>(`/profile/analytics?days=${days}`);
  }

  async getPersonalizationInsights(): Promise<any> {
    return this.makeRequest<any>('/profile/personalization-insights');
  }

  async updateBehavioralPatterns(patterns: any): Promise<void> {
    await this.makeRequest<void>('/profile/behavioral-patterns', {
      method: 'PUT',
      body: JSON.stringify(patterns),
    });
  }

  async sendBehavioralEvents(events: any[]): Promise<void> {
    await this.makeRequest<void>('/behavioral-analytics', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }
}

export const profileService = new ProfileService();