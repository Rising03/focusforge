import { OAuth2Client } from 'google-auth-library';
import { GoogleOAuthUser } from '../types/auth';
import { logger } from '../utils/logger';

console.log('=== GoogleAuthService module loaded ===');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  logger.warn('Google OAuth credentials not configured. Google authentication will be disabled.');
}

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    // Use environment-specific redirect URI
    // Priority: 1. Explicit OAUTH_REDIRECT_URI, 2. Environment detection, 3. Default localhost
    let redirectUri = process.env.OAUTH_REDIRECT_URI;
    
    if (!redirectUri) {
      // Check multiple indicators for production environment
      const isProduction = process.env.NODE_ENV === 'production' || 
                          process.env.RAILWAY_ENVIRONMENT === 'production' ||
                          process.env.RAILWAY_PUBLIC_DOMAIN?.includes('railway.app');
      
      redirectUri = isProduction
        ? 'https://focusforge-production-33cd.up.railway.app/api/auth/google/callback'
        : 'http://localhost:3001/api/auth/google/callback';
    }
      
    // FORCE LOGGING FOR DEBUGGING
    console.log('=== GoogleAuthService initialized ===', {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
      OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI,
      DEBUG_OAUTH: process.env.DEBUG_OAUTH,
      finalRedirectUri: redirectUri
    });
      
    this.client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  }

  isConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true
    });
  }

  async verifyIdToken(idToken: string): Promise<GoogleOAuthUser> {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth not configured');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      if (!payload.email || !payload.sub) {
        throw new Error('Missing required user information');
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        picture: payload.picture
      };
    } catch (error) {
      logger.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  async exchangeCodeForTokens(code: string): Promise<{ idToken: string; accessToken: string }> {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth not configured');
    }

    try {
      const { tokens } = await this.client.getToken(code);
      
      if (!tokens.id_token || !tokens.access_token) {
        throw new Error('Missing tokens in response');
      }

      return {
        idToken: tokens.id_token,
        accessToken: tokens.access_token
      };
    } catch (error) {
      logger.error('Google token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  async getUserInfo(accessToken: string): Promise<GoogleOAuthUser> {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth not configured');
    }

    try {
      this.client.setCredentials({ access_token: accessToken });
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json() as any;

      if (!userInfo.email || !userInfo.id) {
        throw new Error('Missing required user information');
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture
      };
    } catch (error) {
      logger.error('Failed to get Google user info:', error);
      throw new Error('Failed to get user information');
    }
  }
}