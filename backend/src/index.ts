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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174'  // Support both ports
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: dbConnected ? 'OK' : 'ERROR', 
    timestamp: new Date().toISOString(),
    service: 'Student Discipline System API',
    version: '1.0.0',
    database: dbConnected ? 'Connected' : 'Disconnected'
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
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed, but server will continue to start');
    }

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      });
    }
  } catch (error) {
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
