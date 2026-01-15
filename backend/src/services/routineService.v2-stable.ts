import { query } from '../config/database';
import { 
  DailyRoutine, 
  RoutineSegment, 
  TimeSlot,
  RoutineGenerationRequest,
  RoutineGenerationContext,
  PerformanceData,
  RoutineComplexity,
  ActivityDistribution,
  RoutineAdaptation,
  CreateRoutineRequest,
  RoutineResponse,
  RoutineUpdateRequest,
  ContextualFactors
} from '../types/routine';
import { UserProfile } from '../types/profile';
import { ProfileService } from './profileService';
import { logger } from '../utils/logger';

export class RoutineService {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async generateDailyRoutine(userId: string, request: CreateRoutineRequest): Promise<RoutineResponse> {
    try {
      // Get user profile
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found. Please create a profile first.');
      }

      // Validate profile has required fields
      const profile = profileResponse.profile;
      if (!profile.academic_goals || profile.academic_goals.length === 0) {
        throw new Error('Profile missing academic goals. Please complete your profile.');
      }
      if (!profile.skill_goals || profile.skill_goals.length === 0) {
        throw new Error('Profile missing skill goals. Please complete your profile.');
      }
      if (!profile.wake_up_time || !profile.sleep_time) {
        throw new Error('Profile missing schedule information. Please complete your profile.');
      }
      if (!profile.available_hours || profile.available_hours <= 0) {
        throw new Error('Profile missing available hours. Please complete your profile.');
      }

      // Check if routine already exists for this date
      const existingRoutine = await this.getRoutineByDate(userId, new Date(request.date));
      if (existingRoutine) {
        return {
          routine: existingRoutine,
          complexity_level: this.determineComplexityLevel(existingRoutine.segments).level,
          adaptations_applied: existingRoutine.adaptations || [],
          estimated_completion_time: this.calculateEstimatedTime(existingRoutine.segments)
        };
      }

      // Build generation context
      const context = await this.buildGenerationContext(userId, profile);
      
      // Generate routine
      const routine = await this.createRoutine(userId, request, context);
      
      // Store routine in database
      const savedRoutine = await this.saveRoutine(routine);

