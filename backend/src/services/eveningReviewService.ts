import pool from '../config/database';
import { 
  EveningReview, 
  CreateEveningReviewRequest,
  EveningReviewResponse,
  RoutineAdaptation,
  PerformanceInsight,
  ReviewAnalysis,
  EnergyPattern,
  MoodTrend,
  ReviewBasedRoutineAdjustment,
  ReviewHistoryResponse,
  UpdateEveningReviewRequest
} from '../types/eveningReview';
import { PerformanceData } from '../types/routine';
import { ProfileService } from './profileService';
import { RoutineService } from './routineService';
import { logger } from '../utils/logger';

export class EveningReviewService {
  private profileService: ProfileService;
  // Lazy-loaded to avoid circular dependency
  private _routineService?: any;

  constructor() {
    this.profileService = new ProfileService();
  }

  // Lazy load RoutineService only when needed
  private async getRoutineService() {
    if (!this._routineService) {
      const { RoutineService } = await import('./routineService');
      this._routineService = new RoutineService();
    }
    return this._routineService;
  }

  async createEveningReview(userId: string, request: CreateEveningReviewRequest): Promise<EveningReviewResponse> {
    try {
      logger.info('Creating evening review - start', { userId, request });

      // Validate input
      this.validateReviewRequest(request);
      logger.info('Validation passed');

      // Check if review already exists for this date
      const existingReview = await this.getReviewByDate(userId, new Date(request.date));
      if (existingReview) {
        throw new Error('Evening review already exists for this date');
      }
      logger.info('No existing review found');

      // Create the review
      const review = await this.saveReview(userId, request);
      logger.info('Review saved successfully', { reviewId: review.id });

      // Return minimal response to avoid dependency issues
      const routineAdaptations: RoutineAdaptation[] = [];
      const performanceInsights: PerformanceInsight[] = [];

      logger.info('Evening review created successfully', { 
        userId, 
        date: request.date,
        reviewId: review.id
      });

      return {
        review,
        routine_adaptations: routineAdaptations,
        performance_insights: performanceInsights
      };
    } catch (error) {
      logger.error('Error creating evening review:', error);
      throw error; // Re-throw the original error for better debugging
    }
  }

