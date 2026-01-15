import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReviewCycleService, CreateWeeklyReviewRequest, CreateMonthlyReviewRequest } from '../services/reviewCycleService';
import { logger } from '../utils/logger';

export class ReviewCycleController {
  private reviewCycleService: ReviewCycleService;

  constructor() {
    this.reviewCycleService = new ReviewCycleService();
  }

  async createWeeklyReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: CreateWeeklyReviewRequest = req.body;
      
      if (!request.week_start_date) {
        res.status(400).json({ error: 'week_start_date is required' });
        return;
      }

      const weeklyReview = await this.reviewCycleService.createWeeklyReview(userId, request);
      
      logger.info('Weekly review created successfully', { 
        userId, 
        weekStartDate: request.week_start_date 
      });

      res.status(201).json({
        success: true,
        data: weeklyReview
      });
    } catch (error) {
      logger.error('Error creating weekly review:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ 
          error: 'Weekly review already exists for this week',
          code: 'REVIEW_EXISTS'
        });
        return;
      }

      res.status(500).json({ 
        error: 'Failed to create weekly review',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async createMonthlyReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: CreateMonthlyReviewRequest = req.body;
      
      if (!request.month_start_date) {
        res.status(400).json({ error: 'month_start_date is required' });
        return;
      }

      const monthlyReview = await this.reviewCycleService.createMonthlyReview(userId, request);
      
      logger.info('Monthly review created successfully', { 
        userId, 
        monthStartDate: request.month_start_date 
      });

      res.status(201).json({
        success: true,
        data: monthlyReview
      });
    } catch (error) {
      logger.error('Error creating monthly review:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ 
          error: 'Monthly review already exists for this month',
          code: 'REVIEW_EXISTS'
        });
        return;
      }

      res.status(500).json({ 
        error: 'Failed to create monthly review',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getWeeklyReviewHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const weeks = parseInt(req.query.weeks as string) || 12;
      
      if (weeks < 1 || weeks > 52) {
        res.status(400).json({ error: 'weeks must be between 1 and 52' });
        return;
      }

      const weeklyReviews = await this.reviewCycleService.getWeeklyReviewHistory(userId, weeks);
      
      res.json({
        success: true,
        data: weeklyReviews
      });
    } catch (error) {
      logger.error('Error getting weekly review history:', error);
      res.status(500).json({ 
        error: 'Failed to get weekly review history',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getMonthlyReviewHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const months = parseInt(req.query.months as string) || 6;
      
      if (months < 1 || months > 24) {
        res.status(400).json({ error: 'months must be between 1 and 24' });
        return;
      }

      const monthlyReviews = await this.reviewCycleService.getMonthlyReviewHistory(userId, months);
      
      res.json({
        success: true,
        data: monthlyReviews
      });
    } catch (error) {
      logger.error('Error getting monthly review history:', error);
      res.status(500).json({ 
        error: 'Failed to get monthly review history',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async identifyLongTermPatterns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const months = parseInt(req.query.months as string) || 6;
      
      if (months < 3 || months > 24) {
        res.status(400).json({ error: 'months must be between 3 and 24' });
        return;
      }

      const patterns = await this.reviewCycleService.identifyLongTermPatterns(userId, months);
      
      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      logger.error('Error identifying long-term patterns:', error);
      res.status(500).json({ 
        error: 'Failed to identify long-term patterns',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async generateSystematicAdjustmentSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const suggestions = await this.reviewCycleService.generateSystematicAdjustmentSuggestions(userId);
      
      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('Error generating systematic adjustment suggestions:', error);
      res.status(500).json({ 
        error: 'Failed to generate systematic adjustment suggestions',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async trackHabitEvolution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const months = parseInt(req.query.months as string) || 12;
      
      if (months < 1 || months > 24) {
        res.status(400).json({ error: 'months must be between 1 and 24' });
        return;
      }

      const habitEvolution = await this.reviewCycleService.trackHabitEvolution(userId, months);
      
      res.json({
        success: true,
        data: habitEvolution
      });
    } catch (error) {
      logger.error('Error tracking habit evolution:', error);
      res.status(500).json({ 
        error: 'Failed to track habit evolution',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}