import { Request, Response } from 'express';
import Joi from 'joi';
import { UserService } from '../services/userService';
import { GoogleAuthService } from '../services/googleAuthService';
import { logger } from '../utils/logger';

const userService = new UserService();
const googleAuthService = new GoogleAuthService();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().optional() // Allow name field but don't require it
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const googleTokenSchema = Joi.object({
  idToken: Joi.string().required()
});

const googleCallbackSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().optional()
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }
      
      const { email, password } = value;
      
      // Create user
      const user = await userService.createUser({ email, password });
      
      // Authenticate the newly created user
      const authToken = await userService.authenticateUser({ email, password });
      
      return res.status(201).json({
        message: 'User registered successfully',
        ...authToken
      });
      
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      if (error.message.includes('Password validation failed')) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
  
  async login(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }
      
      const { email, password } = value;
      
      // Authenticate user
      const authToken = await userService.authenticateUser({ email, password });
      
      return res.json({
        message: 'Login successful',
        ...authToken
      });
      
    } catch (error: any) {
      logger.error('Login error:', error);
      
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      return res.status(500).json({ error: 'Login failed' });
    }
  }
  
  async refreshToken(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }
      
      const { refreshToken } = value;
      
      // Refresh tokens
      const authToken = await userService.refreshToken(refreshToken);
      
      return res.json({
        message: 'Token refreshed successfully',
        ...authToken
      });
      
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      
      if (error.message.includes('Invalid refresh token')) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      return res.status(500).json({ error: 'Token refresh failed' });
    }
  }
  
  async logout(req: Request, res: Response) {
    // In a stateless JWT system, logout is handled client-side
    // by removing the tokens from storage
    return res.json({ message: 'Logout successful' });
  }
  
  async me(req: Request, res: Response) {
    try {
      // This endpoint requires authentication middleware
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = await userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return user data without sensitive information
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          google_id: user.google_id,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });
      
    } catch (error) {
      logger.error('Get user profile error:', error);
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  async googleAuth(req: Request, res: Response) {
    try {
      if (!googleAuthService.isConfigured()) {
        return res.status(503).json({ 
          error: 'Google OAuth not configured',
          message: 'Google authentication is not available'
        });
      }

      const authUrl = googleAuthService.getAuthUrl();
      return res.json({ authUrl });
      
    } catch (error) {
      logger.error('Google auth URL generation error:', error);
      return res.status(500).json({ error: 'Failed to generate Google auth URL' });
    }
  }

  async googleCallback(req: Request, res: Response) {
    try {
      if (!googleAuthService.isConfigured()) {
        return res.status(503).json({ 
          error: 'Google OAuth not configured',
          message: 'Google authentication is not available'
        });
      }

      // Handle both query parameters (from redirect) and body (from API call)
      const code = req.query.code as string || req.body.code;
      const error = req.query.error as string;

      if (error) {
        // Redirect to frontend with error
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=${encodeURIComponent('No authorization code received')}`);
      }

      // Exchange code for tokens
      const { idToken, accessToken } = await googleAuthService.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await googleAuthService.getUserInfo(accessToken);
      
      // Create or update user in our system
      const user = await userService.createOrUpdateGoogleUser(googleUser);
      
      // Generate our own JWT tokens
      const authToken = await userService.authenticateGoogleUser(user.email);

      // If this is a direct redirect from Google, redirect to frontend with tokens
      if (req.query.code) {
        const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${authToken.accessToken}&refresh=${authToken.refreshToken}`;
        return res.redirect(frontendUrl);
      }

      // If this is an API call, return JSON
      return res.json({
        message: 'Google authentication successful',
        ...authToken
      });
      
    } catch (error: any) {
      logger.error('Google callback error:', error);
      
      // If this is a redirect from Google, redirect to frontend with error
      if (req.query.code || req.query.error) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=${encodeURIComponent(error.message || 'Google authentication failed')}`);
      }
      
      // If this is an API call, return JSON error
      if (error.message.includes('Invalid Google token') || 
          error.message.includes('Failed to exchange authorization code')) {
        return res.status(401).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Google authentication failed' });
    }
  }

  async googleTokenAuth(req: Request, res: Response) {
    try {
      if (!googleAuthService.isConfigured()) {
        return res.status(503).json({ 
          error: 'Google OAuth not configured',
          message: 'Google authentication is not available'
        });
      }

      // Validate request body
      const { error, value } = googleTokenSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const { idToken } = value;

      // Verify Google ID token
      const googleUser = await googleAuthService.verifyIdToken(idToken);
      
      // Create or update user in our system
      const user = await userService.createOrUpdateGoogleUser(googleUser);
      
      // Generate our own JWT tokens
      const authToken = await userService.authenticateGoogleUser(user.email);

      return res.json({
        message: 'Google token authentication successful',
        ...authToken
      });
      
    } catch (error: any) {
      logger.error('Google token auth error:', error);
      
      if (error.message.includes('Invalid Google token')) {
        return res.status(401).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Google token authentication failed' });
    }
  }
}