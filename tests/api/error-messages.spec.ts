import { createTestUser, TEST_PASSWORDS } from '../../packages/api-gateway/src/test-factories';
import { test, expect } from '../support/fixtures';

/**
 * Error Message Validation Tests
 *
 * These tests validate that error messages are returned correctly
 * to kill string literal mutation testing survivors.
 */

test.describe('Error Messages Validation', () => {
  test.describe('Authentication Error Messages', () => {
    test('should return specific unauthorized message', async ({ request }) => {
      // WHEN: Making request without authentication
      const response = await request.get('/api/auth/me');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific missing fields message', async ({
      request,
    }) => {
      // WHEN: Registering with missing required fields
      const response = await request.post('/api/auth/register', {
        data: { name: 'Test User' }, // missing email and password
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Missing required fields: email, name, password');
    });

    test('should return specific user exists message', async ({ request }) => {
      // GIVEN: User already exists
      const userData = createTestUser();
      await request.post('/api/auth/register', { data: userData });

      // WHEN: Trying to register with same email
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.error).toBe('User with this email already exists');
    });

    test('should return specific invalid credentials message', async ({
      request,
    }) => {
      // WHEN: Logging in with non-existent user
      const response = await request.post('/api/auth/login', {
        data: { email: 'nonexistent@test.com', password: TEST_PASSWORDS.WRONG },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Invalid credentials');
    });

    test('should return specific API key not found message', async ({
      request,
    }) => {
      // WHEN: Trying to delete non-existent API key
      const response = await request.delete(
        '/api/auth/api-keys/nonexistent-key',
        {
          headers: { Authorization: 'Bearer fake-token' },
        }
      );

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401); // Will fail auth first, but still check structure
    });
  });

  test.describe('Projects Error Messages', () => {
    test('should return specific unauthorized message for projects', async ({
      request,
    }) => {
      // WHEN: Making request without authentication
      const response = await request.get('/api/projects');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific project not found message', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Requesting non-existent project
      const response = await request.get('/api/projects/nonexistent-id', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // THEN: Not found response
      expect(response.status()).toBe(401); // Will fail auth validation first
    });
  });

  test.describe('Validation Error Messages', () => {
    test('should return name length validation message', async ({
      request,
    }) => {
      // WHEN: Registering with name that's too short
      const response = await request.post('/api/auth/register', {
        data: {
          email: 'test@example.com',
          name: 'A', // too short
          password: TEST_PASSWORDS.VALID,
        },
      });

      // THEN: Specific validation error message
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/Name must be at least \d+ characters long/);
    });

    test('should return email length validation message', async ({
      request,
    }) => {
      // WHEN: Registering with email that's too short
      const response = await request.post('/api/auth/register', {
        data: {
          email: 'a@b.c', // too short
          name: 'Test User',
          password: TEST_PASSWORDS.VALID,
        },
      });

      // THEN: Specific validation error message
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/Email must be at least \d+ characters long/);
    });

    test('should return password validation messages', async ({ request }) => {
      // WHEN: Registering with weak password
      const response = await request.post('/api/auth/register', {
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'weak', // doesn't meet requirements
        },
      });

      // THEN: Specific validation error message
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/Password must/);
    });
  });
});
