import {
  createTestUser,
  TEST_PASSWORDS,
} from '../../packages/api-gateway/src/test-factories';
import { test, expect } from '../support/fixtures';

/**
 * Authentication Mutation Testing Targets
 *
 * Focused tests to kill specific surviving mutants in authentication logic.
 * Based on actual mutation testing results showing 127 surviving mutants.
 */

test.describe('Authentication Mutation Targets', () => {
  test('POST /api/auth/login - invalid credentials returns consistent error structure', async ({
    request,
    baseURL,
  }) => {
    // Network-first: Set up response interception before request
    const loginPromise = request.waitForResponse('**/api/auth/login');

    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: TEST_PASSWORDS.WRONG,
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(typeof error.error).toBe('string');
    expect(error.error).toBe('Invalid credentials'); // Specific error message validation
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login - wrong password returns proper error', async ({
    request,
    baseURL,
  }) => {
    // Network-first: Set up response interception for user creation
    const registerPromise = request.waitForResponse('**/api/auth/register');

    // First create a user
    const userData = createTestUser({
      password: TEST_PASSWORDS.CORRECT,
    });
    await request.post(`${baseURL}/api/auth/register`, { data: userData });

    await registerPromise; // Deterministic wait

    // Network-first: Set up response interception for login
    const loginPromise = request.waitForResponse('**/api/auth/login');

    // Try login with wrong password
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: userData.email,
        password: TEST_PASSWORDS.WRONG,
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('Invalid credentials'); // Specific error message validation
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login - malformed email handled by auth logic', async ({
    request,
    baseURL,
  }) => {
    // Network-first: Set up response interception before request
    const loginPromise = request.waitForResponse('**/api/auth/login');

    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'not-an-email',
        password: TEST_PASSWORDS.VALID,
      },
    });

    await loginPromise; // Deterministic wait

    // Should be 401 because user lookup fails, not 400 from validation
    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('Invalid credentials'); // Auth logic should handle this
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/register - duplicate email check works correctly', async ({
    request,
    baseURL,
  }) => {
    const userData = createTestUser({
      password: TEST_PASSWORDS.VALID,
    });

    // Network-first: Set up response interception for first registration
    const firstRegisterPromise = request.waitForResponse(
      '**/api/auth/register'
    );

    // First registration should succeed
    const firstResponse = await request.post(`${baseURL}/api/auth/register`, {
      data: userData,
    });

    await firstRegisterPromise; // Deterministic wait
    expect(firstResponse.status()).toBe(201);

    // Network-first: Set up response interception for second registration
    const secondRegisterPromise = request.waitForResponse(
      '**/api/auth/register'
    );

    // Second registration should fail
    const secondResponse = await request.post(`${baseURL}/api/auth/register`, {
      data: userData,
    });

    await secondRegisterPromise; // Deterministic wait

    expect(secondResponse.status()).toBe(409);
    const error = await secondResponse.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('User with this email already exists'); // Specific validation
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/register - missing fields validation', async ({
    request,
    baseURL,
  }) => {
    const testCases = [
      {
        data: { name: 'Test User', password: TEST_PASSWORDS.VALID },
        missing: 'email',
      },
      {
        data: { email: 'test@example.com', password: TEST_PASSWORDS.VALID },
        missing: 'name',
      },
      {
        data: { email: 'test@example.com', name: 'Test User' },
        missing: 'password',
      },
    ];

    for (const testCase of testCases) {
      // Network-first: Set up response interception before request
      const registerPromise = request.waitForResponse('**/api/auth/register');

      const response = await request.post(`${baseURL}/api/auth/register`, {
        data: testCase.data,
      });

      await registerPromise; // Deterministic wait

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('Missing required fields');
      expect(error.error).toContain(testCase.missing); // Should mention missing field
      expect(error.error.length).toBeGreaterThan(0);
    }
  });

  test('GET /api/auth/me - missing authorization header', async ({
    request,
    baseURL,
  }) => {
    // Network-first: Set up response interception before request
    const mePromise = request.waitForResponse('**/api/auth/me');

    const response = await request.get(`${baseURL}/api/auth/me`);

    await mePromise; // Deterministic wait

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('Unauthorized'); // Specific validation
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('GET /api/auth/me - malformed authorization header', async ({
    request,
    baseURL,
  }) => {
    const malformedTokens = ['invalid-token', 'Bearer malformed', ''];

    for (const token of malformedTokens) {
      // Network-first: Set up response interception before request
      const mePromise = request.waitForResponse('**/api/auth/me');

      const response = await request.get(`${baseURL}/api/auth/me`, {
        headers: {
          Authorization: token,
        },
      });

      await mePromise; // Deterministic wait

      expect(response.status()).toBe(401);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('Unauthorized'); // Consistent error message
      expect(error.error.length).toBeGreaterThan(0);
    }
  });

  test('POST /api/auth/api-keys - unauthorized access blocked', async ({
    request,
    baseURL,
  }) => {
    // Network-first: Set up response interception before request
    const apiKeysPromise = request.waitForResponse('**/api/auth/api-keys');

    const response = await request.post(`${baseURL}/api/auth/api-keys`, {
      data: {
        name: 'Test Key',
        scopes: ['read'],
      },
    });

    await apiKeysPromise; // Deterministic wait

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('Unauthorized'); // Specific validation
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('Auth flow consistency - register and login sequence', async ({
    request,
    baseURL,
  }) => {
    const userData = createTestUser({
      password: TEST_PASSWORDS.SECURE,
    });

    // Network-first: Set up response interception for registration
    const registerPromise = request.waitForResponse('**/api/auth/register');

    // Register user
    const registerResponse = await request.post(
      `${baseURL}/api/auth/register`,
      {
        data: userData,
      }
    );

    await registerPromise; // Deterministic wait

    expect(registerResponse.status()).toBe(201);
    const registerResult = await registerResponse.json();
    expect(registerResult).toHaveProperty('id');
    expect(registerResult).toHaveProperty('email');
    expect(registerResult).toHaveProperty('name');

    // Network-first: Set up response interception for login
    const loginPromise = request.waitForResponse('**/api/auth/login');

    // Login with same credentials
    const loginResponse = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: userData.email,
        password: TEST_PASSWORDS.SECURE,
      },
    });

    await loginPromise; // Deterministic wait

    expect(loginResponse.status()).toBe(200);
    const loginResult = await loginResponse.json();
    expect(loginResult).toHaveProperty('token');

    // Network-first: Set up response interception for /me endpoint
    const mePromise = request.waitForResponse('**/api/auth/me');

    // Use token to access protected endpoint
    const meResponse = await request.get(`${baseURL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginResult.token}`,
      },
    });

    await mePromise; // Deterministic wait

    expect(meResponse.status()).toBe(200);
    const meResult = await meResponse.json();
    expect(meResult).toHaveProperty('id');
    expect(meResult.id).toBe(registerResult.id);
  });

  test('Token validation - invalid JWT structure rejection', async ({
    request,
    baseURL,
  }) => {
    // Test with various malformed JWT tokens
    const invalidTokens = [
      'not.a.jwt',
      'Bearer not.a.jwt',
      'invalid',
      'Bearer',
      '',
    ];

    for (const token of invalidTokens) {
      // Network-first: Set up response interception before request
      const mePromise = request.waitForResponse('**/api/auth/me');

      const response = await request.get(`${baseURL}/api/auth/me`, {
        headers: {
          Authorization: token,
        },
      });

      await mePromise; // Deterministic wait

      expect(response.status()).toBe(401);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('Unauthorized'); // Consistent error message
      expect(error.error.length).toBeGreaterThan(0);
    }
  });
});
