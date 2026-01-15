import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DeepWorkService } from '../services/deepWorkService';
import { 
  ScheduleDeepWorkRequest, 
  StartDeepWorkRequest, 
  CompleteDeepWorkRequest,
  WorkQualityAssessmentRequest,
  AttentionTrainingRequest
} from '../types/deepWork';
import { logger } from '../utils/logger';

const deepWorkService = new DeepWorkService();

export const analyzeEnergyPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const patterns = await deepWorkService.analyzeEnergyPatterns(userId);

    res.json({
      success: true,
      data: {
        patterns,
        insights: patterns.length > 0 
          ? [`Found ${patterns.length} energy patterns from your activity history`]
          : ['Not enough activity data to analyze patterns. Start tracking activities to get personalized insights.']
      }
    });
  } catch (error) {
    logger.error('Error in analyzeEnergyPatterns controller:', error);
    res.status(500).json({ 
      error: 'Failed to analyze energy patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const scheduleDeepWork = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const request: ScheduleDeepWorkRequest = {
      activity: req.body.activity || req.body.task || 'Deep work session',
      planned_duration: req.body.planned_duration || req.body.duration || 60,
      cognitive_load: req.body.cognitive_load || 'medium',
      energy_requirement: req.body.energy_requirement || 'medium',
      priority: req.body.priority || 'medium',
      preferred_time_slots: req.body.preferred_time_slots || req.body.scheduledTime ? [req.body.scheduledTime] : undefined,
      preparation_time: req.body.preparation_time || 15,
      preparation_notes: req.body.preparation_notes
    };

    // Validate required fields
    if (!request.activity) {
      res.status(400).json({ 
        error: 'Missing required field: activity is required' 
      });
      return;
    }

    if (request.planned_duration < 15 || request.planned_duration > 240) {
      res.status(400).json({ 
        error: 'Planned duration must be between 15 and 240 minutes' 
      });
      return;
    }

    const session = await deepWorkService.scheduleDeepWork(userId, request);

    // Get optimal time slot for response
    const optimalSlots = await deepWorkService.getOptimalTimeSlots(userId, new Date());
    const energyPrediction = optimalSlots[0]?.energy_prediction || 3;

    res.status(201).json({
      id: session.id,
      scheduledTime: session.planned_start_time,
      activity: session.activity,
      duration: session.planned_duration,
      success: true,
      environmentSetup: {
        location: 'library',
        lighting: 'bright',
        noise_level: 'quiet',
        temperature: 'comfortable',
        organization: 'minimal',
        digital_distractions: 'blocked',
        preparation: ['Turn off notifications', 'Clear workspace', 'Set focus timer']
      },
      data: {
        session,
        optimal_time_slot: session.planned_start_time.toTimeString().slice(0, 5),
        energy_prediction: energyPrediction,
        preparation_suggestions: [
          'Clear your workspace of distractions',
          'Set your phone to do not disturb mode',
          'Have water and any necessary materials ready',
          'Take a few deep breaths to center yourself'
        ]
      }
    });
  } catch (error) {
    logger.error('Error in scheduleDeepWork controller:', error);
    res.status(500).json({ 
      error: 'Failed to schedule deep work session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const startDeepWorkSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get session ID from URL params or request body
    const sessionId = req.params.sessionId || req.body.session_id;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const request: StartDeepWorkRequest = {
      session_id: sessionId,
      ...req.body
    };

    const session = await deepWorkService.startDeepWorkSession(userId, request);

    res.json({
      sessionId: session.id,
      success: true,
      data: {
        session,
        message: 'Deep work session started. Focus mode activated.',
        tips: [
          'Eliminate all distractions',
          'Focus on the single task at hand',
          'Take notes of insights as they come',
          'Don\'t check email or messages'
        ]
      }
    });
  } catch (error) {
    logger.error('Error in startDeepWorkSession controller:', error);
    res.status(500).json({ 
      error: 'Failed to start deep work session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const completeDeepWorkSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const request: CompleteDeepWorkRequest = req.body;

    if (!request.session_id || request.work_quality_score === undefined) {
      res.status(400).json({ 
        error: 'Session ID and work quality score are required' 
      });
      return;
    }

    if (request.work_quality_score < 0 || request.work_quality_score > 10) {
      res.status(400).json({ 
        error: 'Work quality score must be between 0 and 10' 
      });
      return;
    }

    const session = await deepWorkService.completeDeepWorkSession(userId, request);

    res.json({
      success: true,
      data: {
        session,
        message: 'Deep work session completed successfully!',
        insights: [
          `Session lasted ${session.actual_duration} minutes`,
          `Quality score: ${request.work_quality_score}/10`,
          request.interruptions === 0 
            ? 'Excellent focus - no interruptions!' 
            : `${request.interruptions} interruptions - consider improving environment setup`
        ]
      }
    });
  } catch (error) {
    logger.error('Error in completeDeepWorkSession controller:', error);
    res.status(500).json({ 
      error: 'Failed to complete deep work session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOptimalTimeSlots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    
    const optimalSlots = await deepWorkService.getOptimalTimeSlots(userId, date);
    const energyPatterns = await deepWorkService.analyzeEnergyPatterns(userId);

    res.json({
      success: true,
      data: {
        recommended_slots: optimalSlots,
        energy_pattern: energyPatterns,
        scheduling_insights: [
          'Schedule deep work during your peak energy hours',
          'Protect these time blocks from meetings and distractions',
          'Consider your cognitive load when choosing activities',
          'Allow preparation time before starting'
        ]
      }
    });
  } catch (error) {
    logger.error('Error in getOptimalTimeSlots controller:', error);
    res.status(500).json({ 
      error: 'Failed to get optimal time slots',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const recordWorkQualityAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const request: WorkQualityAssessmentRequest = req.body;

    // Validate required fields
    const requiredFields = [
      'session_id', 'focus_depth', 'cognitive_load_handled', 
      'output_quality', 'mental_clarity', 'problem_complexity', 'creative_output'
    ];

    for (const field of requiredFields) {
      if (request[field as keyof WorkQualityAssessmentRequest] === undefined) {
        res.status(400).json({ error: `${field} is required` });
        return;
      }
    }

    // Validate score ranges (1-10)
    const scoreFields = [
      'focus_depth', 'cognitive_load_handled', 'output_quality', 
      'mental_clarity', 'problem_complexity', 'creative_output'
    ];

    for (const field of scoreFields) {
      const value = request[field as keyof WorkQualityAssessmentRequest] as number;
      if (value < 1 || value > 10) {
        res.status(400).json({ 
          error: `${field} must be between 1 and 10` 
        });
        return;
      }
    }

    const measurement = await deepWorkService.recordWorkQualityAssessment(userId, request);

    res.status(201).json({
      success: true,
      data: {
        measurement,
        message: 'Work quality assessment recorded successfully',
        overall_score: measurement.overall_score
      }
    });
  } catch (error) {
    logger.error('Error in recordWorkQualityAssessment controller:', error);
    res.status(500).json({ 
      error: 'Failed to record work quality assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createAttentionTrainingSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const request: AttentionTrainingRequest = req.body;

    if (!request.exercise_type || !request.duration || !request.difficulty_level) {
      res.status(400).json({ 
        error: 'Exercise type, duration, and difficulty level are required' 
      });
      return;
    }

    if (request.duration < 1 || request.duration > 60) {
      res.status(400).json({ 
        error: 'Duration must be between 1 and 60 minutes' 
      });
      return;
    }

    if (request.difficulty_level < 1 || request.difficulty_level > 5) {
      res.status(400).json({ 
        error: 'Difficulty level must be between 1 and 5' 
      });
      return;
    }

    const session = await deepWorkService.createAttentionTrainingSession(userId, request);

    res.status(201).json({
      success: true,
      data: {
        session,
        message: 'Attention training session completed!',
        performance_feedback: session.performance_score >= 80 
          ? 'Excellent performance! Your attention skills are improving.'
          : session.performance_score >= 60
          ? 'Good work! Keep practicing to improve further.'
          : 'Keep practicing! Attention training takes time and consistency.'
      }
    });
  } catch (error) {
    logger.error('Error in createAttentionTrainingSession controller:', error);
    res.status(500).json({ 
      error: 'Failed to create attention training session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAttentionMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const metrics = await deepWorkService.getAttentionMetrics(userId);

    if (!metrics) {
      res.json({
        success: true,
        data: {
          message: 'No attention metrics available yet. Complete some attention training sessions to see your progress.',
          suggested_exercises: [
            'Start with 5-minute focus breathing exercises',
            'Try sustained attention tasks',
            'Practice cognitive control exercises'
          ]
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        metrics,
        insights: metrics ? [
          `Your attention span has ${metrics.improvement_percentage >= 0 ? 'improved' : 'decreased'} by ${Math.abs(metrics.improvement_percentage).toFixed(1)}%`,
          `Current attention span: ${metrics.current_attention_span} minutes`,
          `Training sessions completed: ${metrics.training_sessions_completed}`,
          `Trend: ${metrics.trend}`
        ] : [
          'Not enough training data to show metrics. Complete more attention training sessions to see your progress.'
        ]
      }
    });
  } catch (error) {
    logger.error('Error in getAttentionMetrics controller:', error);
    res.status(500).json({ 
      error: 'Failed to get attention metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDeepWorkAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const startDate = req.query.start_date 
      ? new Date(req.query.start_date as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const endDate = req.query.end_date 
      ? new Date(req.query.end_date as string)
      : new Date();

    const analytics = await deepWorkService.getDeepWorkAnalytics(userId, startDate, endDate);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error in getDeepWorkAnalytics controller:', error);
    res.status(500).json({ 
      error: 'Failed to get deep work analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserDeepWorkSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // This would be implemented in the service
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        sessions: [],
        total_count: 0,
        message: 'Deep work session history will be available once you start scheduling sessions'
      }
    });
  } catch (error) {
    logger.error('Error in getUserDeepWorkSessions controller:', error);
    res.status(500).json({ 
      error: 'Failed to get deep work sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};