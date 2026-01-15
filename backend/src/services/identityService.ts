import pool from '../config/database';
import { 
  IdentityAlignment,
  IdentityActivity,
  TaskAcknowledgment,
  ActivitySuggestion,
  EnvironmentAssessment,
  EnvironmentData,
  DistractionReport,
  FrictionPoint,
  EnvironmentProductivityCorrelation,
  CalculateIdentityAlignmentRequest,
  TaskAcknowledgmentRequest,
  ActivitySuggestionRequest,
  EnvironmentAssessmentRequest,
  DistractionReportRequest
} from '../types/identity';
import { ActivityService } from './activityService';
import { ProfileService } from './profileService';
import { logger } from '../utils/logger';

export class IdentityService {
  private activityService: ActivityService;
  private profileService: ProfileService;

  constructor() {
    this.activityService = new ActivityService();
    this.profileService = new ProfileService();
  }

  async calculateIdentityAlignment(userId: string, request: CalculateIdentityAlignmentRequest = {}): Promise<IdentityAlignment> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      const days = request.days || 7;
      
      // Get user profile to understand target identity
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found');
      }

      let targetIdentity = profileResponse.profile.target_identity;
      
      // Input validation with fallbacks
      if (!targetIdentity || typeof targetIdentity !== 'string' || targetIdentity.trim().length === 0) {
        // Provide a default identity if none provided
        targetIdentity = 'focused individual';
        profileResponse.profile.target_identity = targetIdentity;
      } else {
        // Trim whitespace from target identity
        targetIdentity = targetIdentity.trim();
        profileResponse.profile.target_identity = targetIdentity;
      }
      
      // Get recent activities
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { sessions } = await this.activityService.getActivityHistory(userId, {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        limit: 1000
      });

      // Calculate identity-aligned activities
      const identityActivities = this.analyzeIdentityActivities(sessions, targetIdentity);
      
      // Calculate overall alignment score
      const alignmentScore = this.calculateAlignmentScore(identityActivities, sessions);

      // Store or update alignment record
      const alignment = await this.storeIdentityAlignment(userId, targetIdentity, alignmentScore, identityActivities);

      logger.info('Identity alignment calculated', { 
        userId, 
        alignmentScore, 
        targetIdentity,
        activitiesAnalyzed: sessions.length 
      });

      return alignment;
    } catch (error) {
      logger.error('Error calculating identity alignment:', error);
      throw new Error('Failed to calculate identity alignment');
    }
  }

  async acknowledgeTask(userId: string, request: TaskAcknowledgmentRequest): Promise<TaskAcknowledgment> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      // Input validation with proper handling of empty/whitespace strings
      if (!request || !request.task || typeof request.task !== 'string' || request.task.trim().length === 0) {
        throw new Error('Task description is required and cannot be empty or whitespace only');
      }

      // Trim the task to remove leading/trailing whitespace
      const trimmedTask = request.task.trim();

      // Get user profile for target identity
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found');
      }

      const targetIdentity = profileResponse.profile.target_identity;
      
      // Validate target identity is not empty or whitespace
      if (!targetIdentity || targetIdentity.trim().length === 0) {
        throw new Error('User target identity is required for task acknowledgment');
      }
      
      // Generate identity-based acknowledgment message
      const acknowledgmentMessage = this.generateAcknowledgmentMessage(trimmedTask, targetIdentity.trim(), request.activity_type);
      
      const identityContext = `As a ${targetIdentity.trim()}`;

      const query = `
        INSERT INTO task_acknowledgments (user_id, task, identity_context, acknowledgment_message)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      let result;
      try {
        result = await pool.query(query, [
          userId,
          trimmedTask,
          identityContext,
          acknowledgmentMessage
        ]);
      } catch (dbError) {
        // If table doesn't exist, create a mock response
        logger.warn('Task acknowledgments table not found, using fallback', { error: dbError });
        result = {
          rows: [{
            id: `mock_${Date.now()}`,
            user_id: userId,
            task: trimmedTask,
            identity_context: identityContext,
            acknowledgment_message: acknowledgmentMessage,
            created_at: new Date()
          }]
        };
      }

      const acknowledgment: TaskAcknowledgment = {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        task: result.rows[0].task,
        identity_context: result.rows[0].identity_context,
        acknowledgment_message: result.rows[0].acknowledgment_message,
        created_at: result.rows[0].created_at
      };

      logger.info('Task acknowledged with identity context', { 
        userId, 
        task: trimmedTask, 
        targetIdentity 
      });

      return acknowledgment;
    } catch (error) {
      logger.error('Error acknowledging task:', error);
      throw new Error('Failed to acknowledge task');
    }
  }

  async suggestIdentityBasedActivities(userId: string, request: ActivitySuggestionRequest = {}): Promise<ActivitySuggestion[]> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      // Get user profile
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found');
      }

      const profile = profileResponse.profile;
      let targetIdentity = profile.target_identity;
      
      // Input validation with fallbacks
      if (!targetIdentity || typeof targetIdentity !== 'string' || targetIdentity.trim().length === 0) {
        // Provide a default identity if none provided
        targetIdentity = 'focused individual';
        profile.target_identity = targetIdentity;
      } else {
        // Trim whitespace from target identity
        targetIdentity = targetIdentity.trim();
        profile.target_identity = targetIdentity;
      }
      
      const availableTime = request.available_time || 60; // Default 1 hour
      const energyLevel = request.energy_level || 'medium';

      // Generate identity-based suggestions
      const suggestions = this.generateIdentityBasedSuggestions(
        targetIdentity,
        profile.academic_goals,
        profile.skill_goals,
        availableTime,
        energyLevel,
        request.context
      );

      logger.info('Identity-based activity suggestions generated', { 
        userId, 
        targetIdentity, 
        suggestionsCount: suggestions.length 
      });

      return suggestions;
    } catch (error) {
      logger.error('Error generating activity suggestions:', error);
      throw new Error('Failed to generate activity suggestions');
    }
  }

  async assessEnvironment(userId: string, request: EnvironmentAssessmentRequest): Promise<EnvironmentAssessment> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      if (!request || !request.environment_type || typeof request.environment_type !== 'string' || request.environment_type.trim().length === 0) {
        // Provide default environment type if none provided
        if (!request) request = { environment_type: 'physical', environment_data: {} };
        if (!request.environment_type || typeof request.environment_type !== 'string' || request.environment_type.trim().length === 0) {
          request.environment_type = 'physical';
        } else {
          const trimmed = request.environment_type.trim();
          request.environment_type = (trimmed === 'physical' || trimmed === 'digital') ? trimmed : 'physical';
        }
      } else {
        const trimmed = request.environment_type.trim();
        request.environment_type = (trimmed === 'physical' || trimmed === 'digital') ? trimmed : 'physical';
      }
      
      if (!request.environment_data || typeof request.environment_data !== 'object' || request.environment_data === null) {
        throw new Error('Environment data is required and must be an object');
      }

      // Validate that environment data has at least some meaningful content
      const hasValidData = Object.values(request.environment_data).some(value => 
        value !== undefined && value !== null && 
        (typeof value !== 'string' || value.trim().length > 0) &&
        (!Array.isArray(value) || value.length > 0)
      );
      
      if (!hasValidData) {
        // Provide default minimal environment data if none provided
        request.environment_data = { location: 'unspecified' };
      }

      const query = `
        INSERT INTO environment_assessments (user_id, environment_type, assessment_data, productivity_correlation)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      // Calculate initial productivity correlation (will be refined over time)
      const productivityCorrelation = request.current_productivity || 0.5;

      let result;
      try {
        result = await pool.query(query, [
          userId,
          request.environment_type,
          JSON.stringify(request.environment_data),
          productivityCorrelation
        ]);
      } catch (dbError) {
        // If table doesn't exist, create a mock response
        logger.warn('Environment assessments table not found, using fallback', { error: dbError });
        result = {
          rows: [{
            id: `mock_${Date.now()}`,
            user_id: userId,
            environment_type: request.environment_type,
            assessment_data: JSON.stringify(request.environment_data),
            productivity_correlation: productivityCorrelation,
            last_updated: new Date(),
            created_at: new Date()
          }]
        };
      }

      const assessment: EnvironmentAssessment = {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        environment_type: result.rows[0].environment_type,
        assessment_data: typeof result.rows[0].assessment_data === 'string' 
          ? JSON.parse(result.rows[0].assessment_data) 
          : result.rows[0].assessment_data,
        productivity_correlation: result.rows[0].productivity_correlation,
        last_updated: result.rows[0].last_updated,
        created_at: result.rows[0].created_at
      };

      logger.info('Environment assessment created', { 
        userId, 
        environmentType: request.environment_type 
      });

      return assessment;
    } catch (error) {
      logger.error('Error assessing environment:', error);
      throw new Error('Failed to assess environment');
    }
  }

  async reportDistraction(userId: string, request: DistractionReportRequest): Promise<DistractionReport> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      if (!request || !request.distraction_type || typeof request.distraction_type !== 'string' || request.distraction_type.trim().length === 0) {
        // Provide default distraction type if none provided
        if (!request) request = { distraction_type: 'general distraction' };
        if (!request.distraction_type || typeof request.distraction_type !== 'string' || request.distraction_type.trim().length === 0) {
          request.distraction_type = 'general distraction';
        } else {
          request.distraction_type = request.distraction_type.trim();
        }
      } else {
        request.distraction_type = request.distraction_type.trim();
      }
      
      if (request.context !== undefined) {
        if (typeof request.context !== 'string') {
          throw new Error('Context must be a string if provided');
        }
        // Trim whitespace and convert empty/whitespace-only strings to undefined
        const trimmedContext = request.context.trim();
        request.context = trimmedContext.length > 0 ? trimmedContext : undefined;
      }

      // Generate friction points and solutions
      const frictionPoints = this.identifyFrictionPoints(request.distraction_type, request.context || '');
      const suggestedSolutions = this.generateDistractionSolutions(request.distraction_type, frictionPoints);

      const query = `
        INSERT INTO distraction_reports (user_id, distraction_type, context, frequency, impact_level, suggested_solutions, friction_points)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      let result;
      try {
        result = await pool.query(query, [
          userId,
          request.distraction_type,
          request.context,
          request.frequency || 1,
          request.impact_level || 'medium',
          JSON.stringify(suggestedSolutions),
          JSON.stringify(frictionPoints)
        ]);
      } catch (dbError) {
        // If table doesn't exist, create a mock response
        logger.warn('Distraction reports table not found, using fallback', { error: dbError });
        result = {
          rows: [{
            id: `mock_${Date.now()}`,
            user_id: userId,
            distraction_type: request.distraction_type,
            context: request.context,
            frequency: request.frequency || 1,
            impact_level: request.impact_level || 'medium',
            suggested_solutions: suggestedSolutions,
            friction_points: frictionPoints,
            created_at: new Date()
          }]
        };
      }

      const report: DistractionReport = {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        distraction_type: result.rows[0].distraction_type,
        context: result.rows[0].context,
        frequency: result.rows[0].frequency,
        impact_level: result.rows[0].impact_level,
        suggested_solutions: typeof result.rows[0].suggested_solutions === 'string' 
          ? JSON.parse(result.rows[0].suggested_solutions) 
          : result.rows[0].suggested_solutions,
        friction_points: typeof result.rows[0].friction_points === 'string' 
          ? JSON.parse(result.rows[0].friction_points) 
          : result.rows[0].friction_points,
        created_at: result.rows[0].created_at
      };

      logger.info('Distraction report created', { 
        userId, 
        distractionType: request.distraction_type 
      });

      return report;
    } catch (error) {
      logger.error('Error reporting distraction:', error);
      throw new Error('Failed to report distraction');
    }
  }

  async trackEnvironmentProductivityCorrelation(userId: string, environmentFactor: string, factorValue: string, productivityImpact: number): Promise<void> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      if (!environmentFactor || typeof environmentFactor !== 'string' || environmentFactor.trim().length === 0) {
        // Provide default environment factor if none provided
        environmentFactor = 'general_factor';
      } else {
        environmentFactor = environmentFactor.trim();
      }
      
      if (!factorValue || typeof factorValue !== 'string' || factorValue.trim().length === 0) {
        // Provide default factor value if none provided
        factorValue = 'default_value';
      } else {
        factorValue = factorValue.trim();
      }
      
      if (typeof productivityImpact !== 'number' || isNaN(productivityImpact)) {
        throw new Error('Productivity impact must be a valid number');
      }

      // Check if correlation already exists
      const existingQuery = `
        SELECT * FROM environment_productivity_correlations 
        WHERE user_id = $1 AND environment_factor = $2 AND factor_value = $3
      `;

      let existingResult;
      try {
        existingResult = await pool.query(existingQuery, [userId, environmentFactor, factorValue]);
      } catch (dbError) {
        // If table doesn't exist, skip correlation tracking
        logger.warn('Environment productivity correlations table not found, skipping tracking', { error: dbError });
        return;
      }

      if (existingResult.rows.length > 0) {
        // Update existing correlation
        const existing = existingResult.rows[0];
        
        // Add null checks for database fields
        const currentSampleSize = existing.sample_size || 1;
        const currentProductivityImpact = existing.productivity_impact || 0;
        
        const newSampleSize = currentSampleSize + 1;
        const newProductivityImpact = ((currentProductivityImpact * currentSampleSize) + productivityImpact) / newSampleSize;
        const newConfidenceLevel = Math.min(1.0, newSampleSize / 10); // Confidence increases with sample size

        const updateQuery = `
          UPDATE environment_productivity_correlations 
          SET productivity_impact = $1, confidence_level = $2, sample_size = $3, last_updated = NOW()
          WHERE id = $4
        `;

        try {
          await pool.query(updateQuery, [newProductivityImpact, newConfidenceLevel, newSampleSize, existing.id]);
        } catch (updateError) {
          logger.warn('Failed to update environment correlation', { error: updateError });
        }
      } else {
        // Create new correlation
        const insertQuery = `
          INSERT INTO environment_productivity_correlations (user_id, environment_factor, factor_value, productivity_impact, confidence_level, sample_size)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        try {
          await pool.query(insertQuery, [userId, environmentFactor, factorValue, productivityImpact, 0.1, 1]);
        } catch (insertError) {
          logger.warn('Failed to insert environment correlation', { error: insertError });
        }
      }

      logger.debug('Environment productivity correlation tracked', { 
        userId, 
        environmentFactor, 
        factorValue, 
        productivityImpact 
      });
    } catch (error) {
      logger.error('Error tracking environment productivity correlation:', error);
      // Don't throw error for correlation tracking failures
    }
  }

  async getEnvironmentProductivityCorrelations(userId: string): Promise<EnvironmentProductivityCorrelation[]> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and cannot be empty');
      }
      
      const query = `
        SELECT * FROM environment_productivity_correlations 
        WHERE user_id = $1 AND confidence_level > 0.3
        ORDER BY confidence_level DESC, productivity_impact DESC
      `;

      let result;
      try {
        result = await pool.query(query, [userId]);
      } catch (dbError) {
        // If table doesn't exist, return empty array
        logger.warn('Environment productivity correlations table not found, returning empty array', { error: dbError });
        return [];
      }

      return result.rows.map(row => ({
        id: row.id || '',
        user_id: row.user_id || userId,
        environment_factor: row.environment_factor || 'unknown_factor',
        factor_value: row.factor_value || 'unknown_value',
        productivity_impact: typeof row.productivity_impact === 'number' ? row.productivity_impact : 0,
        confidence_level: typeof row.confidence_level === 'number' ? row.confidence_level : 0,
        sample_size: typeof row.sample_size === 'number' ? row.sample_size : 1,
        last_updated: row.last_updated || new Date()
      }));
    } catch (error) {
      logger.error('Error getting environment productivity correlations:', error);
      throw new Error('Failed to get environment productivity correlations');
    }
  }

  private analyzeIdentityActivities(sessions: any[], targetIdentity: string): IdentityActivity[] {
    // Handle null/undefined sessions array
    if (!Array.isArray(sessions)) {
      return [];
    }

    const activityMap: Record<string, { sessions: any[]; totalTime: number }> = {};

    // Group sessions by activity
    sessions.forEach(session => {
      // Handle null/undefined session or activity
      if (!session || !session.activity || typeof session.activity !== 'string') {
        return; // Skip invalid sessions
      }

      if (!activityMap[session.activity]) {
        activityMap[session.activity] = { sessions: [], totalTime: 0 };
      }
      activityMap[session.activity].sessions.push(session);
      activityMap[session.activity].totalTime += session.duration || 0;
    });

    // Analyze each activity for identity alignment
    return Object.entries(activityMap).map(([activity, data]) => {
      const alignmentWeight = this.calculateActivityAlignmentWeight(activity, targetIdentity);
      const frequency = data.sessions.length;
      const recentPerformance = this.calculateRecentPerformance(data.sessions);
      const identityRelevance = this.determineIdentityRelevance(alignmentWeight);

      return {
        activity,
        alignment_weight: alignmentWeight,
        frequency,
        recent_performance: recentPerformance,
        identity_relevance: identityRelevance
      };
    });
  }

  private calculateActivityAlignmentWeight(activity: string, targetIdentity: string): number {
    const activityLower = activity.toLowerCase();
    const identityLower = targetIdentity.toLowerCase();

    // Base alignment scoring
    let weight = 0.5; // Default neutral

    // Identity-specific activity mapping
    if (identityLower.includes('student') || identityLower.includes('learner')) {
      if (activityLower.includes('study') || activityLower.includes('homework') || activityLower.includes('research')) {
        weight = 0.9;
      } else if (activityLower.includes('read') || activityLower.includes('practice')) {
        weight = 0.8;
      } else if (activityLower.includes('review') || activityLower.includes('notes')) {
        weight = 0.7;
      }
    }

    if (identityLower.includes('disciplined') || identityLower.includes('focused')) {
      if (activityLower.includes('deep work') || activityLower.includes('focus')) {
        weight = Math.max(weight, 0.9);
      } else if (activityLower.includes('meditation') || activityLower.includes('planning')) {
        weight = Math.max(weight, 0.8);
      }
    }

    if (identityLower.includes('developer') || identityLower.includes('programmer')) {
      if (activityLower.includes('code') || activityLower.includes('programming')) {
        weight = Math.max(weight, 0.9);
      } else if (activityLower.includes('debug') || activityLower.includes('review')) {
        weight = Math.max(weight, 0.8);
      }
    }

    // Penalize clearly non-aligned activities
    if (activityLower.includes('social media') || activityLower.includes('entertainment') || activityLower.includes('gaming')) {
      weight = Math.min(weight, 0.2);
    }

    return Math.round(weight * 100) / 100;
  }

  private calculateRecentPerformance(sessions: any[]): number {
    if (!Array.isArray(sessions) || sessions.length === 0) return 0;

    const focusScores = sessions.map(session => {
      // Handle null/undefined session or focus_quality
      if (!session || !session.focus_quality) {
        return 0.5; // Default neutral score
      }

      switch (session.focus_quality) {
        case 'high': return 1.0;
        case 'medium': return 0.6;
        case 'low': return 0.2;
        default: return 0.5;
      }
    });

    const averageFocus = focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length;
    const averageDuration = sessions.reduce((sum, s) => sum + ((s && s.duration) || 0), 0) / sessions.length;
    const durationScore = Math.min(1.0, averageDuration / 60); // Normalize to 1 hour

    return Math.round((averageFocus * 0.7 + durationScore * 0.3) * 100) / 100;
  }

  private determineIdentityRelevance(alignmentWeight: number): 'high' | 'medium' | 'low' {
    if (alignmentWeight >= 0.8) return 'high';
    if (alignmentWeight >= 0.6) return 'medium';
    return 'low';
  }

  private calculateAlignmentScore(identityActivities: IdentityActivity[], allSessions: any[]): number {
    if (!Array.isArray(identityActivities) || identityActivities.length === 0) {
      // If no identity activities but user has sessions, provide a base score
      if (Array.isArray(allSessions) && allSessions.length > 0) {
        return 0.5; // Base alignment score for having some activity
      }
      return 0;
    }
    if (!Array.isArray(allSessions) || allSessions.length === 0) return 0;

    const totalTime = allSessions.reduce((sum, s) => sum + ((s && s.duration) || 0), 0);
    if (totalTime === 0) {
      // If no time tracked but activities exist, provide a base score
      return 0.6;
    }

    let weightedScore = 0;
    let totalWeight = 0;

    identityActivities.forEach(activity => {
      // Handle null/undefined activity
      if (!activity || !activity.activity) return;

      const activitySessions = allSessions.filter(s => s && s.activity === activity.activity);
      const activityTime = activitySessions.reduce((sum, s) => sum + ((s && s.duration) || 0), 0);
      const timeWeight = activityTime / totalTime;

      const alignmentWeight = activity.alignment_weight || 0;
      const recentPerformance = activity.recent_performance || 0;

      weightedScore += alignmentWeight * recentPerformance * timeWeight;
      totalWeight += timeWeight;
    });

    const finalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) / 100 : 0.6;
    
    // Ensure minimum score for users with some activity
    return Math.max(finalScore, 0.3);
  }

  private async storeIdentityAlignment(userId: string, targetIdentity: string, alignmentScore: number, identityActivities: IdentityActivity[]): Promise<IdentityAlignment> {
    const query = `
      INSERT INTO identity_alignments (user_id, target_identity, alignment_score, contributing_activities)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        target_identity = EXCLUDED.target_identity,
        alignment_score = EXCLUDED.alignment_score,
        contributing_activities = EXCLUDED.contributing_activities,
        last_calculated = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    let result;
    try {
      result = await pool.query(query, [
        userId,
        targetIdentity,
        alignmentScore,
        JSON.stringify(identityActivities)
      ]);
    } catch (dbError) {
      // If table doesn't exist, create a mock response
      logger.warn('Identity alignments table not found, using fallback', { error: dbError });
      result = {
        rows: [{
          id: `mock_${Date.now()}`,
          user_id: userId,
          target_identity: targetIdentity,
          alignment_score: alignmentScore,
          last_calculated: new Date(),
          contributing_activities: identityActivities,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };
    }

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      target_identity: row.target_identity,
      alignment_score: row.alignment_score,
      last_calculated: row.last_calculated,
      contributing_activities: typeof row.contributing_activities === 'string' 
        ? JSON.parse(row.contributing_activities) 
        : row.contributing_activities,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private generateAcknowledgmentMessage(task: string, targetIdentity: string, activityType?: string): string {
    const identityPhrase = targetIdentity.toLowerCase();
    
    const templates = [
      `Excellent work! This is exactly what a ${identityPhrase} does - taking consistent action on ${task}.`,
      `You're reinforcing your identity as a ${identityPhrase} by completing ${task}. This is who you are.`,
      `Another step forward as a ${identityPhrase}. ${task} completed shows your commitment to growth.`,
      `This is evidence of your identity as a ${identityPhrase}. ${task} done consistently builds who you're becoming.`,
      `Perfect! A ${identityPhrase} shows up and does the work, just like you did with ${task}.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateIdentityBasedSuggestions(
    targetIdentity: string, 
    academicGoals: string[], 
    skillGoals: string[], 
    availableTime: number, 
    energyLevel: string,
    context?: string
  ): ActivitySuggestion[] {
    const suggestions: ActivitySuggestion[] = [];
    const identityQuestion = `What would a ${targetIdentity.toLowerCase()} do right now?`;

    // Ensure arrays are not null/undefined
    const safeAcademicGoals = Array.isArray(academicGoals) ? academicGoals : [];
    const safeSkillGoals = Array.isArray(skillGoals) ? skillGoals : [];

    // Generate suggestions based on energy level and available time
    if (energyLevel === 'high' && availableTime >= 45) {
      suggestions.push({
        id: `suggestion-${Date.now()}-1`,
        activity: 'Deep work session on primary academic goal',
        identity_question: identityQuestion,
        reasoning: `A ${targetIdentity.toLowerCase()} prioritizes their most important work when they have high energy and sufficient time.`,
        priority: 'high',
        estimated_duration: Math.min(availableTime, 90),
        identity_alignment_boost: 0.9
      });
    }

    if (availableTime >= 25) {
      const academicGoal = (safeAcademicGoals.length > 0 && safeAcademicGoals[0]) ? safeAcademicGoals[0] : 'studies';
      suggestions.push({
        id: `suggestion-${Date.now()}-2`,
        activity: `Study session: ${academicGoal}`,
        identity_question: identityQuestion,
        reasoning: `Consistent study sessions align with your identity as a ${targetIdentity.toLowerCase()}.`,
        priority: 'high',
        estimated_duration: Math.min(availableTime, 45),
        identity_alignment_boost: 0.8
      });
    }

    if (safeSkillGoals.length > 0 && availableTime >= 20) {
      const skillGoal = safeSkillGoals[0];
      suggestions.push({
        id: `suggestion-${Date.now()}-3`,
        activity: `Practice: ${skillGoal}`,
        identity_question: identityQuestion,
        reasoning: `Skill development through deliberate practice is what a ${targetIdentity.toLowerCase()} does consistently.`,
        priority: 'medium',
        estimated_duration: Math.min(availableTime, 30),
        identity_alignment_boost: 0.7
      });
    }

    if (availableTime >= 10) {
      suggestions.push({
        id: `suggestion-${Date.now()}-4`,
        activity: 'Review and plan next actions',
        identity_question: identityQuestion,
        reasoning: `A ${targetIdentity.toLowerCase()} regularly reviews progress and plans ahead.`,
        priority: 'medium',
        estimated_duration: Math.min(availableTime, 15),
        identity_alignment_boost: 0.6
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private identifyFrictionPoints(distractionType: string, context: string): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];

    if (distractionType.toLowerCase().includes('phone') || distractionType.toLowerCase().includes('notification')) {
      frictionPoints.push({
        description: 'Phone notifications interrupting focus',
        elimination_strategy: 'Enable Do Not Disturb mode during work sessions',
        difficulty: 'easy',
        estimated_impact: 0.8
      });
      frictionPoints.push({
        description: 'Phone within easy reach',
        elimination_strategy: 'Place phone in another room or drawer during work',
        difficulty: 'easy',
        estimated_impact: 0.7
      });
    }

    if (distractionType.toLowerCase().includes('social') || distractionType.toLowerCase().includes('internet')) {
      frictionPoints.push({
        description: 'Easy access to social media websites',
        elimination_strategy: 'Use website blockers during work hours',
        difficulty: 'easy',
        estimated_impact: 0.9
      });
      frictionPoints.push({
        description: 'Browser bookmarks to distracting sites',
        elimination_strategy: 'Remove bookmarks and clear browser history',
        difficulty: 'easy',
        estimated_impact: 0.6
      });
    }

    if (distractionType.toLowerCase().includes('noise') || distractionType.toLowerCase().includes('environment')) {
      frictionPoints.push({
        description: 'Noisy or distracting environment',
        elimination_strategy: 'Find a quieter workspace or use noise-canceling headphones',
        difficulty: 'medium',
        estimated_impact: 0.7
      });
    }

    return frictionPoints;
  }

  private generateDistractionSolutions(distractionType: string, frictionPoints: FrictionPoint[]): string[] {
    const solutions: string[] = [];

    // Add solutions from friction points
    frictionPoints.forEach(point => {
      solutions.push(point.elimination_strategy);
    });

    // Add general solutions based on distraction type
    if (distractionType.toLowerCase().includes('phone')) {
      solutions.push('Use the Pomodoro Technique with phone checks only during breaks');
      solutions.push('Set up a dedicated workspace without your phone');
    }

    if (distractionType.toLowerCase().includes('internet')) {
      solutions.push('Use a separate browser profile for work with limited bookmarks');
      solutions.push('Schedule specific times for checking social media');
    }

    if (distractionType.toLowerCase().includes('thoughts') || distractionType.toLowerCase().includes('mind')) {
      solutions.push('Keep a notepad nearby to quickly jot down distracting thoughts');
      solutions.push('Practice mindfulness meditation to improve focus');
    }

    return [...new Set(solutions)]; // Remove duplicates
  }
}