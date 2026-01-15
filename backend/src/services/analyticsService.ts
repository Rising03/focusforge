import pool from '../config/database';
import { ActivityService } from './activityService';
import { HabitService } from './habitService';
import { EveningReviewService } from './eveningReviewService';
import { ProfileService } from './profileService';
import { logger } from '../utils/logger';

export interface AnalyticsData {
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  consistency_score: number;
  identity_alignment: number;
  deep_work_trend: number[];
  habit_streaks: HabitStreak[];
  productivity_pattern: ProductivityMetrics;
  behavioral_insights: BehavioralInsight[];
  personalization_metrics: PersonalizationMetrics;
}

export interface HabitStreak {
  habit_id: string;
  habit_name: string;
  current_streak: number;
  longest_streak: number;
  consistency_percentage: number;
}

export interface ProductivityMetrics {
  daily_completion_rates: number[];
  focus_quality_trend: number[];
  deep_work_hours_trend: number[];
  energy_patterns: EnergyPattern[];
  most_productive_hours: string[];
  distraction_patterns: DistractionPattern[];
}

export interface EnergyPattern {
  time_period: string;
  average_energy: number;
  productivity_correlation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DistractionPattern {
  time_period: string;
  average_distractions: number;
  common_triggers: string[];
  impact_on_focus: number;
}

export interface BehavioralInsight {
  category: 'productivity' | 'habits' | 'focus' | 'energy' | 'patterns';
  insight: string;
  confidence: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendation: string;
  data_points: number;
}

export interface PersonalizationMetrics {
  profile_completeness: number;
  adaptation_effectiveness: number;
  suggestion_acceptance_rate: number;
  routine_modification_frequency: number;
  learning_progression: LearningProgression;
}

export interface LearningProgression {
  weeks_active: number;
  skill_improvements: SkillImprovement[];
  habit_formation_rate: number;
  system_mastery_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillImprovement {
  skill_area: string;
  improvement_percentage: number;
  time_period: string;
}

export interface IdentityAlignmentScore {
  overall_score: number;
  identity_behaviors: IdentityBehavior[];
  alignment_trend: number[];
  recommendations: string[];
}

export interface IdentityBehavior {
  behavior: string;
  target_identity: string;
  completion_rate: number;
  consistency_score: number;
  impact_weight: number;
}

export interface PerformancePatternAnalysis {
  declining_patterns: PatternAlert[];
  improvement_opportunities: ImprovementOpportunity[];
  system_adjustments: SystemAdjustment[];
  optimization_suggestions: OptimizationSuggestion[];
}

export interface PatternAlert {
  pattern_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_metrics: string[];
  suggested_actions: string[];
}

export interface ImprovementOpportunity {
  area: string;
  potential_impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  action_steps: string[];
}

export interface SystemAdjustment {
  adjustment_type: 'routine_simplification' | 'complexity_increase' | 'timing_optimization' | 'habit_stacking';
  reason: string;
  expected_impact: number;
  implementation_steps: string[];
}

export interface OptimizationSuggestion {
  category: string;
  suggestion: string;
  confidence: number;
  expected_benefit: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

export class AnalyticsService {
  private activityService: ActivityService;
  private habitService: HabitService;
  private eveningReviewService: EveningReviewService;
  private profileService: ProfileService;

  constructor() {
    this.activityService = new ActivityService();
    this.habitService = new HabitService();
    this.eveningReviewService = new EveningReviewService();
    this.profileService = new ProfileService();
  }

  // Helper function to clamp values to valid range
  private clampScore(value: number, min: number = 0, max: number = 100): number {
    return Math.max(min, Math.min(max, value));
  }

