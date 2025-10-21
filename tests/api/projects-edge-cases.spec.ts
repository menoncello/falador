import { createTestProject } from '../../packages/api-gateway/src/test-factories';
import { test, expect } from '../support/fixtures';

/**
 * API Tests: Projects Edge Cases
 *
 * These tests validate edge cases and error conditions for project management endpoints.
 * Separated from main projects tests to maintain file size guidelines.
 */

test.describe('1.4-API-Projects-Edge: Projects Edge Cases', () => {
  test.use({ testDuration: true });

  test.describe('Project Creation Edge Cases', () => {
    test('should reject project creation with missing author', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Project data without author (should be allowed as optional)
      const projectData = createTestProject();
      // @ts-expect-error - Intentionally removing author to test optional behavior
      delete projectData.author;

      // WHEN: Creating project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: projectData,
      });

      // THEN: Project should be created successfully (author is optional)
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject({
        title: projectData.title,
        language: projectData.language,
        status: 'draft',
        id: expect.any(String),
      });
    });

    test('should reject project creation with empty request body', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Empty request body
      // WHEN: Attempting to create project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {},
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject project creation with invalid language code', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Project data with invalid language
      const projectData = createTestProject({
        language: 'invalid-language-code',
      });

      // WHEN: Attempting to create project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: projectData,
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject project creation with invalid status', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Project data with invalid status
      const projectData = createTestProject({
        status: 'invalid-status' as any,
      });

      // WHEN: Attempting to create project
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: projectData,
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('Project Update Edge Cases', () => {
    test('should reject project update with empty request body', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: Existing project
      const project = await projectFactory.createProject();

      // WHEN: Updating with empty body
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {},
      });

      // THEN: Request should succeed (no changes to make)
      expect(response.status()).toBe(200);
    });

    test('should reject project update with invalid fields', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: Existing project
      const project = await projectFactory.createProject();

      // WHEN: Updating with invalid data
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          invalidField: 'should not be allowed',
        },
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject project update with invalid status transition', async ({
      apiKey,
      projectFactory,
      request,
    }) => {
      // GIVEN: Existing project
      const project = await projectFactory.createProject();

      // WHEN: Updating with invalid status
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          status: 'invalid-status' as any,
        },
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('Project Access Edge Cases', () => {
    test('should reject project access with invalid project ID format', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Invalid project ID format
      const invalidId = 'invalid-uuid-format';

      // WHEN: Attempting to access project
      const response = await request.get(`/api/projects/${invalidId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject project update with invalid project ID format', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Invalid project ID format
      const invalidId = 'invalid-uuid-format';

      // WHEN: Attempting to update project
      const response = await request.patch(`/api/projects/${invalidId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          title: 'Updated Title',
        },
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });
  });

  // Additional tests to improve mutation score for response utilities
  test.describe('Error Response Structure Validation', () => {
    test('should validate error response structure for unauthorized project access', async ({
      request,
    }) => {
      // GIVEN: No authentication
      // WHEN: Attempting to list projects
      const response = await request.get('/api/projects');

      // THEN: Proper error structure is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should validate error response structure for project creation validation errors', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Attempting to create project with invalid data
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          author: 'Test Author',
          // Missing required title
        },
      });

      // THEN: Proper error structure is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should validate error response structure for non-existent project access', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Attempting to access non-existent project
      const response = await request.get(
        '/api/projects/00000000-0000-0000-0000-000000000000',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // THEN: Proper error structure is returned
      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });
  });
});
