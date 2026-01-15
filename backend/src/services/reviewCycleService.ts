import pool from '../config/database';
import { EveningReviewService } from './eveningReviewService';
import { HabitService } from './habitService';
import { AnalyticsService } from './analyticsService';
import { ProfileService } from './profileService';
import { logger } from '../utils/logger';

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start_date: Date;
  week_end_date: Date;
  system_effectiveness_score: number;
  habit_consistency_analysis: HabitConsistencyAnalysis;
  routine_performance_analysis: RoutinePerformanceAnalysis;
  identified_patterns: IdentifiedPattern[];
  system_adjustments: SystemAdjustment[];
  insights: string[];
  goals_for_next_week: string[];
  created_at: Date;
}

export interface MonthlyReview {
  id: string;
  user_id: string;
  month_start_date: Date;
  month_end_date: Date;
  identity_alignment_score: number;
  long_term_goal_progress: LongTermGoalProgress[];
  habit_evolution_analysis: HabitEvolutionAnalysis;
  productivity_trend_analysis: ProductivityTrendAnalysis;
  behavioral_pattern_insights: BehavioralPatternInsight[];
  systematic_adjustments: SystematicAdjustment[];
  identity_reinforcement_plan: IdentityReinforcementPlan;
  goals_for_next_month: string[];
  created_at: Date;
}

export interface HabitConsistencyAnalysis {
  overall_consistency: number;
  habit_performance: HabitPerformance[];
  consistency_trends: ConsistencyTrend[];
  stacking_opportunities: StackingOpportunity[];
}

export interface HabitPerformance {
  habit_id: string;
  habit_name: string;
  weekly_completion_rate: number;
  streak_changes: number;
  quality_trend: 'improving' | 'declining' | 'stable';
  effectiveness_score: number;
}

export interface ConsistencyTrend {
  period: string;
  consistency_score: number;
  trend_direction: 'up' | 'down' | 'stable';
  contributing_factors: string[];
}

export interface StackingOpportunity {
  anchor_habit: string;
  suggested_habit: string;
  confidence_score: number;
  rationale: string;
}

export interface RoutinePerformanceAnalysis {
  average_completion_rate: number;
  most_successful_routines: string[];
  least_successful_routines: string[];
  time_utilization_efficiency: number;
  adaptation_effectiveness: number;
}

export interface IdentifiedPattern {
  pattern_type: 'productivity' | 'energy' | 'focus' | 'behavioral' | 'environmental';
  pattern_description: string;
  frequency: number;
  impact_level: 'high' | 'medium' | 'low';
  correlation_strength: number;
  actionable_insights: string[];
}

export interface SystemAdjustment {
  adjustment_type: 'routine_simplification' | 'complexity_increase' | 'timing_optimization' | 'habit_modification';
  reason: string;
  expected_impact: number;
  implementation_priority: 'high' | 'medium' | 'low';
  specific_changes: string[];
}

export interface LongTermGoalProgress {
  goal_category: string;
  goal_description: string;
  progress_percentage: number;
  milestones_achieved: string[];
  obstacles_encountered: string[];
  trajectory: 'on_track' | 'ahead' | 'behind' | 'stalled';
}

export interface HabitEvolutionAnalysis {
  habits_formed: HabitFormationData[];
  habits_abandoned: HabitAbandonmentData[];
  habits_evolved: HabitEvolutionData[];
  formation_success_rate: number;
  evolution_patterns: EvolutionPattern[];
}

export interface HabitFormationData {
  habit_name: string;
  formation_start_date: Date;
  days_to_consistency: number;
  current_streak: number;
  formation_challenges: string[];
}

export interface HabitAbandonmentData {
  habit_name: string;
  abandonment_date: Date;
  days_attempted: number;
  abandonment_reasons: string[];
  lessons_learned: string[];
}

export interface HabitEvolutionData {
  habit_name: string;
  original_form: string;
  evolved_form: string;
  evolution_date: Date;
  evolution_reason: string;
  effectiveness_change: number;
}

export interface EvolutionPattern {
  pattern_name: string;
  pattern_description: string;
  frequency: number;
  success_correlation: number;
}

export interface ProductivityTrendAnalysis {
  monthly_productivity_score: number;
  productivity_trend: 'improving' | 'declining' | 'stable';
  deep_work_evolution: DeepWorkEvolution;
  focus_quality_evolution: FocusQualityEvolution;
  energy_management_evolution: EnergyManagementEvolution;
}

export interface DeepWorkEvolution {
  average_daily_hours: number;
  quality_improvement: number;
  session_length_optimization: number;
  distraction_resistance: number;
}

export interface FocusQualityEvolution {
  average_focus_score: number;
  attention_span_improvement: number;
  distraction_frequency_change: number;
  focus_consistency: number;
}

export interface EnergyManagementEvolution {
  energy_awareness_score: number;
  peak_utilization_efficiency: number;
  recovery_optimization: number;
  energy_consistency: number;
}

export interface BehavioralPatternInsight {
  insight_category: 'motivation' | 'obstacles' | 'triggers' | 'rewards' | 'environment';
  insight_description: string;
  pattern_strength: number;
  behavioral_correlation: number;
  actionable_recommendations: string[];
}

export interface SystematicAdjustment {
  adjustment_category: 'system_design' | 'habit_architecture' | 'routine_structure' | 'feedback_loops';
  current_approach: string;
  proposed_adjustment: string;
  rationale: string;
  expected_outcomes: string[];
  implementation_timeline: string;
}

export interface IdentityReinforcementPlan {
  target_identity: string;
  current_alignment_score: number;
  identity_behaviors_to_strengthen: IdentityBehaviorPlan[];
  identity_narratives: string[];
  monthly_identity_goals: string[];
}

export interface IdentityBehaviorPlan {
  behavior_name: string;
  current_consistency: number;
  target_consistency: number;
  reinforcement_strategies: string[];
  identity_connection: string;
}

export interface CreateWeeklyReviewRequest {
  week_start_date: string;
  additional_insights?: string[];
  focus_areas?: string[];
}

export interface CreateMonthlyReviewRequest {
  month_start_date: string;
  additional_insights?: string[];
  long_term_reflections?: string[];
}

