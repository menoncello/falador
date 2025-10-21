import {
  createTestUser,
  TEST_PASSWORDS,
} from '../../packages/api-gateway/src/test-factories';
import { test, expect, TEST_CONSTANTS } from '../support/fixtures';

/**
 * API Tests: Authentication
 *
 * These tests validate the authentication endpoints:
 * - User registration
 * - Login
 * - API key generation
 *
 * Tests follow best practices:
 * - Given-When-Then structure
 * - One assertion per test (atomic)
 * - Auto-cleanup via fixtures
 * - Faker-generated test data (no hardcoded values)
 */

test.describe('1.4-API-Auth: Authentication API', () => {
  test.use({ cleanupDatabase: true, testDuration: true });
  // Note: Changed from serial to parallel for better isolation

  test.describe('POST /api/auth/register', () => {
    test('1.4-API-001 [P0]: should create new user with valid data @auth @registration @smoke', async ({
      request,
    }) => {
      // GIVEN: Valid user registration data using factory
      const userData = createTestUser();

      // WHEN: Creating user via API
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: User is created successfully
      expect(response.status()).toBe(201);
    });

    test('1.4-API-002 [P1]: should return created user object @auth @registration', async ({
      request,
    }) => {
      // GIVEN: Valid user registration data using factory
      const userData = createTestUser();

      // WHEN: Creating user via API
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: User is created successfully
      expect(response.status()).toBe(201);

      // AND: Response contains user object with expected fields
      const body = await response.json();
      expect(body).toMatchObject({
        email: userData.email,
        name: userData.name,
        tier: 'free',
        id: expect.any(String),
      });
    });

    test('1.4-API-003 [P2]: should reject registration with missing email', async ({
      request,
    }) => {
      // GIVEN: Registration data without email using factory
      const userData = createTestUser({
        password: TEST_CONSTANTS.TEST_MOCK_PASSWORD_STANDARD,
      });
      // @ts-expect-error - Intentionally removing email to test validation
      delete userData.email;

      // WHEN: Attempting to create user
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Request is rejected
      expect(response.status()).toBe(400);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: expect.any(String), // Validate that error message exists
      });
      expect(body.error).toBeTruthy(); // Ensure error message is not empty
    });

    test('1.4-API-004 [P1]: should reject registration with duplicate email', async ({
      request,
    }) => {
      // GIVEN: User already exists with email
      const existingUser = createTestUser();
      await request.post('/api/auth/register', {
        data: existingUser,
      });

      // WHEN: Attempting to register with same email using factory
      const newUser = createTestUser({
        email: existingUser.email,
      });

      const response = await request.post('/api/auth/register', {
        data: newUser,
      });

      // THEN: Request is rejected with 409 Conflict
      expect(response.status()).toBe(409);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: expect.any(String),
      });
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('POST /api/auth/login', () => {
    test('1.4-API-005 [P0]: should authenticate user with valid credentials @auth @login @smoke', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: User exists with known credentials
      const user = await userFactory.createUser();

      // WHEN: Logging in with valid credentials
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: user.password,
        },
      });

      // THEN: Login succeeds
      expect(response.status()).toBe(200);
    });

    test('1.4-API-006 [P1]: should return JWT token on successful login', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: User exists with known credentials
      const user = await userFactory.createUser();

      // WHEN: Logging in
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: user.password,
        },
      });

      // THEN: Response contains JWT token
      const body = await response.json();
      expect(body.token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
    });

    test('1.4-API-007 [P0]: should reject login with invalid password', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: User exists with known password
      const user = await userFactory.createUser();

      // WHEN: Logging in with wrong password
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: TEST_PASSWORDS.WRONG,
        },
      });

      // THEN: Login fails with 401 Unauthorized
      expect(response.status()).toBe(401);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: expect.any(String),
      });
      expect(body.error).toBeTruthy();
    });

    test('1.4-API-008 [P1]: should reject login for non-existent user', async ({
      request,
    }) => {
      // GIVEN: No user exists with this email
      const nonExistentUser = createTestUser();

      // WHEN: Attempting to login
      const response = await request.post('/api/auth/login', {
        data: {
          email: nonExistentUser.email,
          password: TEST_CONSTANTS.TEST_MOCK_PASSWORD_SECURE,
        },
      });

      // THEN: Login fails with 401 Unauthorized
      expect(response.status()).toBe(401);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: expect.any(String),
      });
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('GET /api/auth/me', () => {
    test('1.4-API-009 [P0]: should return current user info when authenticated', async ({
      apiKey,
      request,
    }) => {
      // GIVEN: Authenticated user
      // WHEN: Requesting current user info
      const response = await request.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // THEN: User info is returned
      expect(response.status()).toBe(200);
    });

    test('1.4-API-010 [P1]: should reject request without authentication', async ({
      request,
    }) => {
      // GIVEN: No authentication provided
      // WHEN: Requesting current user info
      const response = await request.get('/api/auth/me');

      // THEN: Request is rejected with 401 Unauthorized
      expect(response.status()).toBe(401);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });
  });

  test.describe('POST /api/auth/api-keys', () => {
    test('1.4-API-011 [P1]: should create API key for authenticated user', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Creating API key
      const response = await request.post('/api/auth/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          name: 'Test API Key',
          scopes: ['read', 'write'],
        },
      });

      // THEN: API key is created successfully
      expect(response.status()).toBe(201);
    });

    test('1.4-API-012 [P2]: should return API key string', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user);

      // WHEN: Creating API key
      const response = await request.post('/api/auth/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          name: 'Test Key',
          scopes: ['read'],
        },
      });

      // THEN: Response contains API key
      const body = await response.json();
      expect(body.key).toMatch(/^[\w-]+$/);
    });

    test('1.4-API-013 [P2]: should reject API key creation without authentication', async ({
      request,
    }) => {
      // GIVEN: No authentication provided
      // WHEN: Attempting to create API key
      const response = await request.post('/api/auth/api-keys', {
        data: {
          name: 'Test API Key',
          scopes: ['read', 'write'],
        },
      });

      // THEN: Request is rejected with 401 Unauthorized
      expect(response.status()).toBe(401);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });
  });

  test.describe('DELETE /api/auth/api-keys/:id', () => {
    test('1.4-API-014 [P2]: should return proper error when deleting non-existent API key', async ({
      request,
    }) => {
      // GIVEN: Non-existent API key ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // WHEN: Attempting to delete non-existent API key
      const response = await request.delete(
        `/api/auth/api-keys/${nonExistentId}`
      );

      // THEN: Request returns 404 Not Found
      expect(response.status()).toBe(404);

      // AND: Proper error message is returned
      const body = await response.json();
      expect(body).toMatchObject({
        error: expect.any(String),
      });
      expect(body.error).toBeTruthy();
    });
  });

  // Note: Edge case tests are separated into auth-edge-cases.spec.ts
  // to maintain file size guidelines while ensuring comprehensive coverage
});