  async getReviewByDate(userId: string, date: Date): Promise<EveningReview | null> {
    const query = 'SELECT * FROM evening_reviews WHERE user_id = $1 AND date = $2';
    
    try {
      const result = await pool.query(query, [userId, date.toISOString().split('T')[0]]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching review by date:', error);
      throw new Error('Failed to fetch evening review');
    }
  }

  async updateEveningReview(userId: string, reviewId: string, update: UpdateEveningReviewRequest): Promise<EveningReview> {
    try {
      // Get existing review
      const existingReview = await this.getReviewById(reviewId);
      if (!existingReview || existingReview.user_id !== userId) {
        throw new Error('Review not found or access denied');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (update.accomplished !== undefined) {
        updateFields.push(`accomplished = $${paramIndex++}`);
        updateValues.push(update.accomplished);
      }
      if (update.missed !== undefined) {
        updateFields.push(`missed = $${paramIndex++}`);
        updateValues.push(update.missed);
      }
      if (update.reasons !== undefined) {
        updateFields.push(`reasons = $${paramIndex++}`);
        updateValues.push(update.reasons);
      }
      if (update.tomorrow_tasks !== undefined) {
        updateFields.push(`tomorrow_tasks = $${paramIndex++}`);
        updateValues.push(update.tomorrow_tasks);
      }
      if (update.mood !== undefined) {
        updateFields.push(`mood = $${paramIndex++}`);
        updateValues.push(update.mood);
      }
      if (update.energy_level !== undefined) {
        updateFields.push(`energy_level = $${paramIndex++}`);
        updateValues.push(update.energy_level);
      }
      if (update.insights !== undefined) {
        updateFields.push(`insights = $${paramIndex++}`);
        updateValues.push(update.insights);
      }

      if (updateFields.length === 0) {
        return existingReview;
      }

      const query = `
        UPDATE evening_reviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      updateValues.push(reviewId, userId);
      const result = await pool.query(query, updateValues);

      const updatedReview = this.formatReviewFromDb(result.rows[0]);

      // Re-analyze for routine adaptations if significant changes
      if (update.missed || update.reasons || update.energy_level || update.mood) {
        const routineAdaptations = await this.analyzeForRoutineAdaptations(userId, updatedReview);
        await this.applyRoutineAdaptations(userId, routineAdaptations, updatedReview.date);
      }

      logger.info('Evening review updated successfully', { userId, reviewId });
      return updatedReview;
    } catch (error) {
      logger.error('Error updating evening review:', error);
      throw new Error('Failed to update evening review');
    }
  }

  async getReviewHistory(userId: string, days: number = 30): Promise<ReviewHistoryResponse> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const query = `
        SELECT * FROM evening_reviews 
        WHERE user_id = $1 AND date >= $2 AND date <= $3
        ORDER BY date DESC
      `;

      const result = await pool.query(query, [
        userId, 
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]);

      const reviews = result.rows.map(row => this.formatReviewFromDb(row));
      const analysis = await this.analyzeReviewHistory(reviews);

      return {
        reviews,
        analysis,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        total_reviews: reviews.length
      };
    } catch (error) {
      logger.error('Error getting review history:', error);
      throw new Error('Failed to get review history');
    }
  }

  private async saveReview(userId: string, request: CreateEveningReviewRequest): Promise<EveningReview> {
    logger.info('Saving review to database', { userId, request });

    const query = `
      INSERT INTO evening_reviews (
        user_id, date, accomplished, missed, reasons, 
        tomorrow_tasks, mood, energy_level, insights
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const queryParams = [
        userId,
        request.date,
        request.accomplished,
        request.missed,
        request.reasons,
        request.tomorrow_tasks,
        request.mood,
        request.energy_level,
        request.insights
      ];

      logger.info('Executing database query', { query, params: queryParams });

      const result = await pool.query(query, queryParams);

      logger.info('Database query successful', { result: result.rows[0] });

      if (!result.rows[0]) {
        throw new Error('Failed to create evening review - no data returned from database');
      }

      return this.formatReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error saving evening review to database:', error);
      throw error; // Re-throw the original error
    }
  }

  private async analyzeForRoutineAdaptations(userId: string, review: EveningReview): Promise<RoutineAdaptation[]> {
    const adaptations: RoutineAdaptation[] = [];

    try {
      // Get recent performance data
      const recentReviews = await this.getRecentReviews(userId, 7);
      const performanceData = this.calculatePerformanceFromReviews(recentReviews);

      // Analyze missed tasks patterns
      if (review.missed.length > 0) {
        const missedTasksAdaptation = this.analyzeMissedTasks(review.missed, review.reasons);
        if (missedTasksAdaptation) {
          adaptations.push(missedTasksAdaptation);
        }
      }

      // Analyze energy patterns
      if (review.energy_level <= 3) {
        adaptations.push({
          type: 'simplify',
          description: 'Reduce routine complexity due to low energy levels',
          reason: `Energy level reported as ${review.energy_level}/10`,
          impact_score: 0.8
        });
      }

      // Analyze mood impact
      if (review.mood <= 4) {
        adaptations.push({
          type: 'adjust_timing',
          description: 'Shift challenging tasks to higher energy periods',
          reason: `Low mood (${review.mood}/10) may affect task completion`,
          impact_score: 0.6
        });
      }

      // Analyze completion patterns
      const completionRate = review.accomplished.length / (review.accomplished.length + review.missed.length);
      if (completionRate < 0.5) {
        adaptations.push({
          type: 'simplify',
          description: 'Reduce number of daily tasks to improve completion rate',
          reason: `Low completion rate: ${Math.round(completionRate * 100)}%`,
          impact_score: 0.9
        });
      } else if (completionRate > 0.9 && review.energy_level >= 7) {
        adaptations.push({
          type: 'increase_complexity',
          description: 'Increase routine challenge based on high performance',
          reason: `High completion rate (${Math.round(completionRate * 100)}%) and good energy`,
          impact_score: 0.7
        });
      }

      // Analyze insights for specific adaptations
      if (review.insights) {
        const insightAdaptations = this.analyzeInsightsForAdaptations(review.insights);
        adaptations.push(...insightAdaptations);
      }

      return adaptations;
    } catch (error) {
      logger.error('Error analyzing for routine adaptations:', error);
      return [];
    }
  }

  private async generatePerformanceInsights(userId: string, review: EveningReview): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    try {
      // Get historical data for trend analysis
      const recentReviews = await this.getRecentReviews(userId, 14);
      
      // Productivity insights
      const productivityTrend = this.analyzeProductivityTrend(recentReviews);
      insights.push({
        category: 'productivity',
        insight: `Your task completion rate is ${productivityTrend.current_rate}%`,
        trend: productivityTrend.trend,
        recommendation: this.getProductivityRecommendation(productivityTrend)
      });

      // Energy insights
      const energyTrend = this.analyzeEnergyTrend(recentReviews);
      insights.push({
        category: 'energy',
        insight: `Your average energy level is ${energyTrend.average}/10`,
        trend: energyTrend.trend,
        recommendation: this.getEnergyRecommendation(energyTrend)
      });

      // Mood insights
      const moodTrend = this.analyzeMoodTrend(recentReviews);
      insights.push({
        category: 'mood',
        insight: `Your mood has been ${moodTrend.description} recently`,
        trend: moodTrend.trend,
        recommendation: this.getMoodRecommendation(moodTrend)
      });

      // Focus insights based on missed tasks
      if (review.missed.length > 0) {
        insights.push({
          category: 'focus',
          insight: `You missed ${review.missed.length} tasks today`,
          trend: 'declining',
          recommendation: 'Consider breaking large tasks into smaller, manageable chunks'
        });
      }

      return insights;
    } catch (error) {
      logger.error('Error generating performance insights:', error);
      return [];
    }
  }

  private async applyRoutineAdaptations(userId: string, adaptations: RoutineAdaptation[], reviewDate: Date): Promise<void> {
    try {
      if (adaptations.length === 0) {
        return;
      }

      // Calculate tomorrow's date
      const tomorrow = new Date(reviewDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get tomorrow's routine if it exists
      const routineService = await this.getRoutineService();
      const tomorrowRoutine = await routineService.getRoutineByDate(userId, tomorrow);
      
      // If routine doesn't exist yet, store adaptations for when it's generated
      if (!tomorrowRoutine) {
        await this.storeAdaptationsForFutureRoutine(userId, tomorrow, adaptations);
        logger.info('Stored adaptations for future routine', {
          userId,
          date: tomorrow.toISOString().split('T')[0],
          adaptations_count: adaptations.length
        });
        return;
      }

      // Apply adaptations to existing routine
      const adjustments = this.convertAdaptationsToAdjustments(adaptations);
      await this.applyAdjustmentsToRoutine(userId, tomorrowRoutine.id, adjustments);

      logger.info('Routine adaptations applied successfully', { 
        userId, 
        date: tomorrow.toISOString().split('T')[0],
        adaptations_count: adaptations.length
      });
    } catch (error) {
      logger.error('Error applying routine adaptations:', error);
      // Don't throw error for adaptation failures
    }
  }

  private async analyzeReviewHistory(reviews: EveningReview[]): Promise<ReviewAnalysis> {
    if (reviews.length === 0) {
      return {
        completion_rate: 0,
        common_obstacles: [],
        energy_patterns: [],
        mood_trends: [],
        productivity_insights: []
      };
    }

    // Calculate completion rate
    const totalTasks = reviews.reduce((sum, review) => 
      sum + review.accomplished.length + review.missed.length, 0);
    const completedTasks = reviews.reduce((sum, review) => 
      sum + review.accomplished.length, 0);
    const completion_rate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Identify common obstacles
    const allReasons = reviews.flatMap(review => review.reasons);
    const reasonCounts = this.countOccurrences(allReasons);
    const common_obstacles = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason]) => reason);

    // Analyze energy patterns
    const energy_patterns = this.analyzeEnergyPatterns(reviews);

    // Analyze mood trends
    const mood_trends = this.analyzeMoodTrends(reviews);

    // Generate productivity insights
    const productivity_insights = this.generateProductivityInsights(reviews, completion_rate);

    return {
      completion_rate,
      common_obstacles,
      energy_patterns,
      mood_trends,
      productivity_insights
    };
  }

