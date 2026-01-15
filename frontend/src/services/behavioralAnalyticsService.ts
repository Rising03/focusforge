import { InteractionPattern, TemporalPattern, EngagementMetric } from '../types/profile';

interface BehavioralEvent {
  eventType: string;
  eventData: any;
  context?: any;
  timestamp?: string;
}

interface ContextualData {
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  weatherType?: string;
  location?: string;
  deviceType?: string;
  sessionDuration?: number;
}

class BehavioralAnalyticsService {
  private eventQueue: BehavioralEvent[] = [];
  private sessionStartTime: number = Date.now();
  private currentContext: Partial<ContextualData> = {};
  private interactionCounts: Record<string, number> = {};
  private featureEngagement: Record<string, { startTime: number; totalTime: number; interactions: number }> = {};

  constructor() {
    this.initializeContext();
    this.startSessionTracking();
  }

  private initializeContext() {
    const now = new Date();
    this.currentContext = {
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      season: this.getSeason(now),
      deviceType: this.getDeviceType(),
      sessionDuration: 0
    };
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private startSessionTracking() {
    // Update session duration every minute
    setInterval(() => {
      this.currentContext.sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000 / 60);
    }, 60000);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility_change', {
        hidden: document.hidden,
        timestamp: new Date().toISOString()
      });
    });

    // Track window focus/blur
    window.addEventListener('focus', () => {
      this.trackEvent('window_focus', { timestamp: new Date().toISOString() });
    });

    window.addEventListener('blur', () => {
      this.trackEvent('window_blur', { timestamp: new Date().toISOString() });
    });
  }

  // Core tracking methods
  trackEvent(eventType: string, eventData: any, context?: any): void {
    const event: BehavioralEvent = {
      eventType,
      eventData,
      context: { ...this.currentContext, ...context },
      timestamp: new Date().toISOString()
    };

    this.eventQueue.push(event);
    this.updateInteractionCounts(eventType);

    // Send events in batches to avoid overwhelming the server
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  trackFeatureUsage(featureName: string, action: 'start' | 'end' | 'interact'): void {
    const now = Date.now();

    if (!this.featureEngagement[featureName]) {
      this.featureEngagement[featureName] = {
        startTime: now,
        totalTime: 0,
        interactions: 0
      };
    }

    const engagement = this.featureEngagement[featureName];

    switch (action) {
      case 'start':
        engagement.startTime = now;
        break;
      case 'end':
        if (engagement.startTime) {
          engagement.totalTime += now - engagement.startTime;
        }
        break;
      case 'interact':
        engagement.interactions++;
        break;
    }

    this.trackEvent('feature_usage', {
      feature: featureName,
      action,
      totalTime: engagement.totalTime,
      interactions: engagement.interactions
    });
  }

  trackUserInteraction(element: string, interactionType: 'click' | 'hover' | 'focus' | 'scroll'): void {
    this.trackEvent('user_interaction', {
      element,
      interactionType,
      timestamp: new Date().toISOString()
    });
  }

  trackTaskCompletion(taskType: string, completed: boolean, duration?: number, quality?: string): void {
    this.trackEvent('task_completion', {
      taskType,
      completed,
      duration,
      quality,
      timestamp: new Date().toISOString()
    });
  }

  trackRoutineModification(modificationType: string, originalValue: any, newValue: any, reason?: string): void {
    this.trackEvent('routine_modification', {
      modificationType,
      originalValue,
      newValue,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  trackSuggestionResponse(suggestionType: string, response: 'accepted' | 'rejected' | 'modified', context?: any): void {
    this.trackEvent('suggestion_response', {
      suggestionType,
      response,
      context,
      timestamp: new Date().toISOString()
    });
  }

  trackSkipPattern(skippedActivity: string, reason?: string): void {
    this.trackEvent('skip_pattern', {
      skippedActivity,
      reason,
      timeOfDay: this.currentContext.timeOfDay,
      dayOfWeek: this.currentContext.dayOfWeek,
      timestamp: new Date().toISOString()
    });
  }

  trackProductivityMetrics(metrics: {
    focusQuality: number;
    taskCompletionRate: number;
    distractionCount: number;
    energyLevel: number;
  }): void {
    this.trackEvent('productivity_metrics', {
      ...metrics,
      context: this.currentContext,
      timestamp: new Date().toISOString()
    });
  }

  trackContextualFactors(factors: {
    weatherType?: string;
    location?: string;
    noiseLevel?: string;
    socialContext?: string;
  }): void {
    // Update current context
    this.currentContext = { ...this.currentContext, ...factors };

    this.trackEvent('contextual_factors', {
      factors,
      timestamp: new Date().toISOString()
    });
  }

  // Implicit feedback collection
  trackImplicitFeedback(feedbackType: string, data: any): void {
    this.trackEvent('implicit_feedback', {
      feedbackType,
      data,
      context: this.currentContext,
      timestamp: new Date().toISOString()
    });
  }

  // Analytics computation methods
  computeInteractionPatterns(): InteractionPattern[] {
    const patterns: InteractionPattern[] = [];

    Object.entries(this.interactionCounts).forEach(([feature, _count]) => {
      const engagement = this.featureEngagement[feature];
      if (engagement) {
        patterns.push({
          feature,
          engagement_score: this.calculateEngagementScore(engagement),
          click_through_rate: this.calculateClickThroughRate(feature),
          completion_rate: this.calculateCompletionRate(feature),
          last_updated: new Date()
        });
      }
    });

    return patterns;
  }

  computeTemporalPatterns(): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    const productivityEvents = this.eventQueue.filter(e => e.eventType === 'productivity_metrics');

    // Group by time patterns
    const timeGroups: Record<string, any[]> = {};

    productivityEvents.forEach(event => {
      const key = `${event.context?.timeOfDay}_${event.context?.dayOfWeek}`;
      if (!timeGroups[key]) timeGroups[key] = [];
      timeGroups[key].push(event.eventData);
    });

    Object.entries(timeGroups).forEach(([key, events]) => {
      const [timeOfDay, dayOfWeek] = key.split('_');
      const avgProductivity = events.reduce((sum, e) => sum + (e.focusQuality || 0), 0) / events.length;
      const avgEnergy = events.reduce((sum, e) => sum + (e.energyLevel || 0), 0) / events.length;

      patterns.push({
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek,
        season: this.currentContext.season || 'unknown',
        productivity_score: avgProductivity,
        energy_level: avgEnergy,
        focus_quality: avgProductivity // Using same metric for now
      });
    });

    return patterns;
  }

  computeEngagementMetrics(): EngagementMetric[] {
    const metrics: EngagementMetric[] = [];

    Object.entries(this.featureEngagement).forEach(([feature, engagement]) => {
      metrics.push({
        feature,
        engagement_duration: engagement.totalTime,
        interaction_depth: engagement.interactions,
        return_frequency: this.calculateReturnFrequency(feature)
      });
    });

    return metrics;
  }

  // Helper methods
  private updateInteractionCounts(eventType: string): void {
    this.interactionCounts[eventType] = (this.interactionCounts[eventType] || 0) + 1;
  }

  private calculateEngagementScore(engagement: { totalTime: number; interactions: number }): number {
    // Simple engagement score based on time and interactions
    const timeScore = Math.min(engagement.totalTime / 60000, 10); // Max 10 points for time (in minutes)
    const interactionScore = Math.min(engagement.interactions, 10); // Max 10 points for interactions
    return (timeScore + interactionScore) / 2;
  }

  private calculateClickThroughRate(feature: string): number {
    const clickEvents = this.eventQueue.filter(e => 
      e.eventType === 'user_interaction' && 
      e.eventData.element === feature && 
      e.eventData.interactionType === 'click'
    ).length;

    const viewEvents = this.eventQueue.filter(e => 
      e.eventType === 'feature_usage' && 
      e.eventData.feature === feature
    ).length;

    return viewEvents > 0 ? clickEvents / viewEvents : 0;
  }

  private calculateCompletionRate(feature: string): number {
    const completionEvents = this.eventQueue.filter(e => 
      e.eventType === 'task_completion' && 
      e.eventData.taskType === feature && 
      e.eventData.completed
    ).length;

    const totalEvents = this.eventQueue.filter(e => 
      e.eventType === 'task_completion' && 
      e.eventData.taskType === feature
    ).length;

    return totalEvents > 0 ? completionEvents / totalEvents : 0;
  }

  private calculateReturnFrequency(feature: string): number {
    const usageEvents = this.eventQueue.filter(e => 
      e.eventType === 'feature_usage' && 
      e.eventData.feature === feature
    );

    if (usageEvents.length < 2) return 0;

    // Calculate average time between uses
    const timestamps = usageEvents.map(e => new Date(e.timestamp!).getTime()).sort();
    const intervals = [];

    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return 1 / (avgInterval / (1000 * 60 * 60 * 24)); // Return frequency per day
  }

  // Data persistence
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Import profileService dynamically to avoid circular dependency
      const { profileService } = await import('./profileService');
      await profileService.sendBehavioralEvents(eventsToSend);
    } catch (error) {
      console.error('Error sending behavioral analytics:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  // Cleanup
  destroy(): void {
    this.flushEvents();
  }
}

// Create singleton instance
export const behavioralAnalyticsService = new BehavioralAnalyticsService();

// Auto-flush events before page unload
window.addEventListener('beforeunload', () => {
  behavioralAnalyticsService.flushEvents();
});

export default behavioralAnalyticsService;