import { test, expect } from '../support/fixtures';
import { createTestUser, TEST_PASSWORDS } from '../../packages/api-gateway/src/test-factories';

/**
 * Authentication Security Tests
 *
 * These tests target surviving mutation testing mutants in authentication logic.
 * Focus on security edge cases and error handling to improve mutation score.
 */

test.describe('Authentication Security - Critical Mutants', () => {

  test('POST /api/auth/login - rejects unauthenticated requests without proper credentials', async ({ request, baseURL }) => {
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
    expect(error.error).toMatch(/Invalid credentials/i);
    expect(error.error).toBe('Invalid credentials'); // Specific error message validation
  });

  test('POST /api/auth/login - handles malformed email addresses', async ({ request, baseURL }) => {
    // Network-first: Set up response interception before request
    const loginPromise = request.waitForResponse('**/api/auth/login');

    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'not-an-email',
        password: TEST_PASSWORDS.VALID,
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(401); // Should be 401 (user not found) not 400 (validation)
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/Invalid credentials/i); // Should be authentication error
    expect(error.error.length).toBeGreaterThan(0); // Error message not empty
  });

  test('POST /api/auth/login - rejects empty password', async ({ request, baseURL }) => {
    // Network-first: Set up response interception before request
    const loginPromise = request.waitForResponse('**/api/auth/login');

    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: '',
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/Password is required/i);
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login - rejects missing credentials', async ({ request, baseURL }) => {
    // Network-first: Set up response interception before request
    const loginPromise = request.waitForResponse('**/api/auth/login');

    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {},
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/Missing required fields/i);
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login - validates JSON structure', async ({ request, baseURL }) => {
    // Network-first: Set up response interception before request
    const loginPromise = request.waitForResponse('**/api/auth/login');

    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: 'invalid-json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/Invalid JSON/i);
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/register - handles duplicate email registration gracefully', async ({ request, baseURL }) => {
    const userData = createTestUser({
      email: 'duplicate-test@example.com',
      password: TEST_PASSWORDS.VALID,
    });

    // Network-first: Set up response interception for first registration
    const firstRegisterPromise = request.waitForResponse('**/api/auth/register');

    // First registration should succeed
    const firstResponse = await request.post(`${baseURL}/api/auth/register`, {
      data: userData,
    });

    await firstRegisterPromise; // Deterministic wait
    expect(firstResponse.status()).toBe(201);

    // Network-first: Set up response interception for second registration
    const secondRegisterPromise = request.waitForResponse('**/api/auth/register');

    // Second registration with same email should fail
    const secondResponse = await request.post(`${baseURL}/api/auth/register`, {
      data: userData,
    });

    await secondRegisterPromise; // Deterministic wait

    expect(secondResponse.status()).toBe(409);
    const error = await secondResponse.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/already exists/i);
    expect(error.error).toBe('User with this email already exists'); // Specific validation
  });

  test('POST /api/auth/register - validates password strength', async ({ request, baseURL }) => {
    const weakPasswords = [
      '123',
      'password',
      'weak',
      'short',
      '',
    ];

    for (const weakPassword of weakPasswords) {
      // Network-first: Set up response interception before each request
      const registerPromise = request.waitForResponse('**/api/auth/register');

      const response = await request.post(`${baseURL}/api/auth/register`, {
        data: {
          email: `test-${Date.now()}@example.com`,
          password: weakPassword,
          name: 'Test User',
        },
      });

      await registerPromise; // Deterministic wait

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toMatch(/Password too weak|Password must be at least/i);
      expect(error.error.length).toBeGreaterThan(0);
    }
  });

  test('POST /api/auth/register - validates required fields', async ({ request, baseURL }) => {
    const requiredFields = ['email', 'password', 'name'];

    for (const field of requiredFields) {
      const userData = createTestUser();
      delete userData[field as keyof typeof userData];

      // Network-first: Set up response interception before request
      const registerPromise = request.waitForResponse('**/api/auth/register');

      const response = await request.post(`${baseURL}/api/auth/register`, {
        data: userData,
      });

      await registerPromise; // Deterministic wait

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toMatch(/Missing required fields/i);
      expect(error.error).toContain(field); // Should mention which field is missing
      expect(error.error.length).toBeGreaterThan(0);
    }
  });

  test('GET /protected-endpoints - returns proper error structure for missing auth', async ({ request, baseURL }) => {
    // Network-first: Set up response interception before request
    const projectsPromise = request.waitForResponse('**/projects');

    // Test projects endpoint without authentication
    const response = await request.get(`${baseURL}/projects`);

    await projectsPromise; // Deterministic wait

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/Unauthorized/i);
    expect(error.error).toBe('Unauthorized'); // Specific validation
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('Authorization middleware - handles malformed JWT tokens', async ({ request, baseURL }) => {
    const malformedTokens = [
      'invalid-token',
      'Bearer malformed',
      'Bearer ',
      '',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    ];

    for (const token of malformedTokens) {
      // Network-first: Set up response interception before request
      const projectsPromise = request.waitForResponse('**/projects');

      const response = await request.get(`${baseURL}/projects`, {
        headers: {
          'Authorization': token,
        },
      });

      await projectsPromise; // Deterministic wait

      expect(response.status()).toBe(401);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('Unauthorized'); // Consistent error message
      expect(error.error.length).toBeGreaterThan(0);
    }
  });

  test('Authorization middleware - validates token structure', async ({ request, baseURL }) => {
    // Test with validly structured but invalid JWT
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    // Network-first: Set up response interception before request
    const projectsPromise = request.waitForResponse('**/projects');

    const response = await request.get(`${baseURL}/projects`, {
      headers: {
        'Authorization': `Bearer ${fakeToken}`,
      },
    });

    await projectsPromise; // Deterministic wait

    expect(response.status()).toBe(401);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toBe('Unauthorized'); // Consistent error message
    expect(error.error.length).toBeGreaterThan(0);
  });

  test('Error responses - maintain consistent error structure', async ({ request, baseURL }) => {
    const testCases = [
      { endpoint: '/api/auth/login', method: 'POST', data: { email: 'invalid', password: 'invalid' } },
      { endpoint: '/api/auth/register', method: 'POST', data: {} },
      { endpoint: '/projects', method: 'GET', data: null },
    ];

    for (const testCase of testCases) {
      let response;

      if (testCase.method === 'POST') {
        // Network-first: Set up response interception before request
        const endpointPromise = request.waitForResponse(`**${testCase.endpoint}`);

        response = await request.post(`${baseURL}${testCase.endpoint}`, {
          data: testCase.data
        });

        await endpointPromise; // Deterministic wait
      } else {
        // Network-first: Set up response interception before request
        const endpointPromise = request.waitForResponse(`**${testCase.endpoint}`);

        response = await request.get(`${baseURL}${testCase.endpoint}`);

        await endpointPromise; // Deterministic wait
      }

      if (response.status() >= 400) {
        const error = await response.json();

        // All error responses should have consistent structure
        expect(error).toHaveProperty('error');
        expect(typeof error.error).toBe('string');
        expect(error.error.length).toBeGreaterThan(0);
      }
    }
  });

  test('POST /api/auth/login - case insensitive email handling', async ({ request, baseURL }) => {
    const userData = createTestUser({
      email: 'CASE.TEST@example.com',
      password: TEST_PASSWORDS.VALID,
    });

    // Network-first: Set up response interception for registration
    const registerPromise = request.waitForResponse('**/api/auth/register');

    // Register with uppercase email
    const registerResponse = await request.post(`${baseURL}/api/auth/register`, {
      data: userData
    });

    await registerPromise; // Deterministic wait

    // Network-first: Set up response interception for login
    const loginPromise = request.waitForResponse('**/api/auth/login');

    // Try login with lowercase email
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'case.test@example.com',
        password: TEST_PASSWORDS.VALID,
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
  });

  test('POST /api/auth/login - whitespace trimming in credentials', async ({ request, baseURL }) => {
    const userData = createTestUser({
      email: 'whitespace@example.com',
      password: TEST_PASSWORDS.VALID,
    });

    // Network-first: Set up response interception for registration
    const registerPromise = request.waitForResponse('**/api/auth/register');

    // Register user
    await request.post(`${baseURL}/api/auth/register`, {
      data: userData
    });

    await registerPromise; // Deterministic wait

    // Network-first: Set up response interception for login
    const loginPromise = request.waitForResponse('**/api/auth/login');

    // Try login with whitespace around email
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: '  whitespace@example.com  ',
        password: TEST_PASSWORDS.VALID,
      },
    });

    await loginPromise; // Deterministic wait

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
  });
});