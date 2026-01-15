import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

interface GoogleCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function GoogleCallback({ onSuccess, onError }: GoogleCallbackProps) {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        // Exchange the code for tokens
        await authService.handleGoogleCallback(code);
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        onSuccess();
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        onError(error instanceof Error ? error.message : 'Google authentication failed');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Google Sign In
          </h2>
          <p className="text-gray-600">
            Please wait while we finish setting up your account...
          </p>
        </div>
      </div>
    );
  }

  return null;
}