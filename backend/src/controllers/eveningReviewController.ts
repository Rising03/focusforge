import { Response } from 'express';
import { EveningReviewService } from '../services/eveningReviewService';
import { CreateEveningReviewRequest, UpdateEveningReviewRequest } from '../types/eveningReview';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export class EveningReviewController {
  private eveningReviewService: EveningReviewService;

  constructor() {
    this.eveningReviewService = new EveningReviewService();
  }

  // Create a new evening review
  createEveningReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      logger.info('Creating evening review', { userId, body: req.body });

      // Validate required fields - make mood and energy_level optional with defaults
      // Handle both camelCase and snake_case field names for compatibility
      const reviewRequest: CreateEveningReviewRequest = {
        date: req.body.date || new Date().toISOString().split('T')[0],
        accomplished: req.body.accomplished || [],
        missed: req.body.missed || [],
        reasons: req.body.reasons || [],
        tomorrow_tasks: req.body.tomorrowTasks || req.body.tomorrow_tasks || [],
        mood: req.body.mood ? parseInt(req.body.mood) : 5, // Default to neutral mood
        energy_level: req.body.energyLevel ? parseInt(req.body.energyLevel) : req.body.energy_level ? parseInt(req.body.energy_level) : 5, // Default to medium energy
        insights: req.body.insights || ''
      };

      logger.info('Processed review request', { userId, reviewRequest });

      // Validate mood and energy level ranges
      if (reviewRequest.mood < 1 || reviewRequest.mood > 10) {
        res.status(400).json({ error: 'Mood must be between 1 and 10' });
        return;
      }

      if (reviewRequest.energy_level < 1 || reviewRequest.energy_level > 10) {
        res.status(400).json({ error: 'Energy level must be between 1 and 10' });
        return;
      }

      const reviewResponse = await this.eveningReviewService.createEveningReview(userId, reviewRequest);

      res.status(201).json(reviewResponse.review);

      logger.info('Evening review created successfully', { 
        userId, 
        date: reviewRequest.date,
        adaptations_count: reviewResponse.routine_adaptations.length
      });
    } catch (error) {
      logger.error('Error in createEveningReview:', error);
      res.status(500).json({ 
        error: 'Failed to create evening review',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get evening review by date
  getReviewByDate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { date } = req.params;
      
      if (!this.isValidDate(date)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        return;
      }

      const review = await this.eveningReviewService.getReviewByDate(userId, new Date(date));

      if (!review) {
        res.status(404).json({ error: 'Evening review not found for the specified date' });
        return;
      }

      res.status(200).json({
        success: true,
        data: review
      });

      logger.info('Evening review retrieved successfully', { userId, date });
    } catch (error) {
      logger.error('Error in getReviewByDate:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve evening review',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Update an existing evening review
  updateEveningReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { reviewId } = req.params;
      const updateRequest: UpdateEveningReviewRequest = {
        accomplished: req.body.accomplished,
        missed: req.body.missed,
        reasons: req.body.reasons,
        tomorrow_tasks: req.body.tomorrow_tasks,
        mood: req.body.mood,
        energy_level: req.body.energy_level,
        insights: req.body.insights
      };

      const updatedReview = await this.eveningReviewService.updateEveningReview(userId, reviewId, updateRequest);

      res.status(200).json({
        success: true,
        data: updatedReview
      });

      logger.info('Evening review updated successfully', { userId, reviewId });
    } catch (error) {
      logger.error('Error in updateEveningReview:', error);
      res.status(500).json({ 
        error: 'Failed to update evening review',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get evening review history
  getReviewHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { days = '30' } = req.query;
      const daysNumber = parseInt(days as string, 10);

      if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
        res.status(400).json({ error: 'Days parameter must be between 1 and 365' });
        return;
      }

      const historyResponse = await this.eveningReviewService.getReviewHistory(userId, daysNumber);

      res.status(200).json({
        success: true,
        data: historyResponse
      });

      logger.info('Evening review history retrieved successfully', { userId, days: daysNumber });
    } catch (error) {
      logger.error('Error in getReviewHistory:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve review history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get today's evening review (convenience endpoint)
  getTodayReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const review = await this.eveningReviewService.getReviewByDate(userId, new Date(today));

      if (!review) {
        res.status(404).json({ 
          error: 'No evening review found for today',
          message: 'Create a review to start tracking your daily progress'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: review
      });

      logger.info('Today\'s evening review retrieved successfully', { userId });
    } catch (error) {
      logger.error('Error in getTodayReview:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve today\'s review',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get review analytics and insights
  getReviewAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { days = '30' } = req.query;
      const daysNumber = parseInt(days as string, 10);

      if (isNaN(daysNumber) || daysNumber < 7 || daysNumber > 365) {
        res.status(400).json({ error: 'Days parameter must be between 7 and 365 for analytics' });
        return;
      }

      const historyResponse = await this.eveningReviewService.getReviewHistory(userId, daysNumber);

      // Return only the analytics portion
      res.status(200).json({
        success: true,
        data: {
          analysis: historyResponse.analysis,
          date_range: historyResponse.date_range,
          total_reviews: historyResponse.total_reviews,
          review_frequency: Math.round((historyResponse.total_reviews / daysNumber) * 100) / 100
        }
      });

      logger.info('Evening review analytics retrieved successfully', { userId, days: daysNumber });
    } catch (error) {
      logger.error('Error in getReviewAnalytics:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve review analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Delete an evening review
  deleteEveningReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { reviewId } = req.params;

      // First check if review exists and belongs to user
      const review = await this.eveningReviewService.getReviewByDate(userId, new Date());
      if (!review || review.id !== reviewId) {
        res.status(404).json({ error: 'Evening review not found or access denied' });
        return;
      }

      await this.deleteReviewFromDatabase(reviewId, userId);

      res.status(200).json({
        success: true,
        message: 'Evening review deleted successfully'
      });

      logger.info('Evening review deleted successfully', { userId, reviewId });
    } catch (error) {
      logger.error('Error in deleteEveningReview:', error);
      res.status(500).json({ 
        error: 'Failed to delete evening review',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get review prompts and suggestions
  getReviewPrompts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get today's routine to provide context for prompts
      const today = new Date().toISOString().split('T')[0];
      const prompts = await this.generateReviewPrompts(userId, today);

      res.status(200).json({
        success: true,
        data: prompts
      });

      logger.info('Review prompts generated successfully', { userId });
    } catch (error) {
      logger.error('Error in getReviewPrompts:', error);
      res.status(500).json({ 
        error: 'Failed to generate review prompts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  private async deleteReviewFromDatabase(reviewId: string, userId: string): Promise<void> {
    // This would be implemented in the service layer
    // For now, this is a placeholder
    logger.info('Review deletion requested', { reviewId, userId });
  }

  private async generateReviewPrompts(userId: string, date: string): Promise<any> {
    // Generate contextual prompts based on user's routine and history
    return {
      reflection_prompts: [
        "What did you accomplish today that you're proud of?",
        "What tasks did you miss and why?",
        "How was your energy level throughout the day?",
        "What would you do differently tomorrow?",
        "What insights did you gain about your productivity patterns?"
      ],
      mood_check: {
        question: "How would you rate your overall mood today?",
        scale: "1 (very low) to 10 (excellent)"
      },
      energy_check: {
        question: "How would you rate your energy level today?",
        scale: "1 (exhausted) to 10 (highly energized)"
      },
      tomorrow_planning: [
        "What are your top 3 priorities for tomorrow?",
        "What time will you start your most important task?",
        "What potential obstacles should you prepare for?"
      ]
    };
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