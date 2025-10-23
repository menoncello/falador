import { test, expect } from '../support/fixtures';

/**
 * API Tests: Projects
 *
 * These tests validate the project management endpoints:
 * - List projects
 * - Create project
 * - Get project details
 * - Update project
 *
 * Tests use fixtures for automatic cleanup and realistic test data.
 */

test.describe('1.4-API-Projects: Projects API', () => {
  test.describe('GET /api/projects', () => {
    test('1.4-API-013 [P0]: should return empty array for user with no projects', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Authenticated user with no projects
      // WHEN: Listing projects
      const response = await request.get('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: Empty array is returned
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    test('1.4-API-014 [P0]: should return user projects', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: User has 3 projects
      await projectFactory.createProjects(3);

      // WHEN: Listing projects
      const response = await request.get('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: All 3 projects are returned
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(3);
    });

    test('1.4-API-015 [P1]: should require authentication', async ({
      request,
    }) => {
      // GIVEN: No authentication
      // WHEN: Attempting to list projects
      const response = await request.get('/api/projects');

      // THEN: Request is rejected (route not found or missing auth middleware)
      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /api/projects', () => {
    test('1.4-API-016 [P0]: should create new project with valid data', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Valid project data
      const projectData = {
        title: 'My Audiobook',
        author: 'John Doe',
        language: 'pt-BR',
        genre: 'Fiction',
      };

      // WHEN: Creating project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: projectData,
      });

      // THEN: Project is created successfully
      expect(response.status()).toBe(201);
    });

    test('1.4-API-017 [P1]: should return created project object', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Valid project data
      const projectData = {
        title: 'Test Book',
        language: 'pt-BR',
      };

      // WHEN: Creating project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: projectData,
      });

      // THEN: Response contains project with expected fields
      const body = await response.json();
      expect(body).toMatchObject({
        title: projectData.title,
        language: projectData.language,
        status: 'draft',
        id: expect.any(String),
      });
    });

    test('1.4-API-018 [P2]: should reject project without title', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Project data without title
      const projectData = {
        language: 'pt-BR',
      };

      // WHEN: Attempting to create project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: projectData,
      });

      // THEN: Request is rejected
      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/projects/:id', () => {
    test('1.4-API-019 [P0]: should return project details', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: Project exists
      const project = await projectFactory.createProject();

      // WHEN: Getting project details
      const response = await request.get(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: Project details are returned
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(project.id);
    });

    test('1.4-API-020 [P1]: should return 404 for non-existent project', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Project ID that does not exist
      const fakeId = '00000000-0000-0000-0000-000000000000';

      // WHEN: Attempting to get project
      const response = await request.get(`/api/projects/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: 404 Not Found is returned
      expect(response.status()).toBe(404);
    });

    test('1.4-API-021 [P0]: should not allow access to other user projects', async ({
      projectFactory,
      userFactory,
      request,
    }) => {
      // GIVEN: Project belongs to another user
      const otherUser = await userFactory.createUser();
      const project = await projectFactory.createProject({
        userId: otherUser.id,
      });

      // AND: Current user is authenticated
      const currentUser = await userFactory.createUser();
      const token = await userFactory.login(
        currentUser.email,
        currentUser.password ?? ''
      );

      // WHEN: Attempting to access other user's project
      const response = await request.get(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // THEN: Access is denied
      expect(response.status()).toBe(403);
    });
  });

  test.describe('PATCH /api/projects/:id', () => {
    test('1.4-API-022 [P1]: should update project title', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: Project exists
      const project = await projectFactory.createProject();

      // WHEN: Updating project title
      const newTitle = 'Updated Title';
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          title: newTitle,
        },
      });

      // THEN: Project is updated successfully
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.title).toBe(newTitle);
    });

    test('1.4-API-023 [P1]: should update project status', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: Project exists with draft status
      const project = await projectFactory.createProject({ status: 'draft' });

      // WHEN: Updating status to queued
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          status: 'queued',
        },
      });

      // THEN: Status is updated
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('queued');
    });
  });
});
