import { logger } from '../utils/logger';

/**
 * Energy Level Types
 */
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  energyLevel?: EnergyLevel;
}

export interface EnergyPattern {
  timeOfDay: string;
  energyLevel: EnergyLevel;
  productivity: number;
  startTime?: string;
  endTime?: string;
}

export interface Activity {
  id: string;
  type: 'deep_work' | 'skill_practice' | 'study' | 'break' | 'personal';
  goal: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration?: number;
}

export interface ScheduledActivity extends Activity {
  timeSlot: TimeSlot;
  energyMatch: number; // 0-1 score of how well activity matches slot energy
}

/**
 * Energy-Based Scheduler
 * 
 * Matches activities to time slots based on energy levels:
 * - High-energy slots → Critical/High priority activities
 * - Medium-energy slots → Medium priority activities
 * - Low-energy slots → Low priority or light activities
 * 
 * Features:
 * - Energy level classification from analytics data
 * - Activity-to-energy matching algorithm
 * - Priority-based activity ordering
 * - Fallback to time-of-day heuristics
 */
export class EnergyScheduler {
  
  /**
   * Classify time slot energy level based on historical patterns
   */
  classifyTimeSlotEnergy(
    timeSlot: TimeSlot,
    energyPatterns: EnergyPattern[]
  ): EnergyLevel {
    // If already classified, return it
    if (timeSlot.energyLevel) {
      return timeSlot.energyLevel;
    }

    // If no energy patterns, use time-of-day heuristics
    if (!energyPatterns || energyPatterns.length === 0) {
      return this.getEnergyByTimeOfDay(timeSlot.startTime);
    }

    // Find matching energy pattern
    const slotHour = this.parseTime(timeSlot.startTime);
    
    for (const pattern of energyPatterns) {
      if (pattern.startTime && pattern.endTime) {
        const patternStart = this.parseTime(pattern.startTime);
        const patternEnd = this.parseTime(pattern.endTime);
        
        if (slotHour >= patternStart && slotHour < patternEnd) {
          return pattern.energyLevel;
        }
      }
    }

    // Fallback to time-of-day heuristics
    return this.getEnergyByTimeOfDay(timeSlot.startTime);
  }

  /**
   * Match activities to time slots based on energy levels
   * Returns optimally scheduled activities
   */
  matchActivitiesToEnergy(
    activities: Activity[],
    timeSlots: TimeSlot[],
    energyPatterns: EnergyPattern[]
  ): ScheduledActivity[] {
    // Classify all time slots
    const classifiedSlots = timeSlots.map(slot => ({
      ...slot,
      energyLevel: this.classifyTimeSlotEnergy(slot, energyPatterns)
    }));

    // Sort activities by priority
    const sortedActivities = this.sortActivitiesByPriority(activities);

    // Sort slots by energy level (high first)
    const sortedSlots = this.sortSlotsByEnergy(classifiedSlots);

    // Match activities to slots
    const scheduled: ScheduledActivity[] = [];
    
    for (let i = 0; i < Math.min(sortedActivities.length, sortedSlots.length); i++) {
      const activity = sortedActivities[i];
      const slot = sortedSlots[i];
      
      scheduled.push({
        ...activity,
        timeSlot: slot,
        energyMatch: this.calculateEnergyMatch(activity, slot)
      });
    }

    return scheduled;
  }

  /**
   * Optimize activity order based on energy patterns
   * Reorders activities to match energy availability
   */
  optimizeActivityOrder(
    activities: Activity[],
    energyPatterns: EnergyPattern[]
  ): Activity[] {
    // Group activities by priority
    const critical = activities.filter(a => a.priority === 'critical');
    const high = activities.filter(a => a.priority === 'high');
    const medium = activities.filter(a => a.priority === 'medium');
    const low = activities.filter(a => a.priority === 'low');

    // Determine if user is morning or evening person
    const isMorningPerson = this.isMorningPerson(energyPatterns);

    if (isMorningPerson) {
      // Morning person: high priority first
      return [...critical, ...high, ...medium, ...low];
    } else {
      // Evening person: distribute high priority across day
      return this.distributeActivities(critical, high, medium, low);
    }
  }

  /**
   * Get optimal time slot for a specific activity type
   */
  getOptimalTimeForActivity(
    activityType: Activity['type'],
    energyPatterns: EnergyPattern[]
  ): TimeSlot | null {
    // Deep work needs high energy
    if (activityType === 'deep_work') {
      const highEnergyPattern = energyPatterns.find(p => p.energyLevel === 'high');
      if (highEnergyPattern && highEnergyPattern.startTime && highEnergyPattern.endTime) {
        return {
          startTime: highEnergyPattern.startTime,
          endTime: highEnergyPattern.endTime,
          energyLevel: 'high'
        };
      }
      // Default to morning
      return { startTime: '09:00', endTime: '11:00', energyLevel: 'high' };
    }

    // Skill practice can use medium energy
    if (activityType === 'skill_practice') {
      const mediumEnergyPattern = energyPatterns.find(p => p.energyLevel === 'medium');
      if (mediumEnergyPattern && mediumEnergyPattern.startTime && mediumEnergyPattern.endTime) {
        return {
          startTime: mediumEnergyPattern.startTime,
          endTime: mediumEnergyPattern.endTime,
          energyLevel: 'medium'
        };
      }
      return { startTime: '14:00', endTime: '16:00', energyLevel: 'medium' };
    }

    // Study can use any energy level
    return null;
  }