      return {
        routine: savedRoutine,
        complexity_level: this.determineComplexityLevel(savedRoutine.segments).level,
        adaptations_applied: savedRoutine.adaptations || [],
        estimated_completion_time: this.calculateEstimatedTime(savedRoutine.segments)
      };
    } catch (error) {
      logger.error('Error generating daily routine:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Profile not found') || error.message.includes('Profile missing')) {
          throw error; // Re-throw profile-related errors as-is
        }
      }
      
      throw new Error('Failed to generate daily routine. Please ensure your profile is complete.');
    }
  }

  async getRoutineByDate(userId: string, date: Date): Promise<DailyRoutine | null> {
    const queryText = 'SELECT * FROM daily_routines WHERE user_id = $1 AND date = $2';
    
    try {
      const result = await query(queryText, [userId, date.toISOString().split('T')[0]]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatRoutineFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching routine by date:', error);
      throw new Error('Failed to fetch routine');
    }
  }

  async updateRoutineSegment(userId: string, routineId: string, update: RoutineUpdateRequest): Promise<void> {
    try {
      // Get current routine
      const routine = await this.getRoutineById(routineId);
      if (!routine || routine.user_id !== userId) {
        throw new Error('Routine not found or access denied');
      }

      // Update the specific segment
      const updatedSegments = routine.segments.map(segment => {
        if (segment.id === update.segment_id) {
          return {
            ...segment,
            completed: update.completed ?? segment.completed,
            // Store additional tracking data in notes or separate table
          };
        }
        return segment;
      });

      // Update routine in database
      const queryText = `
        UPDATE daily_routines 
        SET segments = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
      `;

      await query(queryText, [JSON.stringify(updatedSegments), routineId, userId]);

      // Track behavioral data for adaptation
      if (update.completed !== undefined) {
        await this.profileService.trackBehavioralEvent(
          userId,
          'segment_completion',
          {
            segment_id: update.segment_id,
            completed: update.completed,
            actual_duration: update.actual_duration,
            focus_quality: update.focus_quality
          },
          { routine_id: routineId, date: routine.date }
        );
      }

      logger.info('Routine segment updated', { userId, routineId, segmentId: update.segment_id });
    } catch (error) {
      logger.error('Error updating routine segment:', error);
      throw new Error('Failed to update routine segment');
    }
  }

  private async createRoutine(
    userId: string, 
    request: CreateRoutineRequest, 
    context: RoutineGenerationContext
  ): Promise<DailyRoutine> {
    const { user_profile, historical_performance, contextual_factors } = context;
    
    // Determine routine complexity based on performance
    const complexity = this.determineComplexityLevel([], historical_performance);
    
    // Calculate activity distribution
    const distribution = this.calculateActivityDistribution(user_profile, complexity);
    
    // Generate time slots based on user's schedule
    const timeSlots = this.generateTimeSlots(user_profile, request.available_time_override);
    
    // Create routine segments
    const segments = this.createRoutineSegments(
      timeSlots,
      distribution,
      user_profile,
      complexity,
      contextual_factors
    );

    // Apply adaptations based on historical data
    const adaptations = this.generateAdaptations(historical_performance, contextual_factors);

    return {
      id: '', // Will be set when saved to DB
      user_id: userId,
      date: new Date(request.date),
      segments,
      adaptations: adaptations.map(a => a.description),
      completed: false,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private determineComplexityLevel(
    segments: RoutineSegment[], 
    performance?: PerformanceData
  ): RoutineComplexity {
    if (!performance) {
      // Default to moderate complexity for new users
      return {
        level: 'moderate',
        task_count: 6,
        deep_work_blocks: 2,
        break_frequency: 90, // minutes between breaks
        multitasking_allowed: false
      };
    }

    // Simplify if recent performance is poor
    if (performance.completion_rate < 0.6 || performance.recent_failures > 3) {
      return {
        level: 'simple',
        task_count: 4,
        deep_work_blocks: 1,
        break_frequency: 60,
        multitasking_allowed: false
      };
    }

    // Increase complexity if performance is consistently good
    if (performance.completion_rate > 0.8 && performance.consistency_score > 0.75) {
      return {
        level: 'complex',
        task_count: 8,
        deep_work_blocks: 3,
        break_frequency: 120,
        multitasking_allowed: true
      };
    }

    // Default moderate complexity
    return {
      level: 'moderate',
      task_count: 6,
      deep_work_blocks: 2,
      break_frequency: 90,
      multitasking_allowed: false
    };
  }

  private calculateActivityDistribution(
    profile: UserProfile, 
    complexity: RoutineComplexity
  ): ActivityDistribution {
    // Base distribution
    let distribution: ActivityDistribution = {
      deep_work_percentage: 40,
      study_percentage: 30,
      skill_practice_percentage: 15,
      break_percentage: 10,
      personal_percentage: 5
    };

    // Adjust based on complexity
    if (complexity.level === 'simple') {
      distribution.deep_work_percentage = 30;
      distribution.break_percentage = 20;
    } else if (complexity.level === 'complex') {
      distribution.deep_work_percentage = 50;
      distribution.break_percentage = 5;
    }

    // Adjust based on user goals and preferences (with null checks)
    const academicGoalsCount = profile.academic_goals ? profile.academic_goals.length : 0;
    const skillGoalsCount = profile.skill_goals ? profile.skill_goals.length : 0;
    
    if (academicGoalsCount > skillGoalsCount) {
      distribution.study_percentage += 10;
      distribution.skill_practice_percentage -= 10;
    } else if (skillGoalsCount > academicGoalsCount) {
      distribution.skill_practice_percentage += 10;
      distribution.study_percentage -= 10;
    }

    return distribution;
  }

  private generateTimeSlots(profile: UserProfile, availableTimeOverride?: number): TimeSlot[] {
    const wakeTime = this.parseTime(profile.wake_up_time);
    let sleepTime = this.parseTime(profile.sleep_time);
    const availableHours = availableTimeOverride || profile.available_hours;

    // Handle sleep time crossing midnight (e.g., 02:20 is next day)
    if (sleepTime < wakeTime) {
      sleepTime += 24 * 60; // Add 24 hours in minutes
    }

    // Create exactly 3 time slots: morning, afternoon, evening
    const slots: TimeSlot[] = [];
    const totalMinutes = availableHours * 60;
    const segmentDuration = Math.floor(totalMinutes / 3); // Divide available time into 3 segments

    // Morning slot (starts at wake time)
    const morningStart = wakeTime;
    const morningEnd = morningStart + segmentDuration;
    slots.push({
      start_time: this.formatTime(morningStart),
      end_time: this.formatTime(morningEnd)
    });

    // Afternoon slot (with 30 min buffer)
    const afternoonStart = morningEnd + 30;
    const afternoonEnd = afternoonStart + segmentDuration;
    slots.push({
      start_time: this.formatTime(afternoonStart),
      end_time: this.formatTime(afternoonEnd)
    });

    // Evening slot (with 30 min buffer)
    const eveningStart = afternoonEnd + 30;
    const eveningEnd = Math.min(eveningStart + segmentDuration, sleepTime);
    slots.push({
      start_time: this.formatTime(eveningStart),
      end_time: this.formatTime(eveningEnd)
    });

    return slots;
  }

  private createRoutineSegments(
    timeSlots: TimeSlot[],
    distribution: ActivityDistribution,
    profile: UserProfile,
    complexity: RoutineComplexity,
    contextualFactors?: ContextualFactors
  ): RoutineSegment[] {
    const segments: RoutineSegment[] = [];

    // Ensure we have exactly 3 time slots
    if (timeSlots.length !== 3) {
      throw new Error('Expected exactly 3 time slots for morning, afternoon, and evening');
    }

    // Define activity types for each segment based on energy patterns
    // Rotate between different activity types to use both academic and skill goals
    const segmentTypes: Array<{ type: RoutineSegment['type'], priority: RoutineSegment['priority'] }> = [
      { type: 'deep_work', priority: 'high' },       // Morning - highest energy, academic focus
      { type: 'skill_practice', priority: 'high' },  // Afternoon - skill development
      { type: 'study', priority: 'medium' }          // Evening - lighter study/review
    ];

    // Create segments for morning, afternoon, evening
    timeSlots.forEach((timeSlot, index) => {
      const segmentInfo = segmentTypes[index];
      
      segments.push({
        id: `segment_${index + 1}`,
        timeSlot: {  // Use camelCase for test compatibility
          start: timeSlot.start_time,
          end: timeSlot.end_time
        },
        time_slot: timeSlot, // Keep snake_case for database compatibility
        type: segmentInfo.type,
        activity: this.generateActivityDescription(segmentInfo.type, profile, contextualFactors),
        duration: this.calculateSlotDuration(timeSlot),
        priority: segmentInfo.priority,
        completed: false
      });
    });

    return segments;
  }

  private generateActivityDescription(
    type: RoutineSegment['type'], 
    profile: UserProfile,
    contextualFactors?: ContextualFactors
  ): string {
    switch (type) {
      case 'deep_work':
        if (profile.academic_goals && profile.academic_goals.length > 0) {
          const academicGoal = profile.academic_goals[Math.floor(Math.random() * profile.academic_goals.length)];
          return `Deep work session: ${academicGoal}`;
        }
        return 'Deep work session: Focus on academic priorities';
      
      case 'study':
        if (profile.academic_goals && profile.academic_goals.length > 0) {
          const studyGoal = profile.academic_goals[Math.floor(Math.random() * profile.academic_goals.length)];
          return `Study session: ${studyGoal}`;
        }
        return 'Study session: Review course materials';
      
      case 'skill_practice':
        if (profile.skill_goals && profile.skill_goals.length > 0) {
          const skillGoal = profile.skill_goals[Math.floor(Math.random() * profile.skill_goals.length)];
          return `Skill practice: ${skillGoal}`;
        }
        return 'Skill practice: Work on personal development';
      
      case 'break':
        return 'Mindful break - walk, stretch, or meditate';
      
      case 'personal':
        return 'Personal time - meals, hygiene, or light tasks';
      
      default:
        return 'General activity';
    }
  }

  private optimizeSegmentOrder(segments: RoutineSegment[], profile: UserProfile): RoutineSegment[] {
    // Sort segments to align with energy patterns
    const energyPattern = profile.energy_pattern || [];
    
    // Place high-priority tasks during high-energy times
    const optimizedSegments = [...segments];
    
    // Simple optimization: put deep work in morning, breaks in afternoon
    optimizedSegments.sort((a, b) => {
      if (a.type === 'deep_work' && b.type !== 'deep_work') return -1;
      if (b.type === 'deep_work' && a.type !== 'deep_work') return 1;
      if (a.type === 'break' && b.type !== 'break') return 1;
      if (b.type === 'break' && a.type !== 'break') return -1;
      return 0;
    });

    return optimizedSegments;
  }

  private generateAdaptations(
    performance?: PerformanceData,
    contextualFactors?: ContextualFactors
  ): RoutineAdaptation[] {
    const adaptations: RoutineAdaptation[] = [];

    if (performance) {
      if (performance.completion_rate < 0.6) {
        adaptations.push({
          trigger: 'low_completion_rate',
          adaptation_type: 'simplify',
          description: 'Reduced task complexity due to recent completion challenges'
        });
      }

      if (performance.average_focus_quality < 0.5) {
        adaptations.push({
          trigger: 'poor_focus_quality',
          adaptation_type: 'adjust_timing',
          description: 'Increased break frequency to improve focus quality'
        });
      }
    }

    if (contextualFactors?.day_of_week === 'Monday') {
      adaptations.push({
        trigger: 'monday_motivation',
        adaptation_type: 'increase_complexity',
        description: 'Added motivational boost for week start'
      });
    }

    return adaptations;
  }

  private async buildGenerationContext(userId: string, profile: UserProfile): Promise<RoutineGenerationContext> {
    // Get historical performance data
    const performance = await this.getHistoricalPerformance(userId);
    
    // Get current habits
    const habits = await this.getCurrentHabits(userId);
    
    // Build contextual factors
    const contextualFactors: ContextualFactors = {
      day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      season: this.getCurrentSeason()
    };

    return {
      user_profile: profile,
      historical_performance: performance,
      current_habits: habits,
      contextual_factors: contextualFactors
    };
  }

  private async getHistoricalPerformance(userId: string): Promise<PerformanceData | undefined> {
    try {
      // Get recent routine completion data
      const routineQuery = `
        SELECT completed, segments
        FROM daily_routines 
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '14 days'
        ORDER BY date DESC
      `;
      
      const routineResult = await query(routineQuery, [userId]);
      
      if (routineResult.rows.length === 0) {
        return undefined;
      }

      // Calculate performance metrics
      const completedRoutines = routineResult.rows.filter((r: any) => r.completed).length;
      const totalRoutines = routineResult.rows.length;
      const completion_rate = totalRoutines > 0 ? completedRoutines / totalRoutines : 0;

      // Get behavioral analytics for more detailed metrics
      const analytics = await this.profileService.getBehavioralAnalytics(userId, 14);
      
      return {
        completion_rate,
        consistency_score: completion_rate, // Simplified for now
        recent_failures: totalRoutines - completedRoutines,
        recent_successes: completedRoutines,
        average_focus_quality: 0.7, // Default value, would be calculated from activity sessions
        preferred_activity_types: ['deep_work', 'study'] // Would be derived from analytics
      };
    } catch (error) {
      logger.error('Error getting historical performance:', error);
      return undefined;
    }
  }

  private async getCurrentHabits(userId: string): Promise<any[]> {
    try {
      const queryText = 'SELECT * FROM habits WHERE user_id = $1 AND is_active = true';
      const result = await query(queryText, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting current habits:', error);
      return [];
    }
  }

  private async getRoutineById(routineId: string): Promise<DailyRoutine | null> {
    const queryText = 'SELECT * FROM daily_routines WHERE id = $1';
    
    try {
      const result = await query(queryText, [routineId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatRoutineFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching routine by ID:', error);
      throw new Error('Failed to fetch routine');
    }
  }

  private async saveRoutine(routine: DailyRoutine): Promise<DailyRoutine> {
    const queryText = `
      INSERT INTO daily_routines (user_id, date, segments, adaptations, completed)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const routineDate = typeof routine.date === 'string' 
        ? routine.date 
        : routine.date.toISOString().split('T')[0];
        
      const result = await query(queryText, [
        routine.user_id,
        routineDate,
        JSON.stringify(routine.segments),
        routine.adaptations,
        routine.completed
      ]);

      return this.formatRoutineFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error saving routine:', error);
      throw new Error('Failed to save routine');
    }
  }

  private formatRoutineFromDb(row: any): DailyRoutine {
    return {
      id: row.id,
      user_id: row.user_id,
      date: new Date(row.date),
      segments: typeof row.segments === 'string' ? JSON.parse(row.segments) : row.segments,
      adaptations: row.adaptations || [],
      completed: row.completed,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calculateSlotDuration(timeSlot: TimeSlot): number {
    const startMinutes = this.parseTime(timeSlot.start_time);
    let endMinutes = this.parseTime(timeSlot.end_time);
    
    // Handle time crossing midnight
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    return endMinutes - startMinutes;
  }

  private calculateEstimatedTime(segments: RoutineSegment[]): number {
    return segments.reduce((total, segment) => total + segment.duration, 0);
  }

  async adaptRoutineComplexity(userId: string, performanceData: PerformanceData): Promise<void> {
    try {
      // Get user's current complexity preferences
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found');
      }

      // Calculate new complexity level based on performance
      const currentComplexity = this.getCurrentComplexityLevel(userId);
      const newComplexity = this.calculateAdaptiveComplexity(performanceData, currentComplexity);

      // Store adaptation event for learning
      const adaptationEvent = {
        timestamp: new Date(),
        trigger: this.identifyAdaptationTrigger(performanceData),
        adaptation: `Complexity changed from ${currentComplexity.level} to ${newComplexity.level}`,
        effectiveness: 0 // Will be updated based on future performance
      };

      // Update user's behavioral patterns with adaptation
      await this.updateBehavioralPatterns(userId, adaptationEvent, performanceData);

      logger.info('Routine complexity adapted', { 
        userId, 
        oldComplexity: currentComplexity.level, 
        newComplexity: newComplexity.level,
        trigger: adaptationEvent.trigger
      });
    } catch (error) {
      logger.error('Error adapting routine complexity:', error);
      throw new Error('Failed to adapt routine complexity');
    }
  }

  async trackRoutinePerformance(userId: string, routineId: string, performanceMetrics: any): Promise<void> {
    try {
      // Store performance metrics
      await this.profileService.trackBehavioralEvent(
        userId,
        'routine_performance',
        performanceMetrics,
        { routine_id: routineId }
      );

      // Analyze patterns and trigger adaptations if needed
      const recentPerformance = await this.analyzeRecentPerformance(userId);
      
      if (this.shouldTriggerAdaptation(recentPerformance)) {
        await this.adaptRoutineComplexity(userId, recentPerformance);
      }

      logger.debug('Routine performance tracked', { userId, routineId });
    } catch (error) {
      logger.error('Error tracking routine performance:', error);
      // Don't throw error for tracking failures
    }
  }

  async getPersonalizedRoutineRecommendations(userId: string): Promise<any> {
    try {
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found');
      }

      const behavioralAnalytics = await this.profileService.getBehavioralAnalytics(userId, 30);
      const performanceData = await this.getHistoricalPerformance(userId);

      // Generate personalized recommendations based on behavioral patterns
      const recommendations = this.generatePersonalizedRecommendations(
        profileResponse.profile,
        behavioralAnalytics,
        performanceData
      );

      return recommendations;
    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getCurrentComplexityLevel(userId: string): RoutineComplexity {
    // This would typically be stored in user preferences or derived from recent routines
    // For now, returning default moderate complexity
    return {
      level: 'moderate',
      task_count: 6,
      deep_work_blocks: 2,
      break_frequency: 90,
      multitasking_allowed: false
    };
  }

  private calculateAdaptiveComplexity(
    performance: PerformanceData, 
    currentComplexity: RoutineComplexity
  ): RoutineComplexity {
    let newComplexity = { ...currentComplexity };

    // Decrease complexity if performance is declining
    if (performance.completion_rate < 0.5 || performance.recent_failures > 5) {
      if (currentComplexity.level !== 'simple') {
        newComplexity = {
          level: 'simple',
          task_count: Math.max(3, currentComplexity.task_count - 2),
          deep_work_blocks: Math.max(1, currentComplexity.deep_work_blocks - 1),
          break_frequency: Math.max(45, currentComplexity.break_frequency - 30),
          multitasking_allowed: false
        };
      }
    }
    // Increase complexity if performance is consistently good
    else if (performance.completion_rate > 0.85 && performance.consistency_score > 0.8) {
      if (currentComplexity.level !== 'complex') {
        newComplexity = {
          level: 'complex',
          task_count: Math.min(10, currentComplexity.task_count + 2),
          deep_work_blocks: Math.min(4, currentComplexity.deep_work_blocks + 1),
          break_frequency: Math.min(150, currentComplexity.break_frequency + 30),
          multitasking_allowed: true
        };
      }
    }

    return newComplexity;
  }

  private identifyAdaptationTrigger(performance: PerformanceData): string {
    if (performance.completion_rate < 0.5) return 'low_completion_rate';
    if (performance.recent_failures > 5) return 'high_failure_count';
    if (performance.average_focus_quality < 0.4) return 'poor_focus_quality';
    if (performance.completion_rate > 0.85) return 'high_success_rate';
    if (performance.consistency_score > 0.8) return 'high_consistency';
    return 'routine_optimization';
  }

  private async updateBehavioralPatterns(
    userId: string, 
    adaptationEvent: any, 
    performanceData: PerformanceData
  ): Promise<void> {
    try {
      // Store the adaptation event
      await this.profileService.trackBehavioralEvent(
        userId,
        'complexity_adaptation',
        adaptationEvent,
        { performance_data: performanceData }
      );

      // Update temporal patterns based on performance
      const temporalPattern = {
        time_of_day: new Date().getHours().toString(),
        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        season: this.getCurrentSeason(),
        productivity_score: performanceData.completion_rate,
        energy_level: performanceData.average_focus_quality,
        focus_quality: performanceData.average_focus_quality
      };

      await this.profileService.trackBehavioralEvent(
        userId,
        'temporal_pattern_update',
        temporalPattern
      );
    } catch (error) {
      logger.error('Error updating behavioral patterns:', error);
      // Don't throw error for pattern updates
    }
  }

  private async analyzeRecentPerformance(userId: string): Promise<PerformanceData> {
    try {
      // Get recent behavioral analytics
      const analytics = await this.profileService.getBehavioralAnalytics(userId, 7);
      
      // Filter for routine-related events
      const routineEvents = analytics.filter(event => 
        event.event_type === 'segment_completion' || 
        event.event_type === 'routine_performance'
      );

      if (routineEvents.length === 0) {
        return this.getDefaultPerformanceData();
      }

      // Calculate performance metrics from recent events
      const completionEvents = routineEvents.filter(e => e.event_type === 'segment_completion');
      const completedCount = completionEvents.filter(e => e.event_data.completed).length;
      const totalCount = completionEvents.length;

      const completion_rate = totalCount > 0 ? completedCount / totalCount : 0;
      const recent_failures = totalCount - completedCount;
      const recent_successes = completedCount;

      // Calculate focus quality average
      const focusQualities = completionEvents
        .filter(e => e.event_data.focus_quality)
        .map(e => this.mapFocusQualityToNumber(e.event_data.focus_quality));
      
      const average_focus_quality = focusQualities.length > 0 
        ? focusQualities.reduce((a, b) => a + b, 0) / focusQualities.length 
        : 0.5;

      return {
        completion_rate,
        consistency_score: completion_rate, // Simplified calculation
        recent_failures,
        recent_successes,
        average_focus_quality,
        preferred_activity_types: this.extractPreferredActivities(routineEvents)
      };
    } catch (error) {
      logger.error('Error analyzing recent performance:', error);
      return this.getDefaultPerformanceData();
    }
  }

  private shouldTriggerAdaptation(performance: PerformanceData): boolean {
    // Trigger adaptation if performance is significantly poor or excellent
    return performance.completion_rate < 0.4 || 
           performance.completion_rate > 0.9 ||
           performance.recent_failures > 4 ||
           performance.average_focus_quality < 0.3;
  }

  private generatePersonalizedRecommendations(
    profile: UserProfile,
    behavioralAnalytics: any[],
    performanceData?: PerformanceData
  ): any {
    const recommendations = {
      complexity_adjustment: null as any,
      timing_optimization: [] as any[],
      activity_preferences: [] as any[],
      environmental_suggestions: [] as any[],
      habit_integration: [] as any[]
    };

    // Complexity recommendations
    if (performanceData) {
      if (performanceData.completion_rate < 0.6) {
        recommendations.complexity_adjustment = {
          type: 'simplify',
          reason: 'Recent completion rate below 60%',
          suggestion: 'Reduce number of tasks and increase break frequency'
        };
      } else if (performanceData.completion_rate > 0.85) {
        recommendations.complexity_adjustment = {
          type: 'increase',
          reason: 'Consistently high performance',
          suggestion: 'Add more challenging tasks and longer focus blocks'
        };
      }
    }

    // Timing optimization based on energy patterns
    if (profile.energy_pattern && profile.energy_pattern.length > 0) {
      const highEnergyTimes = profile.energy_pattern
        .filter(ep => ep.level === 'high')
        .map(ep => ep.time);
      
      if (highEnergyTimes.length > 0) {
        recommendations.timing_optimization.push({
          suggestion: `Schedule deep work during high energy times: ${highEnergyTimes.join(', ')}`,
          priority: 'high'
        });
      }
    }

    // Activity preferences from behavioral data
    const activityEvents = behavioralAnalytics.filter(e => e.event_type === 'segment_completion');
    if (activityEvents.length > 0) {
      const activityPerformance = this.analyzeActivityPerformance(activityEvents);
      recommendations.activity_preferences = activityPerformance;
    }

    // Environmental suggestions based on detailed profile
    if (profile.detailed_profile?.study_environment_prefs) {
      const envPrefs = profile.detailed_profile.study_environment_prefs;
      recommendations.environmental_suggestions.push({
        suggestion: `Optimize environment: ${envPrefs.preferred_location?.join(', ')} with ${envPrefs.noise_level} noise level`,
        priority: 'medium'
      });
    }

    return recommendations;
  }

  private getDefaultPerformanceData(): PerformanceData {
    return {
      completion_rate: 0.7,
      consistency_score: 0.7,
      recent_failures: 2,
      recent_successes: 5,
      average_focus_quality: 0.6,
      preferred_activity_types: ['study', 'deep_work']
    };
  }

  private mapFocusQualityToNumber(quality: string): number {
    switch (quality) {
      case 'high': return 1.0;
      case 'medium': return 0.6;
      case 'low': return 0.2;
      default: return 0.5;
    }
  }

  private extractPreferredActivities(events: any[]): string[] {
    // Analyze which activity types have higher completion rates
    const activityStats: Record<string, { completed: number; total: number }> = {};
    
    events.forEach(event => {
      if (event.event_type === 'segment_completion' && event.context?.activity_type) {
        const activityType = event.context.activity_type;
        if (!activityStats[activityType]) {
          activityStats[activityType] = { completed: 0, total: 0 };
        }
        activityStats[activityType].total++;
        if (event.event_data.completed) {
          activityStats[activityType].completed++;
        }
      }
    });

    // Return activities with completion rate > 70%
    return Object.entries(activityStats)
      .filter(([_, stats]) => stats.total > 0 && (stats.completed / stats.total) > 0.7)
      .map(([activityType, _]) => activityType);
  }

  private analyzeActivityPerformance(events: any[]): any[] {
    const activityStats: Record<string, { completed: number; total: number; avgFocus: number }> = {};
    
    events.forEach(event => {
      if (event.context?.activity_type) {
        const activityType = event.context.activity_type;
        if (!activityStats[activityType]) {
          activityStats[activityType] = { completed: 0, total: 0, avgFocus: 0 };
        }
        activityStats[activityType].total++;
        if (event.event_data.completed) {
          activityStats[activityType].completed++;
        }
        if (event.event_data.focus_quality) {
          activityStats[activityType].avgFocus += this.mapFocusQualityToNumber(event.event_data.focus_quality);
        }
      }
    });

    return Object.entries(activityStats).map(([activityType, stats]) => ({
      activity_type: activityType,
      completion_rate: stats.total > 0 ? stats.completed / stats.total : 0,
      average_focus: stats.total > 0 ? stats.avgFocus / stats.total : 0,
      recommendation: stats.completed / stats.total > 0.8 ? 'increase' : 'maintain'
    }));
  }
}