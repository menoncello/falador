import { registerDependencies } from '@falador/infrastructure/container';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import { InMemoryProjectRepository } from '../repositories/in-memory-project-repository.js';
import { InMemoryUserRepository } from '../repositories/in-memory-user-repository.js';
import { createTestUser } from '../test-factories';
import { projectRoutes } from './projects';

describe('Project Routes', () => {
  beforeEach(() => {
    db.clear();
    // Initialize DI Container for tests
    registerDependencies({
      database: db,
      userRepository: InMemoryUserRepository,
      projectRepository: InMemoryProjectRepository,
    });
  });

  describe('POST /api/projects', () => {
    it('1.5-PROJ-CRT-001 [P0]: should create project without optional author field', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project without specifying author
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      // Then: Should successfully create project with null author
      expect(response.status).toBe(201);
      const data = (await response.json()) as { author: string | null };
      expect(data.author).toBeNull();
    });

    it('1.5-PROJ-CRT-002 [P1]: should create project with author field when provided', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project with author specified
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            author: 'John Doe',
          }),
        })
      );

      // Then: Should successfully create project with specified author
      expect(response.status).toBe(201);
      const data = (await response.json()) as { author: string };
      expect(data.author).toBe('John Doe');
    });

    it('1.5-PROJ-CRT-003 [P1]: should create project without optional language field', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project without specifying language
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      // Then: Should successfully create project with default language (pt-BR)
      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('pt-BR');
    });

    it('1.5-PROJ-CRT-004 [P1]: should create project with language field when provided', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project with language specified
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            language: 'en',
          }),
        })
      );

      // Then: Should successfully create project with specified language
      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('en');
    });

    it('1.5-PROJ-CRT-005 [P1]: should create project without optional genre field', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project without specifying genre
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      // Then: Should successfully create project with null genre
      expect(response.status).toBe(201);
      const data = (await response.json()) as { genre: string | null };
      expect(data.genre).toBeNull();
    });

    it('1.5-PROJ-CRT-006 [P1]: should create project with genre field when provided', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project with genre specified
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            genre: 'Fiction',
          }),
        })
      );

      // Then: Should successfully create project with specified genre
      expect(response.status).toBe(201);
      const data = (await response.json()) as { genre: string };
      expect(data.genre).toBe('Fiction');
    });

    it('1.5-PROJ-CRT-007 [P1]: should create project without optional status field', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project without specifying status
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      // Then: Should successfully create project with default status (draft)
      expect(response.status).toBe(201);
      const data = (await response.json()) as { status: string };
      expect(data.status).toBe('draft');
    });

    it('1.5-PROJ-CRT-008 [P1]: should create project with status field when provided', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project with status specified
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            status: 'completed',
          }),
        })
      );

      // Then: Should successfully create project with specified status
      expect(response.status).toBe(201);
      const data = (await response.json()) as { status: string };
      expect(data.status).toBe('completed');
    });

    it('1.5-PROJ-CRT-009 [P2]: should create project without optional metadata field', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project without specifying metadata
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      // Then: Should successfully create project with empty metadata
      expect(response.status).toBe(201);
      const data = (await response.json()) as {
        metadata: Record<string, unknown>;
      };
      expect(data.metadata).toEqual({});
    });

    it('1.5-PROJ-CRT-009b [P2]: should create project with metadata field when provided', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a project with metadata specified
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            metadata: { custom: 'value' },
          }),
        })
      );

      // Then: Should successfully create project with specified metadata
      expect(response.status).toBe(201);
      const data = (await response.json()) as {
        metadata: Record<string, unknown>;
      };
      expect(data.metadata).toEqual({ custom: 'value' });
    });

    it('1.5-PROJ-CRT-010 [P0]: should reject creating project without title', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Attempting to create a project without title
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      // Then: Should return validation error for missing title
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('title');
    });

    it('1.5-PROJ-CRT-011 [P0]: should reject creating project without auth', async () => {
      // Given: No authentication token provided

      // When: Attempting to create a project without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' }),
        })
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('1.5-PROJ-CRT-020 [P1]: should handle concurrent project creation attempts', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // Helper function to create project request
      const createProjectRequest = (titleSuffix: number): Promise<Response> => {
        return projectRoutes.handle(
          new Request('http://localhost/api/projects', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `Concurrent Project ${Date.now() + titleSuffix}`,
            }),
          })
        );
      };

      // When: Making multiple concurrent project creation requests
      const request1 = createProjectRequest(0);
      const request2 = createProjectRequest(1);
      const request3 = createProjectRequest(2);

      const responses = await Promise.all([request1, request2, request3]);

      // Then: All project creation attempts should succeed
      const successCount = responses.filter((r) => r.status === 201).length;
      expect(successCount).toBe(3);

      // Verify each response contains valid project data
      for (const response of responses) {
        const data = (await response.json()) as { id: string; title: string };
        expect(data.id).toBeTruthy();
        expect(data.title).toBeTruthy();
      }
    });
  });

  describe('GET /api/projects/:id', () => {
    it('1.5-PROJ-GET-001 [P0]: should return 404 for non-existent project', async () => {
      // Given: An authenticated user and non-existent project ID
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Attempting to fetch a non-existent project
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/nonexistent', {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      // Then: Should return not found error
      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });

    it('1.5-PROJ-GET-002 [P0]: should return 403 for project owned by another user', async () => {
      // Given: Two users and a project owned by the first user
      const userData1 = createTestUser();
      const userData2 = createTestUser({ email: 'other@example.com' });
      const user1 = db.createUser({
        email: userData1.email,
        name: userData1.name,
        password: userData1.password,
      });
      const user2 = db.createUser({
        email: userData2.email,
        name: userData2.name,
        password: userData2.password,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'Book',
      });
      const token2 = db.createSession(user2.id);

      // When: Attempting to access another user's project
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          headers: { Authorization: `Bearer ${token2}` },
        })
      );

      // Then: Should return forbidden error
      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });

    it('1.5-PROJ-GET-003 [P0]: should reject unauthorized access', async () => {
      // Given: No authentication token provided

      // When: Attempting to access project endpoint without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id')
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('1.5-PROJ-UPD-001 [P0]: should update project with optional fields', async () => {
      // Given: An authenticated user with an existing project
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const project = db.createProject({
        userId: user.id,
        title: 'Original Title',
      });
      const token = db.createSession(user.id);

      // When: Updating project with multiple fields
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Title',
            author: 'John Doe',
            language: 'en',
            genre: 'Fiction',
            status: 'processing',
            metadata: { key: 'value' },
          }),
        })
      );

      // Then: Should successfully update all provided fields
      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        title: string;
        author: string;
        language: string;
        genre: string;
        status: string;
        metadata: Record<string, unknown>;
      };
      expect(data.title).toBe('Updated Title');
      expect(data.author).toBe('John Doe');
      expect(data.language).toBe('en');
      expect(data.genre).toBe('Fiction');
      expect(data.status).toBe('processing');
      expect(data.metadata).toEqual({ key: 'value' });
    });

    it('1.5-PROJ-UPD-002 [P1]: should return 404 for non-existent project', async () => {
      // Given: An authenticated user and non-existent project ID
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Attempting to update a non-existent project
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/nonexistent', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      // Then: Should return not found error
      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });

    it('1.5-PROJ-UPD-003 [P0]: should return 403 for project owned by another user', async () => {
      // Given: Two users and a project owned by the first user
      const userData1 = createTestUser();
      const userData2 = createTestUser({ email: 'other@example.com' });
      const user1 = db.createUser({
        email: userData1.email,
        name: userData1.name,
        password: userData1.password,
      });
      const user2 = db.createUser({
        email: userData2.email,
        name: userData2.name,
        password: userData2.password,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'Book',
      });
      const token2 = db.createSession(user2.id);

      // When: Attempting to update another user's project
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token2}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      // Then: Should return forbidden error
      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });

    it('1.5-PROJ-UPD-004 [P0]: should reject unauthorized access', async () => {
      // Given: No authentication token provided

      // When: Attempting to update a project without authentication
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('1.5-PROJ-DEL-001 [P0]: should return 404 for non-existent project', async () => {
      // Given: An authenticated user and non-existent project ID
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Attempting to delete a non-existent project
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/nonexistent', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      // Then: Should return not found error
      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });
  });

  describe('Security Authorization Tests', () => {
    it('1.5-PROJ-SEC-001 [P0]: should reject unauthorized project access', async () => {
      // Given: Two different users with a project belonging to user1
      const user1Data = createTestUser({ email: 'user1@example.com' });
      const user2Data = createTestUser({ email: 'user2@example.com' });

      const user1 = db.createUser({
        email: user1Data.email,
        name: user1Data.name,
        password: user1Data.password,
      });
      const user2 = db.createUser({
        email: user2Data.email,
        name: user2Data.name,
        password: user2Data.password,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'User 1 Project',
      });

      const user2Token = db.createSession(user2.id);

      // When: user2 tries to access user1's project
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          headers: {
            Authorization: `Bearer ${user2Token}`,
            'Content-Type': 'application/json',
          },
        })
      );

      // Then: Should reject access with 403 Forbidden
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('1.5-PROJ-SEC-002 [P0]: should reject unauthorized project update', async () => {
      // Given: Two different users with a project belonging to user1
      const user1Data = createTestUser({ email: 'user1@example.com' });
      const user2Data = createTestUser({ email: 'user2@example.com' });

      const user1 = db.createUser({
        email: user1Data.email,
        name: user1Data.name,
        password: user1Data.password,
      });
      const user2 = db.createUser({
        email: user2Data.email,
        name: user2Data.name,
        password: user2Data.password,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'User 1 Project',
      });

      const user2Token = db.createSession(user2.id);

      // When: user2 tries to update user1's project
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${user2Token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Hacked Title',
          }),
        })
      );

      // Then: Should reject update with 403 Forbidden
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('1.5-PROJ-SEC-003 [P0]: should reject unauthorized project deletion', async () => {
      // Given: Two different users with a project belonging to user1
      const user1Data = createTestUser({ email: 'user1@example.com' });
      const user2Data = createTestUser({ email: 'user2@example.com' });

      const user1 = db.createUser({
        email: user1Data.email,
        name: user1Data.name,
        password: user1Data.password,
      });
      const user2 = db.createUser({
        email: user2Data.email,
        name: user2Data.name,
        password: user2Data.password,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'User 1 Project',
      });

      const user2Token = db.createSession(user2.id);

      // When: user2 tries to delete user1's project
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user2Token}`,
            'Content-Type': 'application/json',
          },
        })
      );

      // Then: Should reject deletion with 403 Forbidden
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');

      // And: Project should still exist (not deleted)
      const existingProject = db.getProjectById(project.id);
      expect(existingProject).toBeTruthy();
      expect(existingProject?.title).toBe('User 1 Project');
    });

    it('1.5-PROJ-SEC-004 [P1]: should allow owner to access their own projects', async () => {
      // Given: A user with their own project
      const userData = createTestUser({ email: 'owner@example.com' });
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const project = db.createProject({
        userId: user.id,
        title: 'Owner Project',
      });

      const token = db.createSession(user.id);

      // When: Owner tries to access their own project
      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      );

      // Then: Should allow access with 200 OK
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.title).toBe('Owner Project');
      expect(data.userId).toBe(user.id);
    });
  });
});