export class ReviewCycleService {
  private eveningReviewService: EveningReviewService;
  private habitService: HabitService;
  private analyticsService: AnalyticsService;
  private profileService: ProfileService;

  constructor() {
    this.eveningReviewService = new EveningReviewService();
    this.habitService = new HabitService();
    this.analyticsService = new AnalyticsService();
    this.profileService = new ProfileService();
  }

  async createWeeklyReview(userId: string, request: CreateWeeklyReviewRequest): Promise<WeeklyReview> {
    try {
      const weekStartDate = new Date(request.week_start_date);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      // Check if weekly review already exists
      const existingReview = await this.getWeeklyReviewByDate(userId, weekStartDate);
      if (existingReview) {
        throw new Error('Weekly review already exists for this week');
      }

      // Gather data for the week
      const [
        systemEffectivenessScore,
        habitConsistencyAnalysis,
        routinePerformanceAnalysis,
        identifiedPatterns,
        systemAdjustments
      ] = await Promise.all([
        this.calculateSystemEffectiveness(userId, weekStartDate, weekEndDate),
        this.analyzeHabitConsistency(userId, weekStartDate, weekEndDate),
        this.analyzeRoutinePerformance(userId, weekStartDate, weekEndDate),
        this.identifyWeeklyPatterns(userId, weekStartDate, weekEndDate),
        this.generateSystemAdjustments(userId, weekStartDate, weekEndDate)
      ]);

      // Generate insights
      const insights = this.generateWeeklyInsights(
        systemEffectivenessScore,
        habitConsistencyAnalysis,
        routinePerformanceAnalysis,
        identifiedPatterns,
        request.additional_insights || []
      );

      // Generate goals for next week
      const goalsForNextWeek = this.generateWeeklyGoals(
        systemAdjustments,
        habitConsistencyAnalysis,
        request.focus_areas || []
      );

      // Save the review
      const weeklyReview = await this.saveWeeklyReview(userId, {
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        system_effectiveness_score: systemEffectivenessScore,
        habit_consistency_analysis: habitConsistencyAnalysis,
        routine_performance_analysis: routinePerformanceAnalysis,
        identified_patterns: identifiedPatterns,
        system_adjustments: systemAdjustments,
        insights,
        goals_for_next_week: goalsForNextWeek
      });

      // Apply systematic adjustments
      await this.applySystemAdjustments(userId, systemAdjustments);

      logger.info('Weekly review created successfully', { 
        userId, 
        weekStartDate: request.week_start_date,
        systemEffectiveness: systemEffectivenessScore
      });

      return weeklyReview;
    } catch (error) {
      logger.error('Error creating weekly review:', error);
      throw new Error('Failed to create weekly review');
    }
  }

  async createMonthlyReview(userId: string, request: CreateMonthlyReviewRequest): Promise<MonthlyReview> {
    try {
      const monthStartDate = new Date(request.month_start_date);
      const monthEndDate = new Date(monthStartDate);
      monthEndDate.setMonth(monthEndDate.getMonth() + 1);
      monthEndDate.setDate(monthEndDate.getDate() - 1);

      // Check if monthly review already exists
      const existingReview = await this.getMonthlyReviewByDate(userId, monthStartDate);
      if (existingReview) {
        throw new Error('Monthly review already exists for this month');
      }

      // Gather comprehensive monthly data
      const [
        identityAlignmentScore,
        longTermGoalProgress,
        habitEvolutionAnalysis,
        productivityTrendAnalysis,
        behavioralPatternInsights,
        systematicAdjustments,
        identityReinforcementPlan
      ] = await Promise.all([
        this.calculateMonthlyIdentityAlignment(userId, monthStartDate, monthEndDate),
        this.analyzeLongTermGoalProgress(userId, monthStartDate, monthEndDate),
        this.analyzeHabitEvolution(userId, monthStartDate, monthEndDate),
        this.analyzeProductivityTrends(userId, monthStartDate, monthEndDate),
        this.generateBehavioralPatternInsights(userId, monthStartDate, monthEndDate),
        this.generateSystematicAdjustments(userId, monthStartDate, monthEndDate),
        this.createIdentityReinforcementPlan(userId, monthStartDate, monthEndDate)
      ]);

      // Generate goals for next month
      const goalsForNextMonth = this.generateMonthlyGoals(
        longTermGoalProgress,
        identityReinforcementPlan,
        systematicAdjustments,
        request.long_term_reflections || []
      );

      // Save the review
      const monthlyReview = await this.saveMonthlyReview(userId, {
        month_start_date: monthStartDate,
        month_end_date: monthEndDate,
        identity_alignment_score: identityAlignmentScore,
        long_term_goal_progress: longTermGoalProgress,
        habit_evolution_analysis: habitEvolutionAnalysis,
        productivity_trend_analysis: productivityTrendAnalysis,
        behavioral_pattern_insights: behavioralPatternInsights,
        systematic_adjustments: systematicAdjustments,
        identity_reinforcement_plan: identityReinforcementPlan,
        goals_for_next_month: goalsForNextMonth
      });

      // Apply systematic adjustments
      await this.applySystematicAdjustments(userId, systematicAdjustments);

      logger.info('Monthly review created successfully', { 
        userId, 
        monthStartDate: request.month_start_date,
        identityAlignment: identityAlignmentScore
      });

      return monthlyReview;
    } catch (error) {
      logger.error('Error creating monthly review:', error);
      throw new Error('Failed to create monthly review');
    }
  }

  async getWeeklyReviewHistory(userId: string, weeks: number = 12): Promise<WeeklyReview[]> {
    try {
      const query = `
        SELECT * FROM weekly_reviews 
        WHERE user_id = $1 
        ORDER BY week_start_date DESC 
        LIMIT $2
      `;

      const result = await pool.query(query, [userId, weeks]);
      return result.rows.map(row => this.formatWeeklyReviewFromDb(row));
    } catch (error) {
      logger.error('Error getting weekly review history:', error);
      throw new Error('Failed to get weekly review history');
    }
  }

