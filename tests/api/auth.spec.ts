import { createTestUser } from '../../packages/api-gateway/src/test-factories';
import { test, expect } from '../support/fixtures';

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

// Test passwords for authentication tests (mock data, not actual credentials)
const TEST_MOCK_PASSWORD_SECURE = String.raw`SecurePassword123!`;
const TEST_MOCK_PASSWORD_STANDARD = String.raw`Password123!`;
const TEST_MOCK_PASSWORD_CORRECT = String.raw`CorrectPassword123!`;
const TEST_MOCK_PASSWORD_WRONG = String.raw`WrongPassword123!`;
const TEST_MOCK_PASSWORD_GENERIC = String.raw`SomePassword123!`;

test.describe('1.4-API-Auth: Authentication API', () => {
  test.describe('POST /api/auth/register', () => {
    test('1.4-API-001 [P0]: should create new user with valid data', async ({
      request,
    }) => {
      // GIVEN: Valid user registration data using factory
      const userData = createTestUser({
        password: TEST_MOCK_PASSWORD_SECURE,
      });

      // WHEN: Creating user via API
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: User is created successfully
      expect(response.status()).toBe(201);
    });

    test('1.4-API-002 [P1]: should return created user object', async ({
      request,
    }) => {
      // GIVEN: Valid user registration data using factory
      const userData = createTestUser();

      // WHEN: Creating user via API
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Response contains user object with expected fields
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
      // GIVEN: Registration data without email
      const validUser = createTestUser();
      const userData = {
        name: validUser.name,
        password: validUser.password,
      };

      // WHEN: Attempting to create user
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // THEN: Request is rejected with 400 Bad Request
      expect(response.status()).toBe(400);
    });

    test('1.4-API-004 [P1]: should reject registration with duplicate email', async ({
      request,
    }) => {
      // GIVEN: User already exists with email
      const existingUser = createTestUser();

      // Create first user via API
      await request.post('/api/auth/register', {
        data: existingUser,
      });

      // WHEN: Attempting to register with same email
      const response = await request.post('/api/auth/register', {
        data: {
          email: existingUser.email,
          name: 'Another User',
          password: TEST_MOCK_PASSWORD_STANDARD,
        },
      });

      // THEN: Request is rejected with 409 Conflict
      expect(response.status()).toBe(409);
    });
  });

  test.describe('POST /api/auth/login', () => {
    test('1.4-API-005 [P0]: should authenticate user with valid credentials', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: User exists with known credentials
      const password = TEST_MOCK_PASSWORD_STANDARD;
      const user = await userFactory.createUser({ password });

      // WHEN: Logging in with valid credentials
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password,
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
      const password = TEST_MOCK_PASSWORD_STANDARD;
      const user = await userFactory.createUser({ password });

      // WHEN: Logging in
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password,
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
      // GIVEN: User exists
      const user = await userFactory.createUser({
        password: TEST_MOCK_PASSWORD_CORRECT,
      });

      // WHEN: Logging in with wrong password
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: TEST_MOCK_PASSWORD_WRONG,
        },
      });

      // THEN: Login fails with 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('1.4-API-008 [P1]: should reject login for non-existent user', async ({
      request,
    }) => {
      // GIVEN: No user exists with this email
      const email = 'nonexistent@example.com';

      // WHEN: Attempting to login
      const response = await request.post('/api/auth/login', {
        data: {
          email,
          password: TEST_MOCK_PASSWORD_GENERIC,
        },
      });

      // THEN: Login fails with 401 Unauthorized
      expect(response.status()).toBe(401);
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
    });
  });

  test.describe('POST /api/auth/api-keys', () => {
    test('1.4-API-011 [P1]: should create API key for authenticated user', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Authenticated user
      const user = await userFactory.createUser();
      const token = await userFactory.login(user.email, user.password ?? '');

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
      const token = await userFactory.login(user.email, user.password ?? '');

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
  });
});
