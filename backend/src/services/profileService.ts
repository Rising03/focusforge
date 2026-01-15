import { query } from '../config/database';
import { 
  UserProfile, 
  CreateProfileRequest, 
  UpdateProfileRequest, 
  ProfileResponse,
  DetailedUserProfile
} from '../types/profile';
import { logger } from '../utils/logger';

export class ProfileService {
  async createProfile(userId: string, profileData: CreateProfileRequest): Promise<ProfileResponse> {
    const {
      target_identity,
      academic_goals,
      skill_goals,
      wake_up_time,
      sleep_time,
      available_hours,
      energy_pattern = [],
      detailed_profile = {}
    } = profileData;

    // Validate required fields
    this.validateRequiredFields(profileData);

    const queryText = `
      INSERT INTO user_profiles (
        user_id, target_identity, academic_goals, skill_goals, 
        wake_up_time, sleep_time, available_hours, energy_pattern, detailed_profile
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      logger.info('Creating profile with data:', {
        userId,
        target_identity,
        academic_goals,
        skill_goals,
        wake_up_time,
        sleep_time,
        available_hours,
        energy_pattern,
        detailed_profile
      });

      const result = await query(queryText, [
        userId,
        target_identity,
        academic_goals,
        skill_goals,
        wake_up_time,
        sleep_time,
        available_hours,
        JSON.stringify(energy_pattern),
        JSON.stringify(detailed_profile)
      ]);

      const profile = result.rows[0];
      logger.info('User profile created successfully', { userId, profileId: profile.id });

      return this.formatProfileResponse(profile);
    } catch (error) {
      logger.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  async getProfile(userId: string): Promise<ProfileResponse | null> {
    const queryText = 'SELECT * FROM user_profiles WHERE user_id = $1';

    try {
      const result = await query(queryText, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const profile = result.rows[0];
      return this.formatProfileResponse(profile);
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  async updateProfile(userId: string, profileData: UpdateProfileRequest): Promise<ProfileResponse> {
    // First check if profile exists
    const existingProfile = await this.getProfile(userId);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(profileData).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        // FIX: Added $ prefix to parameter placeholder
        updateFields.push(`${key} = $${paramCount}`);
        
        // Handle JSON fields
        if (key === 'energy_pattern' || key === 'detailed_profile') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    // FIX: Added $ prefix to parameter placeholder
    const queryText = `
      UPDATE user_profiles 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    try {
      logger.info('Updating profile with query:', { queryText, values });
      const result = await query(queryText, values);
      const profile = result.rows[0];
      
      logger.info('User profile updated successfully', { userId, profileId: profile.id });
      return this.formatProfileResponse(profile);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    const queryText = 'DELETE FROM user_profiles WHERE user_id = $1';

    try {
      const result = await query(queryText, [userId]);
      
      if (result.rowCount === 0) {
        throw new Error('Profile not found');
      }

      logger.info('User profile deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  async updateDetailedProfile(userId: string, detailedProfile: Partial<DetailedUserProfile>): Promise<ProfileResponse> {
    const existingProfile = await this.getProfile(userId);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Merge with existing detailed profile
    const currentDetailedProfile = existingProfile.profile.detailed_profile || {};
    const updatedDetailedProfile = { ...currentDetailedProfile, ...detailedProfile };

    logger.info('Updating detailed profile:', {
      userId,
      currentDetailedProfile,
      newData: detailedProfile,
      merged: updatedDetailedProfile
    });

    return this.updateProfile(userId, { detailed_profile: updatedDetailedProfile });
  }

  async trackBehavioralEvent(userId: string, eventType: string, eventData: any, context?: any): Promise<void> {
    const queryText = `
      INSERT INTO behavioral_analytics (user_id, event_type, event_data, context)
      VALUES ($1, $2, $3, $4)
    `;

    try {
      await query(queryText, [
        userId,
        eventType,
        JSON.stringify(eventData),
        context ? JSON.stringify(context) : null
      ]);

      logger.debug('Behavioral event tracked', { userId, eventType });
    } catch (error) {
      logger.error('Error tracking behavioral event:', error);
      // Don't throw error for analytics tracking failures
    }
  }

  async getBehavioralAnalytics(userId: string, days: number = 30): Promise<any[]> {
    const queryText = `
      SELECT event_type, event_data, context, timestamp
      FROM behavioral_analytics
      WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;

    try {
      const result = await query(queryText, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching behavioral analytics:', error);
      throw new Error('Failed to fetch behavioral analytics');
    }
  }

  private validateRequiredFields(profileData: CreateProfileRequest): void {
    const requiredFields = [
      'target_identity',
      'academic_goals',
      'skill_goals',
      'wake_up_time',
      'sleep_time',
      'available_hours'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = profileData[field as keyof CreateProfileRequest];
      return value === undefined || value === null || 
             (Array.isArray(value) && value.length === 0) ||
             (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(profileData.wake_up_time)) {
      throw new Error('Invalid wake_up_time format. Use HH:MM format.');
    }
    if (!timeRegex.test(profileData.sleep_time)) {
      throw new Error('Invalid sleep_time format. Use HH:MM format.');
    }

    // Validate available hours
    if (profileData.available_hours < 1 || profileData.available_hours > 24) {
      throw new Error('Available hours must be between 1 and 24');
    }
  }

  private formatProfileResponse(profile: any): ProfileResponse {
    // Parse JSON fields
    const formattedProfile: UserProfile = {
      ...profile,
      energy_pattern: typeof profile.energy_pattern === 'string' 
        ? JSON.parse(profile.energy_pattern) 
        : profile.energy_pattern || [],
      detailed_profile: typeof profile.detailed_profile === 'string'
        ? JSON.parse(profile.detailed_profile)
        : profile.detailed_profile || {}
    };

    // Calculate completion percentage
    const completionData = this.calculateCompletionPercentage(formattedProfile);

    return {
      profile: formattedProfile,
      completion_percentage: completionData.percentage,
      missing_fields: completionData.missingFields
    };
  }

  private calculateCompletionPercentage(profile: UserProfile): { percentage: number; missingFields: string[] } {
    const requiredFields = [
      'target_identity',
      'academic_goals',
      'skill_goals',
      'wake_up_time',
      'sleep_time',
      'available_hours'
    ];

    const optionalDetailedFields = [
      'learning_style',
      'productivity_peaks',
      'distraction_triggers',
      'motivation_factors',
      'study_environment_prefs',
      'personality_traits',
      'academic_background'
    ];

    let completedRequiredFields = 0;
    const missingFields: string[] = [];

    // Check required fields only for percentage calculation
    requiredFields.forEach(field => {
      const value = profile[field as keyof UserProfile];
      if (value && (typeof value !== 'object' || (Array.isArray(value) && value.length > 0))) {
        completedRequiredFields++;
      } else {
        missingFields.push(field);
      }
    });

    // Track optional detailed fields for missing fields list only
    const detailedProfile = profile.detailed_profile || {};
    optionalDetailedFields.forEach(field => {
      const value = detailedProfile[field as keyof DetailedUserProfile];
      if (!value || (typeof value === 'object' && Array.isArray(value) && value.length === 0) || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
        missingFields.push(`detailed_profile.${field}`);
      }
    });

    // Calculate percentage based on required fields only
    // This shows 100% when basic profile is complete
    const percentage = Math.round((completedRequiredFields / requiredFields.length) * 100);
    
    return { 
      percentage,
      missingFields 
    };
  }
}