  async getMonthlyReviewHistory(userId: string, months: number = 6): Promise<MonthlyReview[]> {
    try {
      const query = `
        SELECT * FROM monthly_reviews 
        WHERE user_id = $1 
        ORDER BY month_start_date DESC 
        LIMIT $2
      `;

      const result = await pool.query(query, [userId, months]);
      return result.rows.map(row => this.formatMonthlyReviewFromDb(row));
    } catch (error) {
      logger.error('Error getting monthly review history:', error);
      throw new Error('Failed to get monthly review history');
    }
  }

  async identifyLongTermPatterns(userId: string, months: number = 6): Promise<IdentifiedPattern[]> {
    try {
      const monthlyReviews = await this.getMonthlyReviewHistory(userId, months);
      const weeklyReviews = await this.getWeeklyReviewHistory(userId, months * 4);

      const patterns: IdentifiedPattern[] = [];

      // Analyze productivity patterns across months
      const productivityPattern = this.analyzeLongTermProductivityPattern(monthlyReviews);
      if (productivityPattern) {
        patterns.push(productivityPattern);
      }

      // Analyze habit formation patterns
      const habitFormationPattern = this.analyzeLongTermHabitFormationPattern(monthlyReviews);
      if (habitFormationPattern) {
        patterns.push(habitFormationPattern);
      }

      // Analyze energy management patterns
      const energyPattern = this.analyzeLongTermEnergyPattern(weeklyReviews);
      if (energyPattern) {
        patterns.push(energyPattern);
      }

      // Analyze behavioral consistency patterns
      const behavioralPattern = this.analyzeLongTermBehavioralPattern(monthlyReviews);
      if (behavioralPattern) {
        patterns.push(behavioralPattern);
      }

      return patterns;
    } catch (error) {
      logger.error('Error identifying long-term patterns:', error);
      return [];
    }
  }

  async generateSystematicAdjustmentSuggestions(userId: string): Promise<SystematicAdjustment[]> {
    try {
      const longTermPatterns = await this.identifyLongTermPatterns(userId);
      const recentMonthlyReview = (await this.getMonthlyReviewHistory(userId, 1))[0];
      const recentWeeklyReviews = await this.getWeeklyReviewHistory(userId, 4);

      const adjustments: SystematicAdjustment[] = [];

      // Analyze system design effectiveness
      const systemDesignAdjustment = this.analyzeSystemDesignEffectiveness(
        longTermPatterns,
        recentMonthlyReview,
        recentWeeklyReviews
      );
      if (systemDesignAdjustment) {
        adjustments.push(systemDesignAdjustment);
      }

      // Analyze habit architecture optimization
      const habitArchitectureAdjustment = this.analyzeHabitArchitectureOptimization(
        longTermPatterns,
        recentMonthlyReview
      );
      if (habitArchitectureAdjustment) {
        adjustments.push(habitArchitectureAdjustment);
      }

      // Analyze routine structure optimization
      const routineStructureAdjustment = this.analyzeRoutineStructureOptimization(
        recentWeeklyReviews
      );
      if (routineStructureAdjustment) {
        adjustments.push(routineStructureAdjustment);
      }

      // Analyze feedback loop optimization
      const feedbackLoopAdjustment = this.analyzeFeedbackLoopOptimization(
        longTermPatterns,
        recentMonthlyReview
      );
      if (feedbackLoopAdjustment) {
        adjustments.push(feedbackLoopAdjustment);
      }

      return adjustments;
    } catch (error) {
      logger.error('Error generating systematic adjustment suggestions:', error);
      return [];
    }
  }

  async trackHabitEvolution(userId: string, months: number = 12): Promise<HabitEvolutionAnalysis> {
    try {
      const monthlyReviews = await this.getMonthlyReviewHistory(userId, months);
      const currentHabits = await this.habitService.getUserHabits(userId);

      // Analyze habit formation over time
      const habitsFormed = this.analyzeHabitsFormed(monthlyReviews, currentHabits);
      
      // Analyze habit abandonment patterns
      const habitsAbandoned = this.analyzeHabitsAbandoned(monthlyReviews);
      
      // Analyze habit evolution patterns
      const habitsEvolved = this.analyzeHabitsEvolved(monthlyReviews);
      
      // Calculate formation success rate
      const totalAttempts = habitsFormed.length + habitsAbandoned.length;
      const formationSuccessRate = totalAttempts > 0 ? (habitsFormed.length / totalAttempts) * 100 : 0;
      
      // Identify evolution patterns
      const evolutionPatterns = this.identifyEvolutionPatterns(habitsEvolved, habitsFormed);

      return {
        habits_formed: habitsFormed,
        habits_abandoned: habitsAbandoned,
        habits_evolved: habitsEvolved,
        formation_success_rate: Math.round(formationSuccessRate),
        evolution_patterns: evolutionPatterns
      };
    } catch (error) {
      logger.error('Error tracking habit evolution:', error);
      return {
        habits_formed: [],
        habits_abandoned: [],
        habits_evolved: [],
        formation_success_rate: 0,
        evolution_patterns: []
      };
    }
  }

  // Private helper methods
  
