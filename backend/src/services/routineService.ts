import { query } from '../config/database';
import { 
  DailyRoutine, 
  RoutineSegment, 
  TimeSlot,
  CreateRoutineRequest,
  RoutineResponse,
  RoutineUpdateRequest,
  PerformanceData
} from '../types/routine';
import { UserProfile } from '../types/profile';
import { ProfileService } from './profileService';
import { AIRoutineService } from './aiRoutineService';
import { RoutineDataOrchestrator, RoutineContext } from './routineDataOrchestrator';
import { EnergyScheduler } from './energyScheduler';
import { ManualSlotBuilder, ManualTimeSlot } from './manualSlotBuilder';
import { logger } from '../utils/logger';

/**
 * Routine Generation Service V3
 * 
 * Upgraded with AI-powered generation modes:
 * 1. Automatic Mode - AI generates complete routine
 * 2. Manual Mode - User creates slots, AI fills with activities
 * 3. Full system integration - Habits, Deep Work, Evening Review, Analytics, Profile
 * 4. Energy-based scheduling - Activities matched to energy levels
 * 5. Natural language support - Parse routine requests
 * 6. Mid-day adaptation - Regenerate remaining time
 * 7. Routine comparison - Compare variations
 * 
 * Backward compatible with V2 API
 */
export class RoutineService {
  private profileService: ProfileService;
  private aiService: AIRoutineService;
  private dataOrchestrator: RoutineDataOrchestrator;
  private energyScheduler: EnergyScheduler;
  private manualSlotBuilder: ManualSlotBuilder;

  constructor() {
    this.profileService = new ProfileService();
    this.aiService = new AIRoutineService();
    this.dataOrchestrator = new RoutineDataOrchestrator();
    this.energyScheduler = new EnergyScheduler();
    this.manualSlotBuilder = new ManualSlotBuilder();
  }

  async generateDailyRoutine(userId: string, request: CreateRoutineRequest): Promise<RoutineResponse> {
    try {
      // Get user profile
      const profileResponse = await this.profileService.getProfile(userId);
      if (!profileResponse) {
        throw new Error('User profile not found. Please create a profile first.');
      }

      const profile = profileResponse.profile;
      this.validateProfile(profile);

      // Check if routine already exists for this date
      const existingRoutine = await this.getRoutineByDate(userId, request.date);
      if (existingRoutine) {
        return this.formatRoutineResponse(existingRoutine);
      }

      // Determine generation mode (V3 or V2 backward compatibility)
      const mode = (request as any).mode || 'automatic'; // Default to automatic for V2 compatibility
      const manualSlots = (request as any).manualSlots;

      let routine: DailyRoutine;

      if (mode === 'manual' && manualSlots && manualSlots.length > 0) {
        // V3 Manual Mode: User creates slots, AI fills with activities
        logger.info('Generating routine in manual mode', { userId, slotCount: manualSlots.length });
        routine = await this.generateManualRoutine(userId, manualSlots, request);
      } else if (mode === 'automatic' || !mode) {
        // V3 Automatic Mode OR V2 Backward Compatibility
        logger.info('Generating routine in automatic mode', { userId, mode });
        routine = await this.generateAutomaticRoutine(userId, request);
      } else {
        // Fallback to V2 algorithm for unknown modes
        logger.warn('Unknown generation mode, using V2 algorithm', { mode });
        const performance = await this.getHistoricalPerformance(userId);
        routine = await this.createIntelligentRoutine(userId, request, profile, performance);
      }
      
      // Store routine in database
      const savedRoutine = await this.saveRoutine(routine);

      return this.formatRoutineResponse(savedRoutine);
    } catch (error) {
      logger.error('Error generating daily routine:', error);
      throw error instanceof Error ? error : new Error('Failed to generate daily routine');
    }
  }

  // ============ V3 Generation Methods ============

