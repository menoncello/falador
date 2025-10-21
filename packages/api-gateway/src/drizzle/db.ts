import { drizzle } from 'drizzle-orm/node-postgres-js';
import { Pool } from 'pg';

/**
 * Database connection configuration and pool management
 *
 * This module handles the PostgreSQL connection using Drizzle ORM
 * with proper connection pooling for optimal performance.
 */

// Optimized connection pool configuration for <100ms response times
const poolConfig = {
  // Maximum number of connections in the pool
  max: Math.max(20, Number.parseInt(process.env.DB_POOL_MAX || '20', 10)),
  // Minimum number of connections to keep in the pool
  min: Math.max(5, Number.parseInt(process.env.DB_POOL_MIN || '5', 10)),
  // Maximum time a connection can be idle before being closed (reduced for better performance)
  idleTimeoutMillis: Number.parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
  // Maximum time to wait for a connection from the pool (reduced for fast failures)
  connectionTimeoutMillis: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
  // How often to check for idle connections to close
  reapIntervalMillis: 1000,
  // How long to keep connection alive before closing (keep connections warm)
  createTimeoutMillis: 2000,
  // Destroy timeout
  destroyTimeoutMillis: 5000,
  // Enable SSL for production environments
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : false,
};

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString:
    process.env['DATABASE_URL'] ||
    'postgresql://falador:falador_dev@localhost:5432/falador',
  ...poolConfig,
});

// Create Drizzle instance with the pool
export const db = drizzle(pool);

// Export pool for direct access when needed
export { pool };

// Performance monitoring
let totalQueries = 0;
let slowQueries = 0;
const slowQueryThreshold = 100; // ms

// Track query performance
pool.on('connect', () => {
  totalQueries++;
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Performance monitoring wrapper
export function withQueryMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();
  return operation().then(result => {
    const duration = Date.now() - startTime;
    if (duration > slowQueryThreshold) {
      slowQueries++;
      console.warn(`Slow query detected: ${operationName} took ${duration}ms`);
    }
    return result;
  }).catch(error => {
    const duration = Date.now() - startTime;
    console.error(`Query failed: ${operationName} after ${duration}ms`, error);
    throw error;
  });
}

// Graceful shutdown function
/**
 * Closes the database connection pool gracefully
 */
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

// Enhanced health check function
/**
 * Checks if the database connection is healthy
 * @returns True if connection is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const startTime = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    const duration = Date.now() - startTime;

    if (duration > slowQueryThreshold) {
      console.warn(`Database health check slow: ${duration}ms`);
    }

    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Performance metrics
export function getDatabasePerformanceMetrics() {
  const poolMetrics = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };

  return {
    pool: poolMetrics,
    queries: {
      total: totalQueries,
      slow: slowQueries,
      slowQueryThreshold,
      slowQueryPercentage: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
    },
  };
}

// Optimize pool for concurrent load
export function optimizePoolForConcurrency(targetConcurrency: number) {
  const recommendedPoolSize = Math.max(targetConcurrency, 20);
  console.log(`Optimizing database pool for ${targetConcurrency} concurrent users`);

  // Log current pool settings for debugging
  console.log('Current pool configuration:', {
    max: pool.options.max,
    min: pool.options.min,
    idleTimeoutMillis: pool.options.idleTimeoutMillis,
    connectionTimeoutMillis: pool.options.connectionTimeoutMillis,
  });

  return {
    recommendedMax: recommendedPoolSize,
    recommendedMin: Math.max(5, Math.floor(recommendedPoolSize * 0.25)),
    recommendedIdleTimeout: 5000, // 5 seconds for high concurrency
    recommendedConnectionTimeout: 1000, // 1 second for fast failures
  };
}
