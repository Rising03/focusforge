import { query } from '../config/database';
import { User, UserRegistration, UserLogin, AuthToken } from '../types/auth';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export class UserService {
  async createUser(userData: UserRegistration): Promise<User> {
    const { email, password } = userData;
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }
    
    // Check if user already exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert user into database
    const queryText = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, created_at, updated_at
    `;
    
    try {
      const result = await query(queryText, [email, passwordHash]);
      const user = result.rows[0];
      
      logger.info('User created successfully', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }
  
  async authenticateUser(loginData: UserLogin): Promise<AuthToken> {
    const { email, password } = loginData;
    
    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    
    logger.info('User authenticated successfully', { userId: user.id, email: user.email });
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }

  async authenticateGoogleUser(email: string): Promise<AuthToken> {
    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify this is a Google OAuth user
    if (!user.google_id) {
      throw new Error('User is not a Google OAuth user');
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    
    logger.info('Google user authenticated successfully', { userId: user.id, email: user.email });
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }
  
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Verify user still exists
      const user = await this.findUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new tokens
      const newAccessToken = generateAccessToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id, user.email);
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          google_id: user.google_id,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      };
    } catch (error) {
      logger.warn('Refresh token validation failed:', error);
      throw new Error('Invalid refresh token');
    }
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await query(queryText, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw new Error('Database query failed');
    }
  }
  
  async findUserById(id: string): Promise<User | null> {
    const queryText = 'SELECT * FROM users WHERE id = $1';
    
    try {
      const result = await query(queryText, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw new Error('Database query failed');
    }
  }
  
  async findUserByGoogleId(googleId: string): Promise<User | null> {
    const queryText = 'SELECT * FROM users WHERE google_id = $1';
    
    try {
      const result = await query(queryText, [googleId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by Google ID:', error);
      throw new Error('Database query failed');
    }
  }
  
  async createOrUpdateGoogleUser(googleUser: { id: string; email: string; name: string }): Promise<User> {
    // Check if user exists with this Google ID
    let user = await this.findUserByGoogleId(googleUser.id);
    
    if (user) {
      return user;
    }
    
    // Check if user exists with this email
    user = await this.findUserByEmail(googleUser.email);
    
    if (user) {
      // Update existing user with Google ID
      const queryText = `
        UPDATE users 
        SET google_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      try {
        const result = await query(queryText, [googleUser.id, user.id]);
        logger.info('User updated with Google ID', { userId: user.id, email: user.email });
        return result.rows[0];
      } catch (error) {
        logger.error('Error updating user with Google ID:', error);
        throw new Error('Failed to update user');
      }
    } else {
      // Create new user with Google ID
      const queryText = `
        INSERT INTO users (email, google_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      try {
        const result = await query(queryText, [googleUser.email, googleUser.id]);
        const newUser = result.rows[0];
        logger.info('Google user created successfully', { userId: newUser.id, email: newUser.email });
        return newUser;
      } catch (error) {
        logger.error('Error creating Google user:', error);
        throw new Error('Failed to create Google user');
      }
    }
  }
}