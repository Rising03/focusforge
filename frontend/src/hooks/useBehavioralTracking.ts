import { useEffect, useRef, useCallback } from 'react';
import { behavioralAnalyticsService } from '../services/behavioralAnalyticsService';

interface UseBehavioralTrackingOptions {
  featureName: string;
  trackClicks?: boolean;
  trackHovers?: boolean;
  trackFocus?: boolean;
  trackScroll?: boolean;
  autoTrackEngagement?: boolean;
}

export const useBehavioralTracking = (options: UseBehavioralTrackingOptions) => {
  const {
    featureName,
    trackClicks = true,
    trackHovers = false,
    trackFocus = false,
    trackScroll = false,
    autoTrackEngagement = true
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const engagementStartTime = useRef<number | null>(null);

  // Track feature usage start/end
  useEffect(() => {
    if (autoTrackEngagement) {
      behavioralAnalyticsService.trackFeatureUsage(featureName, 'start');
      
      return () => {
        behavioralAnalyticsService.trackFeatureUsage(featureName, 'end');
      };
    }
  }, [featureName, autoTrackEngagement]);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleClick = (e: Event) => {
      if (trackClicks) {
        behavioralAnalyticsService.trackUserInteraction(featureName, 'click');
        behavioralAnalyticsService.trackFeatureUsage(featureName, 'interact');
      }
    };

    const handleMouseEnter = (e: Event) => {
      if (trackHovers) {
        behavioralAnalyticsService.trackUserInteraction(featureName, 'hover');
        engagementStartTime.current = Date.now();
      }
    };

    const handleMouseLeave = (e: Event) => {
      if (trackHovers && engagementStartTime.current) {
        const duration = Date.now() - engagementStartTime.current;
        behavioralAnalyticsService.trackEvent('hover_duration', {
          feature: featureName,
          duration
        });
        engagementStartTime.current = null;
      }
    };

    const handleFocus = (e: Event) => {
      if (trackFocus) {
        behavioralAnalyticsService.trackUserInteraction(featureName, 'focus');
      }
    };

    const handleScroll = (e: Event) => {
      if (trackScroll) {
        behavioralAnalyticsService.trackUserInteraction(featureName, 'scroll');
      }
    };

    // Add event listeners
    if (trackClicks) element.addEventListener('click', handleClick);
    if (trackHovers) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }
    if (trackFocus) element.addEventListener('focus', handleFocus);
    if (trackScroll) element.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      if (trackClicks) element.removeEventListener('click', handleClick);
      if (trackHovers) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (trackFocus) element.removeEventListener('focus', handleFocus);
      if (trackScroll) element.removeEventListener('scroll', handleScroll);
    };
  }, [featureName, trackClicks, trackHovers, trackFocus, trackScroll]);

  // Manual tracking methods
  const trackCustomEvent = useCallback((eventType: string, data: any) => {
    behavioralAnalyticsService.trackEvent(eventType, {
      feature: featureName,
      ...data
    });
  }, [featureName]);

  const trackTaskCompletion = useCallback((completed: boolean, duration?: number, quality?: string) => {
    behavioralAnalyticsService.trackTaskCompletion(featureName, completed, duration, quality);
  }, [featureName]);

  const trackSuggestionResponse = useCallback((response: 'accepted' | 'rejected' | 'modified', context?: any) => {
    behavioralAnalyticsService.trackSuggestionResponse(featureName, response, context);
  }, [featureName]);

  const trackSkip = useCallback((reason?: string) => {
    behavioralAnalyticsService.trackSkipPattern(featureName, reason);
  }, [featureName]);

  const trackModification = useCallback((modificationType: string, originalValue: any, newValue: any, reason?: string) => {
    behavioralAnalyticsService.trackRoutineModification(modificationType, originalValue, newValue, reason);
  }, []);

  return {
    elementRef,
    trackCustomEvent,
    trackTaskCompletion,
    trackSuggestionResponse,
    trackSkip,
    trackModification
  };
};

// Hook for tracking form interactions
export const useFormTracking = (formName: string) => {
  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change', value?: any) => {
    behavioralAnalyticsService.trackEvent('form_interaction', {
      form: formName,
      field: fieldName,
      action,
      value: typeof value === 'string' ? value.length : value // Don't store actual values for privacy
    });
  }, [formName]);

  const trackFormSubmission = useCallback((success: boolean, errors?: string[], duration?: number) => {
    behavioralAnalyticsService.trackEvent('form_submission', {
      form: formName,
      success,
      errorCount: errors?.length || 0,
      duration
    });
  }, [formName]);

  const trackFormAbandonment = useCallback((completedFields: number, totalFields: number, timeSpent: number) => {
    behavioralAnalyticsService.trackEvent('form_abandonment', {
      form: formName,
      completedFields,
      totalFields,
      completionRate: completedFields / totalFields,
      timeSpent
    });
  }, [formName]);

  return {
    trackFieldInteraction,
    trackFormSubmission,
    trackFormAbandonment
  };
};

// Hook for tracking navigation patterns
export const useNavigationTracking = () => {
  const trackPageView = useCallback((pageName: string, referrer?: string) => {
    behavioralAnalyticsService.trackEvent('page_view', {
      page: pageName,
      referrer,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackNavigation = useCallback((from: string, to: string, method: 'click' | 'back' | 'forward' | 'direct') => {
    behavioralAnalyticsService.trackEvent('navigation', {
      from,
      to,
      method,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackTimeOnPage = useCallback((pageName: string, duration: number) => {
    behavioralAnalyticsService.trackEvent('time_on_page', {
      page: pageName,
      duration,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    trackPageView,
    trackNavigation,
    trackTimeOnPage
  };
};

// Hook for tracking productivity metrics
export const useProductivityTracking = () => {
  const trackFocusSession = useCallback((duration: number, quality: 'high' | 'medium' | 'low', distractions: number) => {
    behavioralAnalyticsService.trackProductivityMetrics({
      focusQuality: quality === 'high' ? 3 : quality === 'medium' ? 2 : 1,
      taskCompletionRate: 1, // Will be updated based on actual completion
      distractionCount: distractions,
      energyLevel: 3 // Default, should be updated based on user input
    });
  }, []);

  const trackEnergyLevel = useCallback((level: number, timeOfDay: string) => {
    behavioralAnalyticsService.trackEvent('energy_level', {
      level,
      timeOfDay,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackContextualFactors = useCallback((factors: {
    weatherType?: string;
    location?: string;
    noiseLevel?: string;
    socialContext?: string;
  }) => {
    behavioralAnalyticsService.trackContextualFactors(factors);
  }, []);

  return {
    trackFocusSession,
    trackEnergyLevel,
    trackContextualFactors
  };
};