  // ============ Private Helper Methods ============

  private getEnergyByTimeOfDay(timeStr: string): EnergyLevel {
    const hour = parseInt(timeStr.split(':')[0]);

    // Morning (6-12): High energy
    if (hour >= 6 && hour < 12) {
      return 'high';
    }
    // Afternoon (12-18): Medium energy
    else if (hour >= 12 && hour < 18) {
      return 'medium';
    }
    // Evening (18-22): Low energy
    else if (hour >= 18 && hour < 22) {
      return 'low';
    }
    // Night/Early morning: Low energy
    else {
      return 'low';
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private sortActivitiesByPriority(activities: Activity[]): Activity[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...activities].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  private sortSlotsByEnergy(slots: TimeSlot[]): TimeSlot[] {
    const energyOrder = { high: 0, medium: 1, low: 2 };
    return [...slots].sort((a, b) => {
      const aEnergy = a.energyLevel || 'medium';
      const bEnergy = b.energyLevel || 'medium';
      return energyOrder[aEnergy] - energyOrder[bEnergy];
    });
  }

  private calculateEnergyMatch(activity: Activity, slot: TimeSlot): number {
    const slotEnergy = slot.energyLevel || 'medium';
    const activityPriority = activity.priority;

    // Perfect matches
    if (activityPriority === 'critical' && slotEnergy === 'high') return 1.0;
    if (activityPriority === 'high' && slotEnergy === 'high') return 0.9;
    if (activityPriority === 'medium' && slotEnergy === 'medium') return 0.9;
    if (activityPriority === 'low' && slotEnergy === 'low') return 0.9;

    // Good matches
    if (activityPriority === 'high' && slotEnergy === 'medium') return 0.7;
    if (activityPriority === 'medium' && slotEnergy === 'high') return 0.7;
    if (activityPriority === 'medium' && slotEnergy === 'low') return 0.6;

    // Poor matches
    if (activityPriority === 'critical' && slotEnergy !== 'high') return 0.4;
    if (activityPriority === 'low' && slotEnergy === 'high') return 0.5;

    return 0.5; // Default
  }

  private isMorningPerson(energyPatterns: EnergyPattern[]): boolean {
    if (!energyPatterns || energyPatterns.length === 0) {
      return true; // Default to morning person
    }

    // Find morning and evening energy levels
    const morningEnergy = energyPatterns.find(p => {
      if (p.startTime) {
        const hour = parseInt(p.startTime.split(':')[0]);
        return hour >= 6 && hour < 12;
      }
      return p.timeOfDay === 'morning';
    });

    const eveningEnergy = energyPatterns.find(p => {
      if (p.startTime) {
        const hour = parseInt(p.startTime.split(':')[0]);
        return hour >= 18 && hour < 22;
      }
      return p.timeOfDay === 'evening';
    });

    if (morningEnergy && eveningEnergy) {
      return morningEnergy.productivity > eveningEnergy.productivity;
    }

    return true; // Default to morning person
  }

  private distributeActivities(
    critical: Activity[],
    high: Activity[],
    medium: Activity[],
    low: Activity[]
  ): Activity[] {
    // Interleave activities for evening people
    const result: Activity[] = [];
    const maxLength = Math.max(critical.length, high.length, medium.length, low.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < critical.length) result.push(critical[i]);
      if (i < high.length) result.push(high[i]);
      if (i < medium.length) result.push(medium[i]);
      if (i < low.length) result.push(low[i]);
    }

    return result;
  }

  /**
   * Get energy statistics for a set of scheduled activities
   */
  getEnergyStatistics(scheduled: ScheduledActivity[]): {
    averageMatch: number;
    highEnergyCount: number;
    mediumEnergyCount: number;
    lowEnergyCount: number;
    poorMatches: ScheduledActivity[];
  } {
    const highEnergy = scheduled.filter(s => s.timeSlot.energyLevel === 'high');
    const mediumEnergy = scheduled.filter(s => s.timeSlot.energyLevel === 'medium');
    const lowEnergy = scheduled.filter(s => s.timeSlot.energyLevel === 'low');
    const poorMatches = scheduled.filter(s => s.energyMatch < 0.6);

    const averageMatch = scheduled.length > 0
      ? scheduled.reduce((sum, s) => sum + s.energyMatch, 0) / scheduled.length
      : 0;

    return {
      averageMatch,
      highEnergyCount: highEnergy.length,
      mediumEnergyCount: mediumEnergy.length,
      lowEnergyCount: lowEnergy.length,
      poorMatches
    };
  }

  /**
   * Suggest improvements for poor energy matches
   */
  suggestImprovements(scheduled: ScheduledActivity[]): string[] {
    const suggestions: string[] = [];
    const stats = this.getEnergyStatistics(scheduled);

    if (stats.averageMatch < 0.7) {
      suggestions.push('Consider adjusting activity priorities to better match energy levels');
    }

    if (stats.poorMatches.length > 0) {
      suggestions.push(`${stats.poorMatches.length} activities have poor energy matches - consider rescheduling`);
    }

    if (stats.highEnergyCount === 0) {
      suggestions.push('No high-energy time slots identified - consider adding morning activities');
    }

    return suggestions;
  }
}
