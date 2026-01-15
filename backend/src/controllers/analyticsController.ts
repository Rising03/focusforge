import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // Get comprehensive analytics dashboard data
  getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'weekly';

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!['daily', 'weekly', 'monthly'].includes(period)) {
        res.status(400).json({ error: 'Invalid period. Must be daily, weekly, or monthly' });
        return;
      }

      const analyticsData = await this.analyticsService.getAnalyticsData(userId, period);

      // Calculate additional metrics for compatibility
      const deepWorkHours = analyticsData.deep_work_trend.reduce((sum, hours) => sum + hours, 0);
      const categoryBreakdown = {
        study: Math.max(1, Math.floor(Math.random() * 10)), // Mock data for now
        skill_practice: Math.max(1, Math.floor(Math.random() * 8)),
        deep_work: Math.max(1, Math.floor(Math.random() * 6))
      };

      logger.info('Dashboard analytics retrieved successfully', { 
        userId, 
        period,
        consistency_score: analyticsData.consistency_score,
        identity_alignment: analyticsData.identity_alignment
      });

      res.status(200).json({
        consistencyScore: analyticsData.consistency_score,
        identityAlignment: analyticsData.identity_alignment,
        deepWorkTrend: analyticsData.deep_work_trend,
        habitStreaks: analyticsData.habit_streaks,
        deepWorkHours,
        categoryBreakdown,
        productivityPattern: analyticsData.productivity_pattern,
        ...analyticsData
      });
    } catch (error) {
      logger.error('Error retrieving dashboard analytics:', error);
      res.status(500).json({ error: 'Failed to retrieve dashboard analytics' });
    }
  };

  // Get consistency score breakdown
  getConsistencyScore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dateRange = this.calculateDateRange(days);
      const consistencyScore = await this.analyticsService.calculateConsistencyScore(userId, dateRange);

      res.status(200).json({
        success: true,
        data: {
          consistency_score: consistencyScore,
          period_days: days,
          date_range: dateRange
        }
      });
    } catch (error) {
      logger.error('Error calculating consistency score:', error);
      res.status(500).json({ error: 'Failed to calculate consistency score' });
    }
  };

  // Get identity alignment analysis
  getIdentityAlignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dateRange = this.calculateDateRange(days);
      const identityAlignment = await this.analyticsService.calculateIdentityAlignment(userId, dateRange);

      res.status(200).json({
        success: true,
        data: {
          identity_alignment: identityAlignment,
          period_days: days,
          date_range: dateRange
        }
      });
    } catch (error) {
      logger.error('Error calculating identity alignment:', error);
      res.status(500).json({ error: 'Failed to calculate identity alignment' });
    }
  };

  // Get productivity patterns analysis
  getProductivityPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dateRange = this.calculateDateRange(days);
      const productivityPattern = await this.analyticsService.calculateProductivityPattern(userId, dateRange);

      res.status(200).json({
        success: true,
        productivityPatterns: productivityPattern.daily_completion_rates,
        productivity_pattern: productivityPattern, // Add snake_case for compatibility
        temporalPatterns: [
          {
            timeOfDay: 'morning',
            productivity: 0.8,
            productivityScore: 0.8,
            focusQuality: 0.9
          },
          {
            timeOfDay: 'afternoon', 
            productivity: 0.6,
            productivityScore: 0.6,
            focusQuality: 0.7
          },
          {
            timeOfDay: 'evening',
            productivity: 0.4,
            productivityScore: 0.4,
            focusQuality: 0.5
          }
        ],
        focusQualityTrends: productivityPattern.focus_quality_trend,
        data: {
          productivity_pattern: productivityPattern,
          period_days: days,
          date_range: dateRange
        }
      });
    } catch (error) {
      logger.error('Error analyzing productivity patterns:', error);
      res.status(500).json({ error: 'Failed to analyze productivity patterns' });
    }
  };

  // Get behavioral insights
  getBehavioralInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dateRange = this.calculateDateRange(days);
      const behavioralInsights = await this.analyticsService.generateBehavioralInsights(userId, dateRange);

      res.status(200).json({
        success: true,
        data: {
          insights: behavioralInsights,
          period_days: days,
          date_range: dateRange
        }
      });
    } catch (error) {
      logger.error('Error generating behavioral insights:', error);
      res.status(500).json({ error: 'Failed to generate behavioral insights' });
    }
  };

  // Get personalization metrics
  getPersonalizationMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dateRange = this.calculateDateRange(days);
      const personalizationMetrics = await this.analyticsService.calculatePersonalizationMetrics(userId, dateRange);

      res.status(200).json({
        success: true,
        data: {
          personalization_metrics: personalizationMetrics,
          period_days: days,
          date_range: dateRange
        }
      });
    } catch (error) {
      logger.error('Error calculating personalization metrics:', error);
      res.status(500).json({ error: 'Failed to calculate personalization metrics' });
    }
  };

  // Get performance pattern analysis with recommendations
  getPerformanceAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const performanceAnalysis = await this.analyticsService.analyzePerformancePatterns(userId);

      res.status(200).json({
        success: true,
        data: performanceAnalysis
      });
    } catch (error) {
      logger.error('Error analyzing performance patterns:', error);
      res.status(500).json({ error: 'Failed to analyze performance patterns' });
    }
  };

  // Get deep work trend analysis
  getDeepWorkTrend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const days = parseInt(req.query.days as string) || 30;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const dateRange = this.calculateDateRange(days);
      const deepWorkTrend = await this.analyticsService.calculateDeepWorkTrend(userId, dateRange);

      // Calculate trend statistics
      const avgDeepWork = deepWorkTrend.reduce((sum, hours) => sum + hours, 0) / Math.max(deepWorkTrend.length, 1);
      const recentAvg = deepWorkTrend.slice(-7).reduce((sum, hours) => sum + hours, 0) / Math.max(deepWorkTrend.slice(-7).length, 1);
      const olderAvg = deepWorkTrend.slice(-14, -7).reduce((sum, hours) => sum + hours, 0) / Math.max(deepWorkTrend.slice(-14, -7).length, 1);
      
      const trend = recentAvg > olderAvg + 0.5 ? 'improving' : recentAvg < olderAvg - 0.5 ? 'declining' : 'stable';

      res.status(200).json({
        success: true,
        data: {
          deep_work_trend: deepWorkTrend,
          statistics: {
            average_hours: Math.round(avgDeepWork * 100) / 100,
            recent_average: Math.round(recentAvg * 100) / 100,
            trend,
            total_days: deepWorkTrend.length
          },
          period_days: days,
          date_range: dateRange
        }
      });
    } catch (error) {
      logger.error('Error calculating deep work trend:', error);
      res.status(500).json({ error: 'Failed to calculate deep work trend' });
    }
  };

  // Get habit streaks with analytics
  getHabitStreaksAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const habitStreaks = await this.analyticsService.getHabitStreaks(userId);

      // Calculate analytics
      const totalHabits = habitStreaks.length;
      const strongHabits = habitStreaks.filter(h => h.consistency_percentage > 70).length;
      const strugglingHabits = habitStreaks.filter(h => h.consistency_percentage < 50).length;
      const avgConsistency = totalHabits > 0 
        ? habitStreaks.reduce((sum, h) => sum + h.consistency_percentage, 0) / totalHabits 
        : 0;
      const longestStreak = Math.max(...habitStreaks.map(h => h.current_streak), 0);

      res.status(200).json({
        success: true,
        data: {
          habit_streaks: habitStreaks,
          analytics: {
            total_habits: totalHabits,
            strong_habits: strongHabits,
            struggling_habits: strugglingHabits,
            average_consistency: Math.round(avgConsistency * 10) / 10,
            longest_current_streak: longestStreak
          }
        }
      });
    } catch (error) {
      logger.error('Error getting habit streaks analytics:', error);
      res.status(500).json({ error: 'Failed to get habit streaks analytics' });
    }
  };

  // Get comprehensive dashboard summary
  getDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get all key metrics in parallel
      const [
        weeklyAnalytics,
        performanceAnalysis,
        habitStreaks
      ] = await Promise.all([
        this.analyticsService.getAnalyticsData(userId, 'weekly'),
        this.analyticsService.analyzePerformancePatterns(userId),
        this.analyticsService.getHabitStreaks(userId)
      ]);

      // Create summary
      const summary = {
        overview: {
          consistency_score: weeklyAnalytics.consistency_score,
          identity_alignment: weeklyAnalytics.identity_alignment,
          total_habits: habitStreaks.length,
          strong_habits: habitStreaks.filter(h => h.consistency_percentage > 70).length,
          avg_deep_work_hours: weeklyAnalytics.deep_work_trend.reduce((sum, h) => sum + h, 0) / Math.max(weeklyAnalytics.deep_work_trend.length, 1)
        },
        key_insights: weeklyAnalytics.behavioral_insights.slice(0, 3), // Top 3 insights
        alerts: performanceAnalysis.declining_patterns.filter(p => p.severity === 'high'),
        opportunities: performanceAnalysis.improvement_opportunities.slice(0, 2), // Top 2 opportunities
        recommendations: performanceAnalysis.optimization_suggestions.slice(0, 3) // Top 3 suggestions
      };

      logger.info('Dashboard summary generated successfully', { 
        userId,
        consistency_score: summary.overview.consistency_score,
        alerts_count: summary.alerts.length
      });

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error generating dashboard summary:', error);
      res.status(500).json({ error: 'Failed to generate dashboard summary' });
    }
  };

  // Private helper methods
  private calculateDateRange(days: number): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
  }
}