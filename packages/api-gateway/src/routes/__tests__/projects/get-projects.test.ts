import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../../database';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  createProjectForUser
} from '../../test-fixtures';
import { projectRoutes } from '../projects';

describe('GET /api/projects/:id', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Given an authenticated user with an existing project', () => {
    it('should return project details with valid BDD structure', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Test Book',
        author: 'John Doe',
        language: 'en',
        genre: 'Fiction',
        status: 'processing',
        metadata: { key: 'value' }
      });

      // When: Retrieving the project by ID
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'GET',
          authenticatedUser.token
        )
      );

      // Then: Should return complete project details
      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        id: string;
        title: string;
        author: string | null;
        language: string;
        genre: string | null;
        status: string;
        metadata: Record<string, unknown>;
      };

      expect(data.id).toBe(project.id);
      expect(data.title).toBe('Test Book');
      expect(data.author).toBe('John Doe');
      expect(data.language).toBe('en');
      expect(data.genre).toBe('Fiction');
      expect(data.status).toBe('processing');
      expect(data.metadata).toEqual({ key: 'value' });
    });
  });

  describe('Given an authenticated user accessing a non-existent project', () => {
    it('should return 404 for non-existent project', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Requesting a project that doesn't exist
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects/nonexistent-id',
          'GET',
          authenticatedUser.token
        )
      );

      // Then: Should return 404 error
      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });
  });

  describe('Given an authenticated user accessing another user\'s project', () => {
    it('should return 403 for project owned by another user', async () => {
      // Given: Two authenticated users and a project owned by user1
      const user1 = createAuthenticatedUser();
      const user2 = createAuthenticatedUser({ email: 'other@example.com', name: 'Other User' });
      const project = createProjectForUser(user1.user.id, { title: 'User1 Book' });

      // When: User2 tries to access user1's project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'GET',
          user2.token
        )
      );

      // Then: Should return 403 forbidden error
      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Given an unauthenticated request', () => {
    it('should reject unauthorized access', async () => {
      // When: Making request without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Then: Should return 401 unauthorized
      expect(response.status).toBe(401);
    });
  });
});