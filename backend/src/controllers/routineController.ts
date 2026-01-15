import { Response } from 'express';
import { RoutineService } from '../services/routineService';
import { CreateRoutineRequest, RoutineUpdateRequest } from '../types/routine';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export class RoutineController {
  private routineService: RoutineService;

  constructor() {
    this.routineService = new RoutineService();
  }

  // Generate or get daily routine
  generateDailyRoutine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // V3: Support new fields for automatic and manual modes
      const mode = req.body.mode || 'automatic'; // 'automatic' | 'manual'
      const timeRange = req.body.timeRange; // { start, end, preset }
      const priorityFocus = req.body.priorityFocus; // 'critical' | 'high' | 'medium' | 'low'
      const manualSlots = req.body.manualSlots; // ManualTimeSlot[]
      const naturalLanguageRequest = req.body.naturalLanguageRequest; // string

      // V2: Backward compatibility fields
      const validFields = [
        'date', 'energy_level', 'energyLevel', 'available_time_override', 'availableHours', 
        'focus_areas', 'focusAreas', 'priorities',
        // V3 fields
        'mode', 'timeRange', 'priorityFocus', 'manualSlots', 'naturalLanguageRequest'
      ];
      const requestFields = Object.keys(req.body);
      const hasInvalidField = requestFields.some(field => !validFields.includes(field));
      
      logger.info('Routine generation request', { 
        requestFields, 
        mode,
        hasManualSlots: !!manualSlots,
        hasNaturalLanguage: !!naturalLanguageRequest
      });
      
      // If request has invalid fields, return 400
      if (hasInvalidField) {
        logger.warn('Rejecting routine generation due to invalid fields', { requestFields });
        res.status(400).json({ 
          error: 'Invalid request data',
          message: 'Request contains unrecognized fields',
          validFields: validFields,
          invalidFields: requestFields.filter(field => !validFields.includes(field))
        });
        return;
      }

      const routineRequest: any = {
        date: req.body.date || new Date().toISOString().split('T')[0],
        energy_level: req.body.energy_level || req.body.energyLevel || 'medium',
        available_time_override: req.body.available_time_override || req.body.availableHours,
        focus_areas: req.body.focus_areas || req.body.focusAreas || req.body.priorities,
        // V3 fields
        mode,
        timeRange,
        priorityFocus,
        manualSlots,
        naturalLanguageRequest
      };

      // Validate date format
      if (!this.isValidDate(routineRequest.date)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        return;
      }

      // Validate energy level
      const validEnergyLevels = ['low', 'medium', 'high'];
      if (routineRequest.energy_level && !validEnergyLevels.includes(routineRequest.energy_level)) {
        res.status(400).json({ 
          error: 'Invalid energy level',
          message: 'Energy level must be one of: low, medium, high'
        });
        return;
      }

      // Validate mode
      const validModes = ['automatic', 'manual'];
      if (mode && !validModes.includes(mode)) {
        res.status(400).json({
          error: 'Invalid generation mode',
          message: 'Mode must be one of: automatic, manual'
        });
        return;
      }

      // Validate manual slots if provided
      if (mode === 'manual' && (!manualSlots || manualSlots.length === 0)) {
        res.status(400).json({
          error: 'Manual mode requires time slots',
          message: 'Please provide manualSlots array for manual mode'
        });
        return;
      }

      const routineResponse = await this.routineService.generateDailyRoutine(userId, routineRequest);

      // Format response to match expected structure
      const formattedRoutine = {
        ...routineResponse.routine,
        segments: routineResponse.routine.segments.map(segment => ({
          ...segment,
          timeSlot: {
            start: segment.time_slot?.start_time || segment.timeSlot?.start || '09:00',
            end: segment.time_slot?.end_time || segment.timeSlot?.end || '10:00'
          }
        }))
      };

      res.status(201).json({
        success: true,
        data: {
          routine: formattedRoutine
        }
      });

      logger.info('Daily routine generated successfully', { 
        userId, 
        date: routineRequest.date,
        mode,
        complexity: routineResponse.complexity_level
      });
    } catch (error) {
      logger.error('Error in generateDailyRoutine:', error);
      res.status(500).json({ 
        error: 'Failed to generate daily routine',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get routine by date
  getRoutineByDate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const routine = await this.routineService.getRoutineByDate(userId, date);

      if (!routine) {
        res.status(404).json({ error: 'Routine not found for the specified date' });
        return;
      }

      res.status(200).json({
        success: true,
        data: routine
      });

      logger.info('Routine retrieved successfully', { userId, date });
    } catch (error) {
      logger.error('Error in getRoutineByDate:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve routine',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Update routine segment (mark as completed, add notes, etc.)
  updateRoutineSegment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { routineId } = req.params;
      const updateRequest: RoutineUpdateRequest = {
        segment_id: req.body.segment_id,
        completed: req.body.completed,
        actual_duration: req.body.actual_duration,
        focus_quality: req.body.focus_quality,
        notes: req.body.notes
      };

      // Validate required fields
      if (!updateRequest.segment_id) {
        res.status(400).json({ error: 'segment_id is required' });
        return;
      }

      await this.routineService.updateRoutineSegment(userId, routineId, updateRequest);

      res.status(200).json({
        success: true,
        message: 'Routine segment updated successfully'
      });

      logger.info('Routine segment updated successfully', { 
        userId, 
        routineId, 
        segmentId: updateRequest.segment_id 
      });
    } catch (error) {
      logger.error('Error in updateRoutineSegment:', error);
      res.status(500).json({ 
        error: 'Failed to update routine segment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get user's routine history
  getRoutineHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { days = '7' } = req.query;
      const daysNumber = parseInt(days as string, 10);

      if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 90) {
        res.status(400).json({ error: 'Days parameter must be between 1 and 90' });
        return;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysNumber);

      const routines = await this.getRoutinesInDateRange(userId, startDate, endDate);

      res.status(200).json({
        success: true,
        data: {
          routines,
          date_range: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          total_routines: routines.length
        }
      });

      logger.info('Routine history retrieved successfully', { userId, days: daysNumber });
    } catch (error) {
      logger.error('Error in getRoutineHistory:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve routine history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get today's routine (convenience endpoint)
  getTodayRoutine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const routine = await this.routineService.getRoutineByDate(userId, today);

      if (!routine) {
        // Generate routine for today if it doesn't exist
        const routineResponse = await this.routineService.generateDailyRoutine(userId, { date: today });
        
        res.status(200).json({
          success: true,
          data: routineResponse.routine,
          generated: true
        });
      } else {
        res.status(200).json({
          success: true,
          data: routine,
          generated: false
        });
      }

      logger.info('Today\'s routine retrieved successfully', { userId });
    } catch (error) {
      logger.error('Error in getTodayRoutine:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve today\'s routine',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Get personalized routine recommendations
  getPersonalizedRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const recommendations = await this.routineService.getPersonalizedRoutineRecommendations(userId);

      res.status(200).json({
        success: true,
        data: recommendations
      });

      logger.info('Personalized recommendations retrieved successfully', { userId });
    } catch (error) {
      logger.error('Error in getPersonalizedRecommendations:', error);
      res.status(500).json({ 
        error: 'Failed to get personalized recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ============ V3 New Endpoints ============

  /**
   * Generate routine from natural language request
   * POST /routines/natural-language
   */
  generateFromNaturalLanguage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { input, date } = req.body;

      if (!input || typeof input !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Natural language input is required'
        });
        return;
      }

      // Create routine request with natural language
      const routineRequest: any = {
        date: date || new Date().toISOString().split('T')[0],
        mode: 'automatic',
        naturalLanguageRequest: input
      };

      const routineResponse = await this.routineService.generateDailyRoutine(userId, routineRequest);

      res.status(201).json({
        success: true,
        data: routineResponse.routine,
        message: 'Routine generated from natural language request'
      });

      logger.info('Natural language routine generated', { userId, input: input.substring(0, 50) });
    } catch (error) {
      logger.error('Error in generateFromNaturalLanguage:', error);
      res.status(500).json({
        error: 'Failed to generate routine from natural language',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Adapt routine mid-day
   * POST /routines/:routineId/adapt
   */
  adaptRoutineMidDay = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { routineId } = req.params;
      const { remainingTime } = req.body;

      if (!routineId) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Routine ID is required'
        });
        return;
      }

      if (!remainingTime || typeof remainingTime !== 'number' || remainingTime <= 0) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Remaining time (in minutes) is required and must be positive'
        });
        return;
      }

      const adaptedRoutine = await this.routineService.adaptRoutineMidDay(
        userId,
        routineId,
        remainingTime
      );

      res.status(200).json({
        success: true,
        data: adaptedRoutine,
        message: 'Routine adapted for remaining time'
      });

      logger.info('Routine adapted mid-day', { userId, routineId, remainingTime });
    } catch (error) {
      logger.error('Error in adaptRoutineMidDay:', error);
      res.status(500).json({
        error: 'Failed to adapt routine',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Compare routine variations
   * POST /routines/compare
   */
  compareRoutineVariations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { variations } = req.body;

      if (!variations || !Array.isArray(variations) || variations.length < 2) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'At least 2 routine variations are required for comparison'
        });
        return;
      }

      const comparison = await this.routineService.compareRoutineVariations(userId, variations);

      res.status(200).json({
        success: true,
        data: comparison,
        message: 'Routine variations compared successfully'
      });

      logger.info('Routine variations compared', { userId, variationCount: variations.length });
    } catch (error) {
      logger.error('Error in compareRoutineVariations:', error);
      res.status(500).json({
        error: 'Failed to compare routine variations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Track routine performance for adaptive learning
  trackPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { routineId } = req.params;
      const performanceMetrics = req.body;

      await this.routineService.trackRoutinePerformance(userId, routineId, performanceMetrics);

      // Generate adaptations based on performance
      const adaptations = this.generateAdaptations(performanceMetrics);

      res.status(200).json({
        adaptations
      });

      logger.info('Routine performance tracked successfully', { userId, routineId });
    } catch (error) {
      logger.error('Error in trackPerformance:', error);
      res.status(500).json({ 
        error: 'Failed to track performance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  private generateAdaptations(performanceMetrics: any): string[] {
    const adaptations: string[] = [];
    
    if (performanceMetrics.completionRate < 0.7) {
      adaptations.push('Reduce routine complexity for better completion rates');
    }
    
    if (performanceMetrics.challenges?.includes('time_management')) {
      adaptations.push('Add buffer time between activities');
    }
    
    if (performanceMetrics.challenges?.includes('interruptions')) {
      adaptations.push('Include environment preparation time');
    }
    
    if (performanceMetrics.focusQuality === 'low') {
      adaptations.push('Schedule deep work during peak energy hours');
    }
    
    if (performanceMetrics.successes?.includes('morning_routine')) {
      adaptations.push('Maintain successful morning routine structure');
    }
    
    if (adaptations.length === 0) {
      adaptations.push('Continue current routine structure - performance is good');
    }
    
    return adaptations;
  }

  private async getRoutinesInDateRange(userId: string, startDate: Date, endDate: Date) {
    // This would be implemented in the service layer
    // For now, returning empty array as placeholder
    return [];
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