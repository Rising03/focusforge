import { Response } from 'express';
import { HabitService } from '../services/habitService';
import { 
  CreateHabitRequest, 
  UpdateHabitRequest, 
  LogHabitCompletionRequest,
  HabitAnalyticsRequest
} from '../types/habit';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export class HabitController {
  private habitService: HabitService;

  constructor() {
    this.habitService = new HabitService();
  }

  // Create a new habit
  createHabit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: CreateHabitRequest = {
        name: req.body.name,
        description: req.body.description,
        frequency: req.body.frequency,
        cue: req.body.cue,
        reward: req.body.reward,
        stacked_after: req.body.stacked_after
      };

      // Validate required fields
      if (!request.name || request.name.trim().length === 0) {
        res.status(400).json({ error: 'Habit name is required' });
        return;
      }

      if (!request.frequency || !['daily', 'weekly'].includes(request.frequency)) {
        res.status(400).json({ error: 'Valid frequency (daily, weekly) is required' });
        return;
      }

      const habit = await this.habitService.createHabit(userId, request);

      // Get additional data for response
      const currentStreak = 0; // New habit has no streak
      const completionRate = 0; // New habit has no completion history
      const lastCompleted = null;

      res.status(201).json({
        success: true,
        data: {
          habit
        }
      });

      logger.info('Habit created successfully', { userId, habitId: habit.id });
    } catch (error) {
      logger.error('Error in createHabit:', error);
      res.status(500).json({ 
        error: 'Failed to create habit',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Update an existing habit
  updateHabit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { habitId } = req.params;
      const request: UpdateHabitRequest = {
        name: req.body.name,
        description: req.body.description,
        frequency: req.body.frequency,
        cue: req.body.cue,
        reward: req.body.reward,
        stacked_after: req.body.stacked_after,
        is_active: req.body.is_active
      };

      // Validate frequency if provided
      if (request.frequency && !['daily', 'weekly'].includes(request.frequency)) {
        res.status(400).json({ error: 'Valid frequency (daily, weekly) is required' });
        return;
      }

      const habit = await this.habitService.updateHabit(userId, habitId, request);

      // Get additional data for response
      const streaks = await this.habitService.getHabitStreaks(userId);
      const habitStreak = streaks.find(s => s.habit_id === habit.id);

      res.status(200).json({
        success: true,
        data: {
          habit,
          current_streak: habitStreak?.current_streak || 0,
          completion_rate_30_days: habitStreak?.consistency_percentage || 0,
          last_completed: habitStreak?.last_completed || null
        }
      });

      logger.info('Habit updated successfully', { userId, habitId });
    } catch (error) {
      logger.error('Error in updateHabit:', error);
      res.status(500).json({ 
        error: 'Failed to update habit',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Delete a habit
  deleteHabit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { habitId } = req.params;

      await this.habitService.deleteHabit(userId, habitId);

      res.status(200).json({
        success: true,
        message: 'Habit deleted successfully'
      });

      logger.info('Habit deleted successfully', { userId, habitId });
    } catch (error) {
      logger.error('Error in deleteHabit:', error);
      res.status(500).json({ 
        error: 'Failed to delete habit',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get all user habits
  getUserHabits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const includeInactive = req.query.include_inactive === 'true';
      const habits = await this.habitService.getUserHabits(userId, includeInactive);
      const streaks = await this.habitService.getHabitStreaks(userId);

      // Combine habit data with streak information
      const habitsWithData = habits.map(habit => {
        const habitStreak = streaks.find(s => s.habit_id === habit.id);
        return {
          habit,
          current_streak: habitStreak?.current_streak || 0,
          completion_rate_30_days: habitStreak?.consistency_percentage || 0,
          last_completed: habitStreak?.last_completed || null
        };
      });

      // Calculate summary statistics
      const activeHabits = habits.filter(h => h.is_active);
      const overallConsistency = streaks.length > 0 
        ? streaks.reduce((sum, s) => sum + s.consistency_percentage, 0) / streaks.length 
        : 0;

      // Get today's completions
      const today = new Date().toISOString().split('T')[0];
      const todayCompletions = await this.getTodayCompletions(userId, today);
      const habitsCompletedToday = todayCompletions.filter(c => c.completed).length;

      res.status(200).json({
        success: true,
        data: {
          habits: habitsWithData,
          overall_consistency: Math.round(overallConsistency * 100) / 100,
          total_active_habits: activeHabits.length,
          habits_completed_today: habitsCompletedToday
        }
      });

      logger.debug('User habits retrieved', { userId, count: habits.length });
    } catch (error) {
      logger.error('Error in getUserHabits:', error);
      res.status(500).json({ 
        error: 'Failed to get user habits',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Log habit completion
  logHabitCompletion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Handle both route patterns: /habits/:habitId/complete and /habits/completions
      const habitId = req.params.habitId || req.body.habit_id;
      
      // For the /complete endpoint, default completed to true if not provided
      let completed = req.body.completed;
      if (req.params.habitId && completed === undefined) {
        completed = true; // Default to true for /complete endpoint
      }
      
      const request: LogHabitCompletionRequest = {
        habit_id: habitId,
        date: req.body.date,
        completed: completed,
        quality: req.body.quality,
        notes: req.body.notes
      };

      // Validate required fields
      if (!request.habit_id) {
        res.status(400).json({ error: 'Habit ID is required' });
        return;
      }

      if (!request.date) {
        res.status(400).json({ error: 'Date is required' });
        return;
      }

      if (typeof request.completed !== 'boolean') {
        res.status(400).json({ error: 'Completed status (boolean) is required' });
        return;
      }

      // Validate date format
      if (!this.isValidDate(request.date)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        return;
      }

      // Validate quality if provided
      if (request.quality && !['excellent', 'good', 'poor'].includes(request.quality)) {
        res.status(400).json({ error: 'Valid quality (excellent, good, poor) is required if provided' });
        return;
      }

      const completion = await this.habitService.logHabitCompletion(
        userId,
        request.habit_id,
        new Date(request.date),
        request.completed,
        request.quality,
        request.notes
      );

      // Calculate updated streak information
      const streaks = await this.habitService.getHabitStreaks(userId);
      const habitStreak = streaks.find(s => s.habit_id === request.habit_id);
      const newStreakLength = habitStreak?.current_streak || 0;

      // Check if "never miss twice" support should be triggered
      const neverMissTwiceTriggered = !request.completed && newStreakLength === 0;

      res.status(200).json({
        success: true,
        data: {
          completion,
          streak_updated: true,
          new_streak_length: newStreakLength,
          never_miss_twice_triggered: neverMissTwiceTriggered
        }
      });

      logger.info('Habit completion logged successfully', { 
        userId, 
        habitId: request.habit_id, 
        date: request.date,
        completed: request.completed 
      });
    } catch (error) {
      logger.error('Error in logHabitCompletion:', error);
      res.status(500).json({ 
        error: 'Failed to log habit completion',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get habit streaks
  getHabitStreaks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const streaks = await this.habitService.getHabitStreaks(userId);

      // Format for compatibility with tests
      const formattedStreaks = streaks.map(streak => ({
        ...streak,
        habitId: streak.habit_id // Add camelCase version for test compatibility
      }));

      res.status(200).json(formattedStreaks);

      logger.debug('Habit streaks retrieved', { userId, count: streaks.length });
    } catch (error) {
      logger.error('Error in getHabitStreaks:', error);
      res.status(500).json({ 
        error: 'Failed to get habit streaks',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get habit stacking suggestions
  getHabitStackSuggestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const suggestions = await this.habitService.suggestHabitStacks(userId);
      const habits = await this.habitService.getUserHabits(userId);

      // Get existing habit stacks
      const existingStacks = habits
        .filter(h => h.stacked_after)
        .reduce((stacks: any[], habit) => {
          const parentHabit = habits.find(h => h.id === habit.stacked_after);
          if (parentHabit) {
            let stack = stacks.find(s => s.parent_habit === parentHabit.name);
            if (!stack) {
              stack = { parent_habit: parentHabit.name, stacked_habits: [] };
              stacks.push(stack);
            }
            stack.stacked_habits.push(habit.name);
          }
          return stacks;
        }, []);

      res.status(200).json({
        success: true,
        data: {
          suggestions,
          existing_stacks: existingStacks
        }
      });

      logger.debug('Habit stack suggestions retrieved', { userId, count: suggestions.length });
    } catch (error) {
      logger.error('Error in getHabitStackSuggestions:', error);
      res.status(500).json({ 
        error: 'Failed to get habit stack suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get consistency score
  getConsistencyScore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const consistencyScore = await this.habitService.calculateConsistencyScore(userId);

      res.status(200).json({
        success: true,
        data: consistencyScore
      });

      logger.debug('Consistency score retrieved', { userId, score: consistencyScore.overall_score });
    } catch (error) {
      logger.error('Error in getConsistencyScore:', error);
      res.status(500).json({ 
        error: 'Failed to get consistency score',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get habit analytics
  getHabitAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: HabitAnalyticsRequest = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        habit_ids: req.query.habit_ids ? (req.query.habit_ids as string).split(',') : undefined
      };

      // Validate date formats if provided
      if (request.start_date && !this.isValidDate(request.start_date)) {
        res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD.' });
        return;
      }

      if (request.end_date && !this.isValidDate(request.end_date)) {
        res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD.' });
        return;
      }

      const analytics = await this.habitService.getHabitAnalytics(userId, request);

      res.status(200).json({
        success: true,
        data: analytics
      });

      logger.debug('Habit analytics retrieved', { userId });
    } catch (error) {
      logger.error('Error in getHabitAnalytics:', error);
      res.status(500).json({ 
        error: 'Failed to get habit analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get today's habit completions (convenience endpoint)
  getTodayHabits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const habits = await this.habitService.getUserHabits(userId);
      const todayCompletions = await this.getTodayCompletions(userId, today);

      // Combine habits with today's completion status
      const habitsWithStatus = habits.map(habit => {
        const completion = todayCompletions.find(c => c.habit_id === habit.id);
        return {
          habit,
          completed_today: completion?.completed || false,
          quality_today: completion?.quality || null,
          notes_today: completion?.notes || null
        };
      });

      const completedCount = habitsWithStatus.filter(h => h.completed_today).length;
      const completionRate = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

      res.status(200).json({
        success: true,
        data: {
          date: today,
          habits: habitsWithStatus,
          completed_count: completedCount,
          total_habits: habits.length,
          completion_rate: Math.round(completionRate * 100) / 100
        }
      });

      logger.debug('Today\'s habits retrieved', { userId, completedCount, totalHabits: habits.length });
    } catch (error) {
      logger.error('Error in getTodayHabits:', error);
      res.status(500).json({ 
        error: 'Failed to get today\'s habits',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Private helper methods

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private async getTodayCompletions(userId: string, date: string): Promise<any[]> {
    try {
      // Get all user habits
      const habits = await this.habitService.getUserHabits(userId);
      const completions = [];

      // For each habit, check if there's a completion for today
      for (const habit of habits) {
        try {
          // Query the database for today's completion
          const queryText = `
            SELECT * FROM habit_completions 
            WHERE habit_id = $1 AND user_id = $2 AND date = $3
          `;
          
          const result = await query(queryText, [habit.id, userId, date]);
          
          if (result.rows.length > 0) {
            const completion = result.rows[0];
            completions.push({
              habit_id: habit.id,
              completed: completion.completed,
              quality: completion.quality,
              notes: completion.notes
            });
          } else {
            // No completion record for today, default to false
            completions.push({
              habit_id: habit.id,
              completed: false,
              quality: null,
              notes: null
            });
          }
        } catch (error) {
          // Skip this habit if there's an error, default to false
          completions.push({
            habit_id: habit.id,
            completed: false,
            quality: null,
            notes: null
          });
        }
      }

      return completions;
    } catch (error) {
      logger.error('Error getting today\'s completions:', error);
      return [];
    }
  }
}