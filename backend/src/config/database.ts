import { Pool } from 'pg';
import { logger } from '../utils/logger';
import MockDatabase from './mockDatabase';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('=== DATABASE CONFIG ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Create pool - prefer DATABASE_URL for cloud deployments
const pool = new Pool(
  process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : process.env.DB_HOST
    ? {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'student_discipline',
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT || '5432'),
        ssl: process.env.DB_HOST.includes('proxy.rlwy.net') || process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'student_discipline',
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT || '5432'),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

console.log('Using DATABASE_URL:', !!process.env.DATABASE_URL);
console.log('Using DB_HOST:', process.env.DB_HOST);

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

    console.log('Testing database connection...');
    console.log(`DATABASE_URL is ${process.env.DATABASE_URL ? 'set' : 'not set'}`);
    
    const client = await pool.connect();
    console.log('Pool connection acquired');
    await client.query('SELECT NOW()');
    console.log('Test query executed successfully');
    client.release();
    logger.info('PostgreSQL database connection successful');
    return true;
  } catch (error: any) {
    console.error('Database connection test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    logger.error('Database connection test failed:', error.message);
    logger.error('Error details:', error);
    
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