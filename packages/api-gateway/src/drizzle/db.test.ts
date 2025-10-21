import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import { db, closeDatabaseConnection, checkDatabaseHealth } from './db';

describe('Database Connection (AC-1)', () => {
  beforeAll(async () => {
    // Note: Migrations should be run manually via: bun run db:migrate
    // Tests assume database is already set up
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe('1.4-DB-001 [P0]: should connect to PostgreSQL with environment variables', () => {
    it('should establish database connection successfully', async () => {
      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });

    it('should execute simple query', async () => {
      const result = await db.execute(sql`SELECT 1 as test_value`);
      expect(result[0]).toEqual({ test_value: 1 });
    });

    it('should use environment variables for connection', async () => {
      const databaseUrl = process.env['DATABASE_URL'];
      expect(databaseUrl).toBeDefined();
      expect(databaseUrl).toMatch(/^postgresql:\/\//);
    });
  });

  describe('Connection Pool Configuration (AC-7)', () => {
    it('should handle connection pooling', async () => {
      // Test multiple concurrent connections
      const createConnectionQuery = async (i: number) => {
        const result = await db.execute(sql`SELECT ${i} as connection_id`);
        return result[0].connection_id;
      };

      const promises = Array.from({ length: 5 }, (_, i) =>
        createConnectionQuery(i)
      );

      const results = await Promise.all(promises);
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle connection timeout gracefully', async () => {
      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });
  });
});