  async getAnalyticsData(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<AnalyticsData> {
    try {
      logger.info('Generating analytics data', { userId, period });

      // Calculate date range based on period
      const dateRange = this.calculateDateRange(period);

      // Gather data from all services
      const [
        consistencyScore,
        identityAlignment,
        deepWorkTrend,
        habitStreaks,
        productivityPattern,
        behavioralInsights,
        personalizationMetrics
      ] = await Promise.all([
        this.calculateConsistencyScore(userId, dateRange),
        this.calculateIdentityAlignment(userId, dateRange),
        this.calculateDeepWorkTrend(userId, dateRange),
        this.getHabitStreaks(userId),
        this.calculateProductivityPattern(userId, dateRange),
        this.generateBehavioralInsights(userId, dateRange),
        this.calculatePersonalizationMetrics(userId, dateRange)
      ]);

      const analyticsData: AnalyticsData = {
        user_id: userId,
        period,
        consistency_score: consistencyScore,
        identity_alignment: identityAlignment,
        deep_work_trend: deepWorkTrend,
        habit_streaks: habitStreaks,
        productivity_pattern: productivityPattern,
        behavioral_insights: behavioralInsights,
        personalization_metrics: personalizationMetrics
      };

      logger.info('Analytics data generated successfully', { 
        userId, 
        period,
        consistency_score: consistencyScore,
        identity_alignment: identityAlignment
      });

      return analyticsData;
    } catch (error) {
      logger.error('Error generating analytics data:', error);
      throw new Error('Failed to generate analytics data');
    }
  }

  async calculateConsistencyScore(userId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    try {
      // Get habit consistency
      const habitConsistency = await this.habitService.calculateConsistencyScore(userId);
      
      // Get evening review consistency
      const reviewHistory = await this.eveningReviewService.getReviewHistory(userId, 30);
      const reviewConsistency = this.calculateReviewConsistency(reviewHistory.reviews, dateRange);

      // Get activity tracking consistency
      const activityConsistency = await this.calculateActivityConsistency(userId, dateRange);

      // Weighted average (habits 50%, reviews 30%, activities 20%)
      const overallConsistency = Math.round(
        (habitConsistency.overall_score * 0.5) +
        (reviewConsistency * 0.3) +
        (activityConsistency * 0.2)
      );

      return Math.max(0, Math.min(100, overallConsistency));
    } catch (error) {
      logger.error('Error calculating consistency score:', error);
      return 0;
    }
  }

  async calculateIdentityAlignment(userId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    try {
      // Get user's target identity from profile
      const profile = await this.profileService.getProfile(userId);
      if (!profile?.profile?.target_identity) {
        return 50; // Default neutral score if no identity defined
      }

      // Get behavioral analytics to analyze identity-aligned actions
      const behavioralData = await this.profileService.getBehavioralAnalytics(userId, 30);
      
      // Calculate identity alignment based on completed tasks and habits
      const identityBehaviors = await this.analyzeIdentityBehaviors(userId, dateRange);
      
      if (identityBehaviors.length === 0) {
        return 50; // Default if no data
      }

      // Calculate weighted average based on behavior importance
      const totalWeight = identityBehaviors.reduce((sum, behavior) => sum + behavior.impact_weight, 0);
      const weightedScore = identityBehaviors.reduce((sum, behavior) => 
        sum + (behavior.completion_rate * behavior.impact_weight), 0);

      const alignmentScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 50;

      return Math.round(Math.max(0, Math.min(100, alignmentScore)));
    } catch (error) {
      logger.error('Error calculating identity alignment:', error);
      return 50;
    }
  }

  async calculateDeepWorkTrend(userId: string, dateRange: { start: Date; end: Date }): Promise<number[]> {
    try {
      const trend: number[] = [];
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get daily deep work hours for the period
      for (let i = 0; i < Math.min(daysDiff, 30); i++) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);
        
        const timeUtilization = await this.activityService.getTimeUtilization(userId, date);
        trend.push(timeUtilization.deep_work_hours);
      }

      return trend;
    } catch (error) {
      logger.error('Error calculating deep work trend:', error);
      return [];
    }
  }

  async getHabitStreaks(userId: string): Promise<HabitStreak[]> {
    try {
      const streaks = await this.habitService.getHabitStreaks(userId);
      
      return streaks.map(streak => ({
        habit_id: streak.habit_id,
        habit_name: streak.habit_name,
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak,
        consistency_percentage: streak.consistency_percentage
      }));
    } catch (error) {
      logger.error('Error getting habit streaks:', error);
      return [];
    }
  }

  async calculateProductivityPattern(userId: string, dateRange: { start: Date; end: Date }): Promise<ProductivityMetrics> {
    try {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const dailyCompletionRates: number[] = [];
      const focusQualityTrend: number[] = [];
      const deepWorkHoursTrend: number[] = [];
      const energyData: { time: string; energy: number; productivity: number }[] = [];
      const distractionData: { time: string; distractions: number; impact: number }[] = [];

      // Collect daily data
      for (let i = 0; i < Math.min(daysDiff, 30); i++) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);

        // Get daily stats
        const dailyStats = await this.activityService.getDailyStats(userId, date);
        const timeUtilization = await this.activityService.getTimeUtilization(userId, date);
        
        // Calculate completion rate from evening review if available
        const review = await this.eveningReviewService.getReviewByDate(userId, date);
        let completionRate = 0;
        if (review) {
          const totalTasks = review.accomplished.length + review.missed.length;
          completionRate = totalTasks > 0 ? (review.accomplished.length / totalTasks) * 100 : 0;
        }

        dailyCompletionRates.push(completionRate);
        focusQualityTrend.push(dailyStats.average_focus_quality * 100);
        deepWorkHoursTrend.push(timeUtilization.deep_work_hours);

        // Collect energy and distraction data
        if (review) {
          const timeOfDay = this.getTimeOfDay(date);
          energyData.push({
            time: timeOfDay,
            energy: review.energy_level,
            productivity: completionRate
          });
        }

        distractionData.push({
          time: this.getTimeOfDay(date),
          distractions: dailyStats.distraction_count,
          impact: dailyStats.average_focus_quality
        });
      }

      // Analyze patterns
      const energyPatterns = this.analyzeEnergyPatterns(energyData);
      const distractionPatterns = this.analyzeDistractionPatterns(distractionData);
      const mostProductiveHours = this.identifyProductiveHours(energyData);

