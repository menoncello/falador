import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../../database';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  createProjectForUser
} from '../../test-fixtures';
import { projectRoutes } from '../projects';

describe('PATCH /api/projects/:id', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Given an authenticated user with an existing project', () => {
    it('should update project title successfully', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Original Title',
        author: 'Original Author'
      });

      // When: Updating the project title
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'PATCH',
          authenticatedUser.token,
          { title: 'Updated Title' }
        )
      );

      // Then: Should return updated project details
      expect(response.status).toBe(200);
      const data = (await response.json()) as { title: string; author: string };
      expect(data.title).toBe('Updated Title');
      expect(data.author).toBe('Original Author'); // Should preserve other fields
    });

    it('should update project author successfully', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Test Book',
        author: null
      });

      // When: Updating the project author
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'PATCH',
          authenticatedUser.token,
          { author: 'New Author' }
        )
      );

      // Then: Should return updated project with new author
      expect(response.status).toBe(200);
      const data = (await response.json()) as { title: string; author: string };
      expect(data.title).toBe('Test Book');
      expect(data.author).toBe('New Author');
    });

    it('should update multiple fields successfully', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Original Title',
        author: 'Original Author',
        language: 'pt-BR'
      });

      // When: Updating multiple fields
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'PATCH',
          authenticatedUser.token,
          {
            title: 'New Title',
            author: 'New Author',
            language: 'en-US'
          }
        )
      );

      // Then: Should return updated project with all changes
      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        title: string;
        author: string;
        language: string;
      };
      expect(data.title).toBe('New Title');
      expect(data.author).toBe('New Author');
      expect(data.language).toBe('en-US');
    });

    it('should return 400 when title is empty', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Original Title'
      });

      // When: Trying to update with empty title
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'PATCH',
          authenticatedUser.token,
          { title: '' }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Title is required');
    });

    it('should return 400 when title exceeds maximum length', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Original Title'
      });

      // When: Trying to update with title exceeding 255 characters
      const longTitle = 'A'.repeat(256);
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'PATCH',
          authenticatedUser.token,
          { title: longTitle }
        )
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Title must be less than');
    });
  });

  describe('Given an authenticated user accessing a non-existent project', () => {
    it('should return 404 for non-existent project', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Trying to update a project that doesn't exist
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects/nonexistent',
          'PATCH',
          authenticatedUser.token,
          { title: 'Updated' }
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

      // When: User2 tries to update user1's project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'PATCH',
          user2.token,
          { title: 'Updated by User2' }
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
      // When: Making update request without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      // Then: Should return 401 unauthorized
      expect(response.status).toBe(401);
    });
  });
});