import { query } from '../config/database';
import { 
  Habit, 
  HabitCompletion, 
  HabitDefinition, 
  HabitStreak, 
  HabitStackSuggestion,
  ConsistencyScore,
  HabitAnalyticsRequest
} from '../types/habit';
import { logger } from '../utils/logger';

export class HabitService {

  async createHabit(userId: string, habitDefinition: HabitDefinition): Promise<Habit> {
    try {
      // Validate stacked_after habit exists and belongs to user
      if (habitDefinition.stacked_after) {
        const stackedAfterHabit = await this.getHabitById(habitDefinition.stacked_after);
        if (!stackedAfterHabit || stackedAfterHabit.user_id !== userId) {
          throw new Error('Invalid stacked_after habit reference');
        }
      }

      const queryText = `
        INSERT INTO habits (user_id, name, description, frequency, cue, reward, stacked_after)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await query(queryText, [
        userId,
        habitDefinition.name,
        habitDefinition.description,
        habitDefinition.frequency,
        habitDefinition.cue,
        habitDefinition.reward,
        habitDefinition.stacked_after
      ]);

      const habit = this.formatHabitFromDb(result.rows[0]);

      logger.info('Habit created', { 
        userId, 
        habitId: habit.id, 
        habitName: habit.name 
      });

      return habit;
    } catch (error) {
      logger.error('Error creating habit:', error);
      throw new Error('Failed to create habit');
    }
  }

  async updateHabit(userId: string, habitId: string, updates: Partial<HabitDefinition> & { is_active?: boolean }): Promise<Habit> {
    try {
      // Verify habit belongs to user
      const existingHabit = await this.getHabitById(habitId);
      if (!existingHabit || existingHabit.user_id !== userId) {
        throw new Error('Habit not found or access denied');
      }

      // Validate stacked_after if provided
      if (updates.stacked_after) {
        const stackedAfterHabit = await this.getHabitById(updates.stacked_after);
        if (!stackedAfterHabit || stackedAfterHabit.user_id !== userId) {
          throw new Error('Invalid stacked_after habit reference');
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
      }

      if (updates.frequency !== undefined) {
        updateFields.push(`frequency = $${paramIndex}`);
        values.push(updates.frequency);
        paramIndex++;
      }

      if (updates.cue !== undefined) {
        updateFields.push(`cue = $${paramIndex}`);
        values.push(updates.cue);
        paramIndex++;
      }

      if (updates.reward !== undefined) {
        updateFields.push(`reward = $${paramIndex}`);
        values.push(updates.reward);
        paramIndex++;
      }

      if (updates.stacked_after !== undefined) {
        updateFields.push(`stacked_after = $${paramIndex}`);
        values.push(updates.stacked_after);
        paramIndex++;
      }

      if (updates.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        values.push(updates.is_active);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingHabit;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(habitId, userId);

      const queryText = `
        UPDATE habits 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await query(queryText, values);
      const updatedHabit = this.formatHabitFromDb(result.rows[0]);

      logger.info('Habit updated', { 
        userId, 
        habitId, 
        updates: Object.keys(updates) 
      });

      return updatedHabit;
    } catch (error) {
      logger.error('Error updating habit:', error);
      throw new Error('Failed to update habit');
    }
  }

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    try {
      // Verify habit belongs to user
      const habit = await this.getHabitById(habitId);
      if (!habit || habit.user_id !== userId) {
        throw new Error('Habit not found or access denied');
      }

      // Check if other habits are stacked after this one
      const stackedHabits = await this.getHabitsStackedAfter(habitId);
      if (stackedHabits.length > 0) {
        throw new Error('Cannot delete habit that has other habits stacked after it. Remove stacking first.');
      }

      const queryText = 'DELETE FROM habits WHERE id = $1 AND user_id = $2';
      await query(queryText, [habitId, userId]);

      logger.info('Habit deleted', { userId, habitId });
    } catch (error) {
      logger.error('Error deleting habit:', error);
      throw new Error('Failed to delete habit');
    }
  }

  async getUserHabits(userId: string, includeInactive: boolean = false): Promise<Habit[]> {
    try {
      let queryText = 'SELECT * FROM habits WHERE user_id = $1';
      const params = [userId];

      if (!includeInactive) {
        queryText += ' AND is_active = true';
      }

      queryText += ' ORDER BY created_at ASC';

      const result = await query(queryText, params);
      return result.rows.map((row: any) => this.formatHabitFromDb(row));
    } catch (error) {
      logger.error('Error getting user habits:', error);
      throw new Error('Failed to get user habits');
    }
  }

  async logHabitCompletion(userId: string, habitId: string, date: Date, completed: boolean, quality?: 'excellent' | 'good' | 'poor', notes?: string): Promise<HabitCompletion> {
    try {
      // Verify habit belongs to user
      const habit = await this.getHabitById(habitId);
      if (!habit || habit.user_id !== userId) {
        throw new Error('Habit not found or access denied');
      }

      // Check if completion already exists for this date
      const existingCompletion = await this.getHabitCompletionByDate(habitId, date);
      
      if (existingCompletion) {
        // Update existing completion
        const updateQuery = `
          UPDATE habit_completions 
          SET completed = $1, quality = $2, notes = $3
          WHERE id = $4
          RETURNING *
        `;

        const result = await query(updateQuery, [
          completed,
          quality,
          notes,
          existingCompletion.id
        ]);

        const updatedCompletion = this.formatCompletionFromDb(result.rows[0]);

        logger.info('Habit completion updated', { 
          userId, 
          habitId, 
          date: date.toISOString().split('T')[0], 
          completed 
        });

        return updatedCompletion;
      } else {
        // Create new completion
        const insertQuery = `
          INSERT INTO habit_completions (habit_id, user_id, date, completed, quality, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const result = await query(insertQuery, [
          habitId,
          userId,
          date,
          completed,
          quality,
          notes
        ]);

        const newCompletion = this.formatCompletionFromDb(result.rows[0]);

        logger.info('Habit completion logged', { 
          userId, 
          habitId, 
          date: date.toISOString().split('T')[0], 
          completed 
        });

        return newCompletion;
      }
    } catch (error) {
      logger.error('Error logging habit completion:', error);
      throw new Error('Failed to log habit completion');
    }
  }

  async getHabitStreaks(userId: string): Promise<HabitStreak[]> {
    try {
      const habits = await this.getUserHabits(userId);
      const streaks: HabitStreak[] = [];

      for (const habit of habits) {
        const streak = await this.calculateHabitStreak(habit.id);
        const consistencyPercentage = await this.calculateConsistencyPercentage(habit.id, 30);

        streaks.push({
          habit_id: habit.id,
          habit_name: habit.name,
          current_streak: streak.current,
          longest_streak: streak.longest,
          last_completed: streak.lastCompleted,
          consistency_percentage: consistencyPercentage
        });
      }

      return streaks;
    } catch (error) {
      logger.error('Error getting habit streaks:', error);
      throw new Error('Failed to get habit streaks');
    }
  }

  async suggestHabitStacks(userId: string): Promise<HabitStackSuggestion[]> {
    try {
      const habits = await this.getUserHabits(userId);
      const suggestions: HabitStackSuggestion[] = [];

      // Find habits with high consistency that could be good anchors
      const consistentHabits = [];
      for (const habit of habits) {
        const consistency = await this.calculateConsistencyPercentage(habit.id, 30);
        if (consistency >= 70 && !habit.stacked_after) { // High consistency and not already stacked
          consistentHabits.push({ habit, consistency });
        }
      }

      // Sort by consistency
      consistentHabits.sort((a, b) => b.consistency - a.consistency);

      // Generate suggestions based on common habit stacking patterns
      const stackingSuggestions = [
        { pattern: 'morning routine', suggestions: ['meditation', 'journaling', 'exercise', 'reading'] },
        { pattern: 'study session', suggestions: ['review notes', 'practice problems', 'summarize learning'] },
        { pattern: 'evening routine', suggestions: ['plan tomorrow', 'gratitude practice', 'prepare clothes'] },
        { pattern: 'meal time', suggestions: ['take vitamins', 'drink water', 'mindful eating'] },
        { pattern: 'work break', suggestions: ['stretch', 'deep breathing', 'walk'] }
      ];

      for (const { habit, consistency } of consistentHabits.slice(0, 3)) { // Top 3 consistent habits
        const habitLower = habit.name.toLowerCase();
        
        for (const { pattern, suggestions: patternSuggestions } of stackingSuggestions) {
          if (habitLower.includes(pattern.split(' ')[0]) || habitLower.includes(pattern.split(' ')[1])) {
            for (const suggestion of patternSuggestions) {
              // Check if user doesn't already have this habit
              const hasHabit = habits.some(h => h.name.toLowerCase().includes(suggestion));
              if (!hasHabit) {
                suggestions.push({
                  existing_habit_id: habit.id,
                  existing_habit_name: habit.name,
                  suggested_new_habit: suggestion,
                  reason: `Stack with your consistent ${habit.name} habit (${consistency.toFixed(0)}% consistency)`,
                  confidence_score: Math.min(0.9, consistency / 100 + 0.2)
                });
              }
            }
            break;
          }
        }
      }

      // Remove duplicates and limit to top 5 suggestions
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.suggested_new_habit === suggestion.suggested_new_habit)
        )
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, 5);

      return uniqueSuggestions;
    } catch (error) {
      logger.error('Error suggesting habit stacks:', error);
      throw new Error('Failed to suggest habit stacks');
    }
  }

  async calculateConsistencyScore(userId: string): Promise<ConsistencyScore> {
    try {
      const habits = await this.getUserHabits(userId);
      const habitScores = [];
      let totalScore = 0;

      for (const habit of habits) {
        const consistency = await this.calculateConsistencyPercentage(habit.id, 30);
        const streak = await this.calculateHabitStreak(habit.id);
        
        const score = Math.round(consistency);
        habitScores.push({
          habit_id: habit.id,
          habit_name: habit.name,
          score,
          streak: streak.current
        });

        totalScore += score;
      }

      const overallScore = habits.length > 0 ? Math.round(totalScore / habits.length) : 0;

      // Generate insights
      const insights = this.generateConsistencyInsights(overallScore, habitScores);
      const recommendations = this.generateConsistencyRecommendations(overallScore, habitScores);

      return {
        overall_score: overallScore,
        habit_scores: habitScores,
        insights,
        recommendations
      };
    } catch (error) {
      logger.error('Error calculating consistency score:', error);
      throw new Error('Failed to calculate consistency score');
    }
  }

  async getHabitAnalytics(userId: string, request: HabitAnalyticsRequest): Promise<any> {
    try {
      const startDate = request.start_date ? new Date(request.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = request.end_date ? new Date(request.end_date) : new Date();

      let habits = await this.getUserHabits(userId);
      
      if (request.habit_ids && request.habit_ids.length > 0) {
        habits = habits.filter(h => request.habit_ids!.includes(h.id));
      }

      const analyticsData = [];

      for (const habit of habits) {
        const completions = await this.getHabitCompletionsInRange(habit.id, startDate, endDate);
        
        // Calculate opportunities based on frequency
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalOpportunities = habit.frequency === 'daily' ? daysDiff : Math.ceil(daysDiff / 7);
        
        const completedCount = completions.filter(c => c.completed).length;
        const completionRate = totalOpportunities > 0 ? (completedCount / totalOpportunities) * 100 : 0;

        // Calculate streak data
        const streakData = await this.calculateStreakDataInRange(habit.id, startDate, endDate);

        // Calculate quality distribution
        const qualityDistribution = {
          excellent: completions.filter(c => c.quality === 'excellent').length,
          good: completions.filter(c => c.quality === 'good').length,
          poor: completions.filter(c => c.quality === 'poor').length
        };

        analyticsData.push({
          habit_id: habit.id,
          habit_name: habit.name,
          total_opportunities: totalOpportunities,
          completed_count: completedCount,
          completion_rate: Math.round(completionRate * 100) / 100,
          streak_data: streakData,
          quality_distribution: qualityDistribution
        });
      }

      const insights = this.generateAnalyticsInsights(analyticsData);
      const recommendations = this.generateAnalyticsRecommendations(analyticsData);

      return {
        period: { start_date: startDate, end_date: endDate },
        habits: analyticsData,
        insights,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting habit analytics:', error);
      throw new Error('Failed to get habit analytics');
    }
  }

  // Private helper methods

  private async getHabitById(habitId: string): Promise<Habit | null> {
    try {
      const queryText = 'SELECT * FROM habits WHERE id = $1';
      const result = await query(queryText, [habitId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatHabitFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting habit by ID:', error);
      throw new Error('Failed to get habit');
    }
  }

  private async getHabitsStackedAfter(habitId: string): Promise<Habit[]> {
    try {
      const queryText = 'SELECT * FROM habits WHERE stacked_after = $1 AND is_active = true';
      const result = await query(queryText, [habitId]);
      return result.rows.map((row: any) => this.formatHabitFromDb(row));
    } catch (error) {
      logger.error('Error getting stacked habits:', error);
      return [];
    }
  }

  private async getHabitCompletionByDate(habitId: string, date: Date): Promise<HabitCompletion | null> {
    try {
      const queryText = 'SELECT * FROM habit_completions WHERE habit_id = $1 AND date = $2';
      const result = await query(queryText, [habitId, date]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatCompletionFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting habit completion by date:', error);
      return null;
    }
  }

  private async calculateHabitStreak(habitId: string): Promise<{ current: number; longest: number; lastCompleted: Date | null }> {
    try {
      const queryText = `
        SELECT date, completed 
        FROM habit_completions 
        WHERE habit_id = $1 
        ORDER BY date DESC
      `;

      const result = await query(queryText, [habitId]);
      const completions = result.rows;

      if (completions.length === 0) {
        return { current: 0, longest: 0, lastCompleted: null };
      }

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastCompleted: Date | null = null;

      // Find last completed date
      for (const completion of completions) {
        if (completion.completed) {
          lastCompleted = completion.date;
          break;
        }
      }

      // Calculate current streak (from most recent backwards)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < completions.length; i++) {
        const completion = completions[i];
        const completionDate = new Date(completion.date);
        
        if (completion.completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      for (const completion of completions.reverse()) {
        if (completion.completed) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      return { current: currentStreak, longest: longestStreak, lastCompleted };
    } catch (error) {
      logger.error('Error calculating habit streak:', error);
      return { current: 0, longest: 0, lastCompleted: null };
    }
  }

  private async calculateConsistencyPercentage(habitId: string, days: number): Promise<number> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const queryText = `
        SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
        FROM habit_completions 
        WHERE habit_id = $1 AND date >= $2 AND date <= $3
      `;

      const result = await query(queryText, [habitId, startDate, endDate]);
      const { total, completed } = result.rows[0];

      if (total === 0) return 0;
      return (completed / total) * 100;
    } catch (error) {
      logger.error('Error calculating consistency percentage:', error);
      return 0;
    }
  }

  private async getHabitCompletionsInRange(habitId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
    try {
      const queryText = `
        SELECT * FROM habit_completions 
        WHERE habit_id = $1 AND date >= $2 AND date <= $3
        ORDER BY date ASC
      `;

      const result = await query(queryText, [habitId, startDate, endDate]);
      return result.rows.map((row: any) => this.formatCompletionFromDb(row));
    } catch (error) {
      logger.error('Error getting habit completions in range:', error);
      return [];
    }
  }

  private async calculateStreakDataInRange(habitId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const completions = await this.getHabitCompletionsInRange(habitId, startDate, endDate);
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let streakBreaks = 0;

      for (const completion of completions) {
        if (completion.completed) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          if (tempStreak > 0) {
            streakBreaks++;
          }
          tempStreak = 0;
        }
      }

      // Current streak is the last consecutive completions
      for (let i = completions.length - 1; i >= 0; i--) {
        if (completions[i].completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        current_streak: currentStreak,
        longest_streak_in_period: longestStreak,
        streak_breaks: streakBreaks
      };
    } catch (error) {
      logger.error('Error calculating streak data in range:', error);
      return {
        current_streak: 0,
        longest_streak_in_period: 0,
        streak_breaks: 0
      };
    }
  }

  private formatHabitFromDb(row: any): Habit {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      frequency: row.frequency,
      cue: row.cue,
      reward: row.reward,
      stacked_after: row.stacked_after,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private formatCompletionFromDb(row: any): HabitCompletion {
    return {
      id: row.id,
      habit_id: row.habit_id,
      user_id: row.user_id,
      date: row.date,
      completed: row.completed,
      quality: row.quality,
      notes: row.notes,
      created_at: row.created_at
    };
  }

  private generateConsistencyInsights(overallScore: number, habitScores: any[]): string[] {
    const insights: string[] = [];

    if (overallScore >= 80) {
      insights.push('Excellent consistency! You\'re building strong discipline through your daily habits.');
    } else if (overallScore >= 60) {
      insights.push('Good consistency overall. Focus on the habits that need more attention.');
    } else if (overallScore >= 40) {
      insights.push('Moderate consistency. Consider simplifying your habits or reducing the number of habits.');
    } else {
      insights.push('Low consistency detected. Focus on 1-2 core habits and build from there.');
    }

    const bestHabit = habitScores.reduce((best, current) => 
      current.score > best.score ? current : best, habitScores[0]);
    
    if (bestHabit && bestHabit.score > 70) {
      insights.push(`Your most consistent habit is "${bestHabit.habit_name}" - consider stacking new habits after this one.`);
    }

    const strugglingHabits = habitScores.filter(h => h.score < 50);
    if (strugglingHabits.length > 0) {
      insights.push(`${strugglingHabits.length} habit(s) need attention. Consider the "never miss twice" rule.`);
    }

    return insights;
  }

  private generateConsistencyRecommendations(overallScore: number, habitScores: any[]): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('Focus on 1-2 core habits until they become automatic (21+ day streaks)');
      recommendations.push('Use the "never miss twice" rule - if you miss once, prioritize not missing again');
    }

    const strugglingHabits = habitScores.filter(h => h.score < 50);
    if (strugglingHabits.length > 0) {
      recommendations.push('Consider making struggling habits smaller or easier to complete');
      recommendations.push('Link struggling habits to existing strong routines (habit stacking)');
    }

    if (habitScores.length > 5) {
      recommendations.push('Consider reducing the number of habits you\'re tracking to focus on quality over quantity');
    }

    const strongHabits = habitScores.filter(h => h.score > 70);
    if (strongHabits.length > 0) {
      recommendations.push('Use your strong habits as anchors for building new habit stacks');
    }

    return recommendations;
  }

  private generateAnalyticsInsights(analyticsData: any[]): string[] {
    const insights: string[] = [];

    const avgCompletionRate = analyticsData.reduce((sum, h) => sum + h.completion_rate, 0) / analyticsData.length;
    
    if (avgCompletionRate > 80) {
      insights.push('Outstanding habit performance! You\'re consistently executing your routines.');
    } else if (avgCompletionRate > 60) {
      insights.push('Solid habit performance with room for improvement on consistency.');
    } else {
      insights.push('Habit consistency needs attention. Focus on your most important habits first.');
    }

    const bestHabit = analyticsData.reduce((best, current) => 
      current.completion_rate > best.completion_rate ? current : best, analyticsData[0]);
    
    if (bestHabit) {
      insights.push(`"${bestHabit.habit_name}" is your strongest habit with ${bestHabit.completion_rate.toFixed(1)}% completion rate.`);
    }

    const totalStreakBreaks = analyticsData.reduce((sum, h) => sum + h.streak_data.streak_breaks, 0);
    if (totalStreakBreaks > 0) {
      insights.push(`You had ${totalStreakBreaks} streak breaks in this period. Remember: never miss twice!`);
    }

    return insights;
  }

  private generateAnalyticsRecommendations(analyticsData: any[]): string[] {
    const recommendations: string[] = [];

    const strugglingHabits = analyticsData.filter(h => h.completion_rate < 50);
    if (strugglingHabits.length > 0) {
      recommendations.push('Consider simplifying or reducing the frequency of low-performing habits');
      recommendations.push('Use habit stacking to link struggling habits with strong ones');
    }

    const habitsWithBreaks = analyticsData.filter(h => h.streak_data.streak_breaks > 2);
    if (habitsWithBreaks.length > 0) {
      recommendations.push('Focus on consistency over perfection - aim to never miss the same habit twice in a row');
    }

    if (analyticsData.length > 3) {
      const avgRate = analyticsData.reduce((sum, h) => sum + h.completion_rate, 0) / analyticsData.length;
      if (avgRate < 70) {
        recommendations.push('Consider focusing on fewer habits to improve overall consistency');
      }
    }

    return recommendations;
  }
}