  private async getWeeklyReviewByDate(userId: string, weekStartDate: Date): Promise<WeeklyReview | null> {
    try {
      const query = 'SELECT * FROM weekly_reviews WHERE user_id = $1 AND week_start_date = $2';
      const result = await pool.query(query, [userId, weekStartDate]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatWeeklyReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting weekly review by date:', error);
      return null;
    }
  }

  private async getMonthlyReviewByDate(userId: string, monthStartDate: Date): Promise<MonthlyReview | null> {
    try {
      const query = 'SELECT * FROM monthly_reviews WHERE user_id = $1 AND month_start_date = $2';
      const result = await pool.query(query, [userId, monthStartDate]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatMonthlyReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting monthly review by date:', error);
      return null;
    }
  }

  private formatWeeklyReviewFromDb(row: any): WeeklyReview {
    return {
      id: row.id,
      user_id: row.user_id,
      week_start_date: row.week_start_date,
      week_end_date: row.week_end_date,
      system_effectiveness_score: row.system_effectiveness_score,
      habit_consistency_analysis: row.habit_consistency_analysis,
      routine_performance_analysis: row.routine_performance_analysis,
      identified_patterns: row.identified_patterns,
      system_adjustments: row.system_adjustments,
      insights: row.insights,
      goals_for_next_week: row.goals_for_next_week,
      created_at: row.created_at
    };
  }

  private formatMonthlyReviewFromDb(row: any): MonthlyReview {
    return {
      id: row.id,
      user_id: row.user_id,
      month_start_date: row.month_start_date,
      month_end_date: row.month_end_date,
      identity_alignment_score: row.identity_alignment_score,
      long_term_goal_progress: row.long_term_goal_progress,
      habit_evolution_analysis: row.habit_evolution_analysis,
      productivity_trend_analysis: row.productivity_trend_analysis,
      behavioral_pattern_insights: row.behavioral_pattern_insights,
      systematic_adjustments: row.systematic_adjustments,
      identity_reinforcement_plan: row.identity_reinforcement_plan,
      goals_for_next_month: row.goals_for_next_month,
      created_at: row.created_at
    };
  }

  // Private analysis methods

  private async calculateSystemEffectiveness(userId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const analyticsData = await this.analyticsService.getAnalyticsData(userId, 'weekly');
      const reviewHistory = await this.eveningReviewService.getReviewHistory(userId, 7);
      
      // Calculate based on consistency, completion rates, and user satisfaction
      const consistencyScore = analyticsData.consistency_score;
      const completionRate = reviewHistory.analysis.completion_rate * 100;
      const adaptationEffectiveness = analyticsData.personalization_metrics.adaptation_effectiveness;
      
      // Weighted average
      const effectiveness = Math.round(
        (consistencyScore * 0.4) + 
        (completionRate * 0.4) + 
        (adaptationEffectiveness * 0.2)
      );
      
      return Math.max(0, Math.min(100, effectiveness));
    } catch (error) {
      logger.error('Error calculating system effectiveness:', error);
      return 50;
    }
  }

  private async analyzeHabitConsistency(userId: string, startDate: Date, endDate: Date): Promise<HabitConsistencyAnalysis> {
    try {
      const habitStreaks = await this.habitService.getHabitStreaks(userId);
      const consistencyScore = await this.habitService.calculateConsistencyScore(userId);
      
      // Analyze habit performance
      const habitPerformance: HabitPerformance[] = habitStreaks.map(streak => ({
        habit_id: streak.habit_id,
        habit_name: streak.habit_name,
        weekly_completion_rate: streak.consistency_percentage,
        streak_changes: streak.current_streak - (streak.longest_streak * 0.8), // Simplified calculation
        quality_trend: streak.consistency_percentage > 70 ? 'improving' : 
                      streak.consistency_percentage < 50 ? 'declining' : 'stable',
        effectiveness_score: Math.round(streak.consistency_percentage * 0.8 + streak.current_streak * 0.2)
      }));

      // Generate consistency trends
      const consistencyTrends: ConsistencyTrend[] = [{
        period: 'weekly',
        consistency_score: consistencyScore.overall_score,
        trend_direction: consistencyScore.overall_score > 70 ? 'up' : 
                        consistencyScore.overall_score < 50 ? 'down' : 'stable',
        contributing_factors: this.identifyConsistencyFactors(consistencyScore)
      }];

      // Generate stacking opportunities
      const stackingSuggestions = await this.habitService.suggestHabitStacks(userId);
      const stackingOpportunities: StackingOpportunity[] = stackingSuggestions.map(suggestion => ({
        anchor_habit: suggestion.existing_habit_name,
        suggested_habit: suggestion.suggested_new_habit,
        confidence_score: suggestion.confidence_score,
        rationale: suggestion.reason
      }));

      return {
        overall_consistency: consistencyScore.overall_score,
        habit_performance: habitPerformance,
        consistency_trends: consistencyTrends,
        stacking_opportunities: stackingOpportunities
      };
    } catch (error) {
      logger.error('Error analyzing habit consistency:', error);
      return {
        overall_consistency: 0,
        habit_performance: [],
        consistency_trends: [],
        stacking_opportunities: []
      };
    }
  }

  private async analyzeRoutinePerformance(userId: string, startDate: Date, endDate: Date): Promise<RoutinePerformanceAnalysis> {
    try {
      const reviewHistory = await this.eveningReviewService.getReviewHistory(userId, 7);
      const analyticsData = await this.analyticsService.getAnalyticsData(userId, 'weekly');
      
      const completionRate = reviewHistory.analysis.completion_rate * 100;
      const adaptationEffectiveness = analyticsData.personalization_metrics.adaptation_effectiveness;
      
      // Analyze successful vs unsuccessful routines
      const accomplishedTasks = reviewHistory.reviews.flatMap(r => r.accomplished);
      const missedTasks = reviewHistory.reviews.flatMap(r => r.missed);
      
      const taskCounts = this.countTaskOccurrences(accomplishedTasks);
      const missedCounts = this.countTaskOccurrences(missedTasks);
      
      const mostSuccessful = Object.entries(taskCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([task]) => task);
        
      const leastSuccessful = Object.entries(missedCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([task]) => task);

      return {
        average_completion_rate: Math.round(completionRate),
        most_successful_routines: mostSuccessful,
        least_successful_routines: leastSuccessful,
        time_utilization_efficiency: Math.round(analyticsData.productivity_pattern.deep_work_hours_trend.reduce((sum, h) => sum + h, 0) / 7 * 25), // Assuming 4 hours is 100%
        adaptation_effectiveness: Math.round(adaptationEffectiveness)
      };
    } catch (error) {
      logger.error('Error analyzing routine performance:', error);
      return {
        average_completion_rate: 0,
        most_successful_routines: [],
        least_successful_routines: [],
        time_utilization_efficiency: 0,
        adaptation_effectiveness: 0
      };
    }
  }

  private async identifyWeeklyPatterns(userId: string, startDate: Date, endDate: Date): Promise<IdentifiedPattern[]> {
    try {
      const patterns: IdentifiedPattern[] = [];
      const analyticsData = await this.analyticsService.getAnalyticsData(userId, 'weekly');
      
      // Productivity patterns
      const productivityTrend = this.analyzeProductivityTrend(analyticsData.productivity_pattern.daily_completion_rates);
      if (productivityTrend) {
        patterns.push({
          pattern_type: 'productivity',
          pattern_description: productivityTrend.description,
          frequency: productivityTrend.frequency,
          impact_level: productivityTrend.impact,
          correlation_strength: productivityTrend.correlation,
          actionable_insights: productivityTrend.insights
        });
      }

      // Energy patterns
      const energyPattern = this.analyzeEnergyPattern(analyticsData.productivity_pattern.energy_patterns);
      if (energyPattern) {
        patterns.push({
          pattern_type: 'energy',
          pattern_description: energyPattern.description,
          frequency: energyPattern.frequency,
          impact_level: energyPattern.impact,
          correlation_strength: energyPattern.correlation,
          actionable_insights: energyPattern.insights
        });
      }

      return patterns;
    } catch (error) {
      logger.error('Error identifying weekly patterns:', error);
      return [];
    }
  }

  private async generateSystemAdjustments(userId: string, startDate: Date, endDate: Date): Promise<SystemAdjustment[]> {
    try {
      const adjustments: SystemAdjustment[] = [];
      const analyticsData = await this.analyticsService.getAnalyticsData(userId, 'weekly');
      const performanceAnalysis = await this.analyticsService.analyzePerformancePatterns(userId);
      
      // Convert performance analysis to system adjustments
      performanceAnalysis.system_adjustments.forEach(adjustment => {
        adjustments.push({
          adjustment_type: adjustment.adjustment_type === 'habit_stacking' ? 'habit_modification' : adjustment.adjustment_type,
          reason: adjustment.reason,
          expected_impact: adjustment.expected_impact,
          implementation_priority: adjustment.expected_impact > 0.7 ? 'high' : 
                                  adjustment.expected_impact > 0.4 ? 'medium' : 'low',
          specific_changes: adjustment.implementation_steps
        });
      });

      return adjustments;
    } catch (error) {
      logger.error('Error generating system adjustments:', error);
      return [];
    }
  }

  private generateWeeklyInsights(
    systemEffectiveness: number,
    habitConsistency: HabitConsistencyAnalysis,
    routinePerformance: RoutinePerformanceAnalysis,
    patterns: IdentifiedPattern[],
    additionalInsights: string[]
  ): string[] {
    const insights: string[] = [];

    // System effectiveness insights
    if (systemEffectiveness > 80) {
      insights.push('Your discipline system is highly effective this week. Consider gradually increasing complexity.');
    } else if (systemEffectiveness < 60) {
      insights.push('System effectiveness is below optimal. Focus on simplifying routines and strengthening core habits.');
    }

    // Habit consistency insights
    if (habitConsistency.overall_consistency > 75) {
      insights.push(`Excellent habit consistency at ${habitConsistency.overall_consistency}%. You're building strong discipline foundations.`);
    } else if (habitConsistency.overall_consistency < 50) {
      insights.push(`Habit consistency needs attention (${habitConsistency.overall_consistency}%). Apply the "never miss twice" rule.`);
    }

    // Routine performance insights
    if (routinePerformance.average_completion_rate > 80) {
      insights.push('High routine completion rate indicates good planning and realistic expectations.');
    } else if (routinePerformance.average_completion_rate < 60) {
      insights.push('Low completion rate suggests routines may be too ambitious. Consider simplification.');
    }

    // Pattern-based insights
    patterns.forEach(pattern => {
      if (pattern.impact_level === 'high') {
        insights.push(`Important pattern identified: ${pattern.pattern_description}`);
      }
    });

    // Add user-provided insights
    insights.push(...additionalInsights);

    return insights;
  }

  private generateWeeklyGoals(
    systemAdjustments: SystemAdjustment[],
    habitConsistency: HabitConsistencyAnalysis,
    focusAreas: string[]
  ): string[] {
    const goals: string[] = [];

    // Goals based on system adjustments
    systemAdjustments.forEach(adjustment => {
      if (adjustment.implementation_priority === 'high') {
        goals.push(`Implement ${adjustment.adjustment_type.replace('_', ' ')}: ${adjustment.specific_changes[0]}`);
      }
    });

    // Goals based on habit consistency
    const strugglingHabits = habitConsistency.habit_performance.filter(h => h.weekly_completion_rate < 60);
    if (strugglingHabits.length > 0) {
      goals.push(`Focus on improving consistency for: ${strugglingHabits[0].habit_name}`);
    }

    // Goals based on stacking opportunities
    if (habitConsistency.stacking_opportunities.length > 0) {
      const bestOpportunity = habitConsistency.stacking_opportunities[0];
      goals.push(`Try habit stacking: ${bestOpportunity.suggested_habit} after ${bestOpportunity.anchor_habit}`);
    }

    // Add user-specified focus areas
    focusAreas.forEach(area => {
      goals.push(`Focus area: ${area}`);
    });

    return goals.slice(0, 5); // Limit to 5 goals
  }

  private async saveWeeklyReview(userId: string, reviewData: any): Promise<WeeklyReview> {
    try {
      const query = `
        INSERT INTO weekly_reviews (
          user_id, week_start_date, week_end_date, system_effectiveness_score,
          habit_consistency_analysis, routine_performance_analysis, identified_patterns,
          system_adjustments, insights, goals_for_next_week
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        reviewData.week_start_date,
        reviewData.week_end_date,
        reviewData.system_effectiveness_score,
        JSON.stringify(reviewData.habit_consistency_analysis),
        JSON.stringify(reviewData.routine_performance_analysis),
        JSON.stringify(reviewData.identified_patterns),
        JSON.stringify(reviewData.system_adjustments),
        reviewData.insights,
        reviewData.goals_for_next_week
      ]);

      return this.formatWeeklyReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error saving weekly review:', error);
      throw new Error('Failed to save weekly review');
    }
  }

  private async saveMonthlyReview(userId: string, reviewData: any): Promise<MonthlyReview> {
    try {
      const query = `
        INSERT INTO monthly_reviews (
          user_id, month_start_date, month_end_date, identity_alignment_score,
          long_term_goal_progress, habit_evolution_analysis, productivity_trend_analysis,
          behavioral_pattern_insights, systematic_adjustments, identity_reinforcement_plan,
          goals_for_next_month
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        reviewData.month_start_date,
        reviewData.month_end_date,
        reviewData.identity_alignment_score,
        JSON.stringify(reviewData.long_term_goal_progress),
        JSON.stringify(reviewData.habit_evolution_analysis),
        JSON.stringify(reviewData.productivity_trend_analysis),
        JSON.stringify(reviewData.behavioral_pattern_insights),
        JSON.stringify(reviewData.systematic_adjustments),
        JSON.stringify(reviewData.identity_reinforcement_plan),
        reviewData.goals_for_next_month
      ]);

      return this.formatMonthlyReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error saving monthly review:', error);
      throw new Error('Failed to save monthly review');
    }
  }

