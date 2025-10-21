import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'bun:test';
import { sql } from 'drizzle-orm';
import { db, closeDatabaseConnection } from './db';
import {
  users,
  projects,
  audioGenerationJobs,
  audioFiles,
  apiKeys,
} from './schema';

describe('Database Schema Validation (AC-3)', () => {
  beforeAll(async () => {
    // Note: Migrations should be run manually via: bun run db:migrate
    // Tests assume database schema is already created
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  beforeEach(async () => {
    // Clean up test data
    await db.delete(apiKeys);
    await db.delete(audioFiles);
    await db.delete(audioGenerationJobs);
    await db.delete(projects);
    await db.delete(users);
  });

  describe('1.4-DB-003 [P0]: should create core entity tables', () => {
    it('should create users table with correct structure', async () => {
      // Check if table exists and has correct columns
      const tableInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      const columns = tableInfo.map((row: any) => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('email');
      expect(columns).toContain('name');
      expect(columns).toContain('password_hash');
      expect(columns).toContain('tier');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should create projects table with correct structure', async () => {
      const tableInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'projects'
        ORDER BY ordinal_position
      `);

      const columns = tableInfo.map((row: any) => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('title');
      expect(columns).toContain('author');
      expect(columns).toContain('language');
      expect(columns).toContain('genre');
      expect(columns).toContain('status');
      expect(columns).toContain('metadata');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should create audio_generation_jobs table with correct structure', async () => {
      const tableInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'audio_generation_jobs'
        ORDER BY ordinal_position
      `);

      const columns = tableInfo.map((row: any) => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('project_id');
      expect(columns).toContain('chapter_number');
      expect(columns).toContain('voice_id');
      expect(columns).toContain('text');
      expect(columns).toContain('status');
      expect(columns).toContain('progress');
      expect(columns).toContain('error_message');
      expect(columns).toContain('processing_started_at');
      expect(columns).toContain('processing_completed_at');
      expect(columns).toContain('created_at');
    });

    it('should create audio_files table with correct structure', async () => {
      const tableInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'audio_files'
        ORDER BY ordinal_position
      `);

      const columns = tableInfo.map((row: any) => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('job_id');
      expect(columns).toContain('file_path');
      expect(columns).toContain('file_name');
      expect(columns).toContain('format');
      expect(columns).toContain('duration');
      expect(columns).toContain('file_size');
      expect(columns).toContain('quality_score');
      expect(columns).toContain('metadata');
      expect(columns).toContain('created_at');
    });

    it('should create api_keys table with correct structure', async () => {
      const tableInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'api_keys'
        ORDER BY ordinal_position
      `);

      const columns = tableInfo.map((row: any) => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('key_hash');
      expect(columns).toContain('name');
      expect(columns).toContain('scopes');
      expect(columns).toContain('last_used_at');
      expect(columns).toContain('expires_at');
      expect(columns).toContain('created_at');
    });
  });

  describe('Foreign Key Relationships (AC-5)', () => {
    it('should enforce foreign key relationships', async () => {
      // Try to insert a project with non-existent user_id
      await expect(
        db.insert(projects).values({
          id: 'test-project-id',
          userId: 'non-existent-user-id',
          title: 'Test Project',
          language: 'pt-BR',
          status: 'draft',
        })
      ).rejects.toThrow();

      // Try to insert an audio job with non-existent project_id
      await expect(
        db.insert(audioGenerationJobs).values({
          id: 'test-job-id',
          projectId: 'non-existent-project-id',
          chapterNumber: 1,
          text: 'Test text',
          status: 'pending',
        })
      ).rejects.toThrow();
    });

    it('should cascade delete related records', async () => {
      // Create a user
      const [user] = await db
        .insert(users)
        .values({
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashedpassword',
          tier: 'free',
        })
        .returning();

      // Create a project for the user
      const [project] = await db
        .insert(projects)
        .values({
          id: 'test-project-id',
          userId: user.id,
          title: 'Test Project',
          language: 'pt-BR',
          status: 'draft',
        })
        .returning();

      // Create an audio job for the project
      await db.insert(audioGenerationJobs).values({
        id: 'test-job-id',
        projectId: project.id,
        chapterNumber: 1,
        text: 'Test text',
        status: 'pending',
      });

      // Delete the user and verify cascade deletion
      await db.delete(users).where(sql`id = ${user.id}`);

      const remainingUsers = await db.select().from(users);
      const remainingProjects = await db.select().from(projects);
      const remainingJobs = await db.select().from(audioGenerationJobs);

      expect(remainingUsers).toHaveLength(0);
      expect(remainingProjects).toHaveLength(0);
      expect(remainingJobs).toHaveLength(0);
    });
  });

  describe('Timestamp Fields Configuration (AC-6)', () => {
    it('should include timestamp fields on all tables', async () => {
      // Insert test data
      const [user] = await db
        .insert(users)
        .values({
          email: 'timestamp-test@example.com',
          name: 'Timestamp Test User',
          passwordHash: 'hashedpassword',
          tier: 'free',
        })
        .returning();

      const [project] = await db
        .insert(projects)
        .values({
          userId: user.id,
          title: 'Timestamp Test Project',
          language: 'pt-BR',
          status: 'draft',
        })
        .returning();

      const [job] = await db
        .insert(audioGenerationJobs)
        .values({
          projectId: project.id,
          chapterNumber: 1,
          text: 'Test text',
          status: 'pending',
        })
        .returning();

      const [audioFile] = await db
        .insert(audioFiles)
        .values({
          jobId: job.id,
          filePath: '/test/path',
          fileName: 'test.mp3',
          format: 'mp3',
        })
        .returning();

      const [apiKey] = await db
        .insert(apiKeys)
        .values({
          userId: user.id,
          keyHash: 'testkeyhash',
          name: 'Test API Key',
          scopes: ['read'],
        })
        .returning();

      // Verify timestamp fields exist and are valid dates
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(audioFile.createdAt).toBeInstanceOf(Date);
      expect(apiKey.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically update updated_at timestamp', async () => {
      const [user] = await db
        .insert(users)
        .values({
          email: 'update-test@example.com',
          name: 'Update Test User',
          passwordHash: 'hashedpassword',
          tier: 'free',
        })
        .returning();

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update the user
      await db
        .update(users)
        .set({ name: 'Updated Name' })
        .where(sql`id = ${user.id}`);

      const [updatedUser] = await db
        .select()
        .from(users)
        .where(sql`id = ${user.id}`);

      expect(updatedUser.updatedAt).not.toEqual(originalUpdatedAt);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});
