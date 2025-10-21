import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest
} from '../test-fixtures';
import { projectRoutes } from './projects';

describe('POST /api/projects', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Given an authenticated user', () => {
    it('should create project without optional author field', async () => {
      // Given: An authenticated user using fixture pattern
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project without optional author field
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Test Book',
          }
        )
      );

      // Then: Project should be created with null author
      expect(response.status).toBe(201);
      const data = (await response.json()) as { author: string | null };
      expect(data.author).toBeNull();
    });

    it('should create project with author field when provided', async () => {
      // Given: An authenticated user using fixture pattern
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with author field
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Test Book',
            author: 'John Doe',
          }
        )
      );

      // Then: Project should be created with specified author
      expect(response.status).toBe(201);
      const data = (await response.json()) as { author: string };
      expect(data.author).toBe('John Doe');
    });

    it('should create project without optional language field', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project without language field
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Test Book',
          }
        )
      );

      // Then: Project should be created with default language
      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('pt-BR');
    });

    it('should create project with language field when provided', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with custom language
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Test Book',
            language: 'en-US',
          }
        )
      );

      // Then: Project should be created with specified language
      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('en-US');
    });

    it('should return 400 when title is missing', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project without required title field
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            author: 'John Doe',
          }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Title is required');
    });

    it('should return 400 when title is empty', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with empty title
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: '',
          }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Title is required');
    });

    it('should return 400 when title exceeds maximum length', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with title exceeding 255 characters
      const longTitle = 'A'.repeat(256);
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: longTitle,
          }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Title must be less than');
    });

    it('should return 400 when author exceeds maximum length', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with author exceeding 255 characters
      const longAuthor = 'A'.repeat(256);
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Test Book',
            author: longAuthor,
          }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Author must be less than');
    });

    it('should return 400 when language code is invalid', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with invalid language code
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Test Book',
            language: 'invalid-language-code',
          }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Invalid language code');
    });
  });
});