import { createTestUser, TEST_PASSWORDS } from '../../packages/api-gateway/src/test-factories';
import { test, expect, TEST_CONSTANTS } from '../support/fixtures';

/**
 * API Tests: Authentication Edge Cases
 *
 * These tests validate edge cases and error conditions for authentication endpoints.
 * Separated from main auth tests to maintain file size guidelines.
 */

test.describe('1.4-API-Auth-Edge: Authentication Edge Cases', () => {
  test.use({ testDuration: true });

  test.describe('Registration Edge Cases', () => {
    test('should reject registration with invalid email format', async ({
      request,
    }) => {
      // GIVEN: Registration data with invalid email
      const userData = createTestUser({
        password: TEST_PASSWORDS.TEST_MOCK_PASSWORD_STANDARD,
        email: 'invalid-email-format',
      });

      // WHEN: Attempting to create user
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject registration with weak password', async ({
      request,
    }) => {
      // GIVEN: Registration data with weak password
      const userData = createTestUser({
        password: '123', // Too short and weak
      });

      // WHEN: Attempting to create user
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject registration with missing name', async ({
      request,
    }) => {
      // GIVEN: Registration data without name
      const userData = createTestUser({
        password: TEST_PASSWORDS.TEST_MOCK_PASSWORD_STANDARD,
      });
      // @ts-expect-error - Intentionally removing name to test validation
      delete userData.name;

      // WHEN: Attempting to create user
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject registration with empty request body', async ({
      request,
    }) => {
      // GIVEN: Empty request body
      // WHEN: Attempting to create user
      const response = await request.post('/api/auth/register', {
        data: {},
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('Login Edge Cases', () => {
    test('should reject login with missing email', async ({ request }) => {
      // GIVEN: Login data without email
      // WHEN: Attempting to login
      const response = await request.post('/api/auth/login', {
        data: {
          password: TEST_PASSWORDS.TEST_MOCK_PASSWORD_SECURE,
        },
      });

      // THEN: Login fails with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject login with missing password', async ({ request }) => {
      // GIVEN: Login data without password
      const nonExistentUser = createTestUser();

      // WHEN: Attempting to login
      const response = await request.post('/api/auth/login', {
        data: {
          email: nonExistentUser.email,
        },
      });

      // THEN: Login fails with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject login with empty request body', async ({ request }) => {
      // GIVEN: Empty request body
      // WHEN: Attempting to login
      const response = await request.post('/api/auth/login', {
        data: {},
      });

      // THEN: Login fails with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('API Key Edge Cases', () => {
    test('should reject API key creation with missing name', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Creating API key without name
      const response = await request.post('/api/auth/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          scopes: ['read', 'write'],
        },
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject API key creation with invalid scopes', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Creating API key with invalid scopes
      const response = await request.post('/api/auth/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          name: 'Test API Key',
          scopes: ['invalid-scope'],
        },
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBeTruthy();
    });

    test('should reject API key creation with empty request body', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Creating API key with empty body
      const response = await request.post('/api/auth/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {},
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
    test('should validate error response structure for unauthorized /api/auth/me', async ({
      request,
    }) => {
      // GIVEN: No authentication
      // WHEN: Accessing protected endpoint
      const response = await request.get('/api/auth/me');

      // THEN: Proper error structure is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should validate error response structure for invalid registration data', async ({
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

      // THEN: Proper error structure is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });

    test('should validate error response structure for API key creation without auth', async ({
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

      // THEN: Proper error structure is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
    });
  });
});
