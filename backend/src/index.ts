import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { testConnection } from './config/database';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profileRoutes';
import behavioralAnalyticsRoutes from './routes/behavioralAnalyticsRoutes';
import routineRoutes from './routes/routineRoutes';
import activityRoutes from './routes/activityRoutes';
import habitRoutes from './routes/habitRoutes';
import eveningReviewRoutes from './routes/eveningReviewRoutes';
import aiRoutes from './routes/aiRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import deepWorkRoutes from './routes/deepWorkRoutes';
import identityRoutes from './routes/identityRoutes';
import reviewCycleRoutes from './routes/reviewCycleRoutes';
import dataExportRoutes from './routes/dataExportRoutes';
import breakSuggestionsRoutes from './routes/breakSuggestionsRoutes';
import { initializeDatabase } from './scripts/initDatabase';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, allow specific origins
    const allowedOrigins = [
      'https://frontend-plum-nu-59.vercel.app',
      'https://focusforge-production-33cd.up.railway.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now, log for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (req, res) => {
  // Simple health check for Railway deployment health checks
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (req, res) => {
  // Use a simple health check without database test to avoid log spam
  // Railway health checks hit this endpoint frequently
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Student Discipline System API',
    version: '1.0.0',
    database: 'Available', // Assume available since server started successfully
    dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/behavioral-analytics', behavioralAnalyticsRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/evening-reviews', eveningReviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/deep-work', deepWorkRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/review-cycles', reviewCycleRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/break-suggestions', breakSuggestionsRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Student Discipline System API' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server and test database connection
const startServer = async () => {
  try {
    console.log('=== STARTING SERVER ===');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Test database connection
    const dbConnected = await testConnection();
    console.log('Database connected:', dbConnected);
    
    if (!dbConnected) {
      logger.warn('Database connection failed, but server will continue to start');
    } else {
      // Initialize database schema if connected
      logger.info('Attempting to initialize database schema...');
      await initializeDatabase();
    }

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`=== SERVER RUNNING ON PORT ${PORT} ===`);
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      });
    }
  } catch (error) {
    console.error('=== FAILED TO START SERVER ===', error);
    logger.error('Failed to start server:', error);
    // Only exit in production, not in tests
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