      return {
        daily_completion_rates: dailyCompletionRates,
        focus_quality_trend: focusQualityTrend,
        deep_work_hours_trend: deepWorkHoursTrend,
        energy_patterns: energyPatterns,
        most_productive_hours: mostProductiveHours,
        distraction_patterns: distractionPatterns
      };
    } catch (error) {
      logger.error('Error calculating productivity pattern:', error);
      return {
        daily_completion_rates: [],
        focus_quality_trend: [],
        deep_work_hours_trend: [],
        energy_patterns: [],
        most_productive_hours: [],
        distraction_patterns: []
      };
    }
  }

  async generateBehavioralInsights(userId: string, dateRange: { start: Date; end: Date }): Promise<BehavioralInsight[]> {
    try {
      const insights: BehavioralInsight[] = [];

      // Get behavioral analytics data
      const behavioralData = await this.profileService.getBehavioralAnalytics(userId, 30);
      const productivityPattern = await this.calculateProductivityPattern(userId, dateRange);
      const habitStreaks = await this.getHabitStreaks(userId);

      // Analyze productivity trends
      const productivityInsight = this.analyzeProductivityTrend(productivityPattern);
      if (productivityInsight) {
        insights.push(productivityInsight);
      }

      // Analyze habit consistency
      const habitInsight = this.analyzeHabitConsistency(habitStreaks);
      if (habitInsight) {
        insights.push(habitInsight);
      }

      // Analyze focus patterns
      const focusInsight = this.analyzeFocusPatterns(productivityPattern);
      if (focusInsight) {
        insights.push(focusInsight);
      }

      // Analyze energy patterns
      const energyInsight = this.analyzeEnergyEffectiveness(productivityPattern);
      if (energyInsight) {
        insights.push(energyInsight);
      }

      // Analyze behavioral patterns from analytics data
      const behavioralInsight = this.analyzeBehavioralPatterns(behavioralData);
      if (behavioralInsight) {
        insights.push(behavioralInsight);
      }

      return insights;
    } catch (error) {
      logger.error('Error generating behavioral insights:', error);
      return [];
    }
  }

  async calculatePersonalizationMetrics(userId: string, dateRange: { start: Date; end: Date }): Promise<PersonalizationMetrics> {
    try {
      // Get profile data
      const profile = await this.profileService.getProfile(userId);
      const behavioralData = await this.profileService.getBehavioralAnalytics(userId, 30);

      // Calculate profile completeness
      const profileCompleteness = this.calculateProfileCompleteness(profile);

      // Calculate adaptation effectiveness
      const adaptationEffectiveness = this.calculateAdaptationEffectiveness(behavioralData);

      // Calculate suggestion acceptance rate
      const suggestionAcceptanceRate = this.calculateSuggestionAcceptanceRate(behavioralData);

      // Calculate routine modification frequency
      const routineModificationFrequency = this.calculateRoutineModificationFrequency(behavioralData);

      // Calculate learning progression
      const learningProgression = this.calculateLearningProgression(userId, behavioralData, dateRange);

      return {
        profile_completeness: profileCompleteness,
        adaptation_effectiveness: adaptationEffectiveness,
        suggestion_acceptance_rate: suggestionAcceptanceRate,
        routine_modification_frequency: routineModificationFrequency,
        learning_progression: learningProgression
      };
    } catch (error) {
      logger.error('Error calculating personalization metrics:', error);
      return {
        profile_completeness: 0,
        adaptation_effectiveness: 0,
        suggestion_acceptance_rate: 0,
        routine_modification_frequency: 0,
        learning_progression: {
          weeks_active: 0,
          skill_improvements: [],
          habit_formation_rate: 0,
          system_mastery_level: 'beginner'
        }
      };
    }
  }

  async analyzePerformancePatterns(userId: string): Promise<PerformancePatternAnalysis> {
    try {
      const dateRange = this.calculateDateRange('monthly');
      const analyticsData = await this.getAnalyticsData(userId, 'monthly');

      // Identify declining patterns
      const decliningPatterns = this.identifyDecliningPatterns(analyticsData);

      // Find improvement opportunities
      const improvementOpportunities = this.identifyImprovementOpportunities(analyticsData);

      // Generate system adjustments
      const systemAdjustments = this.generateSystemAdjustments(analyticsData);

      // Create optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(analyticsData);

      return {
        declining_patterns: decliningPatterns,
        improvement_opportunities: improvementOpportunities,
        system_adjustments: systemAdjustments,
        optimization_suggestions: optimizationSuggestions
      };
    } catch (error) {
      logger.error('Error analyzing performance patterns:', error);
      return {
        declining_patterns: [],
        improvement_opportunities: [],
        system_adjustments: [],
        optimization_suggestions: []
      };
    }
  }

  // Private helper methods

  private calculateDateRange(period: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'daily':
        start.setDate(end.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(end.getDate() - 7);
        break;
      case 'monthly':
        start.setDate(end.getDate() - 30);
        break;
    }

    return { start, end };
  }

