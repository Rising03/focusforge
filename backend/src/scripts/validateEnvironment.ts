#!/usr/bin/env node

import dotenv from 'dotenv';
import { validateProductionEnvironment } from '../config/production';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function validateEnvironment() {
  try {
    logger.info('Starting environment validation...');
    
    // Validate production configuration
    validateProductionEnvironment();
    
    logger.info('✅ Environment validation completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}

export { validateEnvironment };