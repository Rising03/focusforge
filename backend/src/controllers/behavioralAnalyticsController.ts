import { Request, Response } from 'express';
import { ProfileService } from '../services/profileService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class BehavioralAnalyticsController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  // Track behavioral events in batch
  trackEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { events } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({ error: 'Events array is required' });
        return;
      }

      // Process each event
      for (const event of events) {
        await this.profileService.trackBehavioralEvent(
          userId,
          event.eventType,
          event.eventData,
          event.context
        );
      }

      logger.info('Behavioral events tracked successfully', { 
        userId, 
        eventCount: events.length 
      });

      res.status(200).json({ 
        success: true, 
        message: `${events.length} events tracked successfully` 
      });
    } catch (error) {
      logger.error('Error tracking behavioral events:', error);
      res.status(500).json({ error: 'Failed to track behavioral events' });
    }
  };

  // Track single behavioral event
  trackEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { eventType, eventData, context } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!eventType || !eventData) {
        res.status(400).json({ error: 'eventType and eventData are required' });
        return;
      }

      await this.profileService.trackBehavioralEvent(userId, eventType, eventData, context);

      logger.debug('Behavioral event tracked', { userId, eventType });

      res.status(200).json({ success: true, message: 'Event tracked successfully' });
    } catch (error) {
      logger.error('Error tracking behavioral event:', error);
      res.status(500).json({ error: 'Failed to track behavioral event' });
    }
  };

  // Get behavioral analytics data
  getAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const analytics = await this.profileService.getBehavioralAnalytics(userId, days);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching behavioral analytics:', error);
      res.status(500).json({ error: 'Failed to fetch behavioral analytics' });
    }
  };

  // Get personalization insights
  getPersonalizationInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const insights = await this.generatePersonalizationInsights(userId);

      res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      logger.error('Error generating personalization insights:', error);
      res.status(500).json({ error: 'Failed to generate personalization insights' });
    }
  };

  // Update behavioral patterns in profile
  updateBehavioralPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const patterns = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get current profile
      const currentProfile = await this.profileService.getProfile(userId);
      if (!currentProfile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Update behavioral patterns
      const updatedDetailedProfile = {
        ...currentProfile.profile.detailed_profile,
        behavioral_patterns: patterns
      };

      await this.profileService.updateDetailedProfile(userId, updatedDetailedProfile);

      logger.info('Behavioral patterns updated', { userId });

      res.status(200).json({ 
        success: true, 
        message: 'Behavioral patterns updated successfully' 
      });
    } catch (error) {
      logger.error('Error updating behavioral patterns:', error);
      res.status(500).json({ error: 'Failed to update behavioral patterns' });
    }
  };

  // Generate interaction patterns analysis
  getInteractionPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const patterns = await this.analyzeInteractionPatterns(userId, days);

      res.status(200).json({
        success: true,
        data: patterns
      });
    } catch (error) {
      logger.error('Error analyzing interaction patterns:', error);
      res.status(500).json({ error: 'Failed to analyze interaction patterns' });
    }
  };

  // Generate temporal productivity patterns
  getTemporalPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const patterns = await this.analyzeTemporalPatterns(userId, days);

      res.status(200).json({
        success: true,
        data: patterns
      });
    } catch (error) {
      logger.error('Error analyzing temporal patterns:', error);
      res.status(500).json({ error: 'Failed to analyze temporal patterns' });
    }
  };

  // Private helper methods
  private async generatePersonalizationInsights(userId: string): Promise<any> {
    const analytics = await this.profileService.getBehavioralAnalytics(userId, 30);
    
    // Analyze productivity patterns
    const productivityEvents = analytics.filter(e => e.event_type === 'productivity_metrics');
    const interactionEvents = analytics.filter(e => e.event_type === 'user_interaction');
    const taskEvents = analytics.filter(e => e.event_type === 'task_completion');

    // Calculate insights
    const insights = {
      suggestedProductivityPeaks: this.calculateProductivityPeaks(productivityEvents),
      commonDistractionTriggers: this.identifyDistractionTriggers(interactionEvents),
      optimalWorkSessionLength: this.calculateOptimalSessionLength(taskEvents),
      preferredLearningStyle: this.inferLearningStyle(taskEvents),
      motivationFactors: this.identifyMotivationFactors(analytics),
      environmentalPreferences: this.analyzeEnvironmentalPreferences(analytics),
      adaptationRecommendations: this.generateAdaptationRecommendations(analytics)
    };

    return insights;
  }

  private calculateProductivityPeaks(events: any[]): string[] {
    if (events.length === 0) return [];

    // Group by time of day and calculate average focus quality
    const timeGroups: Record<string, number[]> = {};
    
    events.forEach(event => {
      const timeOfDay = event.context?.timeOfDay || 'unknown';
      if (!timeGroups[timeOfDay]) timeGroups[timeOfDay] = [];
      timeGroups[timeOfDay].push(event.event_data.focusQuality || 0);
    });

    // Calculate averages and sort by productivity
    const averages = Object.entries(timeGroups)
      .map(([time, qualities]) => ({
        time,
        avgQuality: qualities.reduce((sum, q) => sum + q, 0) / qualities.length
      }))
      .sort((a, b) => b.avgQuality - a.avgQuality);

    // Map to readable time slots
    const timeMapping: Record<string, string> = {
      'morning': 'Morning (8-11 AM)',
      'afternoon': 'Afternoon (1-5 PM)',
      'evening': 'Evening (6-9 PM)',
      'night': 'Night (9 PM-12 AM)'
    };

    return averages
      .slice(0, 2) // Top 2 productive times
      .map(({ time }) => timeMapping[time] || time)
      .filter(Boolean);
  }

  private identifyDistractionTriggers(events: any[]): string[] {
    const triggers: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.event_data.interactionType === 'blur') {
        // Infer distraction triggers from context
        const context = event.context || {};
        if (context.noiseLevel === 'moderate' || context.noiseLevel === 'loud') {
          triggers['Background noise'] = (triggers['Background noise'] || 0) + 1;
        }
        if (context.socialContext === 'group') {
          triggers['Other people around'] = (triggers['Other people around'] || 0) + 1;
        }
      }
    });

    return Object.entries(triggers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger);
  }

  private calculateOptimalSessionLength(events: any[]): number {
    if (events.length === 0) return 45; // Default 45 minutes

    const completedTasks = events.filter(e => e.event_data.completed);
    if (completedTasks.length === 0) return 45;

    const avgDuration = completedTasks.reduce((sum, e) => 
      sum + (e.event_data.duration || 0), 0) / completedTasks.length;

    // Round to nearest 15 minutes
    return Math.round(avgDuration / 15) * 15;
  }

  private inferLearningStyle(events: any[]): string {
    // Simple heuristic based on task completion patterns
    // In a real implementation, this would be more sophisticated
    const completionRate = events.length > 0 
      ? events.filter(e => e.event_data.completed).length / events.length 
      : 0;

    if (completionRate > 0.8) return 'current'; // Keep current style
    if (completionRate > 0.6) return 'visual';
    if (completionRate > 0.4) return 'kinesthetic';
    return 'auditory';
  }

  private identifyMotivationFactors(events: any[]): string[] {
    const suggestionEvents = events.filter(e => e.event_type === 'suggestion_response');
    const acceptanceRate = suggestionEvents.length > 0
      ? suggestionEvents.filter(e => e.event_data.response === 'accepted').length / suggestionEvents.length
      : 0;

    // Suggest motivation factors based on engagement patterns
    if (acceptanceRate > 0.7) {
      return ['Progress tracking and metrics', 'Clear goals and deadlines'];
    } else if (acceptanceRate > 0.4) {
      return ['Personal growth mindset', 'Mastery and expertise'];
    } else {
      return ['Rewards and celebrations', 'Accountability partners'];
    }
  }

  private analyzeEnvironmentalPreferences(events: any[]): any {
    const contextEvents = events.filter(e => e.event_type === 'contextual_factors');
    
    if (contextEvents.length === 0) {
      return {
        preferredLocation: [],
        optimalNoiseLevel: 'moderate',
        bestTimeOfDay: 'morning'
      };
    }

    // Analyze location preferences
    const locations: Record<string, number> = {};
    const noiseLevels: Record<string, number> = {};
    
    contextEvents.forEach(event => {
      const factors = event.event_data.factors || {};
      if (factors.location) {
        locations[factors.location] = (locations[factors.location] || 0) + 1;
      }
      if (factors.noiseLevel) {
        noiseLevels[factors.noiseLevel] = (noiseLevels[factors.noiseLevel] || 0) + 1;
      }
    });

    return {
      preferredLocation: Object.entries(locations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([location]) => location),
      optimalNoiseLevel: Object.entries(noiseLevels)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'moderate'
    };
  }

  private generateAdaptationRecommendations(events: any[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze skip patterns
    const skipEvents = events.filter(e => e.event_type === 'skip_pattern');
    if (skipEvents.length > 5) {
      recommendations.push('Consider reducing routine complexity');
    }

    // Analyze modification patterns
    const modificationEvents = events.filter(e => e.event_type === 'routine_modification');
    if (modificationEvents.length > 10) {
      recommendations.push('Your routine preferences are evolving - consider a profile update');
    }

    // Analyze productivity trends
    const productivityEvents = events.filter(e => e.event_type === 'productivity_metrics');
    if (productivityEvents.length > 0) {
      const recentProductivity = productivityEvents.slice(-7); // Last 7 events
      const avgRecent = recentProductivity.reduce((sum, e) => 
        sum + (e.event_data.focusQuality || 0), 0) / recentProductivity.length;
      
      if (avgRecent < 2) {
        recommendations.push('Focus quality has declined - consider adjusting your environment or schedule');
      }
    }

    return recommendations;
  }

  private async analyzeInteractionPatterns(userId: string, days: number): Promise<any[]> {
    const analytics = await this.profileService.getBehavioralAnalytics(userId, days);
    const interactionEvents = analytics.filter(e => e.event_type === 'user_interaction');

    // Group by feature and calculate metrics
    const featureGroups: Record<string, any[]> = {};
    interactionEvents.forEach(event => {
      const feature = event.event_data.element || 'unknown';
      if (!featureGroups[feature]) featureGroups[feature] = [];
      featureGroups[feature].push(event);
    });

    return Object.entries(featureGroups).map(([feature, events]) => ({
      feature,
      engagement_score: this.calculateEngagementScore(events),
      click_through_rate: this.calculateClickThroughRate(events),
      completion_rate: this.calculateCompletionRate(feature, analytics),
      last_updated: new Date()
    }));
  }

  private async analyzeTemporalPatterns(userId: string, days: number): Promise<any[]> {
    const analytics = await this.profileService.getBehavioralAnalytics(userId, days);
    const productivityEvents = analytics.filter(e => e.event_type === 'productivity_metrics');

    // Group by time patterns
    const patterns: Record<string, any[]> = {};
    productivityEvents.forEach(event => {
      const key = `${event.context?.timeOfDay}_${event.context?.dayOfWeek}`;
      if (!patterns[key]) patterns[key] = [];
      patterns[key].push(event.event_data);
    });

    return Object.entries(patterns).map(([key, events]) => {
      const [timeOfDay, dayOfWeek] = key.split('_');
      const avgProductivity = events.reduce((sum, e) => sum + (e.focusQuality || 0), 0) / events.length;
      const avgEnergy = events.reduce((sum, e) => sum + (e.energyLevel || 0), 0) / events.length;

      return {
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek,
        season: 'current', // Could be enhanced with actual season detection
        productivity_score: avgProductivity,
        energy_level: avgEnergy,
        focus_quality: avgProductivity
      };
    });
  }

  private calculateEngagementScore(events: any[]): number {
    // Simple engagement score based on interaction frequency and types
    const clickEvents = events.filter(e => e.event_data.interactionType === 'click').length;
    const hoverEvents = events.filter(e => e.event_data.interactionType === 'hover').length;
    const focusEvents = events.filter(e => e.event_data.interactionType === 'focus').length;

    return Math.min((clickEvents * 3 + hoverEvents + focusEvents * 2) / 10, 10);
  }

  private calculateClickThroughRate(events: any[]): number {
    const clickEvents = events.filter(e => e.event_data.interactionType === 'click').length;
    const totalEvents = events.length;
    return totalEvents > 0 ? clickEvents / totalEvents : 0;
  }

  private calculateCompletionRate(feature: string, allEvents: any[]): number {
    const taskEvents = allEvents.filter(e => 
      e.event_type === 'task_completion' && e.event_data.taskType === feature
    );
    const completedTasks = taskEvents.filter(e => e.event_data.completed).length;
    return taskEvents.length > 0 ? completedTasks / taskEvents.length : 0;
  }
}