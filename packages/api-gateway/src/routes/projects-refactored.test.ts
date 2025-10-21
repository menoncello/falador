import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import { projectRoutes } from './projects';
import { createAuthenticatedUser, createAuthenticatedRequest } from './test-fixtures';

describe('Project Routes (Refactored with Fixtures)', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('POST /api/projects', () => {
    it('1.5-PROJ-CRT-001 [P0]: should create project without optional author field', async () => {
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

    it('1.5-PROJ-CRT-002 [P0]: should create project with author field when provided', async () => {
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

    it('1.5-PROJ-CRT-003 [P0]: should create project without optional language field', async () => {
      // Given: An authenticated user using fixture pattern
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project without optional language field
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

      // Then: Project should be created with default language (pt-BR)
      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('pt-BR');
    });

    it('1.5-PROJ-CRT-004 [P1]: should create project with all optional fields', async () => {
      // Given: An authenticated user using fixture pattern
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project with all optional fields
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {
            title: 'Complete Test Book',
            author: 'Test Author',
            language: 'en',
            genre: 'Fiction',
            status: 'draft',
            metadata: { custom: 'value', published: true },
          }
        )
      );

      // Then: Project should be created with all specified fields
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('Complete Test Book');
      expect(data.author).toBe('Test Author');
      expect(data.language).toBe('en');
      expect(data.genre).toBe('Fiction');
      expect(data.status).toBe('draft');
      expect(data.metadata).toEqual({ custom: 'value', published: true });
    });

    it('1.5-PROJ-CRT-005 [P1]: should reject creating project without title', async () => {
      // Given: An authenticated user using fixture pattern
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating a project without required title field
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          {}
        )
      );

      // Then: Request should be rejected with validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('title');
    });

    it('1.5-PROJ-CRT-006 [P0]: should reject unauthorized project creation', async () => {
      // When: Creating a project without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' }),
        })
      );

      // Then: Request should be rejected with unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('1.5-PROJ-GET-001 [P0]: should return project for authorized owner', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = db.createProject({
        userId: authenticatedUser.user.id,
        title: 'Test Project',
      });

      // When: Requesting the project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'GET',
          authenticatedUser.token
        )
      );

      // Then: Project should be returned successfully
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(project.id);
      expect(data.title).toBe('Test Project');
    });

    it('1.5-PROJ-GET-002 [P0]: should return 404 for non-existent project', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Requesting a non-existent project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects/nonexistent',
          'GET',
          authenticatedUser.token
        )
      );

      // Then: Should return 404 error
      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });

    it('1.5-PROJ-GET-003 [P0]: should return 403 for project owned by another user', async () => {
      // Given: Two authenticated users with different projects
      const user1 = createAuthenticatedUser({ email: 'user1@example.com', name: 'User One' });
      const user2 = createAuthenticatedUser({ email: 'user2@example.com', name: 'User Two' });
      const project = db.createProject({
        userId: user1.user.id,
        title: 'User One Project',
      });

      // When: User2 tries to access User1's project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'GET',
          user2.token
        )
      );

      // Then: Should return forbidden error
      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });

    it('1.5-PROJ-GET-004 [P0]: should reject unauthorized access', async () => {
      // When: Requesting project without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id')
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('1.5-PROJ-DEL-001 [P0]: should delete project successfully with valid authorization', async () => {
      // Given: An authenticated user with a project
      const authenticatedUser = createAuthenticatedUser();
      const project = db.createProject({
        userId: authenticatedUser.user.id,
        title: 'Test Project to Delete',
      });

      // When: Deleting the project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${project.id}`,
          'DELETE',
          authenticatedUser.token
        )
      );

      // Then: Project should be deleted successfully
      expect(response.status).toBe(204);
      const deletedProject = db.getProjectById(project.id);
      expect(deletedProject).toBeUndefined();
    });

    it('1.5-PROJ-DEL-002 [P0]: should reject unauthorized deletion', async () => {
      // When: Deleting project without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id', {
          method: 'DELETE',
        })
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });
});