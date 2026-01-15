import pool from '../config/database';
import { 
  DeepWorkSession, 
  DeepWorkBlock,
  EnergyPattern,
  WorkQualityMeasurement,
  AttentionTrainingSession,
  AttentionMetrics,
  CognitiveOutputMetrics,
  ScheduleDeepWorkRequest,
  StartDeepWorkRequest,
  CompleteDeepWorkRequest,
  WorkQualityAssessmentRequest,
  AttentionTrainingRequest
} from '../types/deepWork';
import { logger } from '../utils/logger';

export class DeepWorkService {

  async analyzeEnergyPatterns(userId: string): Promise<EnergyPattern[]> {
    try {
      // Get historical activity data to analyze energy patterns
      const query = `
        SELECT 
          EXTRACT(HOUR FROM start_time) as hour,
          EXTRACT(DOW FROM start_time) as day_of_week,
          focus_quality,
          duration,
          distractions,
          start_time
        FROM activity_sessions 
        WHERE user_id = $1 
          AND end_time IS NOT NULL 
          AND start_time >= NOW() - INTERVAL '30 days'
        ORDER BY start_time
      `;

      const result = await pool.query(query, [userId]);
      const sessions = result.rows;

      // Group by time slot and day of week
      const patterns: Record<string, {
        energy_sum: number;
        cognitive_sum: number;
        performance_sum: number;
        count: number;
      }> = {};

      sessions.forEach(session => {
        const hour = Math.floor(session.hour);
        const dayOfWeek = this.getDayName(session.day_of_week);
        const key = `${hour}:00-${dayOfWeek}`;

        if (!patterns[key]) {
          patterns[key] = { energy_sum: 0, cognitive_sum: 0, performance_sum: 0, count: 0 };
        }

        // Calculate energy level based on focus quality and duration
        const energyScore = this.calculateEnergyScore(session.focus_quality, session.duration, session.distractions);
        const cognitiveScore = this.calculateCognitiveCapacity(session.focus_quality, session.duration);
        const performanceScore = this.calculatePerformanceScore(session.focus_quality, session.duration, session.distractions);

        patterns[key].energy_sum += energyScore;
        patterns[key].cognitive_sum += cognitiveScore;
        patterns[key].performance_sum += performanceScore;
        patterns[key].count += 1;
      });

      // Convert to EnergyPattern array
      const energyPatterns: EnergyPattern[] = Object.entries(patterns).map(([key, data]) => {
        const [timeSlot, dayOfWeek] = key.split('-');
        return {
          time_slot: timeSlot,
          day_of_week: dayOfWeek,
          energy_level: Math.round((data.energy_sum / data.count) * 100) / 100,
          cognitive_capacity: Math.round((data.cognitive_sum / data.count) * 100) / 100,
          historical_performance: Math.round((data.performance_sum / data.count) * 100) / 100,
          sample_size: data.count,
          last_updated: new Date()
        };
      });

      logger.info('Energy patterns analyzed', { userId, patternsCount: energyPatterns.length });
      return energyPatterns;
    } catch (error) {
      logger.error('Error analyzing energy patterns:', error);
      throw new Error('Failed to analyze energy patterns');
    }
  }

