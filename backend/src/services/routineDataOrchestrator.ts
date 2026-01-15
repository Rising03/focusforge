import { ProfileService } from './profileService';
import { HabitService } from './habitService';
import { DeepWorkService } from './deepWorkService';
import { EveningReviewService } from './eveningReviewService';
import { AnalyticsService } from './analyticsService';
import { logger } from '../utils/logger';

/**
 * Routine Context - Complete data from all integrated services
 */
export interface RoutineContext {
  userId: string;
  date: Date;
  profile: ProfileData;
  habits: HabitData;
  deepWork: DeepWorkData;
  eveningReview: EveningReviewData;
  analytics: AnalyticsData;
  preferences: RoutinePreferences;
}

export interface ProfileData {
  targetIdentity: string;
  academicGoals: string[];
  skillGoals: string[];
  wakeUpTime: string;
  sleepTime: string;
  availableHours: number;
  energyPattern?: any[];
  learningStyle?: string;
}

export interface HabitData {
  activeHabits: any[];
  habitStacks: any[];
  scheduledHabits: any[];
  consistencyScores: Record<string, number>;
}

export interface DeepWorkData {
  optimalTimeSlots: any[];
  energyPatterns: any[];
  averageSessionDuration: number;
  preferredCognitiveLoad: string;
  recentPerformance: any[];
}

export interface EveningReviewData {
  lastReview?: any;
  tomorrowTasks: string[];
  energyLevel: number;
  mood: number;
  insights: string;
}

export interface AnalyticsData {
  consistencyScore: number;
  identityAlignment: number;
  productivityPatterns: any;
  behavioralInsights: any[];
  completionRates: Record<string, number>;
  optimalActivityTimes: Record<string, any[]>;
}

export interface RoutinePreferences {
  preferredComplexity?: 'simple' | 'moderate' | 'complex';
  preferredActivityTypes?: string[];
  avoidTimeSlots?: string[];
}

/**
 * Routine Data Orchestrator
 * 
 * Fetches and aggregates data from all integrated services:
 * - Profile Service (user goals, schedule, preferences)
 * - Habit Service (active habits, consistency)
 * - Deep Work Service (energy patterns, optimal times)
 * - Evening Review Service (insights, tomorrow tasks)
 * - Analytics Service (performance metrics, patterns)
 * 
 * Features:
 * - Parallel data fetching for performance
 * - 5-second timeout per service
 * - Graceful degradation with smart defaults
 * - 5-minute caching to reduce load
 */
export class RoutineDataOrchestrator {
  private profileService: ProfileService;
  private habitService: HabitService;
  private deepWorkService: DeepWorkService;
  private eveningReviewService: EveningReviewService;
  private analyticsService: AnalyticsService;
  