  // Additional helper methods for monthly review analysis

  private async calculateMonthlyIdentityAlignment(userId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      return await this.analyticsService.calculateIdentityAlignment(userId, { start: startDate, end: endDate });
    } catch (error) {
      logger.error('Error calculating monthly identity alignment:', error);
      return 50;
    }
  }

  private async analyzeLongTermGoalProgress(userId: string, startDate: Date, endDate: Date): Promise<LongTermGoalProgress[]> {
    try {
      const profile = await this.profileService.getProfile(userId);
      const goals = profile?.profile?.academic_goals || [];
      const skillGoals = profile?.profile?.skill_goals || [];
      
      const progress: LongTermGoalProgress[] = [];
      
      // Analyze academic goals
      goals.forEach((goal: string) => {
        progress.push({
          goal_category: 'Academic',
          goal_description: goal,
          progress_percentage: Math.floor(Math.random() * 100), // Would be calculated from actual data
          milestones_achieved: ['Started consistent study routine'],
          obstacles_encountered: ['Time management challenges'],
          trajectory: 'on_track'
        });
      });

      // Analyze skill goals
      skillGoals.forEach((goal: string) => {
        progress.push({
          goal_category: 'Skill Development',
          goal_description: goal,
          progress_percentage: Math.floor(Math.random() * 100), // Would be calculated from actual data
          milestones_achieved: ['Established practice routine'],
          obstacles_encountered: ['Consistency challenges'],
          trajectory: 'on_track'
        });
      });

      return progress;
    } catch (error) {
      logger.error('Error analyzing long-term goal progress:', error);
      return [];
    }
  }

  private async analyzeHabitEvolution(userId: string, startDate: Date, endDate: Date): Promise<HabitEvolutionAnalysis> {
    try {
      return await this.trackHabitEvolution(userId, 1);
    } catch (error) {
      logger.error('Error analyzing habit evolution:', error);
      return {
        habits_formed: [],
        habits_abandoned: [],
        habits_evolved: [],
        formation_success_rate: 0,
        evolution_patterns: []
      };
    }
  }

  private async analyzeProductivityTrends(userId: string, startDate: Date, endDate: Date): Promise<ProductivityTrendAnalysis> {
    try {
      const analyticsData = await this.analyticsService.getAnalyticsData(userId, 'monthly');
      
      const avgDeepWork = analyticsData.deep_work_trend.reduce((sum, h) => sum + h, 0) / analyticsData.deep_work_trend.length;
      const avgFocusQuality = analyticsData.productivity_pattern.focus_quality_trend.reduce((sum, q) => sum + q, 0) / analyticsData.productivity_pattern.focus_quality_trend.length;
      
      return {
        monthly_productivity_score: Math.round(analyticsData.consistency_score),
        productivity_trend: analyticsData.consistency_score > 70 ? 'improving' : 
                          analyticsData.consistency_score < 50 ? 'declining' : 'stable',
        deep_work_evolution: {
          average_daily_hours: Math.round(avgDeepWork * 10) / 10,
          quality_improvement: 15, // Would be calculated from historical data
          session_length_optimization: 20,
          distraction_resistance: 75
        },
        focus_quality_evolution: {
          average_focus_score: Math.round(avgFocusQuality),
          attention_span_improvement: 10,
          distraction_frequency_change: -15,
          focus_consistency: 80
        },
        energy_management_evolution: {
          energy_awareness_score: 75,
          peak_utilization_efficiency: 70,
          recovery_optimization: 65,
          energy_consistency: 80
        }
      };
    } catch (error) {
      logger.error('Error analyzing productivity trends:', error);
      return {
        monthly_productivity_score: 50,
        productivity_trend: 'stable',
        deep_work_evolution: {
          average_daily_hours: 0,
          quality_improvement: 0,
          session_length_optimization: 0,
          distraction_resistance: 0
        },
        focus_quality_evolution: {
          average_focus_score: 0,
          attention_span_improvement: 0,
          distraction_frequency_change: 0,
          focus_consistency: 0
        },
        energy_management_evolution: {
          energy_awareness_score: 0,
          peak_utilization_efficiency: 0,
          recovery_optimization: 0,
          energy_consistency: 0
        }
      };
    }
  }

  private async generateBehavioralPatternInsights(userId: string, startDate: Date, endDate: Date): Promise<BehavioralPatternInsight[]> {
    try {
      const insights: BehavioralPatternInsight[] = [];
      const behavioralData = await this.profileService.getBehavioralAnalytics(userId, 30);
      
      // Analyze motivation patterns
      const motivationInsight = this.analyzeBehavioralMotivationPatterns(behavioralData);
      if (motivationInsight) {
        insights.push(motivationInsight);
      }

      // Analyze obstacle patterns
      const obstacleInsight = this.analyzeBehavioralObstaclePatterns(behavioralData);
      if (obstacleInsight) {
        insights.push(obstacleInsight);
      }

      return insights;
    } catch (error) {
      logger.error('Error generating behavioral pattern insights:', error);
      return [];
    }
  }

  private async generateSystematicAdjustments(userId: string, startDate: Date, endDate: Date): Promise<SystematicAdjustment[]> {
    try {
      return await this.generateSystematicAdjustmentSuggestions(userId);
    } catch (error) {
      logger.error('Error generating systematic adjustments:', error);
      return [];
    }
  }

  private async createIdentityReinforcementPlan(userId: string, startDate: Date, endDate: Date): Promise<IdentityReinforcementPlan> {
    try {
      const profile = await this.profileService.getProfile(userId);
      const targetIdentity = profile?.profile?.target_identity || 'disciplined student';
      const identityAlignment = await this.analyticsService.calculateIdentityAlignment(userId, { start: startDate, end: endDate });
      
      const identityBehaviors: IdentityBehaviorPlan[] = [
        {
          behavior_name: 'Daily habit completion',
          current_consistency: 70,
          target_consistency: 85,
          reinforcement_strategies: [
            'Celebrate small wins as identity evidence',
            'Use identity-based language in self-talk',
            'Track identity-aligned actions daily'
          ],
          identity_connection: `Every completed habit is proof that you are a ${targetIdentity}`
        }
      ];

      return {
        target_identity: targetIdentity,
        current_alignment_score: identityAlignment,
        identity_behaviors_to_strengthen: identityBehaviors,
        identity_narratives: [
          `I am a ${targetIdentity} who shows up consistently`,
          `My daily actions reflect my commitment to growth`,
          `I choose discipline over convenience`
        ],
        monthly_identity_goals: [
          `Strengthen ${targetIdentity} identity through consistent daily actions`,
          'Increase identity alignment score by 10 points',
          'Develop stronger identity-based decision making'
        ]
      };
    } catch (error) {
      logger.error('Error creating identity reinforcement plan:', error);
      return {
        target_identity: 'disciplined student',
        current_alignment_score: 50,
        identity_behaviors_to_strengthen: [],
        identity_narratives: [],
        monthly_identity_goals: []
      };
    }
  }

  private generateMonthlyGoals(
    longTermProgress: LongTermGoalProgress[],
    identityPlan: IdentityReinforcementPlan,
    systematicAdjustments: SystematicAdjustment[],
    reflections: string[]
  ): string[] {
    const goals: string[] = [];

    // Goals from long-term progress
    longTermProgress.forEach(progress => {
      if (progress.trajectory === 'behind' || progress.trajectory === 'stalled') {
        goals.push(`Accelerate progress on: ${progress.goal_description}`);
      }
    });

    // Goals from identity reinforcement
    goals.push(...identityPlan.monthly_identity_goals);

    // Goals from systematic adjustments
    systematicAdjustments.forEach(adjustment => {
      goals.push(`System improvement: ${adjustment.proposed_adjustment}`);
    });

    // Add reflection-based goals
    reflections.forEach(reflection => {
      goals.push(`Reflection goal: ${reflection}`);
    });

    return goals.slice(0, 6); // Limit to 6 goals
  }

  // Utility methods

  private identifyConsistencyFactors(consistencyScore: any): string[] {
    const factors: string[] = [];
    
    if (consistencyScore.overall_score > 70) {
      factors.push('Strong habit foundation');
      factors.push('Effective routine structure');
    } else {
      factors.push('Need for routine simplification');
      factors.push('Focus on core habits');
    }

    return factors;
  }

  private countTaskOccurrences(tasks: string[]): Record<string, number> {
    return tasks.reduce((counts, task) => {
      counts[task] = (counts[task] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private analyzeProductivityTrend(completionRates: number[]): any {
    if (completionRates.length === 0) return null;

    const avgRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    const trend = completionRates[completionRates.length - 1] > completionRates[0] ? 'improving' : 'declining';

    return {
      description: `Task completion rate ${trend} with average of ${avgRate.toFixed(1)}%`,
      frequency: completionRates.length,
      impact: avgRate > 70 ? 'high' : avgRate > 50 ? 'medium' : 'low',
      correlation: 0.8,
      insights: [
        trend === 'improving' ? 'Continue current approach' : 'Consider routine simplification',
        'Focus on consistency over perfection'
      ]
    };
  }

  private analyzeEnergyPattern(energyPatterns: any[]): any {
    if (energyPatterns.length === 0) return null;

    const bestPeriod = energyPatterns.reduce((best, current) => 
      current.productivity_correlation > best.productivity_correlation ? current : best
    );

    return {
      description: `Peak productivity during ${bestPeriod.time_period} with ${bestPeriod.average_energy}/10 energy`,
      frequency: energyPatterns.length,
      impact: 'high',
      correlation: bestPeriod.productivity_correlation,
      insights: [
        `Schedule important work during ${bestPeriod.time_period}`,
        'Protect peak energy periods from low-value activities'
      ]
    };
  }

  private async applySystemAdjustments(userId: string, adjustments: SystemAdjustment[]): Promise<void> {
    try {
      // Track adjustments as behavioral events for future analysis
      for (const adjustment of adjustments) {
        await this.profileService.trackBehavioralEvent(
          userId,
          'system_adjustment_applied',
          {
            adjustment_type: adjustment.adjustment_type,
            reason: adjustment.reason,
            expected_impact: adjustment.expected_impact,
            priority: adjustment.implementation_priority
          },
          { source: 'weekly_review' }
        );
      }
    } catch (error) {
      logger.error('Error applying system adjustments:', error);
    }
  }

  private async applySystematicAdjustments(userId: string, adjustments: SystematicAdjustment[]): Promise<void> {
    try {
      // Track systematic adjustments as behavioral events
      for (const adjustment of adjustments) {
        await this.profileService.trackBehavioralEvent(
          userId,
          'systematic_adjustment_applied',
          {
            category: adjustment.adjustment_category,
            current_approach: adjustment.current_approach,
            proposed_adjustment: adjustment.proposed_adjustment,
            rationale: adjustment.rationale
          },
          { source: 'monthly_review' }
        );
      }
    } catch (error) {
      logger.error('Error applying systematic adjustments:', error);
    }
  }

  // Placeholder methods for complex analysis - would be fully implemented with real data
  private analyzeLongTermProductivityPattern(monthlyReviews: MonthlyReview[]): IdentifiedPattern | null {
    if (monthlyReviews.length < 2) return null;
    
    return {
      pattern_type: 'productivity',
      pattern_description: 'Consistent productivity improvement over time',
      frequency: monthlyReviews.length,
      impact_level: 'high',
      correlation_strength: 0.8,
      actionable_insights: ['Maintain current trajectory', 'Consider gradual complexity increase']
    };
  }

  private analyzeLongTermHabitFormationPattern(monthlyReviews: MonthlyReview[]): IdentifiedPattern | null {
    if (monthlyReviews.length < 2) return null;
    
    return {
      pattern_type: 'behavioral',
      pattern_description: 'Strong habit formation and maintenance patterns',
      frequency: monthlyReviews.length,
      impact_level: 'high',
      correlation_strength: 0.9,
      actionable_insights: ['Use successful patterns for new habits', 'Focus on habit stacking']
    };
  }

  private analyzeLongTermEnergyPattern(weeklyReviews: WeeklyReview[]): IdentifiedPattern | null {
    if (weeklyReviews.length < 4) return null;
    
    return {
      pattern_type: 'energy',
      pattern_description: 'Consistent energy management and optimization',
      frequency: weeklyReviews.length,
      impact_level: 'medium',
      correlation_strength: 0.7,
      actionable_insights: ['Continue energy-based scheduling', 'Optimize recovery periods']
    };
  }

  private analyzeLongTermBehavioralPattern(monthlyReviews: MonthlyReview[]): IdentifiedPattern | null {
    if (monthlyReviews.length < 2) return null;
    
    return {
      pattern_type: 'behavioral',
      pattern_description: 'Evolving behavioral patterns showing increased self-awareness',
      frequency: monthlyReviews.length,
      impact_level: 'high',
      correlation_strength: 0.8,
      actionable_insights: ['Leverage self-awareness for better decisions', 'Continue pattern tracking']
    };
  }

  // Additional placeholder methods for comprehensive analysis
  private analyzeSystemDesignEffectiveness(patterns: IdentifiedPattern[], monthlyReview: MonthlyReview, weeklyReviews: WeeklyReview[]): SystematicAdjustment | null {
    return {
      adjustment_category: 'system_design',
      current_approach: 'Current discipline system structure',
      proposed_adjustment: 'Optimize system based on identified patterns',
      rationale: 'Long-term patterns indicate opportunities for system refinement',
      expected_outcomes: ['Improved system effectiveness', 'Better user engagement'],
      implementation_timeline: '2-3 weeks'
    };
  }

  private analyzeHabitArchitectureOptimization(patterns: IdentifiedPattern[], monthlyReview: MonthlyReview): SystematicAdjustment | null {
    return {
      adjustment_category: 'habit_architecture',
      current_approach: 'Individual habit tracking',
      proposed_adjustment: 'Implement advanced habit stacking and chaining',
      rationale: 'Strong foundation habits can support more complex behavioral chains',
      expected_outcomes: ['Increased habit consistency', 'More efficient habit formation'],
      implementation_timeline: '3-4 weeks'
    };
  }

  private analyzeRoutineStructureOptimization(weeklyReviews: WeeklyReview[]): SystematicAdjustment | null {
    return {
      adjustment_category: 'routine_structure',
      current_approach: 'Daily routine generation',
      proposed_adjustment: 'Implement adaptive routine complexity based on performance',
      rationale: 'Weekly patterns show opportunities for better routine adaptation',
      expected_outcomes: ['Higher completion rates', 'Better routine satisfaction'],
      implementation_timeline: '1-2 weeks'
    };
  }

  private analyzeFeedbackLoopOptimization(patterns: IdentifiedPattern[], monthlyReview: MonthlyReview): SystematicAdjustment | null {
    return {
      adjustment_category: 'feedback_loops',
      current_approach: 'Evening review feedback',
      proposed_adjustment: 'Implement real-time feedback and micro-adjustments',
      rationale: 'Patterns indicate need for more immediate feedback mechanisms',
      expected_outcomes: ['Faster adaptation', 'Better real-time decision making'],
      implementation_timeline: '2-3 weeks'
    };
  }

  private analyzeHabitsFormed(monthlyReviews: MonthlyReview[], currentHabits: any[]): HabitFormationData[] {
    // Simplified implementation - would analyze actual habit creation and consistency data
    return currentHabits.slice(0, 2).map(habit => ({
      habit_name: habit.name,
      formation_start_date: habit.created_at,
      days_to_consistency: 21,
      current_streak: 15,
      formation_challenges: ['Initial resistance', 'Time management']
    }));
  }

  private analyzeHabitsAbandoned(monthlyReviews: MonthlyReview[]): HabitAbandonmentData[] {
    // Simplified implementation - would analyze actual abandonment data
    return [{
      habit_name: 'Example abandoned habit',
      abandonment_date: new Date(),
      days_attempted: 10,
      abandonment_reasons: ['Too complex', 'Poor timing'],
      lessons_learned: ['Start smaller', 'Better scheduling needed']
    }];
  }

  private analyzeHabitsEvolved(monthlyReviews: MonthlyReview[]): HabitEvolutionData[] {
    // Simplified implementation - would analyze actual evolution data
    return [{
      habit_name: 'Morning routine',
      original_form: '30-minute morning routine',
      evolved_form: '15-minute focused morning routine',
      evolution_date: new Date(),
      evolution_reason: 'Time constraints and effectiveness optimization',
      effectiveness_change: 20
    }];
  }

  private identifyEvolutionPatterns(evolved: HabitEvolutionData[], formed: HabitFormationData[]): EvolutionPattern[] {
    return [{
      pattern_name: 'Simplification for sustainability',
      pattern_description: 'Habits tend to evolve toward simpler, more sustainable forms',
      frequency: evolved.length,
      success_correlation: 0.8
    }];
  }

  private analyzeBehavioralMotivationPatterns(behavioralData: any[]): BehavioralPatternInsight | null {
    return {
      insight_category: 'motivation',
      insight_description: 'Motivation patterns show strong correlation with identity-based rewards',
      pattern_strength: 0.8,
      behavioral_correlation: 0.7,
      actionable_recommendations: [
        'Continue using identity-based motivation',
        'Strengthen connection between actions and identity'
      ]
    };
  }

  private analyzeBehavioralObstaclePatterns(behavioralData: any[]): BehavioralPatternInsight | null {
    return {
      insight_category: 'obstacles',
      insight_description: 'Primary obstacles are time management and energy depletion',
      pattern_strength: 0.7,
      behavioral_correlation: 0.6,
      actionable_recommendations: [
        'Implement better time blocking',
        'Focus on energy management strategies'
      ]
    };
  }
}