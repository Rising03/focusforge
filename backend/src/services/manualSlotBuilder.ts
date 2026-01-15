import { AIRoutineService, ActivitySuggestion } from './aiRoutineService';
import { EnergyScheduler, TimeSlot, Activity, ScheduledActivity, EnergyPattern } from './energyScheduler';
import { RoutineContext } from './routineDataOrchestrator';
import { logger } from '../utils/logger';

/**
 * Manual Time Slot - User-created time slot
 */
export interface ManualTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  activityType?: 'deep_work' | 'skill_practice' | 'study' | 'break' | 'personal';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isFlexible: boolean;
  userNotes?: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Routine Segment (output format)
 */
export interface RoutineSegment {
  id: string;
  timeSlot: {
    start: string;
    end: string;
  };
  time_slot: {
    start_time: string;
    end_time: string;
  };
  type: 'deep_work' | 'skill_practice' | 'study' | 'break' | 'personal';
  activity: string;
  duration: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  completed: boolean;
  suggestions?: ActivitySuggestion[];
}

/**
 * Manual Slot Builder
 * 
 * Handles manual mode routine generation:
 * - Validates user-created time slots
 * - Fills slots with appropriate activities
 * - Applies energy-based scheduling
 * - Provides AI suggestions for each slot
 * 
 * Features:
 * - Overlap detection
 * - Duration validation
 * - Energy-based activity assignment
 * - AI-powered suggestions
 */
export class ManualSlotBuilder {
  private aiService: AIRoutineService;
  private energyScheduler: EnergyScheduler;

  constructor() {
    this.aiService = new AIRoutineService();
    this.energyScheduler = new EnergyScheduler();
  }

  /**
   * Validate manual slots for overlaps and constraints
   * Optionally validates against wake-up and sleep times
   */
  validateManualSlots(slots: ManualTimeSlot[], wakeUpTime?: string, sleepTime?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if slots array is empty
    if (!slots || slots.length === 0) {
      errors.push('No time slots provided');
      return { valid: false, errors, warnings };
    }

    // Parse wake-up and sleep times if provided
    const wakeMinutes = wakeUpTime ? this.parseTime(wakeUpTime) : null;
    const sleepMinutes = sleepTime ? this.parseTime(sleepTime) : null;

    // Validate each slot
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];

      // Check required fields
      if (!slot.startTime || !slot.endTime) {
        errors.push(`Slot ${i + 1}: Missing start or end time`);
        continue;
      }

      // Validate time format
      if (!this.isValidTimeFormat(slot.startTime) || !this.isValidTimeFormat(slot.endTime)) {
        errors.push(`Slot ${i + 1}: Invalid time format (use HH:MM)`);
        continue;
      }

      // Check duration
      const duration = this.calculateDuration(slot.startTime, slot.endTime);
      
      if (duration <= 0) {
        errors.push(`Slot ${i + 1}: End time must be after start time`);
      } else if (duration < 15) {
        warnings.push(`Slot ${i + 1}: Very short duration (${duration} minutes)`);
      } else if (duration > 180) {
        warnings.push(`Slot ${i + 1}: Very long duration (${duration} minutes) - consider breaking it up`);
      }

      // CRITICAL: Validate against wake-up time
      if (wakeMinutes !== null) {
        const slotStart = this.parseTime(slot.startTime);
        if (slotStart < wakeMinutes) {
          errors.push(`Slot ${i + 1}: Starts before wake-up time (${wakeUpTime})`);
        }
      }

      // Validate against sleep time
      if (sleepMinutes !== null) {
        const slotEnd = this.parseTime(slot.endTime);
        if (slotEnd > sleepMinutes) {
          warnings.push(`Slot ${i + 1}: Ends after sleep time (${sleepTime})`);
        }
      }

