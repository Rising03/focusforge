import React, { useState, useEffect } from 'react';
import { aiService, AIServiceStatus } from '../services/aiService';

interface AIProcessingFeedbackProps {
  className?: string;
}

export const AIProcessingFeedback: React.FC<AIProcessingFeedbackProps> = ({
  className = ''
}) => {
  const [status, setStatus] = useState<AIServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const serviceStatus = await aiService.getServiceStatus();
      setStatus(serviceStatus);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setStatus({
        available: false,
        usage: { requestsThisMinute: 0, requestsToday: 0, available: false },
        features: { naturalLanguageProcessing: false, responseGeneration: false, fallbackOptions: true }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
        <span>Checking AI status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        Unable to check AI service status
      </div>
    );
  }

  const getStatusColor = () => {
    if (status.available) return 'text-green-600';
    if (status.features.fallbackOptions) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (status.available) return '🤖';
    if (status.features.fallbackOptions) return '⚠️';
    return '❌';
  };

  const getStatusMessage = () => {
    if (status.available) {
      const { requestsThisMinute, requestsToday } = status.usage;
      return `AI Active (${requestsThisMinute}/15 this minute, ${requestsToday}/1500 today)`;
    }
    if (status.features.fallbackOptions) {
      return 'AI Offline - Manual input available';
    }
    return 'AI Service unavailable';
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${getStatusColor()} ${className}`}>
      <span>{getStatusIcon()}</span>
      <span>{getStatusMessage()}</span>
      {status.available && status.usage.requestsThisMinute >= 14 && (
        <span className="text-xs text-amber-600">(Rate limit approaching)</span>
      )}
    </div>
  );
};