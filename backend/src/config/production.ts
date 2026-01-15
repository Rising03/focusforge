import { Pool } from 'pg';
import { logger } from '../utils/logger';

export interface ProductionConfig {
  server: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    corsOrigin: string;
    forceHttps: boolean;
  };
  database: {
    url?: string;
    host?: string;
    port?: number;
    name?: string;
    user?: string;
    password?: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
    ssl: boolean;
  };
  security: {
    jwtSecret: string;
    jwtRefreshSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    helmetCspEnabled: boolean;
    rateLimitEnabled: boolean;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  logging: {
    level: string;
    fileEnabled: boolean;
    filePath?: string;
  };
  performance: {
    compressionEnabled: boolean;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
  monitoring: {
    metricsEnabled: boolean;
    metricsPort: number;
    healthCheckEnabled: boolean;
  };
}

export const getProductionConfig = (): ProductionConfig => {
  // Validate required environment variables
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    server: {
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: process.env.NODE_ENV || 'production',
      frontendUrl: process.env.FRONTEND_URL || 'https://student-discipline-system.vercel.app',
      corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://student-discipline-system.vercel.app',
      forceHttps: process.env.FORCE_HTTPS === 'true',
    },
    database: {
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      ssl: process.env.NODE_ENV === 'production',
    },
    security: {
      jwtSecret: process.env.JWT_SECRET!,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      helmetCspEnabled: process.env.HELMET_CSP_ENABLED === 'true',
      rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
      filePath: process.env.LOG_FILE_PATH,
    },
    performance: {
      compressionEnabled: process.env.COMPRESSION_ENABLED === 'true',
      cacheEnabled: process.env.CACHE_ENABLED === 'true',
      cacheTtl: parseInt(process.env.CACHE_TTL || '300'),
    },
    monitoring: {
      metricsEnabled: process.env.METRICS_ENABLED === 'true',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
      healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    },
  };
};

export const createProductionDatabasePool = (config: ProductionConfig): Pool => {
  const poolConfig = config.database.url 
    ? {
        connectionString: config.database.url,
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeout,
        connectionTimeoutMillis: config.database.connectionTimeout,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      }
    : {
        user: config.database.user,
        host: config.database.host,
        database: config.database.name,
        password: config.database.password,
        port: config.database.port,
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeout,
        connectionTimeoutMillis: config.database.connectionTimeout,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      };

  const pool = new Pool(poolConfig);

  pool.on('connect', () => {
    logger.info('Connected to production PostgreSQL database');
  });

  pool.on('error', (err) => {
    logger.error('Production PostgreSQL connection error:', err);
  });

  return pool;
};

export const validateProductionEnvironment = (): void => {
  const config = getProductionConfig();
  
  // Security validations
  if (config.security.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for production');
  }
  
  if (config.security.jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long for production');
  }
  
  if (config.security.jwtSecret === config.security.jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
  
  // Database validations
  if (!config.database.url && (!config.database.host || !config.database.name)) {
    throw new Error('Either DATABASE_URL or individual database config (DB_HOST, DB_NAME) must be provided');
  }
  
  logger.info('Production environment validation passed');
};