      // Check for focused work duration constraints
      if (slot.activityType === 'deep_work' || slot.activityType === 'study') {
        if (duration < 30) {
          warnings.push(`Slot ${i + 1}: Focused work should be at least 30 minutes`);
        } else if (duration > 120) {
          warnings.push(`Slot ${i + 1}: Focused work should not exceed 120 minutes`);
        }
      }
    }

    // Check for overlaps
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (this.slotsOverlap(slots[i], slots[j])) {
          errors.push(`Slots ${i + 1} and ${j + 1} overlap`);
        }
      }
    }

    // Check for gaps
    const sortedSlots = this.sortSlotsByTime(slots);
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const gap = this.calculateGap(sortedSlots[i], sortedSlots[i + 1]);
      if (gap > 60) {
        warnings.push(`Large gap (${gap} minutes) between slots ${i + 1} and ${i + 2}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Fill slots with activities based on energy levels and context
   */
  async fillSlotsWithActivities(
    slots: ManualTimeSlot[],
    context: RoutineContext
  ): Promise<RoutineSegment[]> {
    logger.info('Filling manual slots with activities', { slotCount: slots.length });

    // Validate slots first
    const validation = this.validateManualSlots(slots);
    if (!validation.valid) {
      throw new Error(`Invalid slots: ${validation.errors.join(', ')}`);
    }

    // Convert to TimeSlots and classify energy
    const energyPatterns = context.deepWork?.energyPatterns || context.analytics?.productivityPatterns || [];
    const timeSlots: TimeSlot[] = slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      energyLevel: this.energyScheduler.classifyTimeSlotEnergy(
        { startTime: slot.startTime, endTime: slot.endTime },
        energyPatterns
      )
    }));

    // Create activities from user goals
    const activities = this.createActivitiesFromContext(context, slots.length);

    // Apply energy-based scheduling
    const scheduled = this.applyEnergyBasedScheduling(
      slots,
      activities,
      energyPatterns
    );

    // Get AI suggestions for each slot
    const segments: RoutineSegment[] = [];
    for (let i = 0; i < scheduled.length; i++) {
      const activity = scheduled[i];
      const slot = slots[i];
      
      // Get AI suggestions if service is available
      let suggestions: ActivitySuggestion[] = [];
      try {
        suggestions = await this.getSuggestionsForSlot(slot, context);
      } catch (error) {
        logger.warn('Failed to get AI suggestions for slot', { error });
      }

      segments.push({
        id: slot.id || `segment_${i + 1}`,
        timeSlot: {
          start: slot.startTime,
          end: slot.endTime
        },
        time_slot: {
          start_time: slot.startTime,
          end_time: slot.endTime
        },
        type: activity.type,
        activity: this.formatActivityDescription(activity),
        duration: this.calculateDuration(slot.startTime, slot.endTime),
        priority: activity.priority,
        completed: false,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      });
    }

    return segments;
  }

  /**
   * Get AI suggestions for a specific slot
   */
  async getSuggestionsForSlot(
    slot: ManualTimeSlot,
    context: RoutineContext
  ): Promise<ActivitySuggestion[]> {
    const timeSlot: TimeSlot = {
      startTime: slot.startTime,
      endTime: slot.endTime,
      energyLevel: this.energyScheduler.classifyTimeSlotEnergy(
        { startTime: slot.startTime, endTime: slot.endTime },
        context.deepWork?.energyPatterns || []
      )
    };

    return this.aiService.suggestActivities(timeSlot, context);
  }

  /**
   * Apply energy-based scheduling to manual slots
   */
  applyEnergyBasedScheduling(
    slots: ManualTimeSlot[],
    activities: Activity[],
    energyPatterns: EnergyPattern[]
  ): ScheduledActivity[] {
    // Convert slots to TimeSlots
    const timeSlots: TimeSlot[] = slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      energyLevel: this.energyScheduler.classifyTimeSlotEnergy(
        { startTime: slot.startTime, endTime: slot.endTime },
        energyPatterns
      )
    }));

    // Use energy scheduler to match activities to slots
    return this.energyScheduler.matchActivitiesToEnergy(
      activities,
      timeSlots,
      energyPatterns
    );
  }

  // ============ Private Helper Methods ============

  private isValidTimeFormat(time: string): boolean {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = this.parseTime(startTime);
    let end = this.parseTime(endTime);
    
    // Handle midnight crossing
    if (end < start) {
      end += 24 * 60;
    }
    
    return end - start;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private slotsOverlap(slot1: ManualTimeSlot, slot2: ManualTimeSlot): boolean {
    const start1 = this.parseTime(slot1.startTime);
    const end1 = this.parseTime(slot1.endTime);
    const start2 = this.parseTime(slot2.startTime);
    const end2 = this.parseTime(slot2.endTime);

    return (start1 < end2 && end1 > start2);
  }

  private calculateGap(slot1: ManualTimeSlot, slot2: ManualTimeSlot): number {
    const end1 = this.parseTime(slot1.endTime);
    const start2 = this.parseTime(slot2.startTime);
    return start2 - end1;
  }

  private sortSlotsByTime(slots: ManualTimeSlot[]): ManualTimeSlot[] {
    return [...slots].sort((a, b) => 
      this.parseTime(a.startTime) - this.parseTime(b.startTime)
    );
  }

  private createActivitiesFromContext(context: RoutineContext, count: number): Activity[] {
    const activities: Activity[] = [];
    const profile = context.profile;
    
    // Combine academic and skill goals
    const allGoals = [
      ...(profile.academicGoals || []).map(g => ({ goal: g, type: 'academic' as const })),
      ...(profile.skillGoals || []).map(g => ({ goal: g, type: 'skill' as const }))
    ];

    // Shuffle for variety
    const shuffled = this.shuffleArray(allGoals);

    // Create activities
    for (let i = 0; i < count && i < shuffled.length; i++) {
      const item = shuffled[i];
      activities.push({
        id: `activity_${i + 1}`,
        type: item.type === 'academic' ? 'deep_work' : 'skill_practice',
        goal: item.goal,
        priority: i < count / 2 ? 'high' : 'medium',
        estimatedDuration: 60
      });
    }

    // Fill remaining slots if needed
    while (activities.length < count) {
      const item = shuffled[activities.length % shuffled.length];
      activities.push({
        id: `activity_${activities.length + 1}`,
        type: 'study',
        goal: item.goal,
        priority: 'medium',
        estimatedDuration: 60
      });
    }

    return activities;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private formatActivityDescription(activity: ScheduledActivity): string {
    const typeLabels = {
      deep_work: 'Deep work',
      skill_practice: 'Skill practice',
      study: 'Study session',
      break: 'Break',
      personal: 'Personal time'
    };

    const label = typeLabels[activity.type] || 'Activity';
    return `${label}: ${activity.goal}`;
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary(validation: ValidationResult): string {
    if (validation.valid && validation.warnings.length === 0) {
      return 'All slots are valid';
    }

    const parts: string[] = [];
    
    if (validation.errors.length > 0) {
      parts.push(`${validation.errors.length} error(s)`);
    }
    
    if (validation.warnings.length > 0) {
      parts.push(`${validation.warnings.length} warning(s)`);
    }

    return parts.join(', ');
  }
}