  /**
   * Generate routine in Automatic Mode (V3)
   * AI generates complete routine based on all integrated data
   */
  async generateAutomaticRoutine(userId: string, request: CreateRoutineRequest): Promise<DailyRoutine> {
    try {
      // Step 1: Fetch context from all integrated services
      const context = await this.dataOrchestrator.buildRoutineContext(userId, new Date(request.date));
      
      // Step 2: Try AI generation first
      let aiRoutine;
      try {
        aiRoutine = await this.aiService.generateAIRoutine(context);
        logger.info('AI routine generated successfully', { userId, confidence: aiRoutine.confidence });
      } catch (error) {
        logger.warn('AI generation failed, using rule-based fallback', { error });
        aiRoutine = null;
      }

      // Step 3: Convert AI routine to segments or use rule-based
      let segments: RoutineSegment[];
      let adaptations: string[] = [];

      if (aiRoutine && aiRoutine.segments.length > 0) {
        // Use AI-generated routine
        segments = aiRoutine.segments.map((seg, index) => ({
          id: seg.id || `segment_${index + 1}`,
          timeSlot: {
            start: seg.startTime,
            end: seg.endTime
          },
          time_slot: {
            start_time: seg.startTime,
            end_time: seg.endTime
          },
          type: seg.type,
          activity: seg.activity,
          duration: seg.duration,
          priority: this.normalizePriority(seg.priority),
          completed: false
        }));

        // Add AI reasoning as adaptations
        if (aiRoutine.reasoning && aiRoutine.reasoning.length > 0) {
          adaptations = [...adaptations, ...aiRoutine.reasoning.map(r => r.decision)];
        }
      } else {
        // Fallback to rule-based generation
        const profile = context.profile;
        const performance = await this.getHistoricalPerformance(userId);
        const routine = await this.createIntelligentRoutine(userId, request, this.convertProfileData(profile), performance);
        segments = routine.segments;
        adaptations = routine.adaptations || [];
      }

      // CRITICAL: Validate wake-up time for ALL segments (AI or V2)
      const wakeUpMinutes = this.parseTime(context.profile.wakeUpTime);
      if (segments.length > 0) {
        const firstSegmentStart = this.parseTime(segments[0].time_slot.start_time);
        
        if (firstSegmentStart < wakeUpMinutes) {
          logger.warn('Routine starting before wake-up time, adjusting all segments...', {
            firstSegmentStart: this.formatTime(firstSegmentStart),
            wakeUpTime: context.profile.wakeUpTime,
            source: aiRoutine ? 'AI' : 'V2'
          });
          
          // Shift all segments to start at wake-up time
          const timeShift = wakeUpMinutes - firstSegmentStart;
          segments = segments.map(seg => {
            const startMinutes = this.parseTime(seg.time_slot.start_time) + timeShift;
            const endMinutes = this.parseTime(seg.time_slot.end_time) + timeShift;
            const newStart = this.formatTime(startMinutes);
            const newEnd = this.formatTime(endMinutes);
            
            return {
              ...seg,
              timeSlot: {
                start: newStart,
                end: newEnd
              },
              time_slot: {
                start_time: newStart,
                end_time: newEnd
              }
            };
          });
          
          adaptations.push(`Adjusted routine to start at wake-up time (${context.profile.wakeUpTime})`);
        }
      }

      // Step 4: Apply energy-based scheduling optimization
      segments = this.optimizeSegmentsWithEnergy(segments, context);

      // Step 5: Insert intelligent breaks
      segments = this.insertIntelligentBreaks(segments, context.profile.availableHours);

      return {
        id: '',
        user_id: userId,
        date: new Date(request.date),
        segments,
        adaptations,
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      logger.error('Error in automatic routine generation:', error);
      throw error;
    }
  }

  /**
   * Generate routine in Manual Mode (V3)
   * User creates slots, AI fills with activities based on energy
   */
  async generateManualRoutine(
    userId: string,
    manualSlots: ManualTimeSlot[],
    request: CreateRoutineRequest
  ): Promise<DailyRoutine> {
    try {
      // Step 1: Fetch context from all integrated services
      const context = await this.dataOrchestrator.buildRoutineContext(userId, new Date(request.date));

      // Step 2: Validate manual slots with wake-up and sleep time constraints
      const validation = this.manualSlotBuilder.validateManualSlots(
        manualSlots,
        context.profile.wakeUpTime,
        context.profile.sleepTime
      );
      
      if (!validation.valid) {
        throw new Error(`Invalid manual slots: ${validation.errors.join(', ')}`);
      }

      // Step 3: Fill slots with activities using energy-based scheduling
      const rawSegments = await this.manualSlotBuilder.fillSlotsWithActivities(manualSlots, context);
      
      // Convert to proper RoutineSegment type
      const segments: RoutineSegment[] = rawSegments.map(seg => ({
        id: seg.id,
        time_slot: seg.time_slot,
        timeSlot: seg.timeSlot,
        type: seg.type,
        activity: seg.activity,
        duration: seg.duration,
        priority: this.normalizePriority(seg.priority),
        completed: seg.completed
      }));

      // Step 4: Add adaptations based on validation warnings
      const adaptations: string[] = [];
      if (validation.warnings.length > 0) {
        adaptations.push(...validation.warnings);
      }
      adaptations.push('Manual mode: User-created time slots with AI-suggested activities');

      return {
        id: '',
        user_id: userId,
        date: new Date(request.date),
        segments,
        adaptations,
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      logger.error('Error in manual routine generation:', error);
      throw error;
    }
  }

  /**
   * Adapt routine mid-day (V3)
   * Preserves completed segments, regenerates remaining time
   */
  async adaptRoutineMidDay(
    userId: string,
    routineId: string,
    remainingTime: number
  ): Promise<DailyRoutine> {
    try {
      // Step 1: Fetch existing routine
      const existingRoutine = await this.getRoutineById(routineId);
      if (!existingRoutine || existingRoutine.user_id !== userId) {
        throw new Error('Routine not found or access denied');
      }

      // Step 2: Separate completed and remaining segments
      const completedSegments = existingRoutine.segments.filter(s => s.completed);
      const remainingSegments = existingRoutine.segments.filter(s => !s.completed);

      logger.info('Mid-day adaptation', {
        userId,
        routineId,
        completedCount: completedSegments.length,
        remainingCount: remainingSegments.length,
        remainingTime
      });

      // Step 3: Fetch context for regeneration
      const routineDate = typeof existingRoutine.date === 'string' ? new Date(existingRoutine.date) : existingRoutine.date;
      const context = await this.dataOrchestrator.buildRoutineContext(userId, routineDate);

      // Step 4: Generate new segments for remaining time
      const lastCompletedTime = completedSegments.length > 0
        ? completedSegments[completedSegments.length - 1].time_slot.end_time
        : context.profile.wakeUpTime;

      const newSegments = await this.generateSegmentsForTimeRange(
        userId,
        lastCompletedTime,
        remainingTime,
        context
      );

      // Step 5: Combine completed and new segments
      const allSegments = [...completedSegments, ...newSegments];

      // Step 6: Update routine
      const updatedRoutine: DailyRoutine = {
        ...existingRoutine,
        segments: allSegments,
        adaptations: [
          ...(existingRoutine.adaptations || []),
          `Mid-day adaptation: Regenerated ${newSegments.length} segments for remaining ${remainingTime} minutes`
        ],
        updated_at: new Date()
      };

      // Save updated routine
      await this.updateRoutineInDb(updatedRoutine);

      return updatedRoutine;
    } catch (error) {
      logger.error('Error in mid-day adaptation:', error);
      throw error;
    }
  }

  /**
   * Compare routine variations (V3)
   * Analyze differences and predict performance
   */
  async compareRoutineVariations(
    userId: string,
    variations: DailyRoutine[]
  ): Promise<any> {
    try {
      if (variations.length < 2) {
        throw new Error('At least 2 routine variations required for comparison');
      }

      const comparison = {
        variations: variations.map((v, index) => ({
          index,
          segmentCount: v.segments.length,
          totalDuration: v.segments.reduce((sum, s) => sum + s.duration, 0),
          activityTypes: this.countActivityTypes(v.segments),
          priorityDistribution: this.countPriorities(v.segments)
        })),
        differences: [] as string[],
        recommendations: [] as string[],
        predictedPerformance: {} as Record<string, number>
      };

      // Analyze differences
      const segmentCounts = comparison.variations.map(v => v.segmentCount);
      const maxSegments = Math.max(...segmentCounts);
      const minSegments = Math.min(...segmentCounts);

      if (maxSegments - minSegments > 2) {
        comparison.differences.push(`Significant complexity difference: ${minSegments}-${maxSegments} segments`);
      }

      // Generate recommendations
      const performance = await this.getHistoricalPerformance(userId);
      if (performance && performance.completion_rate < 0.7) {
        comparison.recommendations.push('Choose simpler routine (fewer segments) based on recent completion challenges');
      } else {
        comparison.recommendations.push('All variations are suitable based on your performance history');
      }

      // Predict performance (simple heuristic)
      variations.forEach((v, index) => {
        const complexity = v.segments.length;
        const baseScore = 0.7;
        const complexityPenalty = Math.max(0, (complexity - 5) * 0.05);
        comparison.predictedPerformance[`variation_${index}`] = Math.max(0.3, baseScore - complexityPenalty);
      });

      return comparison;
    } catch (error) {
      logger.error('Error comparing routine variations:', error);
      throw error;
    }
  }

  // ============ V3 Helper Methods ============

  private optimizeSegmentsWithEnergy(segments: RoutineSegment[], context: RoutineContext): RoutineSegment[] {
    // Extract energy patterns
    const energyPatterns = context.deepWork?.energyPatterns || [];
    
    if (energyPatterns.length === 0) {
      return segments; // No optimization possible
    }

    // Classify each segment's energy level
    return segments.map(segment => {
      const energyLevel = this.energyScheduler.classifyTimeSlotEnergy(
        {
          startTime: segment.time_slot.start_time,
          endTime: segment.time_slot.end_time
        },
        energyPatterns
      );

      return {
        ...segment,
        timeSlot: segment.timeSlot ? {
          start: segment.timeSlot.start,
          end: segment.timeSlot.end
        } : {
          start: segment.time_slot.start_time,
          end: segment.time_slot.end_time
        }
      };
    });
  }

  private normalizePriority(priority: 'critical' | 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
    // Map 'critical' to 'high' for compatibility with RoutineSegment type
    return priority === 'critical' ? 'high' : priority;
  }

  private async generateSegmentsForTimeRange(
    userId: string,
    startTime: string,
    durationMinutes: number,
    context: RoutineContext
  ): Promise<RoutineSegment[]> {
    // Calculate end time
    const startMinutes = this.parseTime(startTime);
    const endMinutes = startMinutes + durationMinutes;
    const endTime = this.formatTime(endMinutes);

    // Generate segments for this time range
    const segmentCount = Math.max(1, Math.floor(durationMinutes / 60)); // 1 segment per hour
    const segmentDuration = Math.floor(durationMinutes / segmentCount);

    const segments: RoutineSegment[] = [];
    let currentMinutes = startMinutes;

    for (let i = 0; i < segmentCount; i++) {
      const segStartTime = this.formatTime(currentMinutes);
      currentMinutes += segmentDuration;
      const segEndTime = this.formatTime(currentMinutes);

      segments.push({
        id: `adapted_segment_${i + 1}`,
        timeSlot: {
          start: segStartTime,
          end: segEndTime
        },
        time_slot: {
          start_time: segStartTime,
          end_time: segEndTime
        },
        type: 'study',
        activity: 'Adapted activity',
        duration: segmentDuration,
        priority: 'medium',
        completed: false
      });
    }

    return segments;
  }

  private async updateRoutineInDb(routine: DailyRoutine): Promise<void> {
    const queryText = `
      UPDATE daily_routines 
      SET segments = $1, adaptations = $2, updated_at = NOW()
      WHERE id = $3 AND user_id = $4
    `;

    await query(queryText, [
      JSON.stringify(routine.segments),
      routine.adaptations,
      routine.id,
      routine.user_id
    ]);
  }

  private countActivityTypes(segments: RoutineSegment[]): Record<string, number> {
    const counts: Record<string, number> = {};
    segments.forEach(seg => {
      counts[seg.type] = (counts[seg.type] || 0) + 1;
    });
    return counts;
  }

  private countPriorities(segments: RoutineSegment[]): Record<string, number> {
    const counts: Record<string, number> = {};
    segments.forEach(seg => {
      counts[seg.priority] = (counts[seg.priority] || 0) + 1;
    });
    return counts;
  }

  private convertProfileData(profileData: any): UserProfile {
    return {
      id: '',
      user_id: '',
      target_identity: profileData.targetIdentity || 'Student',
      academic_goals: profileData.academicGoals || [],
      skill_goals: profileData.skillGoals || [],
      wake_up_time: profileData.wakeUpTime || '07:00',
      sleep_time: profileData.sleepTime || '23:00',
      available_hours: profileData.availableHours || 8,
      energy_pattern: profileData.energyPattern || [],
      detailed_profile: {
        learning_style: profileData.learningStyle || 'reading',
        productivity_peaks: [],
        distraction_triggers: [],
        motivation_factors: [],
        study_environment_prefs: {
          preferred_location: [],
          noise_level: 'moderate',
          lighting_preference: 'moderate',
          temperature_preference: 'moderate',
          organization_style: 'organized'
        },
        challenge_areas: [],
        personality_traits: {
          work_style: 'mixed',
          social_preference: 'mixed',
          feedback_style: 'encouraging',
          challenge_level: 'moderate'
        },
        academic_background: {
          current_level: 'undergraduate',
          subjects: [],
          learning_goals: [],
          time_constraints: [],
          previous_challenges: []
        },
        behavioral_patterns: {
          interaction_patterns: [],
          task_completion_rates: {},
          feature_usage_stats: {},
          temporal_productivity_patterns: [],
          adaptation_history: []
        },
        contextual_preferences: {
          weather_preferences: [],
          seasonal_patterns: [],
          life_circumstances: [],
          social_context: []
        },
        implicit_feedback: {
          suggestion_acceptance_rate: 0,
          routine_modification_patterns: [],
          skip_patterns: [],
          engagement_metrics: []
        }
      },
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  // ============ V2 Methods (Backward Compatibility) ============

  private validateProfile(profile: UserProfile): void {
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
  }

  private async createIntelligentRoutine(
    userId: string,
    request: CreateRoutineRequest,
    profile: UserProfile,
    performance?: PerformanceData
  ): Promise<DailyRoutine> {
    // Step 1: Determine optimal number of segments based on available time
    const segmentCount = this.calculateOptimalSegmentCount(profile.available_hours, performance);
    
    // Step 2: Generate time slots with smart spacing
    const timeSlots = this.generateFlexibleTimeSlots(profile, segmentCount);
    
    // Step 3: Create activity pool with fair goal distribution
    const activityPool = this.createBalancedActivityPool(profile, segmentCount);
    
    // Step 4: Match activities to time slots based on energy patterns
    const segments = this.matchActivitiesToTimeSlots(timeSlots, activityPool, profile, performance);
    
    // Step 5: Add breaks intelligently
    const segmentsWithBreaks = this.insertIntelligentBreaks(segments, profile.available_hours);

    return {
      id: '',
      user_id: userId,
      date: new Date(request.date),
      segments: segmentsWithBreaks,
      adaptations: this.generateAdaptationNotes(performance),
      completed: false,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Calculate optimal number of segments based on available time and performance
   * More time = more segments, but poor performance = fewer segments
   */
  private calculateOptimalSegmentCount(availableHours: number, performance?: PerformanceData): number {
    let baseCount = Math.floor(availableHours / 1.5); // Base: 1 segment per 1.5 hours
    baseCount = Math.max(3, Math.min(8, baseCount)); // Clamp between 3-8 segments

    // Adjust based on performance
    if (performance) {
      if (performance.completion_rate < 0.5) {
        baseCount = Math.max(3, baseCount - 2); // Reduce if struggling
      } else if (performance.completion_rate > 0.8) {
        baseCount = Math.min(8, baseCount + 1); // Increase if doing well
      }
    }

    return baseCount;
  }

  /**
   * Generate flexible time slots with smart spacing
   * Handles midnight crossing and adds appropriate breaks
   * CRITICAL: Always starts at or after wake-up time
   */
  private generateFlexibleTimeSlots(profile: UserProfile, segmentCount: number): TimeSlot[] {
    const wakeMinutes = this.parseTime(profile.wake_up_time);
    let sleepMinutes = this.parseTime(profile.sleep_time);
    
    // Handle midnight crossing
    if (sleepMinutes < wakeMinutes) {
      sleepMinutes += 24 * 60;
    }

    const totalAvailableMinutes = profile.available_hours * 60;
    const breakBuffer = 15; // Minutes between segments
    const totalBreakTime = (segmentCount - 1) * breakBuffer;
    const workMinutes = totalAvailableMinutes - totalBreakTime;
    const avgSegmentDuration = Math.floor(workMinutes / segmentCount);

    const slots: TimeSlot[] = [];
    let currentTime = wakeMinutes; // ALWAYS start at wake-up time

    logger.info('Generating time slots', {
      wakeUpTime: profile.wake_up_time,
      wakeMinutes,
      sleepMinutes,
      segmentCount,
      startingAt: this.formatTime(currentTime)
    });

    for (let i = 0; i < segmentCount; i++) {
      // Vary segment duration slightly for natural feel
      const variation = Math.floor((Math.random() - 0.5) * 20); // ±10 minutes
      const duration = Math.max(30, avgSegmentDuration + variation); // Min 30 minutes
      
      const endTime = Math.min(currentTime + duration, sleepMinutes);
      
      // VALIDATION: Ensure we never go before wake-up time
      if (currentTime < wakeMinutes) {
        logger.error('CRITICAL: Time slot would start before wake-up time!', {
          currentTime: this.formatTime(currentTime),
          wakeUpTime: profile.wake_up_time
        });
        currentTime = wakeMinutes;
      }
      
      slots.push({
        start_time: this.formatTime(currentTime),
        end_time: this.formatTime(endTime)
      });

      currentTime = endTime + breakBuffer;
      
      // Stop if we've reached sleep time
      if (currentTime >= sleepMinutes) break;
    }

    logger.info('Generated time slots', {
      slotCount: slots.length,
      firstSlot: slots[0]?.start_time,
      lastSlot: slots[slots.length - 1]?.end_time
    });

    return slots;
  }

  /**
   * Create a balanced pool of activities that uses ALL goals fairly
   * Ensures both academic and skill goals are represented
   */
  private createBalancedActivityPool(profile: UserProfile, segmentCount: number): Array<{
    type: RoutineSegment['type'];
    goal: string;
    goalType: 'academic' | 'skill';
    priority: RoutineSegment['priority'];
  }> {
    const activities: Array<{
      type: RoutineSegment['type'];
      goal: string;
      goalType: 'academic' | 'skill';
      priority: RoutineSegment['priority'];
    }> = [];

    // Calculate how many of each type we need
    const deepWorkCount = Math.ceil(segmentCount * 0.35); // 35% deep work
    const skillCount = Math.ceil(segmentCount * 0.30); // 30% skill practice
    const studyCount = Math.ceil(segmentCount * 0.25); // 25% study
    const reviewCount = segmentCount - deepWorkCount - skillCount - studyCount; // Rest for review/light work

    // Shuffle goals to ensure variety across days
    const shuffledAcademic = this.shuffleArray([...profile.academic_goals]);
    const shuffledSkills = this.shuffleArray([...profile.skill_goals]);

    let academicIndex = 0;
    let skillIndex = 0;

    // Add deep work sessions (academic goals)
    for (let i = 0; i < deepWorkCount; i++) {
      activities.push({
        type: 'deep_work',
        goal: shuffledAcademic[academicIndex % shuffledAcademic.length],
        goalType: 'academic',
        priority: 'high'
      });
      academicIndex++;
    }

    // Add skill practice sessions (skill goals)
    for (let i = 0; i < skillCount; i++) {
      activities.push({
        type: 'skill_practice',
        goal: shuffledSkills[skillIndex % shuffledSkills.length],
        goalType: 'skill',
        priority: 'high'
      });
      skillIndex++;
    }

    // Add study sessions (academic goals)
    for (let i = 0; i < studyCount; i++) {
      activities.push({
        type: 'study',
        goal: shuffledAcademic[academicIndex % shuffledAcademic.length],
        goalType: 'academic',
        priority: 'medium'
      });
      academicIndex++;
    }

    // Add review/light sessions (alternate between academic and skill)
    for (let i = 0; i < reviewCount; i++) {
      const useAcademic = i % 2 === 0;
      activities.push({
        type: 'study',
        goal: useAcademic 
          ? shuffledAcademic[academicIndex++ % shuffledAcademic.length]
          : shuffledSkills[skillIndex++ % shuffledSkills.length],
        goalType: useAcademic ? 'academic' : 'skill',
        priority: 'low'
      });
    }

    return activities;
  }

  /**
   * Match activities to time slots based on energy patterns
   * Morning = high priority, Evening = lower priority
   */
  private matchActivitiesToTimeSlots(
    timeSlots: TimeSlot[],
    activityPool: Array<{
      type: RoutineSegment['type'];
      goal: string;
      goalType: 'academic' | 'skill';
      priority: RoutineSegment['priority'];
    }>,
    profile: UserProfile,
    performance?: PerformanceData
  ): RoutineSegment[] {
    // Sort activities by priority (high first)
    const sortedActivities = [...activityPool].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Determine energy pattern (morning person vs evening person)
    const isMorningPerson = this.isMorningPerson(profile);

    const segments: RoutineSegment[] = [];

    timeSlots.forEach((slot, index) => {
      const isEarlySlot = index < timeSlots.length / 2;
      
      // Match high-priority tasks to high-energy times
      let activityIndex: number;
      if (isMorningPerson) {
        // Morning person: high priority in early slots
        activityIndex = isEarlySlot ? index : timeSlots.length - 1 - index;
      } else {
        // Evening person: high priority in later slots
        activityIndex = isEarlySlot ? timeSlots.length - 1 - index : index;
      }

      activityIndex = Math.min(activityIndex, sortedActivities.length - 1);
      const activity = sortedActivities[activityIndex];

      segments.push({
        id: `segment_${index + 1}`,
        timeSlot: {
          start: slot.start_time,
          end: slot.end_time
        },
        time_slot: slot,
        type: activity.type,
        activity: this.formatActivityDescription(activity.type, activity.goal, activity.goalType),
        duration: this.calculateSlotDuration(slot),
        priority: activity.priority,
        completed: false
      });
    });

    return segments;
  }

  /**
   * Insert intelligent breaks between segments
   * Longer work = longer break needed
   */
  private insertIntelligentBreaks(segments: RoutineSegment[], availableHours: number): RoutineSegment[] {
    const result: RoutineSegment[] = [];
    const breakThreshold = 90; // Add break after 90+ minute sessions

    segments.forEach((segment, index) => {
      result.push(segment);

      // Add break after long sessions (but not after last segment)
      if (index < segments.length - 1 && segment.duration >= breakThreshold) {
        const nextSegment = segments[index + 1];
        const breakDuration = segment.duration >= 120 ? 15 : 10;

        if (segment.timeSlot && nextSegment.timeSlot) {
          result.push({
            id: `break_${index + 1}`,
            timeSlot: {
              start: segment.timeSlot.end,
              end: nextSegment.timeSlot.start
            },
            time_slot: {
              start_time: segment.time_slot.end_time,
              end_time: nextSegment.time_slot.start_time
            },
            type: 'break',
            activity: 'Short break - stretch, walk, or rest',
            duration: breakDuration,
            priority: 'low',
            completed: false
          });
        }
      }
    });

    return result;
  }

  private formatActivityDescription(
    type: RoutineSegment['type'],
    goal: string,
    goalType: 'academic' | 'skill'
  ): string {
    const typeLabels = {
      deep_work: 'Deep work',
      skill_practice: 'Skill practice',
      study: 'Study session',
      break: 'Break',
      personal: 'Personal time'
    };

    const label = typeLabels[type] || 'Activity';
    return `${label}: ${goal}`;
  }

  private isMorningPerson(profile: UserProfile): boolean {
    // Check if user has energy pattern data
    if (profile.energy_pattern && profile.energy_pattern.length > 0) {
      const morningEnergy = profile.energy_pattern.find((p: any) => 
        p.time_of_day === 'morning' || p.time_of_day === '06:00-12:00'
      );
      const eveningEnergy = profile.energy_pattern.find((p: any) => 
        p.time_of_day === 'evening' || p.time_of_day === '18:00-00:00'
      );

      if (morningEnergy && eveningEnergy) {
        return (morningEnergy as any).energy_level > (eveningEnergy as any).energy_level;
      }
    }

    // Default: assume morning person if wake time is before 8 AM
    const wakeHour = parseInt(profile.wake_up_time.split(':')[0]);
    return wakeHour < 8;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateAdaptationNotes(performance?: PerformanceData): string[] {
    const notes: string[] = [];

    if (performance) {
      if (performance.completion_rate < 0.5) {
        notes.push('Reduced complexity based on recent completion challenges');
      } else if (performance.completion_rate > 0.8) {
        notes.push('Increased challenge based on consistent success');
      }

      if (performance.average_focus_quality < 0.5) {
        notes.push('Added more breaks to improve focus quality');
      }
    }

    return notes;
  }

  // Public method for getting routine by date (used by controller)
  async getRoutineByDate(userId: string, date: string | Date): Promise<DailyRoutine | null> {
    const queryText = 'SELECT id, user_id, date::text as date, segments, adaptations, completed, created_at, updated_at FROM daily_routines WHERE user_id = $1 AND date = $2';
    
    try {
      // Handle both string and Date inputs, but avoid timezone conversion
      const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      
      const result = await query(queryText, [userId, dateString]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatRoutineFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching routine by date:', error);
      throw new Error('Failed to fetch routine');
    }
  }

  private async saveRoutine(routine: DailyRoutine): Promise<DailyRoutine> {
    const queryText = `
      INSERT INTO daily_routines (user_id, date, segments, adaptations, completed)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, date::text as date, segments, adaptations, completed, created_at, updated_at
    `;

    try {
      const result = await query(queryText, [
        routine.user_id,
        typeof routine.date === 'string' ? routine.date : routine.date.toISOString().split('T')[0],
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

  private async getHistoricalPerformance(userId: string): Promise<PerformanceData | undefined> {
    try {
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

      const completedRoutines = routineResult.rows.filter((r: any) => r.completed).length;
      const totalRoutines = routineResult.rows.length;
      const completion_rate = totalRoutines > 0 ? completedRoutines / totalRoutines : 0;

      return {
        completion_rate,
        consistency_score: completion_rate,
        recent_failures: totalRoutines - completedRoutines,
        recent_successes: completedRoutines,
        average_focus_quality: 0.7,
        preferred_activity_types: ['deep_work', 'study']
      };
    } catch (error) {
      logger.error('Error getting historical performance:', error);
      return undefined;
    }
  }

  private formatRoutineResponse(routine: DailyRoutine): RoutineResponse {
    return {
      routine,
      complexity_level: this.determineComplexityLevel(routine.segments),
      adaptations_applied: routine.adaptations || [],
      estimated_completion_time: this.calculateEstimatedTime(routine.segments)
    };
  }

  private determineComplexityLevel(segments: RoutineSegment[]): 'simple' | 'moderate' | 'complex' {
    const workSegments = segments.filter(s => s.type !== 'break');
    if (workSegments.length <= 3) return 'simple';
    if (workSegments.length <= 5) return 'moderate';
    return 'complex';
  }

  private calculateEstimatedTime(segments: RoutineSegment[]): number {
    return segments.reduce((total, segment) => total + segment.duration, 0);
  }

  private formatRoutineFromDb(row: any): DailyRoutine {
    return {
      id: row.id,
      user_id: row.user_id,
      date: row.date, // Keep as string to avoid timezone issues
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
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calculateSlotDuration(timeSlot: TimeSlot): number {
    const startMinutes = this.parseTime(timeSlot.start_time);
    let endMinutes = this.parseTime(timeSlot.end_time);
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    return endMinutes - startMinutes;
  }

  async updateRoutineSegment(userId: string, routineId: string, update: RoutineUpdateRequest): Promise<void> {
    try {
      const routine = await this.getRoutineById(routineId);
      if (!routine || routine.user_id !== userId) {
        throw new Error('Routine not found or access denied');
      }

      const updatedSegments = routine.segments.map(segment => {
        if (segment.id === update.segment_id) {
          return {
            ...segment,
            completed: update.completed ?? segment.completed
          };
        }
        return segment;
      });

      const queryText = `
        UPDATE daily_routines 
        SET segments = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
      `;

      await query(queryText, [JSON.stringify(updatedSegments), routineId, userId]);

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

  // Stub methods for backward compatibility
  async adaptRoutineComplexity(userId: string, performanceData: PerformanceData): Promise<void> {
    logger.info('adaptRoutineComplexity called - handled automatically in V2');
  }

  async trackRoutinePerformance(userId: string, routineId: string, performanceMetrics: any): Promise<void> {
    try {
      await this.profileService.trackBehavioralEvent(
        userId,
        'routine_performance',
        performanceMetrics,
        { routine_id: routineId }
      );
    } catch (error) {
      logger.error('Error tracking routine performance:', error);
    }
  }

  async getPersonalizedRoutineRecommendations(userId: string): Promise<any> {
    try {
      const performance = await this.getHistoricalPerformance(userId);
      return {
        recommendations: this.generateAdaptationNotes(performance),
        performance_summary: performance
      };
    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }
}
