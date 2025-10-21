import { createTestUser, TEST_PASSWORDS } from '../../packages/api-gateway/src/test-factories';
import { test, expect } from '../support/fixtures';

/**
 * API Tests: Authentication with Network-First Pattern
 *
 * This file demonstrates the improved network-first approach for API tests.
 * Uses the new apiRequest fixture for cleaner, more deterministic tests.
 */

test.describe('1.4-API-Auth: Authentication API (Network-First Pattern)', () => {
  test.use({ cleanupDatabase: true, testDuration: true });
  test.describe.configure({ mode: 'parallel' }); // Enable parallel execution

  test.describe('POST /api/auth/register', () => {
    test('1.4-API-001 [P0]: should create new user with valid data @auth @registration @smoke', async ({
      apiRequest,
    }) => {
      // GIVEN: Valid user registration data using factory
      const userData = createTestUser();

      // WHEN: Creating user via API with network-first pattern
      const result = await apiRequest.makeRequest(
        'post',
        '/api/auth/register',
        {
          data: userData,
        }
      );

      // THEN: User is created successfully
      expect(result.status()).toBe(201);
      
      // AND: Response contains expected user data
      const body = await result.body();
      expect(body).toMatchObject({
        email: userData.email,
        name: userData.name,
        tier: 'free',
        id: expect.any(String),
      });
    });

    test('1.4-API-002 [P1]: should reject registration with missing email @auth @registration', async ({
      apiRequest,
    }) => {
      // GIVEN: Registration data without email using factory
      const userData = createTestUser();
      delete userData.email;

      // WHEN: Attempting to create user with network-first pattern
      const result = await apiRequest.makeRequest(
        'post',
        '/api/auth/register',
        {
          data: userData,
        }
      );

      // THEN: Request is rejected with proper error handling
      expect(result.status()).toBe(400);
      
      const body = await result.body();
      expect(body.error).toContain('Missing required fields');
    });

    test('1.4-API-003 [P1]: should reject registration with duplicate email @auth @registration', async ({
      apiRequest,
    }) => {
      // GIVEN: User already exists with email
      const existingUser = createTestUser();

      // Create first user
      await apiRequest.makeRequest('post', '/api/auth/register', {
        data: existingUser,
      });

      // WHEN: Attempting to register with same email using factory
      const newUser = createTestUser({
        email: existingUser.email,
      });

      const result = await apiRequest.makeRequest(
        'post',
        '/api/auth/register',
        {
          data: newUser,
        }
      );

      // THEN: Request is rejected with conflict status
      expect(result.status()).toBe(409);
      
      const body = await result.body();
      expect(body.error).toContain('already exists');
    });
  });

  test.describe('POST /api/auth/login', () => {
    test('1.4-API-004 [P0]: should authenticate user with valid credentials @auth @login @smoke', async ({
      userFactory,
      apiRequest,
    }) => {
      // GIVEN: User exists with known credentials
      const user = await userFactory.createUser();

      // WHEN: Logging in with valid credentials using network-first pattern
      const result = await apiRequest.makeRequest('post', '/api/auth/login', {
        data: {
          email: user.email,
          password: user.password,
        },
      });

      // THEN: Login succeeds with deterministic response handling
      expect(result.status()).toBe(200);
      
      // AND: Response contains valid JWT token
      const body = await result.body();
      expect(body.token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
    });

    test('1.4-API-005 [P0]: should reject login with invalid password @auth @login', async ({
      userFactory,
      apiRequest,
    }) => {
      // GIVEN: User exists with known password
      const user = await userFactory.createUser();

      // WHEN: Logging in with wrong password using network-first pattern
      const result = await apiRequest.makeRequest('post', '/api/auth/login', {
        data: {
          email: user.email,
          password: TEST_PASSWORDS.WRONG,
        },
      });

      // THEN: Login fails with proper error handling
      expect(result.status()).toBe(401);
      
      const body = await result.body();
      expect(body.error).toBe('Invalid credentials');
    });
  });

  test.describe('GET /api/auth/me', () => {
    test('1.4-API-006 [P0]: should return current user info when authenticated @auth @me', async ({
      apiKey,
      apiRequest,
    }) => {
      // GIVEN: Authenticated user with API key
      // WHEN: Requesting current user info with network-first pattern
      const result = await apiRequest.makeRequest('get', '/api/auth/me', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: User info is returned successfully
      expect(result.status()).toBe(200);
      
      const body = await result.body();
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('name');
    });

    test('1.4-API-007 [P1]: should reject request without authentication @auth @me', async ({
      apiRequest,
    }) => {
      // GIVEN: No authentication provided
      // WHEN: Requesting current user info with network-first pattern
      const result = await apiRequest.makeRequest('get', '/api/auth/me');

      // THEN: Request is rejected with proper error handling
      expect(result.status()).toBe(401);
      
      const body = await result.body();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('POST /api/auth/api-keys', () => {
    test('1.4-API-008 [P1]: should create API key for authenticated user @auth @api-keys', async ({
      userFactory,
      apiRequest,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Creating API key with network-first pattern
      const result = await apiRequest.makeRequest(
        'post',
        '/api/auth/api-keys',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            name: 'Test API Key',
            scopes: ['read', 'write'],
          },
        }
      );

      // THEN: API key is created successfully
      expect(result.status()).toBe(201);
      
      const body = await result.body();
      expect(body.name).toBe('Test API Key');
      expect(body.scopes).toEqual(['read', 'write']);
      expect(body.key).toMatch(/^[\w-]+$/);
    });
  });
});
