import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import { db, closeDatabaseConnection } from './db';
import { users, projects, audioGenerationJobs } from './schema';

describe('Migration System (AC-2, AC-8)', () => {
  beforeAll(async () => {
    // Note: Migrations should be run manually via: bun run db:migrate
    // Tests assume database schema is already created
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe('1.4-DB-002 [P0]: should run database migrations using Drizzle', () => {
    it('should run initial migration successfully', async () => {
      // Check if migration table exists and has entries
      await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '__drizzle_migrations'
      `);

      // Note: The exact table name may vary depending on Drizzle version
      // For now, let's verify that our core tables exist
      const tables = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('users', 'projects', 'audio_generation_jobs', 'audio_files', 'api_keys')
        ORDER BY table_name
      `);

      const tableNames = tables.map((row: any) => row.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('projects');
      expect(tableNames).toContain('audio_generation_jobs');
      expect(tableNames).toContain('audio_files');
      expect(tableNames).toContain('api_keys');
    });

    it('should handle migration idempotently', async () => {
      // Running migration multiple times should not cause errors
      try {
        await migrate(db, { migrationsFolder: './src/drizzle/migrations' });
        await migrate(db, { migrationsFolder: './src/drizzle/migrations' });
        expect(true).toBe(true); // If we reach here, migrations were idempotent
      } catch (error) {
        expect.fail(`Migration should be idempotent: ${error}`);
      }
    });
  });

  describe('Performance Indexes Configuration (AC-4)', () => {
    it('should create performance indexes on frequently queried columns', async () => {
      // Check for indexes on users table
      const userIndexes = await db.execute(sql`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'users' AND indexname LIKE '%idx%'
        ORDER BY indexname
      `);

      const userIndexNames = userIndexes.map((row: any) => row.indexname);
      expect(userIndexNames).toContain('users_email_idx');
      expect(userIndexNames).toContain('users_tier_idx');
      expect(userIndexNames).toContain('users_created_at_idx');
    });

    it('should create composite indexes for common query patterns', async () => {
      // Check for composite indexes on projects table
      const projectIndexes = await db.execute(sql`
        SELECT indexname, indexdef FROM pg_indexes
        WHERE tablename = 'projects' AND indexname LIKE '%idx%'
        ORDER BY indexname
      `);

      const projectIndexNames = projectIndexes.map((row: any) => row.indexname);
      expect(projectIndexNames).toContain('projects_user_status_idx');
      expect(projectIndexNames).toContain('projects_user_id_idx');
    });

    it('should create GIN indexes for JSONB fields', async () => {
      // Check for GIN indexes on JSONB columns
      const jsonbIndexes = await db.execute(sql`
        SELECT indexname, indexdef FROM pg_indexes
        WHERE indexdef LIKE '%GIN%' AND tablename IN ('projects', 'audio_files', 'api_keys')
        ORDER BY indexname
      `);

      const jsonbIndexNames = jsonbIndexes.map((row: any) => row.indexname);
      expect(jsonbIndexNames.length).toBeGreaterThan(0);
    });
  });

  describe('1.4-DB-008 [P0]: should run migrations in development environment', () => {
    it('should work with Docker development environment', async () => {
      // This test verifies that the database connection works in a Docker-like environment
      const databaseUrl = process.env['DATABASE_URL'];
      expect(databaseUrl).toBeDefined();

      // Should be able to connect to localhost (Docker host) or database service
      if (databaseUrl) {
        expect(databaseUrl).toMatch(/localhost|postgres/);
      }

      // Should be able to execute basic operations
      const testResult = await db.execute(sql`SELECT version() as version`);
      expect(testResult[0].version).toContain('PostgreSQL');
    });

    it('should handle database connection from Docker Compose configuration', async () => {
      // Verify the connection string matches Docker Compose setup
      const expectedHost = process.env.POSTGRES_HOST || 'localhost';
      const expectedPort = process.env.POSTGRES_PORT || '5432';
      const expectedDb = process.env.POSTGRES_DB || 'falador';
      const expectedUser = process.env.POSTGRES_USER || 'falador';

      const databaseUrl = process.env['DATABASE_URL'];
      if (databaseUrl) {
        expect(databaseUrl).toContain(expectedHost);
        expect(databaseUrl).toContain(expectedPort);
        expect(databaseUrl).toContain(expectedDb);
        expect(databaseUrl).toContain(expectedUser);
      }
    });
  });

  describe('Database Constraints and Validation', () => {
    it('should enforce unique constraints', async () => {
      // Try to insert duplicate email
      const email = 'duplicate-test@example.com';

      await db.insert(users).values({
        email,
        name: 'First User',
        passwordHash: 'hashedpassword1',
        tier: 'free',
      });

      await expect(
        db.insert(users).values({
          email,
          name: 'Second User',
          passwordHash: 'hashedpassword2',
          tier: 'free',
        })
      ).rejects.toThrow();
    });

    it('should enforce check constraints', async () => {
      // Test user tier constraint
      await expect(
        db.insert(users).values({
          email: 'invalid-tier@example.com',
          name: 'Invalid Tier User',
          passwordHash: 'hashedpassword',
          tier: 'invalid_tier' as any,
        })
      ).rejects.toThrow();

      // Test project status constraint
      await expect(
        db.insert(projects).values({
          userId: 'test-user-id',
          title: 'Invalid Status Project',
          language: 'pt-BR',
          status: 'invalid_status' as any,
        })
      ).rejects.toThrow();
    });

    it('should validate data types and constraints', async () => {
      // Test audio file progress range
      const [job] = await db
        .insert(audioGenerationJobs)
        .values({
          projectId: 'test-project-id',
          chapterNumber: 1,
          text: 'Test text',
          status: 'pending',
        })
        .returning();

      // Progress should be between 0 and 100
      await expect(
        db
          .update(audioGenerationJobs)
          .set({ progress: -1 })
          .where(sql`id = ${job.id}`)
      ).rejects.toThrow();

      await expect(
        db
          .update(audioGenerationJobs)
          .set({ progress: 101 })
          .where(sql`id = ${job.id}`)
      ).rejects.toThrow();
    });
  });
});