  private validateReviewRequest(request: CreateEveningReviewRequest): void {
    logger.info('Validating review request', { request });

    if (!request.date || !this.isValidDate(request.date)) {
      throw new Error('Valid date is required (YYYY-MM-DD format)');
    }

    if (!Array.isArray(request.accomplished)) {
      throw new Error('Accomplished tasks must be an array');
    }

    if (!Array.isArray(request.missed)) {
      throw new Error('Missed tasks must be an array');
    }

    if (!Array.isArray(request.reasons)) {
      throw new Error('Reasons must be an array');
    }

    if (!Array.isArray(request.tomorrow_tasks)) {
      throw new Error('Tomorrow tasks must be an array');
    }

    if (typeof request.mood !== 'number' || request.mood < 1 || request.mood > 10) {
      throw new Error('Mood must be a number between 1 and 10');
    }

    if (typeof request.energy_level !== 'number' || request.energy_level < 1 || request.energy_level > 10) {
      throw new Error('Energy level must be a number between 1 and 10');
    }

    if (typeof request.insights !== 'string') {
      throw new Error('Insights must be a string');
    }

    logger.info('Validation passed');
  }

  private formatReviewFromDb(row: any): EveningReview {
    if (!row) {
      throw new Error('Cannot format review: row is null or undefined');
    }

    if (!row.id) {
      logger.error('Database row missing id field', { row });
      throw new Error('Database row missing required id field');
    }

    return {
      id: row.id,
      user_id: row.user_id,
      date: new Date(row.date),
      accomplished: row.accomplished || [],
      missed: row.missed || [],
      reasons: row.reasons || [],
      tomorrow_tasks: row.tomorrow_tasks || [],
      mood: row.mood,
      energy_level: row.energy_level,
      insights: row.insights || '',
      created_at: row.created_at
    };
  }