  private calculateReviewConsistency(reviews: any[], dateRange: { start: Date; end: Date }): number {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const reviewsInRange = reviews.filter(review => {
      const reviewDate = new Date(review.date);
      return reviewDate >= dateRange.start && reviewDate <= dateRange.end;
    });

    return daysDiff > 0 ? (reviewsInRange.length / daysDiff) * 100 : 0;
  }

  private async calculateActivityConsistency(userId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    try {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      let daysWithActivity = 0;

      for (let i = 0; i < daysDiff; i++) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + i);
        
        const dailyStats = await this.activityService.getDailyStats(userId, date);
        if (dailyStats.total_tracked_time > 0) {
          daysWithActivity++;
        }
      }

      return daysDiff > 0 ? (daysWithActivity / daysDiff) * 100 : 0;
    } catch (error) {
      logger.error('Error calculating activity consistency:', error);
      return 0;
    }
  }

  private async analyzeIdentityBehaviors(userId: string, dateRange: { start: Date; end: Date }): Promise<IdentityBehavior[]> {
    try {
      const profile = await this.profileService.getProfile(userId);
      const targetIdentity = profile?.profile?.target_identity || '';

      // Define identity-aligned behaviors based on common student discipline patterns
      const identityBehaviors: IdentityBehavior[] = [
        {
          behavior: 'Daily habit completion',
          target_identity: targetIdentity,
          completion_rate: 0,
          consistency_score: 0,
          impact_weight: 0.3
        },
        {
          behavior: 'Evening review completion',
          target_identity: targetIdentity,
          completion_rate: 0,
          consistency_score: 0,
          impact_weight: 0.2
        },
        {
          behavior: 'Deep work sessions',
          target_identity: targetIdentity,
          completion_rate: 0,
          consistency_score: 0,
          impact_weight: 0.3
        },
        {
          behavior: 'Goal-aligned activities',
          target_identity: targetIdentity,
          completion_rate: 0,
          consistency_score: 0,
          impact_weight: 0.2
        }
      ];

      // Calculate actual completion rates
      const habitConsistency = await this.habitService.calculateConsistencyScore(userId);
      identityBehaviors[0].completion_rate = this.clampScore(habitConsistency.overall_score);
      identityBehaviors[0].consistency_score = this.clampScore(habitConsistency.overall_score);

      const reviewHistory = await this.eveningReviewService.getReviewHistory(userId, 30);
      const reviewConsistency = this.calculateReviewConsistency(reviewHistory.reviews, dateRange);
      identityBehaviors[1].completion_rate = this.clampScore(reviewConsistency);
      identityBehaviors[1].consistency_score = this.clampScore(reviewConsistency);

      // Calculate deep work completion rate
      const deepWorkTrend = await this.calculateDeepWorkTrend(userId, dateRange);
      const avgDeepWork = deepWorkTrend.reduce((sum, hours) => sum + hours, 0) / Math.max(deepWorkTrend.length, 1);
      const deepWorkRate = Math.min((avgDeepWork / 4) * 100, 100); // Assuming 4 hours is excellent
      identityBehaviors[2].completion_rate = this.clampScore(deepWorkRate);
      identityBehaviors[2].consistency_score = this.clampScore(deepWorkRate);

      // Estimate goal-aligned activities from behavioral data
      const behavioralData = await this.profileService.getBehavioralAnalytics(userId, 30);
      const taskCompletionEvents = behavioralData.filter(e => e.event_type === 'task_completion');
      const completedTasks = taskCompletionEvents.filter(e => e.event_data.completed).length;
      const goalAlignmentRate = taskCompletionEvents.length > 0 ? (completedTasks / taskCompletionEvents.length) * 100 : 50;
      identityBehaviors[3].completion_rate = this.clampScore(goalAlignmentRate);
      identityBehaviors[3].consistency_score = this.clampScore(goalAlignmentRate);
      identityBehaviors[3].consistency_score = goalAlignmentRate;

      return identityBehaviors;
    } catch (error) {
      logger.error('Error analyzing identity behaviors:', error);
      return [];
    }
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private analyzeEnergyPatterns(energyData: { time: string; energy: number; productivity: number }[]): EnergyPattern[] {
    const timeGroups: Record<string, { energies: number[]; productivities: number[] }> = {};

    energyData.forEach(data => {
      if (!timeGroups[data.time]) {
        timeGroups[data.time] = { energies: [], productivities: [] };
      }
      timeGroups[data.time].energies.push(data.energy);
      timeGroups[data.time].productivities.push(data.productivity);
    });

    return Object.entries(timeGroups).map(([time, data]) => {
      const avgEnergy = data.energies.length > 0 ? data.energies.reduce((sum, e) => sum + e, 0) / data.energies.length : 0;
      const avgProductivity = data.productivities.length > 0 ? data.productivities.reduce((sum, p) => sum + p, 0) / data.productivities.length : 0;
      
      // Calculate correlation (simplified)
      const correlation = this.calculateCorrelation(data.energies, data.productivities);

      return {
        time_period: time,
        average_energy: Math.round(avgEnergy * 10) / 10,
        productivity_correlation: Math.round(correlation * 100) / 100,
        trend: 'stable' as const // Would need historical data for actual trend
      };
    });
  }

  private analyzeDistractionPatterns(distractionData: { time: string; distractions: number; impact: number }[]): DistractionPattern[] {
    const timeGroups: Record<string, { distractions: number[]; impacts: number[] }> = {};

    distractionData.forEach(data => {
      if (!timeGroups[data.time]) {
        timeGroups[data.time] = { distractions: [], impacts: [] };
      }
      timeGroups[data.time].distractions.push(data.distractions);
      timeGroups[data.time].impacts.push(data.impact);
    });

    return Object.entries(timeGroups).map(([time, data]) => {
      const avgDistractions = data.distractions.length > 0 ? data.distractions.reduce((sum, d) => sum + d, 0) / data.distractions.length : 0;
      const avgImpact = data.impacts.length > 0 ? data.impacts.reduce((sum, i) => sum + i, 0) / data.impacts.length : 0;

      return {
        time_period: time,
        average_distractions: Math.round(avgDistractions * 10) / 10,
        common_triggers: ['notifications', 'background noise'], // Would be enhanced with actual trigger analysis
        impact_on_focus: Math.round((1 - avgImpact) * 100) / 100
      };
    });
  }

  private identifyProductiveHours(energyData: { time: string; energy: number; productivity: number }[]): string[] {
    const timeGroups: Record<string, number[]> = {};

    energyData.forEach(data => {
      if (!timeGroups[data.time]) {
        timeGroups[data.time] = [];
      }
      timeGroups[data.time].push(data.productivity);
    });

    return Object.entries(timeGroups)
      .map(([time, productivities]) => ({
        time,
        avgProductivity: productivities.length > 0 ? productivities.reduce((sum, p) => sum + p, 0) / productivities.length : 0
      }))
      .sort((a, b) => b.avgProductivity - a.avgProductivity)
      .slice(0, 2)
      .map(({ time }) => time);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeProductivityTrend(pattern: ProductivityMetrics): BehavioralInsight | null {
    if (pattern.daily_completion_rates.length === 0) return null;

    const recentRates = pattern.daily_completion_rates.slice(-7);
    const olderRates = pattern.daily_completion_rates.slice(-14, -7);
    
    const recentAvg = recentRates.length > 0 ? recentRates.reduce((sum, rate) => sum + rate, 0) / recentRates.length : 0;
    const olderAvg = olderRates.length > 0 ? olderRates.reduce((sum, rate) => sum + rate, 0) / olderRates.length : recentAvg;

    const trend = recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable';
    
    let insight = '';
    let recommendation = '';

    if (trend === 'improving') {
      insight = `Your task completion rate has improved to ${recentAvg.toFixed(1)}%`;
      recommendation = 'Continue your current approach and consider gradually increasing routine complexity';
    } else if (trend === 'declining') {
      insight = `Your task completion rate has declined to ${recentAvg.toFixed(1)}%`;
      recommendation = 'Consider simplifying your routine or identifying obstacles that prevent completion';
    } else {
      insight = `Your task completion rate is stable at ${recentAvg.toFixed(1)}%`;
      recommendation = recentAvg > 70 ? 'Maintain your current approach' : 'Focus on consistency before adding complexity';
    }

    return {
      category: 'productivity',
      insight,
      confidence: Math.min(pattern.daily_completion_rates.length / 14, 1),
      trend,
      recommendation,
      data_points: pattern.daily_completion_rates.length
    };
  }

  private analyzeHabitConsistency(streaks: HabitStreak[]): BehavioralInsight | null {
    if (streaks.length === 0) return null;

    const avgConsistency = streaks.reduce((sum, streak) => sum + (streak?.consistency_percentage || 0), 0) / streaks.length;
    const strongHabits = streaks.filter(s => (s?.consistency_percentage || 0) > 70).length;
    const strugglingHabits = streaks.filter(s => (s?.consistency_percentage || 0) < 50).length;

    let insight = '';
    let recommendation = '';
    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (avgConsistency > 75) {
      insight = `Excellent habit consistency at ${avgConsistency.toFixed(1)}% with ${strongHabits} strong habits`;
      recommendation = 'Consider adding new habits through habit stacking';
      trend = 'improving';
    } else if (avgConsistency < 50) {
      insight = `Habit consistency needs attention at ${avgConsistency.toFixed(1)}%`;
      recommendation = 'Focus on 1-2 core habits and use the "never miss twice" rule';
      trend = 'declining';
    } else {
      insight = `Moderate habit consistency at ${avgConsistency.toFixed(1)}%`;
      recommendation = strugglingHabits > 0 ? 'Simplify struggling habits or link them to strong ones' : 'Maintain current habits before adding new ones';
    }

    return {
      category: 'habits',
      insight,
      confidence: Math.min(streaks.length / 5, 1),
      trend,
      recommendation,
      data_points: streaks.length
    };
  }

  private analyzeFocusPatterns(pattern: ProductivityMetrics): BehavioralInsight | null {
    if (pattern.focus_quality_trend.length === 0) return null;

    const avgFocusQuality = pattern.focus_quality_trend.reduce((sum, quality) => sum + (quality || 0), 0) / pattern.focus_quality_trend.length;
    const recentFocus = pattern.focus_quality_trend.slice(-7);
    const recentAvg = recentFocus.length > 0 ? recentFocus.reduce((sum, quality) => sum + (quality || 0), 0) / recentFocus.length : 0;

    const trend = recentAvg > avgFocusQuality + 5 ? 'improving' : recentAvg < avgFocusQuality - 5 ? 'declining' : 'stable';

    let insight = '';
    let recommendation = '';

    if (avgFocusQuality > 75) {
      insight = `Excellent focus quality at ${avgFocusQuality.toFixed(1)}%`;
      recommendation = 'Maintain your current environment and schedule';
    } else if (avgFocusQuality < 50) {
      insight = `Focus quality needs improvement at ${avgFocusQuality.toFixed(1)}%`;
      recommendation = 'Review your environment, reduce distractions, and consider shorter focus blocks';
    } else {
      insight = `Moderate focus quality at ${avgFocusQuality.toFixed(1)}%`;
      recommendation = 'Identify your most productive hours and schedule important work then';
    }

    return {
      category: 'focus',
      insight,
      confidence: Math.min(pattern.focus_quality_trend.length / 14, 1),
      trend,
      recommendation,
      data_points: pattern.focus_quality_trend.length
    };
  }

  private analyzeEnergyEffectiveness(pattern: ProductivityMetrics): BehavioralInsight | null {
    if (pattern.energy_patterns.length === 0) return null;

    const bestEnergyPeriod = pattern.energy_patterns.reduce((best, current) => 
      current.productivity_correlation > best.productivity_correlation ? current : best
    );

    const insight = `Your most productive energy period is ${bestEnergyPeriod.time_period} with ${bestEnergyPeriod.average_energy.toFixed(1)}/10 energy`;
    const recommendation = `Schedule your most important work during ${bestEnergyPeriod.time_period} hours`;

    const mappedTrend = bestEnergyPeriod.trend === 'increasing' ? 'improving' : 
                       bestEnergyPeriod.trend === 'decreasing' ? 'declining' : 'stable';

    return {
      category: 'energy',
      insight,
      confidence: 0.8,
      trend: mappedTrend,
      recommendation,
      data_points: pattern.energy_patterns.length
    };
  }

  private analyzeBehavioralPatterns(behavioralData: any[]): BehavioralInsight | null {
    if (behavioralData.length === 0) return null;

    const suggestionEvents = behavioralData.filter(e => e.event_type === 'suggestion_response');
    const acceptanceRate = suggestionEvents.length > 0 
      ? (suggestionEvents.filter(e => e.event_data.response === 'accepted').length / suggestionEvents.length) * 100
      : 50;

    const skipEvents = behavioralData.filter(e => e.event_type === 'skip_pattern');
    const modificationEvents = behavioralData.filter(e => e.event_type === 'routine_modification');

    let insight = '';
    let recommendation = '';
    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (acceptanceRate > 70) {
      insight = `High engagement with system suggestions (${acceptanceRate.toFixed(1)}% acceptance rate)`;
      recommendation = 'The system is well-aligned with your preferences';
      trend = 'improving';
    } else if (skipEvents.length > 10) {
      insight = `Frequent task skipping detected (${skipEvents.length} skip events)`;
      recommendation = 'Consider reducing routine complexity or identifying obstacles';
      trend = 'declining';
    } else if (modificationEvents.length > 15) {
      insight = `High routine modification frequency (${modificationEvents.length} modifications)`;
      recommendation = 'Your preferences may be evolving - consider updating your profile';
      trend = 'stable';
    } else {
      insight = 'Stable behavioral patterns with moderate system engagement';
      recommendation = 'Continue current approach and monitor for changes';
    }

    return {
      category: 'patterns',
      insight,
      confidence: Math.min(behavioralData.length / 50, 1),
      trend,
      recommendation,
      data_points: behavioralData.length
    };
  }

  private calculateProfileCompleteness(profile: any): number {
    if (!profile?.profile) return 0;

    const requiredFields = [
      'target_identity',
      'academic_goals',
      'skill_goals',
      'wake_up_time',
      'sleep_time',
      'available_hours'
    ];

    const detailedFields = [
      'learning_style',
      'productivity_peaks',
      'distraction_triggers',
      'motivation_factors',
      'study_environment_prefs'
    ];

    let completeness = 0;
    let totalFields = requiredFields.length + detailedFields.length;

    // Check required fields
    requiredFields.forEach(field => {
      if (profile.profile[field] && profile.profile[field] !== '') {
        completeness += 1;
      }
    });

    // Check detailed profile fields
    const detailedProfile = profile.profile.detailed_profile || {};
    detailedFields.forEach(field => {
      if (detailedProfile[field] && detailedProfile[field] !== '') {
        completeness += 1;
      }
    });

    return Math.round((completeness / totalFields) * 100);
  }

  private calculateAdaptationEffectiveness(behavioralData: any[]): number {
    const adaptationEvents = behavioralData.filter(e => e.event_type === 'routine_adaptation_applied');
    if (adaptationEvents.length === 0) return 50;

    // Simple heuristic: if adaptations are being applied and user engagement remains high, it's effective
    const recentEvents = behavioralData.filter(e => {
      const eventDate = new Date(e.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return eventDate > weekAgo;
    });

    const engagementScore = recentEvents.length > 0 ? Math.min(recentEvents.length / 10, 1) * 100 : 50;
    return Math.round(engagementScore);
  }

  private calculateSuggestionAcceptanceRate(behavioralData: any[]): number {
    const suggestionEvents = behavioralData.filter(e => e.event_type === 'suggestion_response');
    if (suggestionEvents.length === 0) return 50;

    const acceptedSuggestions = suggestionEvents.filter(e => e.event_data.response === 'accepted').length;
    return Math.round((acceptedSuggestions / Math.max(suggestionEvents.length, 1)) * 100);
  }

  private calculateRoutineModificationFrequency(behavioralData: any[]): number {
    const modificationEvents = behavioralData.filter(e => e.event_type === 'routine_modification');
    const weeklyModifications = modificationEvents.length / 4; // Assuming 4 weeks of data
    return Math.round(weeklyModifications * 10) / 10;
  }

  private calculateLearningProgression(userId: string, behavioralData: any[], dateRange: { start: Date; end: Date }): LearningProgression {
    const weeksActive = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    // Analyze skill improvements (simplified)
    const skillImprovements: SkillImprovement[] = [
      {
        skill_area: 'Focus and Concentration',
        improvement_percentage: this.calculateFocusImprovement(behavioralData),
        time_period: 'last_month'
      },
      {
        skill_area: 'Habit Formation',
        improvement_percentage: this.calculateHabitFormationRate(behavioralData),
        time_period: 'last_month'
      }
    ];

    const habitFormationRate = this.calculateHabitFormationRate(behavioralData);
    const systemMasteryLevel = this.calculateSystemMasteryLevel(behavioralData, weeksActive);

    return {
      weeks_active: weeksActive,
      skill_improvements: skillImprovements,
      habit_formation_rate: habitFormationRate,
      system_mastery_level: systemMasteryLevel
    };
  }

  private calculateFocusImprovement(behavioralData: any[]): number {
    const focusEvents = behavioralData.filter(e => e.event_type === 'productivity_metrics');
    if (focusEvents.length < 2) return 0;

    const recentFocus = focusEvents.slice(-7);
    const olderFocus = focusEvents.slice(-14, -7);

    if (olderFocus.length === 0) return 0;

    const recentAvg = recentFocus.length > 0 ? recentFocus.reduce((sum, e) => sum + (e.event_data.focusQuality || 0), 0) / recentFocus.length : 0;
    const olderAvg = olderFocus.length > 0 ? olderFocus.reduce((sum, e) => sum + (e.event_data.focusQuality || 0), 0) / olderFocus.length : 0;

    return Math.round(olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0);
  }

  private calculateHabitFormationRate(behavioralData: any[]): number {
    const habitEvents = behavioralData.filter(e => e.event_type === 'habit_completion');
    if (habitEvents.length === 0) return 0;

    const completedHabits = habitEvents.filter(e => e.event_data.completed).length;
    return Math.round((completedHabits / habitEvents.length) * 100);
  }

  private calculateSystemMasteryLevel(behavioralData: any[], weeksActive: number): 'beginner' | 'intermediate' | 'advanced' {
    const totalEvents = behavioralData.length;
    const featureUsageEvents = behavioralData.filter(e => e.event_type === 'feature_usage').length;
    
    if (weeksActive < 2 || totalEvents < 50) return 'beginner';
    if (weeksActive < 8 || featureUsageEvents < 20) return 'intermediate';
    return 'advanced';
  }

  private identifyDecliningPatterns(analyticsData: AnalyticsData): PatternAlert[] {
    const alerts: PatternAlert[] = [];

    // Check consistency decline
    if (analyticsData.consistency_score < 50) {
      alerts.push({
        pattern_type: 'consistency_decline',
        severity: analyticsData.consistency_score < 30 ? 'high' : 'medium',
        description: `Overall consistency has dropped to ${analyticsData.consistency_score}%`,
        affected_metrics: ['habit_completion', 'routine_adherence', 'review_frequency'],
        suggested_actions: [
          'Simplify daily routine',
          'Focus on 1-2 core habits',
          'Use "never miss twice" rule'
        ]
      });
    }

    // Check deep work decline
    const recentDeepWork = analyticsData.deep_work_trend.slice(-7);
    const avgRecentDeepWork = recentDeepWork.length > 0 ? recentDeepWork.reduce((sum, hours) => sum + hours, 0) / recentDeepWork.length : 0;
    
    if (avgRecentDeepWork < 1) {
      alerts.push({
        pattern_type: 'deep_work_decline',
        severity: avgRecentDeepWork < 0.5 ? 'high' : 'medium',
        description: `Deep work hours have declined to ${avgRecentDeepWork.toFixed(1)} hours/day`,
        affected_metrics: ['focus_quality', 'productivity', 'goal_progress'],
        suggested_actions: [
          'Schedule protected deep work blocks',
          'Eliminate distractions during focus time',
          'Start with shorter focus sessions'
        ]
      });
    }

    return alerts;
  }

  private identifyImprovementOpportunities(analyticsData: AnalyticsData): ImprovementOpportunity[] {
    const opportunities: ImprovementOpportunity[] = [];

    // Habit stacking opportunity
    const strongHabits = analyticsData.habit_streaks.filter(h => h.consistency_percentage > 70);
    const weakHabits = analyticsData.habit_streaks.filter(h => h.consistency_percentage < 50);

    if (strongHabits.length > 0 && weakHabits.length > 0) {
      opportunities.push({
        area: 'Habit Stacking',
        potential_impact: 0.8,
        difficulty: 'easy',
        description: 'Link weak habits to your strong habits for better consistency',
        action_steps: [
          'Identify your most consistent habit',
          'Choose one struggling habit to stack after it',
          'Practice the stack for 2 weeks before adding more'
        ]
      });
    }

    // Energy optimization opportunity
    const energyPatterns = analyticsData.productivity_pattern.energy_patterns;
    const bestEnergyPeriod = energyPatterns.reduce((best, current) => 
      current.productivity_correlation > best.productivity_correlation ? current : best, 
      energyPatterns[0]
    );

    if (bestEnergyPeriod && bestEnergyPeriod.productivity_correlation > 0.6) {
      opportunities.push({
        area: 'Energy Optimization',
        potential_impact: 0.7,
        difficulty: 'medium',
        description: `Optimize your schedule around your peak energy period (${bestEnergyPeriod.time_period})`,
        action_steps: [
          'Schedule most important work during peak energy hours',
          'Move routine tasks to lower energy periods',
          'Protect peak hours from interruptions'
        ]
      });
    }

    return opportunities;
  }

  private generateSystemAdjustments(analyticsData: AnalyticsData): SystemAdjustment[] {
    const adjustments: SystemAdjustment[] = [];

    // Routine simplification
    if (analyticsData.consistency_score < 60) {
      adjustments.push({
        adjustment_type: 'routine_simplification',
        reason: 'Low consistency score indicates routine may be too complex',
        expected_impact: 0.8,
        implementation_steps: [
          'Reduce daily tasks by 25%',
          'Focus on core habits only',
          'Simplify task descriptions',
          'Increase break time between activities'
        ]
      });
    }

    // Complexity increase
    if (analyticsData.consistency_score > 85 && analyticsData.identity_alignment > 80) {
      adjustments.push({
        adjustment_type: 'complexity_increase',
        reason: 'High performance indicates readiness for increased challenge',
        expected_impact: 0.6,
        implementation_steps: [
          'Add one new challenging habit',
          'Increase deep work session length',
          'Add skill-building activities',
          'Set more ambitious daily goals'
        ]
      });
    }

    return adjustments;
  }

  private generateOptimizationSuggestions(analyticsData: AnalyticsData): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Focus optimization - add null/zero checks
    const focusQualityTrend = analyticsData.productivity_pattern.focus_quality_trend || [];
    if (focusQualityTrend.length > 0) {
      const avgFocusQuality = focusQualityTrend.reduce((sum, q) => sum + (q || 0), 0) / focusQualityTrend.length;

      if (avgFocusQuality < 70) {
        suggestions.push({
          category: 'Focus Enhancement',
          suggestion: 'Implement the Pomodoro Technique with 25-minute focus blocks',
          confidence: 0.8,
          expected_benefit: 'Improved focus quality and reduced mental fatigue',
          implementation_effort: 'low'
        });
      }
    }

    // Habit optimization - add null/zero checks
    const habitStreaks = analyticsData.habit_streaks || [];
    if (habitStreaks.length > 0) {
      const avgHabitConsistency = habitStreaks.reduce((sum, h) => sum + (h?.consistency_percentage || 0), 0) / habitStreaks.length;

      if (avgHabitConsistency < 70) {
        suggestions.push({
          category: 'Habit Formation',
          suggestion: 'Use implementation intentions: "When X happens, I will do Y"',
          confidence: 0.9,
          expected_benefit: 'Increased habit consistency through clear triggers',
          implementation_effort: 'low'
        });
      }
    }

    // Add default suggestion if no data available
    if (suggestions.length === 0) {
      suggestions.push({
        category: 'Getting Started',
        suggestion: 'Begin by establishing a consistent daily routine with 2-3 core habits',
        confidence: 0.7,
        expected_benefit: 'Foundation for building discipline and tracking progress',
        implementation_effort: 'medium'
      });
    }

    return suggestions;
  }
}