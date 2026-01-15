import { getApiBaseUrl } from '../utils/apiConfig';

// Types
export interface EveningReview {
  id: string;
  user_id: string;
  date: Date;
  accomplished: string[];
  missed: string[];
  reasons: string[];
  tomorrow_tasks: string[];
  mood: number;
  energy_level: number;
  insights: string;
  created_at: Date;
}

export interface CreateEveningReviewRequest {
  date: string;
  accomplished: string[];
  missed: string[];
  reasons: string[];
  tomorrow_tasks: string[];
  mood: number;
  energy_level: number;
  insights: string;
}

export interface EveningReviewResponse {
  review: EveningReview;
}

export interface ReviewHistoryResponse {
  reviews: EveningReview[];
  total_reviews: number;
}

// Service
class EveningReviewServiceClass {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

  async createEveningReview(request: CreateEveningReviewRequest): Promise<EveningReviewResponse> {
    return this.makeRequest<EveningReviewResponse>('/evening-reviews', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTodayReview(): Promise<EveningReview | null> {
    try {
      return await this.makeRequest<EveningReview>('/evening-reviews/today');
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getReviewHistory(days: number = 30): Promise<ReviewHistoryResponse> {
    return this.makeRequest<ReviewHistoryResponse>(`/evening-reviews/history?days=${days}`);
  }
}

// Export singleton instance
export const eveningReviewService = new EveningReviewServiceClass();
