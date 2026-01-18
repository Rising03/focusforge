import { logger } from '../utils/logger';
import { query } from '../config/database';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase(): Promise<boolean> {
  try {
    logger.info('Initializing database schema...');
    
    // Test connection first by running a simple query
    await query('SELECT NOW()');
    
    // Check if users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      logger.info('Database already initialized');
      return true;
    }

    // Read and execute init.sql
    const initSqlPath = path.join(__dirname, '../../../database/init.sql');
    if (fs.existsSync(initSqlPath)) {
      logger.info('Running init.sql...');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      await query(initSql);
      logger.info('✓ init.sql completed');
    }

    // Run migrations
    const migrations = [
      'identity_migration.sql',
      'deep_work_migration.sql',
      'evening_review_migration.sql',
      'review_cycle_migration.sql',
      'add_daily_routines_table.sql',
      'fix_habits_system.sql',
      'fix_profile_arrays.sql',
      'fix_deep_work_function.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, '../../../database', migration);
      if (fs.existsSync(migrationPath)) {
        logger.info(`Running ${migration}...`);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        try {
          await query(sql);
          logger.info(`✓ ${migration} completed`);
        } catch (err: any) {
          logger.warn(`⚠ ${migration} skipped: ${err.message}`);
        }
      }
    }

    logger.info('✅ Database initialized successfully!');
    return true;
  } catch (error: any) {
    logger.error('Database initialization failed:', error.message);
    return false;
  }
}
