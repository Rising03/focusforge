import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express from 'express';
import compression from 'compression';
import { logger } from './utils/logger';
import { testConnection } from './config/database';
import { 
  getProductionConfig, 
  validateProductionEnvironment,
  createProductionDatabasePool 
} from './config/production';
import { 
  createCorsConfig, 
  createHelmetConfig, 
  createRateLimitConfig,
  createApiRateLimitConfig 
} from './config/security';

// Import routes
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

async function createProductionServer() {
  try {
    // Validate environment configuration
    validateProductionEnvironment();
    const config = getProductionConfig();
    
    logger.info('Starting Student Discipline System in production mode...');
    
    // Security middleware
    app.use(createHelmetConfig(config));
    app.use(createCorsConfig(config));
    app.use(createRateLimitConfig(config));
    
    // Performance middleware
    if (config.performance.compressionEnabled) {
      app.use(compression());
    }
    
    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Force HTTPS in production
    if (config.server.forceHttps) {
      app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
          res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
          next();
        }
      });
    }
    
    // Health check endpoints (no rate limiting)
    if (config.monitoring.healthCheckEnabled) {
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'OK', 
          timestamp: new Date().toISOString(),
          environment: config.server.nodeEnv,
          version: '1.0.0'
        });
      });

      app.get('/api/health', async (req, res) => {
        const dbConnected = await testConnection();
        res.json({ 
          status: dbConnected ? 'OK' : 'ERROR', 
          timestamp: new Date().toISOString(),
          service: 'Student Discipline System API',
          version: '1.0.0',
          environment: config.server.nodeEnv,
          database: dbConnected ? 'Connected' : 'Disconnected'
        });
      });
    }
    
    // API rate limiting for all API routes
    app.use('/api', createApiRateLimitConfig(config));
    
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
      res.json({ 
        message: 'Student Discipline System API',
        version: '1.0.0',
        environment: config.server.nodeEnv,
        timestamp: new Date().toISOString()
      });
    });

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Don't leak error details in production
      const errorResponse = config.server.nodeEnv === 'production' 
        ? { error: 'Internal server error' }
        : { error: err.message, stack: err.stack };
        
      res.status(500).json(errorResponse);
    });

    // 404 handler
    app.use('*', (req, res) => {
      logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Route not found' });
    });

    return { app, config };
  } catch (error) {
    logger.error('Failed to create production server:', error);
    throw error;
  }
}

// Start server function
const startProductionServer = async () => {
  try {
    const { app, config } = await createProductionServer();
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed - server cannot start');
      process.exit(1);
    }

    // Start the server
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.nodeEnv}`);
      logger.info(`🔒 Security: Enhanced production mode`);
      logger.info(`💾 Database: Connected`);
      logger.info(`🌐 CORS Origin: ${config.server.corsOrigin}`);
      logger.info(`⚡ Performance optimizations: Enabled`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start production server:', error);
    process.exit(1);
  }
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startProductionServer();
}

export default app;