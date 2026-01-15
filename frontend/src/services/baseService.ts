import { authService } from './authService';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

export abstract class BaseService {
  protected async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      // Ensure we have a valid token before making the request
      const token = await authService.ensureValidToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      // If we still get a 401 and haven't retried yet, try once more
      if (response.status === 401 && retryCount === 0) {
        try {
          console.log('🔄 Got 401, attempting token refresh...');
          await authService.refreshToken();
          
          // Retry the request with the new token
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          console.log('🧹 Clearing invalid tokens and redirecting to login...');
          
          // Clear all storage to remove invalid tokens
          localStorage.clear();
          sessionStorage.clear();
          
          // Show user-friendly message
          alert('Your session has expired. Please log in again.');
          
          // Redirect to login
          window.location.href = '/';
          throw new Error('Session expired. Please log in again.');
        }
      }

      // If we get a 401 after retry, tokens are completely invalid
      if (response.status === 401 && retryCount > 0) {
        console.error('❌ Still getting 401 after token refresh - tokens are invalid');
        console.log('🧹 Clearing all storage and redirecting to login...');
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Show user-friendly message
        alert('Your session has expired. Please log in again.');
        
        // Redirect to login
        window.location.href = '/';
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      // If token refresh fails, handle gracefully
      if (error instanceof Error && error.message.includes('No refresh token')) {
        console.log('🧹 No refresh token available - clearing storage...');
        localStorage.clear();
        sessionStorage.clear();
        alert('Your session has expired. Please log in again.');
        window.location.href = '/';
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  }
}