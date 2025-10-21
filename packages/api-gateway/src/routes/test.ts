import { Elysia } from 'elysia';
import { db } from '../database';

/**
 * Test-only routes for database cleanup and test utilities
 * These routes should only be available in test environment
 */
export const testRoutes = new Elysia({ prefix: '/api/test' })

  // Database cleanup endpoint for tests
  .post('/cleanup', async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Test routes are only available in test environment');
    }

    try {
      // Clear all in-memory database data
      db.clear();

      return {
        success: true,
        message: 'Test database cleanup completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Test cleanup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  })

  // Test database status endpoint
  .get('/status', async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Test routes are only available in test environment');
    }

    try {
      // Get database status using in-memory database methods
      // Note: For a real implementation, we would need to add count methods to the Database class
      // For now, we'll just return a basic status
      return {
        success: true,
        data: {
          status: 'In-memory database active',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  });
