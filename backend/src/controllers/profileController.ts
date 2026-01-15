import { Request, Response } from 'express';
import { ProfileService } from '../services/profileService';
import { CreateProfileRequest, UpdateProfileRequest } from '../types/profile';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Convert camelCase to snake_case for compatibility
      const profileData: CreateProfileRequest = this.convertToSnakeCase(req.body);
      const result = await this.profileService.createProfile(userId, profileData);

      // Flatten the response to include profile properties at top level for test compatibility
      res.status(201).json({
        id: result.profile.id,
        targetIdentity: result.profile.target_identity,
        ...result
      });
    } catch (error) {
      logger.error('Error in createProfile controller:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Missing required fields') || 
            error.message.includes('Invalid') ||
            error.message.includes('must be between')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const result = await this.profileService.getProfile(userId);
      
      if (!result) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error in getProfile controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Convert camelCase to snake_case for compatibility
      const profileData: UpdateProfileRequest = this.convertToSnakeCase(req.body);
      const result = await this.profileService.updateProfile(userId, profileData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in updateProfile controller:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Profile not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        
        if (error.message.includes('No fields to update') ||
            error.message.includes('Invalid') ||
            error.message.includes('must be between')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await this.profileService.deleteProfile(userId);

      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteProfile controller:', error);
      
      if (error instanceof Error && error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateDetailedProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const detailedProfileData = req.body;
      const result = await this.profileService.updateDetailedProfile(userId, detailedProfileData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in updateDetailedProfile controller:', error);
      
      if (error instanceof Error && error.message === 'Profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async trackBehavioralEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { eventType, eventData, context } = req.body;
      
      if (!eventType || !eventData) {
        res.status(400).json({ error: 'eventType and eventData are required' });
        return;
      }

      await this.profileService.trackBehavioralEvent(userId, eventType, eventData, context);

      res.json({
        success: true,
        message: 'Behavioral event tracked successfully'
      });
    } catch (error) {
      logger.error('Error in trackBehavioralEvent controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBehavioralAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const analytics = await this.profileService.getBehavioralAnalytics(userId, days);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getBehavioralAnalytics controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private convertToSnakeCase(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.convertToSnakeCase(item));
    }

    const converted: any = {};
    
    // Field mapping from camelCase to snake_case
    const fieldMap: Record<string, string> = {
      'targetIdentity': 'target_identity',
      'academicGoals': 'academic_goals',
      'skillGoals': 'skill_goals',
      'wakeUpTime': 'wake_up_time',
      'sleepTime': 'sleep_time',
      'availableHours': 'available_hours',
      'energyPattern': 'energy_pattern',
      'detailedProfile': 'detailed_profile'
    };

    for (const [key, value] of Object.entries(data)) {
      const snakeKey = fieldMap[key] || key;
      converted[snakeKey] = this.convertToSnakeCase(value);
    }

    return converted;
  }
}