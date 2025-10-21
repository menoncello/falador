import { test, expect } from '../support/fixtures';
import { TEST_PASSWORDS } from '../../packages/api-gateway/src/test-factories';

/**
 * API Tests: Error Response Validation
 *
 * These tests specifically target error response utilities to improve mutation testing score.
 * Tests validate that error responses contain proper status codes and messages.
 */

test.describe('Error Response Validation', () => {
  test.use({ testDuration: true });

  test.describe('Authentication Error Responses', () => {
    test('should return proper error structure for unauthorized access', async ({
      request,
    }) => {
      // GIVEN: No authentication token
      // WHEN: Accessing protected endpoint
      const response = await request.get('/api/auth/me');

      // THEN: Proper error response is returned
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for invalid credentials', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Existing user
      const user = await userFactory.createUser();

      // WHEN: Attempting login with invalid password
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: TEST_PASSWORDS.INVALID,
        },
      });

      // THEN: Proper error response is returned
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for non-existent user login', async ({
      request,
    }) => {
      // GIVEN: Non-existent user credentials
      // WHEN: Attempting login
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'nonexistent@example.com',
          password: TEST_PASSWORDS.GENERIC,
        },
      });

      // THEN: Proper error response is returned
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for registration validation errors', async ({
      request,
    }) => {
      // GIVEN: Invalid registration data (missing email)
      // WHEN: Attempting registration
      const response = await request.post('/api/auth/register', {
        data: {
          name: 'Test User',
          password: TEST_PASSWORDS.VALID,
        },
      });

      // THEN: Proper error response is returned
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for duplicate registration', async ({
      request,
    }) => {
      // GIVEN: User already exists
      await request.post('/api/auth/register', {
        data: {
          email: 'existing@example.com',
          name: 'Existing User',
          password: TEST_PASSWORDS.VALID,
        },
      });

      // WHEN: Attempting registration with same email
      const response = await request.post('/api/auth/register', {
        data: {
          email: 'existing@example.com',
          name: 'Another User',
          password: TEST_PASSWORDS.VALID,
        },
      });

      // THEN: Proper error response is returned
      expect(response.status()).toBe(409);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  test.describe('Projects Error Responses', () => {
    test('should return proper error structure for unauthorized project access', async ({
      request,
    }) => {
      // GIVEN: No authentication
      // WHEN: Attempting to list projects
      const response = await request.get('/api/projects');

      // THEN: Proper error response is returned
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for project creation validation errors', async ({
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

      // THEN: Proper error response is returned
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for non-existent project access', async ({
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

      // THEN: Proper error response is returned
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for unauthorized specific project access', async ({
      userFactory,
      projectFactory,
      request,
    }) => {
      // GIVEN: Project owned by another user
      const otherUser = await userFactory.createUser();
      const project = await projectFactory.createProject({
        userId: otherUser.id,
      });

      // AND: Current user is authenticated
      const currentUser = await userFactory.createUser();
      const token = await userFactory.login(currentUser);

      // WHEN: Attempting to access other user's project
      const response = await request.get(`/api/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // THEN: Proper error response is returned
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  test.describe('API Key Error Responses', () => {
    test('should return proper error structure for API key creation without auth', async ({
      request,
    }) => {
      // GIVEN: No authentication
      // WHEN: Attempting to create API key
      const response = await request.post('/api/auth/api-keys', {
        data: {
          name: 'Test API Key',
          scopes: ['read', 'write'],
        },
      });

      // THEN: Proper error response is returned
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should return proper error structure for non-existent API key deletion', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Attempting to delete non-existent API key
      const response = await request.delete(
        '/api/auth/api-keys/550e8400-e29b-41d4-a716-446655440000',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // THEN: Proper error response is returned
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });
  });
});
