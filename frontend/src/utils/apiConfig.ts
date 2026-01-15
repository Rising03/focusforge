// Utility function to get API URL that works in both Vite and Jest environments
export const getApiBaseUrl = (): string => {
  // Check if we're in a test environment (Jest)
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return process.env.VITE_API_URL || 'http://localhost:3001/api';
  }
  
  // Check if we're in a Vite environment with window global
  if (typeof window !== 'undefined' && (window as any).VITE_API_URL) {
    return (window as any).VITE_API_URL;
  }
  
  // For production, use relative URLs to work with any domain
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  
  // Fallback for development and testing
  return 'http://localhost:3001/api';
};