  private readonly SERVICE_TIMEOUT = 5000; // 5 seconds per service
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: RoutineContext; timestamp: number }> = new Map();

  constructor() {
    this.profileService = new ProfileService();
    this.habitService = new HabitService();
    this.deepWorkService = new DeepWorkService();
    this.eveningReviewService = new EveningReviewService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Build complete routine context by fetching data from all services
   * Uses parallel fetching with timeouts and graceful degradation
   */
  async buildRoutineContext(userId: string, date: Date): Promise<RoutineContext> {
    // Check cache first
    const cacheKey = `${userId}_${date.toISOString().split('T')[0]}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.info('Using cached routine context', { userId, date });
      return cached.data;
    }

    logger.info('Building routine context from services', { userId, date });

    // Fetch all data in parallel with timeouts
    const [profile, habits, deepWork, eveningReview, analytics] = await Promise.all([
      this.fetchProfileData(userId),
      this.fetchHabitData(userId),
      this.fetchDeepWorkData(userId),
      this.fetchEveningReviewData(userId),
      this.fetchAnalyticsData(userId)
    ]);

    const context: RoutineContext = {
      userId,
      date,
      profile,
      habits,
      deepWork,
      eveningReview,
      analytics,
      preferences: this.extractPreferences(profile)
    };

    // Cache the result
    this.cache.set(cacheKey, { data: context, timestamp: Date.now() });

    // Clean old cache entries
    this.cleanCache();

    return context;
  }

  /**
   * Fetch profile data with timeout and defaults
   */
  async fetchProfileData(userId: string): Promise<ProfileData> {
    try {
      const result = await this.withTimeout(
        this.profileService.getProfile(userId),
        this.SERVICE_TIMEOUT,
        'ProfileService'
      );

      if (!result || !result.profile) {
        return this.getDefaultProfileData();
      }

      const profile = result.profile;
      return {
        targetIdentity: profile.target_identity || 'Student',
        academicGoals: profile.academic_goals || [],
        skillGoals: profile.skill_goals || [],
        wakeUpTime: profile.wake_up_time || '07:00',
        sleepTime: profile.sleep_time || '23:00',
        availableHours: profile.available_hours || 8,
        energyPattern: profile.energy_pattern,
        learningStyle: profile.detailed_profile?.learning_style || 'visual'
      };
    } catch (error) {
      logger.warn('Failed to fetch profile data, using defaults', { userId, error });
      return this.getDefaultProfileData();
    }
  }

  /**
   * Fetch habit data with timeout and defaults
   */
  async fetchHabitData(userId: string): Promise<HabitData> {
    try {
      const habits = await this.withTimeout(
        this.habitService.getUserHabits(userId),
        this.SERVICE_TIMEOUT,
        'HabitService'
      );

      const activeHabits = habits?.filter((h: any) => h.active) || [];
      
      return {
        activeHabits,
        habitStacks: [],
        scheduledHabits: activeHabits.filter((h: any) => h.scheduled_time),
        consistencyScores: this.calculateHabitConsistency(activeHabits)
      };
    } catch (error) {
      logger.warn('Failed to fetch habit data, using defaults', { userId, error });
      return {
        activeHabits: [],
        habitStacks: [],
        scheduledHabits: [],
        consistencyScores: {}
      };
    }
  }

  /**
   * Fetch deep work data with timeout and defaults
   */
  async fetchDeepWorkData(userId: string): Promise<DeepWorkData> {
    try {
      const energyPatterns = await this.withTimeout(
        this.deepWorkService.analyzeEnergyPatterns(userId),
        this.SERVICE_TIMEOUT,
        'DeepWorkService'
      );

      return {
        optimalTimeSlots: this.extractOptimalTimeSlots(energyPatterns),
        energyPatterns: energyPatterns || [],
        averageSessionDuration: 90,
        preferredCognitiveLoad: 'medium',
        recentPerformance: []
      };
    } catch (error) {
      logger.warn('Failed to fetch deep work data, using defaults', { userId, error });
      return {
        optimalTimeSlots: [],
        energyPatterns: [],
        averageSessionDuration: 90,
        preferredCognitiveLoad: 'medium',
        recentPerformance: []
      };
    }
  }

  /**
   * Fetch evening review data with timeout and defaults
   */
  async fetchEveningReviewData(userId: string): Promise<EveningReviewData> {
    try {
      // Note: getRecentReviews is private, so we'll use a different approach
      // For now, return defaults until we expose a public method
      logger.warn('Evening review data fetch not implemented - using defaults', { userId });
      return {
        tomorrowTasks: [],
        energyLevel: 5,
        mood: 5,
        insights: ''
      };
    } catch (error) {
      logger.warn('Failed to fetch evening review data, using defaults', { userId, error });
      return {
        tomorrowTasks: [],
        energyLevel: 5,
        mood: 5,
        insights: ''
      };
    }
  }

  /**
   * Fetch analytics data with timeout and defaults
   */
  async fetchAnalyticsData(userId: string): Promise<AnalyticsData> {
    try {
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      };
      
      const analytics = await this.withTimeout(
        this.analyticsService.calculatePersonalizationMetrics(userId, dateRange),
        this.SERVICE_TIMEOUT,
        'AnalyticsService'
      );

      return {
        consistencyScore: (analytics as any)?.consistency_score || 0.5,
        identityAlignment: (analytics as any)?.identity_alignment || 0.5,
        productivityPatterns: (analytics as any)?.productivity_patterns || {},
        behavioralInsights: (analytics as any)?.behavioral_insights || [],
        completionRates: (analytics as any)?.completion_rates || {},
        optimalActivityTimes: (analytics as any)?.optimal_activity_times || {}
      };
    } catch (error) {
      logger.warn('Failed to fetch analytics data, using defaults', { userId, error });
      return {
        consistencyScore: 0.5,
        identityAlignment: 0.5,
        productivityPatterns: {},
        behavioralInsights: [],
        completionRates: {},
        optimalActivityTimes: {}
      };
    }
  }

  // ============ Helper Methods ============

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    serviceName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${serviceName} timeout`)), timeoutMs)
      )
    ]);
  }

  private getDefaultProfileData(): ProfileData {
    return {
      targetIdentity: 'Student',
      academicGoals: ['Study effectively'],
      skillGoals: ['Build discipline'],
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      availableHours: 8,
      learningStyle: 'balanced'
    };
  }

  private extractPreferences(profile: ProfileData): RoutinePreferences {
    return {
      preferredComplexity: 'moderate',
      preferredActivityTypes: [],
      avoidTimeSlots: []
    };
  }

  private calculateHabitConsistency(habits: any[]): Record<string, number> {
    const scores: Record<string, number> = {};
    habits.forEach(habit => {
      if (habit.id && habit.streak) {
        scores[habit.id] = Math.min(1, habit.streak / 30); // Normalize to 0-1
      }
    });
    return scores;
  }

  private extractOptimalTimeSlots(energyPatterns: any[]): any[] {
    if (!energyPatterns || energyPatterns.length === 0) {
      return [];
    }

    // Find high-energy periods
    return energyPatterns
      .filter((pattern: any) => pattern.energy_level === 'high')
      .map((pattern: any) => ({
        startTime: pattern.start_time || '09:00',
        endTime: pattern.end_time || '11:00',
        energyLevel: 'high'
      }));
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache for a specific user (useful after profile updates)
   */
  clearUserCache(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(userId)) {
        this.cache.delete(key);
      }
    }
    logger.info('Cleared cache for user', { userId });
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    logger.info('Cleared all routine context cache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
