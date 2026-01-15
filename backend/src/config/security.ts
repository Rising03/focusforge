import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ProductionConfig } from './production';

export const createCorsConfig = (config: ProductionConfig) => {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        config.server.corsOrigin,
        config.server.frontendUrl,
        'http://localhost:5173', // Development
        'http://localhost:3000', // Alternative development
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
  });
};

export const createHelmetConfig = (config: ProductionConfig) => {
  return helmet({
    contentSecurityPolicy: config.security.helmetCspEnabled ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", config.server.frontendUrl],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: config.server.forceHttps ? [] : null,
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
};

export const createRateLimitConfig = (config: ProductionConfig) => {
  if (!config.security.rateLimitEnabled) {
    return (req: any, res: any, next: any) => next();
  }

  return rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

export const createApiRateLimitConfig = (config: ProductionConfig) => {
  if (!config.security.rateLimitEnabled) {
    return (req: any, res: any, next: any) => next();
  }

  return rateLimit({
    windowMs: 60000, // 1 minute
    max: 60, // More restrictive for API endpoints
    message: {
      error: 'Too many API requests, please try again later.',
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};