  private async getReviewById(reviewId: string): Promise<EveningReview | null> {
    const query = 'SELECT * FROM evening_reviews WHERE id = $1';
    
    try {
      const result = await pool.query(query, [reviewId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatReviewFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching review by ID:', error);
      throw new Error('Failed to fetch evening review');
    }
  }

  private async getRecentReviews(userId: string, days: number): Promise<EveningReview[]> {
    const query = `
      SELECT * FROM evening_reviews 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.map(row => this.formatReviewFromDb(row));
    } catch (error) {
      logger.error('Error fetching recent reviews:', error);
      return [];
    }
  }

  private calculatePerformanceFromReviews(reviews: EveningReview[]): PerformanceData {
    if (reviews.length === 0) {
      return {
        completion_rate: 0,
        consistency_score: 0,
        recent_failures: 0,
        recent_successes: 0,
        average_focus_quality: 0.5,
        preferred_activity_types: []
      };
    }

    const totalTasks = reviews.reduce((sum, review) => 
      sum + review.accomplished.length + review.missed.length, 0);
    const completedTasks = reviews.reduce((sum, review) => 
      sum + review.accomplished.length, 0);

    return {
      completion_rate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      consistency_score: reviews.length > 0 ? completedTasks / reviews.length : 0,
      recent_failures: reviews.reduce((sum, review) => sum + review.missed.length, 0),
      recent_successes: completedTasks,
      average_focus_quality: reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.energy_level, 0) / (reviews.length * 10) : 0,
      preferred_activity_types: this.extractPreferredActivities(reviews)
    };
  }

  private analyzeMissedTasks(missedTasks: string[], reasons: string[]): RoutineAdaptation | null {
    if (missedTasks.length === 0) {
      return null;
    }

    // Analyze common patterns in missed tasks
    const hasTimeRelatedReasons = reasons.some(reason => 
      reason.toLowerCase().includes('time') || 
      reason.toLowerCase().includes('busy') ||
      reason.toLowerCase().includes('schedule')
    );

    const hasEnergyRelatedReasons = reasons.some(reason =>
      reason.toLowerCase().includes('tired') ||
      reason.toLowerCase().includes('energy') ||
      reason.toLowerCase().includes('exhausted')
    );

    if (hasTimeRelatedReasons) {
      return {
        type: 'adjust_timing',
        description: 'Redistribute tasks to better align with available time',
        reason: 'Time-related obstacles identified in missed tasks',
        impact_score: 0.7
      };
    }

    if (hasEnergyRelatedReasons) {
      return {
        type: 'simplify',
        description: 'Reduce task complexity to match energy levels',
        reason: 'Energy-related obstacles identified in missed tasks',
        impact_score: 0.8
      };
    }

    return {
      type: 'simplify',
      description: 'Reduce number of tasks to improve completion rate',
      reason: `${missedTasks.length} tasks missed without clear pattern`,
      impact_score: 0.6
    };
  }

  private analyzeInsightsForAdaptations(insights: string): RoutineAdaptation[] {
    const adaptations: RoutineAdaptation[] = [];
    const lowerInsights = insights.toLowerCase();

    if (lowerInsights.includes('overwhelmed') || lowerInsights.includes('too much')) {
      adaptations.push({
        type: 'simplify',
        description: 'Reduce routine complexity based on user feedback',
        reason: 'User reported feeling overwhelmed',
        impact_score: 0.9
      });
    }

    if (lowerInsights.includes('morning') && lowerInsights.includes('difficult')) {
      adaptations.push({
        type: 'adjust_timing',
        description: 'Move challenging tasks away from morning hours',
        reason: 'User reported morning difficulties',
        impact_score: 0.7
      });
    }

    if (lowerInsights.includes('easy') || lowerInsights.includes('too simple')) {
      adaptations.push({
        type: 'increase_complexity',
        description: 'Increase routine challenge based on user feedback',
        reason: 'User indicated current routine is too easy',
        impact_score: 0.8
      });
    }

    return adaptations;
  }

  private analyzeProductivityTrend(reviews: EveningReview[]): any {
    if (reviews.length === 0) {
      return { current_rate: 0, trend: 'stable' };
    }

    const recentRate = this.calculateCompletionRate(reviews.slice(0, 3));
    const olderRate = this.calculateCompletionRate(reviews.slice(3, 6));

    return {
      current_rate: Math.round(recentRate * 100),
      trend: recentRate > olderRate ? 'improving' : recentRate < olderRate ? 'declining' : 'stable'
    };
  }

  private analyzeEnergyTrend(reviews: EveningReview[]): any {
    if (reviews.length === 0) {
      return { average: 5, trend: 'stable' };
    }

    const recentAvg = reviews.slice(0, 3).reduce((sum, r) => sum + r.energy_level, 0) / Math.min(3, reviews.length);
    const olderAvg = reviews.slice(3, 6).reduce((sum, r) => sum + r.energy_level, 0) / Math.max(1, reviews.slice(3, 6).length);

    return {
      average: Math.round(recentAvg * 10) / 10,
      trend: recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable'
    };
  }

  private analyzeMoodTrend(reviews: EveningReview[]): any {
    if (reviews.length === 0) {
      return { description: 'stable', trend: 'stable' };
    }

    const avgMood = reviews.reduce((sum, r) => sum + r.mood, 0) / reviews.length;
    const description = avgMood >= 7 ? 'positive' : avgMood >= 4 ? 'neutral' : 'challenging';

    const recentAvg = reviews.slice(0, 3).reduce((sum, r) => sum + r.mood, 0) / Math.min(3, reviews.length);
    const olderAvg = reviews.slice(3, 6).reduce((sum, r) => sum + r.mood, 0) / Math.max(1, reviews.slice(3, 6).length);

    return {
      description,
      trend: recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable'
    };
  }

  private getProductivityRecommendation(trend: any): string {
    if (trend.current_rate < 50) {
      return 'Consider simplifying your daily routine to improve completion rates';
    }
    if (trend.current_rate > 90 && trend.trend === 'improving') {
      return 'You\'re doing great! Consider gradually increasing your routine complexity';
    }
    if (trend.trend === 'declining') {
      return 'Focus on identifying and removing obstacles that prevent task completion';
    }
    return 'Maintain your current approach - your productivity is stable';
  }

  private getEnergyRecommendation(trend: any): string {
    if (trend.average < 4) {
      return 'Focus on sleep, nutrition, and stress management to improve energy levels';
    }
    if (trend.trend === 'declining') {
      return 'Consider adjusting your routine to better match your natural energy patterns';
    }
    return 'Your energy levels are good - continue your current habits';
  }

  private getMoodRecommendation(trend: any): string {
    if (trend.description === 'challenging') {
      return 'Consider incorporating more enjoyable activities and self-care into your routine';
    }
    if (trend.trend === 'declining') {
      return 'Pay attention to activities that boost your mood and include more of them';
    }
    return 'Your mood is stable - keep doing what works for you';
  }

  private async storeAdaptationsForFutureRoutine(userId: string, date: Date, adaptations: RoutineAdaptation[]): Promise<void> {
    // Store adaptations in behavioral analytics for future routine generation
    await this.profileService.trackBehavioralEvent(
      userId,
      'routine_adaptations_pending',
      { adaptations },
      { target_date: date.toISOString().split('T')[0] }
    );
  }

  private convertAdaptationsToAdjustments(adaptations: RoutineAdaptation[]): ReviewBasedRoutineAdjustment[] {
    return adaptations.map(adaptation => ({
      adjustment_type: this.mapAdaptationTypeToAdjustment(adaptation.type),
      target_segments: [], // Would be determined based on routine analysis
      adjustment_value: adaptation.impact_score,
      reason: adaptation.reason,
      expected_impact: adaptation.description
    }));
  }

  private mapAdaptationTypeToAdjustment(type: RoutineAdaptation['type']): ReviewBasedRoutineAdjustment['adjustment_type'] {
    switch (type) {
      case 'simplify':
        return 'task_reduction';
      case 'increase_complexity':
        return 'complexity_change';
      case 'adjust_timing':
        return 'timing_shift';
      case 'change_focus':
        return 'complexity_change';
      default:
        return 'task_reduction';
    }
  }

  private async applyAdjustmentsToRoutine(userId: string, routineId: string, adjustments: ReviewBasedRoutineAdjustment[]): Promise<void> {
    // This would integrate with the routine service to modify existing routines
    // For now, we'll track the adjustments as behavioral events
    for (const adjustment of adjustments) {
      await this.profileService.trackBehavioralEvent(
        userId,
        'routine_adjustment_applied',
        adjustment,
        { routine_id: routineId }
      );
    }
  }

  private analyzeEnergyPatterns(reviews: EveningReview[]): EnergyPattern[] {
    // Group reviews by time periods and analyze energy trends
    const patterns: EnergyPattern[] = [];
    
    // Weekly pattern
    const weeklyEnergy = reviews.reduce((sum, review) => sum + review.energy_level, 0) / reviews.length;
    patterns.push({
      time_period: 'weekly',
      average_energy: Math.round(weeklyEnergy * 10) / 10,
      trend: 'stable' // Would calculate actual trend
    });

    return patterns;
  }

  private analyzeMoodTrends(reviews: EveningReview[]): MoodTrend[] {
    const trends: MoodTrend[] = [];
    
    const weeklyMood = reviews.reduce((sum, review) => sum + review.mood, 0) / reviews.length;
    trends.push({
      period: 'weekly',
      average_mood: Math.round(weeklyMood * 10) / 10,
      correlation_with_productivity: 0.7 // Would calculate actual correlation
    });

    return trends;
  }

  private generateProductivityInsights(reviews: EveningReview[], completionRate: number): string[] {
    const insights: string[] = [];

    if (completionRate > 0.8) {
      insights.push('You have excellent task completion consistency');
    } else if (completionRate < 0.5) {
      insights.push('Consider reducing daily task load to improve completion rates');
    }

    const avgMood = reviews.reduce((sum, r) => sum + r.mood, 0) / reviews.length;
    const avgEnergy = reviews.reduce((sum, r) => sum + r.energy_level, 0) / reviews.length;

    if (avgMood > 7 && avgEnergy > 7) {
      insights.push('Your high mood and energy levels support good productivity');
    }

    return insights;
  }

  private calculateCompletionRate(reviews: EveningReview[]): number {
    if (reviews.length === 0) return 0;
    
    const totalTasks = reviews.reduce((sum, review) => 
      sum + review.accomplished.length + review.missed.length, 0);
    const completedTasks = reviews.reduce((sum, review) => 
      sum + review.accomplished.length, 0);
    
    return totalTasks > 0 ? completedTasks / totalTasks : 0;
  }

  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private extractPreferredActivities(reviews: EveningReview[]): string[] {
    // Extract activity types from accomplished tasks
    const accomplishedTasks = reviews.flatMap(review => review.accomplished);
    const activityCounts = this.countOccurrences(accomplishedTasks);
    
    return Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([activity]) => activity);
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}