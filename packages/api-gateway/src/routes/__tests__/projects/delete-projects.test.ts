import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../../database';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  createProjectForUser
} from '../../test-fixtures';
import { projectRoutes } from '../projects';

describe('DELETE /api/projects/:id', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Given an authenticated user with an existing project', () => {
    it('should delete project successfully', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Test Book to Delete'
      });

      // When: Deleting the project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'DELETE',
          authenticatedUser.token
        )
      );

      // Then: Should return success and project should be deleted
      expect(response.status).toBe(204);

      // Verify project is actually deleted
      const getResponse = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'GET',
          authenticatedUser.token
        )
      );
      expect(getResponse.status).toBe(404);
    });

    it('should handle concurrent delete requests gracefully', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = createProjectForUser(authenticatedUser.user.id, {
        title: 'Test Book for Concurrent Delete'
      });

      // When: Making concurrent delete requests
      const [response1, response2] = await Promise.all([
        projectRoutes.handle(
          createAuthenticatedRequest(
            `http://localhost/api/projects/${project.id}`,
            'DELETE',
            authenticatedUser.token
          )
        ),
        projectRoutes.handle(
          createAuthenticatedRequest(
            `http://localhost/api/projects/${project.id}`,
            'DELETE',
            authenticatedUser.token
          )
        )
      ]);

      // Then: First should succeed, second should return 404
      expect(response1.status).toBe(204);
      expect(response2.status).toBe(404);
    });
  });

  describe('Given an authenticated user accessing a non-existent project', () => {
    it('should return 404 for non-existent project', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Trying to delete a project that doesn't exist
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects/nonexistent-id',
          'DELETE',
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

      // When: User2 tries to delete user1's project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'DELETE',
          user2.token
        )
      );

      // Then: Should return 403 forbidden error
      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');

      // Verify original project still exists
      const getResponse = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'GET',
          user1.token
        )
      );
      expect(getResponse.status).toBe(200);
    });
  });

  describe('Given an unauthenticated request', () => {
    it('should reject unauthorized access', async () => {
      // When: Making delete request without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Then: Should return 401 unauthorized
      expect(response.status).toBe(401);
    });
  });

  describe('Given malformed project IDs', () => {
    it('should handle invalid project ID format', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Trying to delete with invalid ID format
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects/invalid-id-format',
          'DELETE',
          authenticatedUser.token
        )
      );

      // Then: Should return 400 bad request or 404 not found
      expect([400, 404]).toContain(response.status);
    });
  });
});