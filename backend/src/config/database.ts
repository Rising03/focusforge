import { Pool } from 'pg';
import { logger } from '../utils/logger';
import MockDatabase from './mockDatabase';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create pool with DATABASE_URL if available, otherwise use individual config
const pool = new Pool(
  process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased to 10 seconds
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'student_discipline',
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT || '5432'),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased to 10 seconds
      }
);

let useMockDatabase = false;
let mockDb: MockDatabase;

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL connection error:', err);
  // Only switch to mock database in development/test environments
  if (!useMockDatabase && process.env.NODE_ENV !== 'production') {
    logger.warn('Switching to mock database for development');
    useMockDatabase = true;
    mockDb = MockDatabase.getInstance();
    mockDb.connect();
  }
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    if (useMockDatabase && mockDb) {
      await mockDb.query('SELECT NOW()');
      logger.warn('Using MOCK DATABASE - data will not persist!');
      return true;
    }

    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    
    // Only use mock database in development/test, not production
    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.warn('Attempting to use mock database for development');
        useMockDatabase = true;
        mockDb = MockDatabase.getInstance();
        await mockDb.connect();
        logger.warn('Mock database initialized - data will NOT persist!');
        return true;
      } catch (mockError) {
        logger.error('Mock database initialization failed:', mockError);
        return false;
      }
    } else {
      logger.error('Database connection failed in production - cannot use mock database');
      return false;
    }
  }
};

// Database query wrapper that handles both real and mock database
export const query = async (text: string, params?: any[]): Promise<any> => {
  if (useMockDatabase && mockDb) {
    return await mockDb.query(text, params);
  }
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Database query failed:', error);
    // DO NOT fallback to mock database on query errors
    // This causes login issues and data inconsistency
    throw error;
  }
};

export { useMockDatabase };
export default pool;