  async scheduleDeepWork(userId: string, request: ScheduleDeepWorkRequest): Promise<DeepWorkSession> {
    try {
      // Get energy patterns to find optimal time slot
      const energyPatterns = await this.analyzeEnergyPatterns(userId);
      const optimalTimeSlot = await this.findOptimalTimeSlot(
        userId, 
        request.planned_duration, 
        request.energy_requirement,
        request.preferred_time_slots,
        energyPatterns
      );

      // Create deep work session
      const preparationTime = request.preparation_time || this.calculatePreparationTime(request.cognitive_load);
      const plannedStartTime = new Date();
      plannedStartTime.setHours(parseInt(optimalTimeSlot.split(':')[0]), parseInt(optimalTimeSlot.split(':')[1] || '0'), 0, 0);
      
      const plannedEndTime = new Date(plannedStartTime);
      plannedEndTime.setMinutes(plannedEndTime.getMinutes() + request.planned_duration);

      const query = `
        INSERT INTO deep_work_sessions (
          user_id, planned_start_time, planned_end_time, planned_duration,
          activity, preparation_time, cognitive_load, energy_requirement,
          priority, status, preparation_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        plannedStartTime,
        plannedEndTime,
        request.planned_duration,
        request.activity,
        preparationTime,
        request.cognitive_load,
        request.energy_requirement,
        request.priority,
        request.preparation_notes
      ]);

      const session = this.formatDeepWorkSessionFromDb(result.rows[0]);

      // Create protected deep work block
      await this.createProtectedBlock(userId, session);

      logger.info('Deep work session scheduled', { 
        userId, 
        sessionId: session.id, 
        timeSlot: optimalTimeSlot 
      });

      return session;
    } catch (error) {
      logger.error('Error scheduling deep work:', error);
      throw new Error('Failed to schedule deep work session');
    }
  }

  async startDeepWorkSession(userId: string, request: StartDeepWorkRequest): Promise<DeepWorkSession> {
    try {
      const session = await this.getDeepWorkSession(request.session_id);
      
      if (!session || session.user_id !== userId) {
        throw new Error('Session not found or access denied');
      }

      if (session.status !== 'scheduled' && session.status !== 'preparing') {
        throw new Error('Session cannot be started in current status');
      }

      const query = `
        UPDATE deep_work_sessions 
        SET actual_start_time = NOW(), status = 'active', preparation_notes = COALESCE($1, preparation_notes)
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [
        request.preparation_notes,
        request.session_id,
        userId
      ]);

      const updatedSession = this.formatDeepWorkSessionFromDb(result.rows[0]);

      logger.info('Deep work session started', { 
        userId, 
        sessionId: request.session_id 
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error starting deep work session:', error);
      throw new Error('Failed to start deep work session');
    }
  }

  async completeDeepWorkSession(userId: string, request: CompleteDeepWorkRequest): Promise<DeepWorkSession> {
    try {
      const session = await this.getDeepWorkSession(request.session_id);
      
      if (!session || session.user_id !== userId) {
        throw new Error('Session not found or access denied');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not currently active');
      }

      const actualEndTime = new Date();
      const actualDuration = session.actual_start_time 
        ? Math.round((actualEndTime.getTime() - session.actual_start_time.getTime()) / (1000 * 60))
        : session.planned_duration;

      const query = `
        UPDATE deep_work_sessions 
        SET 
          actual_end_time = $1,
          actual_duration = $2,
          status = 'completed',
          work_quality_score = $3,
          cognitive_output_metrics = $4,
          interruptions = $5,
          session_notes = $6
        WHERE id = $7 AND user_id = $8
        RETURNING *
      `;

      const result = await pool.query(query, [
        actualEndTime,
        actualDuration,
        request.work_quality_score,
        JSON.stringify(request.cognitive_output_metrics),
        request.interruptions,
        request.session_notes,
        request.session_id,
        userId
      ]);

      const updatedSession = this.formatDeepWorkSessionFromDb(result.rows[0]);

      // Record work quality measurement
      await this.recordWorkQualityMeasurement(userId, request.session_id, request.cognitive_output_metrics);

      logger.info('Deep work session completed', { 
        userId, 
        sessionId: request.session_id,
        actualDuration,
        qualityScore: request.work_quality_score
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error completing deep work session:', error);
      throw new Error('Failed to complete deep work session');
    }
  }

  async getOptimalTimeSlots(userId: string, date: Date): Promise<Array<{ time_slot: string; energy_prediction: number; cognitive_capacity: number; confidence_score: number; reasoning: string }>> {
    try {
      const energyPatterns = await this.analyzeEnergyPatterns(userId);
      const dayOfWeek = this.getDayName(date.getDay());

      // Filter patterns for the specific day
      const dayPatterns = energyPatterns.filter(pattern => pattern.day_of_week === dayOfWeek);

      // Sort by energy level and cognitive capacity
      const optimalSlots = dayPatterns
        .map(pattern => {
          const confidenceScore = Math.min(100, (pattern.sample_size / 10) * 100); // Higher confidence with more data
          const combinedScore = (pattern.energy_level + pattern.cognitive_capacity + pattern.historical_performance) / 3;
          
          let reasoning = `Based on ${pattern.sample_size} historical sessions. `;
          if (pattern.energy_level >= 4) reasoning += 'High energy period. ';
          if (pattern.cognitive_capacity >= 4) reasoning += 'Strong cognitive capacity. ';
          if (pattern.historical_performance >= 4) reasoning += 'Historically productive time.';

          return {
            time_slot: pattern.time_slot,
            energy_prediction: pattern.energy_level,
            cognitive_capacity: pattern.cognitive_capacity,
            confidence_score: Math.round(confidenceScore),
            reasoning: reasoning.trim()
          };
        })
        .sort((a, b) => (b.energy_prediction + b.cognitive_capacity) - (a.energy_prediction + a.cognitive_capacity))
        .slice(0, 5); // Return top 5 slots

      return optimalSlots;
    } catch (error) {
      logger.error('Error getting optimal time slots:', error);
      throw new Error('Failed to get optimal time slots');
    }
  }

  async recordWorkQualityAssessment(userId: string, request: WorkQualityAssessmentRequest): Promise<WorkQualityMeasurement> {
    try {
      const overallScore = (
        request.focus_depth + 
        request.cognitive_load_handled + 
        request.output_quality + 
        request.mental_clarity + 
        request.problem_complexity + 
        request.creative_output
      ) / 6;

      const query = `
        INSERT INTO work_quality_measurements (
          session_id, user_id, measurement_time, focus_depth,
          cognitive_load_handled, output_quality, mental_clarity,
          problem_complexity, creative_output, overall_score, notes
        )
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        request.session_id,
        userId,
        request.focus_depth,
        request.cognitive_load_handled,
        request.output_quality,
        request.mental_clarity,
        request.problem_complexity,
        request.creative_output,
        overallScore,
        request.notes
      ]);

      const measurement = this.formatWorkQualityMeasurementFromDb(result.rows[0]);

      logger.info('Work quality assessment recorded', { 
        userId, 
        sessionId: request.session_id,
        overallScore 
      });

      return measurement;
    } catch (error) {
      logger.error('Error recording work quality assessment:', error);
      throw new Error('Failed to record work quality assessment');
    }
  }

  async createAttentionTrainingSession(userId: string, request: AttentionTrainingRequest): Promise<AttentionTrainingSession> {
    try {
      // Get current attention metrics for baseline comparison
      const currentMetrics = await this.getAttentionMetrics(userId);
      
      // Simulate training session (in real implementation, this would integrate with actual training exercises)
      const performanceScore = this.simulateTrainingPerformance(request.difficulty_level);
      const attentionSpanMeasured = this.simulateAttentionSpanMeasurement(request.duration, performanceScore);
      
      const improvementFromBaseline = currentMetrics 
        ? ((attentionSpanMeasured - currentMetrics.baseline_attention_span) / currentMetrics.baseline_attention_span) * 100
        : 0;

      const query = `
        INSERT INTO attention_training_sessions (
          user_id, exercise_type, duration, difficulty_level,
          performance_score, attention_span_measured, improvement_from_baseline
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        request.exercise_type,
        request.duration,
        request.difficulty_level,
        performanceScore,
        attentionSpanMeasured,
        improvementFromBaseline
      ]);

      const session = this.formatAttentionTrainingSessionFromDb(result.rows[0]);

      // Update attention metrics
      await this.updateAttentionMetrics(userId);

      logger.info('Attention training session created', { 
        userId, 
        exerciseType: request.exercise_type,
        performanceScore 
      });

      return session;
    } catch (error) {
      logger.error('Error creating attention training session:', error);
      throw new Error('Failed to create attention training session');
    }
  }

  async getAttentionMetrics(userId: string): Promise<AttentionMetrics | null> {
    try {
      const query = `
        SELECT * FROM attention_metrics 
        WHERE user_id = $1 
        ORDER BY last_assessment_date DESC 
        LIMIT 1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatAttentionMetricsFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting attention metrics:', error);
      throw new Error('Failed to get attention metrics');
    }
  }

  async getDeepWorkAnalytics(userId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sessions,
          AVG(actual_duration) as avg_duration,
          AVG(work_quality_score) as avg_quality,
          SUM(actual_duration) as total_minutes,
          AVG(interruptions) as avg_interruptions
        FROM deep_work_sessions 
        WHERE user_id = $1 
          AND status = 'completed'
          AND actual_start_time >= $2 
          AND actual_start_time <= $3
      `;

      const result = await pool.query(query, [userId, startDate, endDate]);
      const stats = result.rows[0];

      const totalHours = (stats.total_minutes || 0) / 60;
      const energyPatterns = await this.analyzeEnergyPatterns(userId);
      const attentionMetrics = await this.getAttentionMetrics(userId);

      // Get optimal time slots
      const optimalSlots = energyPatterns
        .sort((a, b) => (b.energy_level + b.cognitive_capacity) - (a.energy_level + a.cognitive_capacity))
        .slice(0, 3)
        .map(p => p.time_slot);

      return {
        total_deep_work_hours: Math.round(totalHours * 100) / 100,
        average_session_quality: Math.round((stats.avg_quality || 0) * 100) / 100,
        optimal_time_slots: optimalSlots,
        energy_pattern_insights: this.generateEnergyInsights(energyPatterns),
        productivity_trends: {
          weekly_average: Math.round((totalHours / 7) * 100) / 100,
          monthly_trend: this.calculateTrend(userId, 'monthly'),
          best_performing_days: this.getBestPerformingDays(energyPatterns)
        },
        attention_metrics: attentionMetrics
      };
    } catch (error) {
      logger.error('Error getting deep work analytics:', error);
      throw new Error('Failed to get deep work analytics');
    }
  }

  // Private helper methods

  private async findOptimalTimeSlot(
    userId: string, 
    duration: number, 
    energyRequirement: string,
    preferredSlots?: string[],
    energyPatterns?: EnergyPattern[]
  ): Promise<string> {
    const patterns = energyPatterns || await this.analyzeEnergyPatterns(userId);
    
    // Filter by energy requirement
    const minEnergyLevel = energyRequirement === 'high' ? 4 : energyRequirement === 'medium' ? 3 : 2;
    const suitablePatterns = patterns.filter(p => p.energy_level >= minEnergyLevel);

    // Prefer user's preferred slots if provided
    if (preferredSlots && preferredSlots.length > 0) {
      const preferredPattern = suitablePatterns.find(p => preferredSlots.includes(p.time_slot));
      if (preferredPattern) {
        return preferredPattern.time_slot;
      }
    }

    // Return the slot with highest combined energy and cognitive capacity
    const optimalPattern = suitablePatterns
      .sort((a, b) => (b.energy_level + b.cognitive_capacity) - (a.energy_level + a.cognitive_capacity))[0];

    return optimalPattern?.time_slot || '09:00'; // Default fallback
  }

  private calculatePreparationTime(cognitiveLoad: string): number {
    switch (cognitiveLoad) {
      case 'heavy': return 15;
      case 'medium': return 10;
      case 'light': return 5;
      default: return 10;
    }
  }

  private async createProtectedBlock(userId: string, session: DeepWorkSession): Promise<void> {
    const protectionLevel = session.priority === 'critical' ? 'hard' : 
                           session.priority === 'high' ? 'medium' : 'soft';

    const query = `
      INSERT INTO deep_work_blocks (
        user_id, date, start_time, end_time, duration,
        energy_level, cognitive_capacity, is_protected,
        protection_level, assigned_session_id
      )
      VALUES ($1, $2, $3, $4, $5, 4, 4, true, $6, $7)
    `;

    await pool.query(query, [
      userId,
      session.planned_start_time,
      session.planned_start_time.toTimeString().slice(0, 5),
      session.planned_end_time.toTimeString().slice(0, 5),
      session.planned_duration,
      protectionLevel,
      session.id
    ]);
  }

  private async recordWorkQualityMeasurement(userId: string, sessionId: string, metrics: CognitiveOutputMetrics): Promise<void> {
    const overallScore = (
      this.mapComplexityToScore(metrics.complexity_handled) +
      metrics.problem_solving_depth +
      metrics.decision_quality +
      (5 - metrics.mental_fatigue_level) + // Invert fatigue
      (metrics.flow_state_achieved ? 5 : 2)
    ) / 5;

    const query = `
      INSERT INTO work_quality_measurements (
        session_id, user_id, measurement_time, focus_depth,
        cognitive_load_handled, output_quality, mental_clarity,
        problem_complexity, creative_output, overall_score
      )
      VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)
    `;

    await pool.query(query, [
      sessionId,
      userId,
      metrics.flow_state_achieved ? 9 : 6,
      this.mapComplexityToScore(metrics.complexity_handled),
      metrics.decision_quality * 2, // Scale to 10
      5 - metrics.mental_fatigue_level, // Invert and scale
      metrics.problem_solving_depth * 2, // Scale to 10
      metrics.creative_insights * 2, // Scale to 10
      overallScore
    ]);
  }

  private async updateAttentionMetrics(userId: string): Promise<void> {
    // Get recent training sessions
    const query = `
      SELECT 
        AVG(attention_span_measured) as avg_span,
        COUNT(*) as session_count,
        AVG(performance_score) as avg_performance
      FROM attention_training_sessions 
      WHERE user_id = $1 
        AND completed_at >= NOW() - INTERVAL '30 days'
    `;

    const result = await pool.query(query, [userId]);
    const stats = result.rows[0];

    const currentMetrics = await this.getAttentionMetrics(userId);
    const baselineSpan = currentMetrics?.baseline_attention_span || 15; // Default 15 minutes
    const currentSpan = stats.avg_span || baselineSpan;
    const improvement = ((currentSpan - baselineSpan) / baselineSpan) * 100;

    const upsertQuery = `
      INSERT INTO attention_metrics (
        user_id, baseline_attention_span, current_attention_span,
        improvement_percentage, consistency_score, training_sessions_completed,
        last_assessment_date, trend
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      ON CONFLICT (user_id) DO UPDATE SET
        current_attention_span = $3,
        improvement_percentage = $4,
        consistency_score = $5,
        training_sessions_completed = $6,
        last_assessment_date = NOW(),
        trend = $7
    `;

    const trend = improvement > 10 ? 'improving' : improvement < -10 ? 'declining' : 'stable';

    await pool.query(upsertQuery, [
      userId,
      baselineSpan,
      currentSpan,
      improvement,
      stats.avg_performance || 50,
      stats.session_count || 0,
      trend
    ]);
  }

  private async getDeepWorkSession(sessionId: string): Promise<DeepWorkSession | null> {
    try {
      const query = 'SELECT * FROM deep_work_sessions WHERE id = $1';
      const result = await pool.query(query, [sessionId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatDeepWorkSessionFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting deep work session:', error);
      throw new Error('Failed to get deep work session');
    }
  }

  // Utility methods
  private getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber] || 'monday';
  }

  private calculateEnergyScore(focusQuality: string, duration: number, distractions: number): number {
    let baseScore = 3; // Default medium energy
    
    if (focusQuality === 'high') baseScore = 5;
    else if (focusQuality === 'medium') baseScore = 3;
    else baseScore = 1;

    // Adjust for duration (longer sessions with good focus indicate higher energy)
    if (duration > 60 && focusQuality === 'high') baseScore = Math.min(5, baseScore + 0.5);
    
    // Penalize for distractions
    baseScore = Math.max(1, baseScore - (distractions * 0.2));

    return baseScore;
  }

  private calculateCognitiveCapacity(focusQuality: string, duration: number): number {
    let baseScore = 3;
    
    if (focusQuality === 'high' && duration > 45) baseScore = 5;
    else if (focusQuality === 'high') baseScore = 4;
    else if (focusQuality === 'medium') baseScore = 3;
    else baseScore = 2;

    return baseScore;
  }

  private calculatePerformanceScore(focusQuality: string, duration: number, distractions: number): number {
    const focusScore = focusQuality === 'high' ? 5 : focusQuality === 'medium' ? 3 : 1;
    const durationScore = Math.min(5, duration / 30); // Normalize to 150 minutes max
    const distractionPenalty = Math.max(0, 5 - distractions);
    
    return (focusScore + durationScore + distractionPenalty) / 3;
  }

  private simulateTrainingPerformance(difficultyLevel: number): number {
    // Simulate performance based on difficulty (in real implementation, this would come from actual exercises)
    const basePerformance = 70;
    const difficultyPenalty = (difficultyLevel - 1) * 10;
    const randomVariation = (Math.random() - 0.5) * 20;
    
    return Math.max(0, Math.min(100, basePerformance - difficultyPenalty + randomVariation));
  }

  private simulateAttentionSpanMeasurement(duration: number, performanceScore: number): number {
    // Simulate attention span measurement based on performance
    const baseSpan = 15; // 15 minutes baseline
    const performanceBonus = (performanceScore - 50) / 10; // Scale performance to minutes
    
    return Math.max(5, baseSpan + performanceBonus);
  }

  private mapComplexityToScore(complexity: string): number {
    switch (complexity) {
      case 'high': return 8;
      case 'medium': return 5;
      case 'low': return 3;
      default: return 5;
    }
  }

  private generateEnergyInsights(patterns: EnergyPattern[]): string[] {
    const insights: string[] = [];
    
    const highEnergySlots = patterns.filter(p => p.energy_level >= 4);
    if (highEnergySlots.length > 0) {
      insights.push(`Your peak energy times are: ${highEnergySlots.map(p => p.time_slot).join(', ')}`);
    }

    const lowEnergySlots = patterns.filter(p => p.energy_level <= 2);
    if (lowEnergySlots.length > 0) {
      insights.push(`Consider avoiding deep work during: ${lowEnergySlots.map(p => p.time_slot).join(', ')}`);
    }

    return insights;
  }

  private calculateTrend(userId: string, period: string): 'improving' | 'stable' | 'declining' {
    // Simplified trend calculation (in real implementation, this would analyze historical data)
    return 'stable';
  }

  private getBestPerformingDays(patterns: EnergyPattern[]): string[] {
    const dayAverages: Record<string, number> = {};
    
    patterns.forEach(pattern => {
      if (!dayAverages[pattern.day_of_week]) {
        dayAverages[pattern.day_of_week] = 0;
      }
      dayAverages[pattern.day_of_week] += pattern.historical_performance;
    });

    return Object.entries(dayAverages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
  }

  // Formatting methods
  private formatDeepWorkSessionFromDb(row: any): DeepWorkSession {
    return {
      id: row.id,
      user_id: row.user_id,
      planned_start_time: row.planned_start_time,
      planned_end_time: row.planned_end_time,
      actual_start_time: row.actual_start_time,
      actual_end_time: row.actual_end_time,
      planned_duration: row.planned_duration,
      actual_duration: row.actual_duration,
      activity: row.activity,
      preparation_time: row.preparation_time,
      cognitive_load: row.cognitive_load,
      energy_requirement: row.energy_requirement,
      priority: row.priority,
      status: row.status,
      work_quality_score: row.work_quality_score,
      cognitive_output_metrics: row.cognitive_output_metrics ? JSON.parse(row.cognitive_output_metrics) : undefined,
      interruptions: row.interruptions || 0,
      preparation_notes: row.preparation_notes,
      session_notes: row.session_notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private formatWorkQualityMeasurementFromDb(row: any): WorkQualityMeasurement {
    return {
      session_id: row.session_id,
      user_id: row.user_id,
      measurement_time: row.measurement_time,
      focus_depth: row.focus_depth,
      cognitive_load_handled: row.cognitive_load_handled,
      output_quality: row.output_quality,
      mental_clarity: row.mental_clarity,
      problem_complexity: row.problem_complexity,
      creative_output: row.creative_output,
      overall_score: row.overall_score,
      notes: row.notes
    };
  }

  private formatAttentionTrainingSessionFromDb(row: any): AttentionTrainingSession {
    return {
      id: row.id,
      user_id: row.user_id,
      exercise_type: row.exercise_type,
      duration: row.duration,
      difficulty_level: row.difficulty_level,
      performance_score: row.performance_score,
      attention_span_measured: row.attention_span_measured,
      improvement_from_baseline: row.improvement_from_baseline,
      completed_at: row.completed_at,
      notes: row.notes
    };
  }

  private formatAttentionMetricsFromDb(row: any): AttentionMetrics {
    return {
      user_id: row.user_id,
      baseline_attention_span: row.baseline_attention_span,
      current_attention_span: row.current_attention_span,
      improvement_percentage: row.improvement_percentage,
      consistency_score: row.consistency_score,
      training_sessions_completed: row.training_sessions_completed,
      last_assessment_date: row.last_assessment_date,
      trend: row.trend
    };
  }
}