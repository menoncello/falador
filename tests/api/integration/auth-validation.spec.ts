import { test, expect } from '@playwright/test';
import { Database } from '../../../packages/api-gateway/src/database';
import {
  createTestUser,
  TEST_PASSWORDS,
} from '../../../packages/api-gateway/src/test-factories';

test.describe('Auth Route Validation Tests', () => {
  let _db: Database;

  test.beforeEach(() => {
    _db = new Database();
  });

  test.describe('POST /api/auth/register - Error Message Validation', () => {
    test('should return specific error for missing email', async ({
      request,
    }) => {
      // GIVEN: Registration data without email
      const userData = {
        name: 'Test User',
        password: TEST_PASSWORDS.VALID,
      };

      // WHEN: Attempting to register
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Missing required fields: email, name, password');
    });

    test('should return specific error for missing name', async ({
      request,
    }) => {
      // GIVEN: Registration data without name
      const userData = {
        email: 'test@example.com',
        password: TEST_PASSWORDS.VALID,
      };

      // WHEN: Attempting to register
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Missing required fields: email, name, password');
    });

    test('should return specific error for missing password', async ({
      request,
    }) => {
      // GIVEN: Registration data without password
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      // WHEN: Attempting to register
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Missing required fields: email, name, password');
    });

    test('should return specific error for all missing fields', async ({
      request,
    }) => {
      // GIVEN: Empty registration data
      const userData = {};

      // WHEN: Attempting to register
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Missing required fields: email, name, password');
    });

    test('should return specific error for duplicate email', async ({
      request,
    }) => {
      // GIVEN: Existing user
      const existingUser = createTestUser();
      await request.post('/api/auth/register', {
        data: existingUser,
      });

      // WHEN: Attempting to register with same email
      const response = await request.post('/api/auth/register', {
        data: {
          email: existingUser.email,
          name: 'Another User',
          password: TEST_PASSWORDS.VALID,
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.error).toBe('User with this email already exists');
    });
  });

  test.describe('POST /api/auth/login - Error Message Validation', () => {
    test('should return specific error for invalid credentials (wrong password)', async ({
      request,
    }) => {
      // GIVEN: Existing user
      const user = createTestUser({ password: TEST_PASSWORDS.CORRECT });
      await request.post('/api/auth/register', {
        data: user,
      });

      // WHEN: Attempting to login with wrong password
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: TEST_PASSWORDS.WRONG,
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Invalid credentials');
    });

    test('should return specific error for non-existent user', async ({
      request,
    }) => {
      // GIVEN: Non-existent user credentials
      const loginData = {
        email: 'nonexistent@example.com',
        password: TEST_PASSWORDS.GENERIC,
      };

      // WHEN: Attempting to login
      const response = await request.post('/api/auth/login', {
        data: loginData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Invalid credentials');
    });
  });

  test.describe('GET /api/auth/me - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth header', async ({
      request,
    }) => {
      // WHEN: Requesting user info without auth
      const response = await request.get('/api/auth/me');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid auth header', async ({
      request,
    }) => {
      // WHEN: Requesting with invalid auth header
      const response = await request.get('/api/auth/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for malformed auth header', async ({
      request,
    }) => {
      // WHEN: Requesting with malformed auth header
      const response = await request.get('/api/auth/me', {
        headers: {
          Authorization: 'invalid-format',
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('POST /api/auth/api-keys - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth', async ({
      request,
    }) => {
      // GIVEN: API key creation data
      const apiKeyData = {
        name: 'Test API Key',
        scopes: ['read', 'write'],
      };

      // WHEN: Attempting to create API key without auth
      const response = await request.post('/api/auth/api-keys', {
        data: apiKeyData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid token', async ({
      request,
    }) => {
      // GIVEN: API key creation data
      const apiKeyData = {
        name: 'Test API Key',
        scopes: ['read'],
      };

      // WHEN: Attempting to create API key with invalid token
      const response = await request.post('/api/auth/api-keys', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        data: apiKeyData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('DELETE /api/auth/api-keys/:id - Error Validation', () => {
    test('should return unauthorized error for missing auth', async ({
      request,
    }) => {
      // WHEN: Attempting to delete API key without auth
      const response = await request.delete('/api/auth/api-keys/some-id');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return not found error for non-existent API key', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user.email, user.password ?? '');

      // WHEN: Attempting to delete non-existent API key
      const response = await request.delete(
        '/api/auth/api-keys/non-existent-id',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // THEN: Specific error message is returned
      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('API key not found');
    });
  });
});
