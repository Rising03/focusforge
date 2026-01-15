import { query } from '../config/database';
import { 
  ActivitySession, 
  ActivityStart, 
  ActivityLog, 
  TimeUtilization, 
  DailyStats,
  CategoryTime,
  ActivityBreakdown,
  ActivityHistoryRequest
} from '../types/activity';
import { logger } from '../utils/logger';

export class ActivityService {
  
  async startActivity(userId: string, activityStart: ActivityStart): Promise<ActivitySession> {
    try {
      // Check if there's already an active session
      const activeSession = await this.getActiveSession(userId);
      if (activeSession) {
        throw new Error('There is already an active activity session. Please stop the current session first.');
      }

      const queryText = `
        INSERT INTO activity_sessions (user_id, activity, start_time, notes)
        VALUES ($1, $2, NOW(), $3)
        RETURNING *
      `;

      const result = await query(queryText, [
        userId,
        activityStart.activity,
        activityStart.notes
      ]);

      const session = this.formatSessionFromDb(result.rows[0]);
      
      logger.info('Activity session started', { 
        userId, 
        sessionId: session.id, 
        activity: session.activity 
      });

      return session;
    } catch (error) {
      logger.error('Error starting activity session:', error);
      throw new Error('Failed to start activity session');
    }
  }

  async stopActivity(userId: string, sessionId: string, focusQuality: 'high' | 'medium' | 'low', distractions: number, notes?: string): Promise<ActivitySession> {
    try {
      // Verify session belongs to user and is active
      const session = await this.getSessionById(sessionId);
      if (!session || session.user_id !== userId) {
        throw new Error('Session not found or access denied');
      }

      if (session.end_time) {
        throw new Error('Session is already completed');
      }

      // Calculate duration
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - session.start_time.getTime()) / (1000 * 60));

      const queryText = `
        UPDATE activity_sessions 
        SET end_time = $1, duration = $2, focus_quality = $3, distractions = $4, notes = COALESCE($5, notes)
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `;

      const result = await query(queryText, [
        endTime,
        duration,
        focusQuality,
        distractions,
        notes,
        sessionId,
        userId
      ]);

      const updatedSession = this.formatSessionFromDb(result.rows[0]);

      logger.info('Activity session stopped', { 
        userId, 
        sessionId, 
        duration: duration,
        focusQuality 
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error stopping activity session:', error);
      throw new Error('Failed to stop activity session');
    }
  }

  async logActivity(userId: string, activityLog: ActivityLog): Promise<ActivitySession> {
    try {
      // Validate time range
      if (activityLog.end_time <= activityLog.start_time) {
        throw new Error('End time must be after start time');
      }

      const duration = Math.round((activityLog.end_time.getTime() - activityLog.start_time.getTime()) / (1000 * 60));

      const queryText = `
        INSERT INTO activity_sessions (user_id, activity, start_time, end_time, duration, focus_quality, distractions, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await query(queryText, [
        userId,
        activityLog.activity,
        activityLog.start_time,
        activityLog.end_time,
        duration,
        activityLog.focus_quality,
        activityLog.distractions,
        activityLog.notes
      ]);

      const session = this.formatSessionFromDb(result.rows[0]);

      logger.info('Activity logged manually', { 
        userId, 
        sessionId: session.id, 
        activity: session.activity,
        duration: duration
      });

      return session;
    } catch (error) {
      logger.error('Error logging activity:', error);
      throw new Error('Failed to log activity');
    }
  }

  async getActiveSession(userId: string): Promise<ActivitySession | null> {
    try {
      const queryText = `
        SELECT * FROM activity_sessions 
        WHERE user_id = $1 AND end_time IS NULL 
        ORDER BY start_time DESC 
        LIMIT 1
      `;

      const result = await query(queryText, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatSessionFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting active session:', error);
      throw new Error('Failed to get active session');
    }
  }

  async getTimeUtilization(userId: string, date: Date): Promise<TimeUtilization> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const queryText = `
        SELECT 
          activity,
          duration,
          focus_quality,
          start_time,
          end_time
        FROM activity_sessions 
        WHERE user_id = $1 
          AND start_time >= $2 
          AND start_time <= $3
          AND end_time IS NOT NULL
        ORDER BY start_time
      `;

      const result = await query(queryText, [userId, startOfDay, endOfDay]);
      const sessions = result.rows;

      // Calculate time categorization
      let focusedTime = 0;
      let distractedTime = 0;
      let deepWorkHours = 0;
      const categoryTimes: Record<string, number> = {};

      sessions.forEach((session: any) => {
        const duration = session.duration || 0;
        
        // Categorize by focus quality
        if (session.focus_quality === 'high') {
          focusedTime += duration;
          // Count as deep work if high focus and longer than 25 minutes
          if (duration >= 25) {
            deepWorkHours += duration / 60;
          }
        } else if (session.focus_quality === 'medium') {
          focusedTime += duration * 0.7; // Partial focus credit
          distractedTime += duration * 0.3;
        } else {
          distractedTime += duration;
        }

        // Categorize by activity type
        const category = this.categorizeActivity(session.activity);
        categoryTimes[category] = (categoryTimes[category] || 0) + duration;
      });

      const totalTrackedTime = focusedTime + distractedTime;
      const totalDayMinutes = 16 * 60; // Assuming 16 waking hours
      const unusedTime = Math.max(0, totalDayMinutes - totalTrackedTime);

      // Convert category times to CategoryTime objects
      const categories: CategoryTime[] = Object.entries(categoryTimes).map(([category, time]) => ({
        category,
        time,
        percentage: totalTrackedTime > 0 ? (time / totalTrackedTime) * 100 : 0
      }));

      return {
        date,
        focused_time: Math.round(focusedTime),
        distracted_time: Math.round(distractedTime),
        unused_time: Math.round(unusedTime),
        deep_work_hours: Math.round(deepWorkHours * 100) / 100, // Round to 2 decimal places
        categories
      };
    } catch (error) {
      logger.error('Error getting time utilization:', error);
      throw new Error('Failed to get time utilization');
    }
  }

  async getDailyStats(userId: string, date: Date): Promise<DailyStats> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const queryText = `
        SELECT 
          activity,
          duration,
          focus_quality,
          distractions,
          start_time,
          end_time
        FROM activity_sessions 
        WHERE user_id = $1 
          AND start_time >= $2 
          AND start_time <= $3
          AND end_time IS NOT NULL
        ORDER BY start_time
      `;

      const result = await query(queryText, [userId, startOfDay, endOfDay]);
      const sessions = result.rows;

      if (sessions.length === 0) {
        return this.getEmptyDailyStats(date);
      }

      // Calculate basic stats
      const totalTrackedTime = sessions.reduce((sum: any, s: any) => sum + (s.duration || 0), 0);
      const focusSessions = sessions.filter((s: any) => s.focus_quality === 'high').length;
      const totalDistractions = sessions.reduce((sum: any, s: any) => sum + (s.distractions || 0), 0);

      // Calculate average focus quality
      const focusScores = sessions.map((s: any) => this.mapFocusQualityToScore(s.focus_quality));
      const averageFocusQuality = focusScores.reduce((sum: any, score: any) => sum + score, 0) / focusScores.length;

      // Find most productive hour
      const hourlyProductivity: Record<string, number> = {};
      sessions.forEach((session: any) => {
        const hour = new Date(session.start_time).getHours();
        const hourKey = `${hour}:00`;
        const productivityScore = this.calculateProductivityScore(session);
        hourlyProductivity[hourKey] = (hourlyProductivity[hourKey] || 0) + productivityScore;
      });

      const mostProductiveHour = Object.entries(hourlyProductivity)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '09:00';

      // Calculate activity breakdown
      const activityStats: Record<string, { time: number; sessions: number; focusSum: number }> = {};
      sessions.forEach((session: any) => {
        const activity = session.activity;
        if (!activityStats[activity]) {
          activityStats[activity] = { time: 0, sessions: 0, focusSum: 0 };
        }
        activityStats[activity].time += session.duration || 0;
        activityStats[activity].sessions += 1;
        activityStats[activity].focusSum += this.mapFocusQualityToScore(session.focus_quality);
      });

      const activityBreakdown: ActivityBreakdown[] = Object.entries(activityStats).map(([activity, stats]) => ({
        activity,
        time: stats.time,
        sessions: stats.sessions,
        average_focus: stats.focusSum / stats.sessions
      }));

      return {
        date,
        total_tracked_time: totalTrackedTime,
        focus_sessions: focusSessions,
        average_focus_quality: Math.round(averageFocusQuality * 100) / 100,
        distraction_count: totalDistractions,
        most_productive_hour: mostProductiveHour,
        activity_breakdown: activityBreakdown
      };
    } catch (error) {
      logger.error('Error getting daily stats:', error);
      throw new Error('Failed to get daily stats');
    }
  }

  async getActivityHistory(userId: string, request: ActivityHistoryRequest): Promise<{ sessions: ActivitySession[]; totalCount: number }> {
    try {
      let queryText = `
        SELECT * FROM activity_sessions 
        WHERE user_id = $1 AND end_time IS NOT NULL
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      // Add date filters
      if (request.start_date) {
        queryText += ` AND DATE(start_time) >= $${paramIndex}`;
        params.push(request.start_date);
        paramIndex++;
      }

      if (request.end_date) {
        queryText += ` AND DATE(start_time) <= $${paramIndex}`;
        params.push(request.end_date);
        paramIndex++;
      }

      // Add activity filter
      if (request.activity_filter) {
        queryText += ` AND activity ILIKE $${paramIndex}`;
        params.push(`%${request.activity_filter}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Add ordering and pagination
      queryText += ` ORDER BY start_time DESC`;
      
      if (request.limit) {
        queryText += ` LIMIT $${paramIndex}`;
        params.push(request.limit);
        paramIndex++;
      }

      if (request.offset) {
        queryText += ` OFFSET $${paramIndex}`;
        params.push(request.offset);
      }

      const result = await query(queryText, params);
      const sessions = result.rows.map((row: any) => this.formatSessionFromDb(row));

      return { sessions, totalCount };
    } catch (error) {
      logger.error('Error getting activity history:', error);
      throw new Error('Failed to get activity history');
    }
  }

  private async getSessionById(sessionId: string): Promise<ActivitySession | null> {
    try {
      const queryText = 'SELECT * FROM activity_sessions WHERE id = $1';
      const result = await query(queryText, [sessionId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatSessionFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting session by ID:', error);
      throw new Error('Failed to get session');
    }
  }

  private formatSessionFromDb(row: any): ActivitySession {
    return {
      id: row.id,
      user_id: row.user_id,
      activity: row.activity,
      start_time: row.start_time,
      end_time: row.end_time,
      duration: row.duration,
      focus_quality: row.focus_quality || 'medium',
      distractions: row.distractions || 0,
      notes: row.notes,
      created_at: row.created_at
    };
  }

  private categorizeActivity(activity: string): string {
    const activityLower = activity.toLowerCase();
    
    if (activityLower.includes('study') || activityLower.includes('homework') || activityLower.includes('research')) {
      return 'Study';
    } else if (activityLower.includes('code') || activityLower.includes('programming') || activityLower.includes('development')) {
      return 'Programming';
    } else if (activityLower.includes('read') || activityLower.includes('book')) {
      return 'Reading';
    } else if (activityLower.includes('write') || activityLower.includes('writing')) {
      return 'Writing';
    } else if (activityLower.includes('break') || activityLower.includes('rest')) {
      return 'Break';
    } else if (activityLower.includes('meeting') || activityLower.includes('call')) {
      return 'Communication';
    } else {
      return 'Other';
    }
  }

  private mapFocusQualityToScore(quality: string): number {
    switch (quality) {
      case 'high': return 1.0;
      case 'medium': return 0.6;
      case 'low': return 0.2;
      default: return 0.5;
    }
  }

  private calculateProductivityScore(session: any): number {
    const focusScore = this.mapFocusQualityToScore(session.focus_quality);
    const durationScore = Math.min(1.0, (session.duration || 0) / 90); // Normalize to 90 minutes
    const distractionPenalty = Math.max(0, 1 - (session.distractions || 0) * 0.1);
    
    return focusScore * durationScore * distractionPenalty;
  }

  private getEmptyDailyStats(date: Date): DailyStats {
    return {
      date,
      total_tracked_time: 0,
      focus_sessions: 0,
      average_focus_quality: 0,
      distraction_count: 0,
      most_productive_hour: '09:00',
      activity_breakdown: []
    };
  }
}