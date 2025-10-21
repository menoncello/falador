import { describe, expect, it, beforeEach } from 'bun:test';
import { HTTP_STATUS } from '../constants';
import { db } from '../database';
import { createTestUser, TEST_PASSWORDS } from '../test-factories';
import { createAuthenticatedUser, createAuthenticatedRequest, InvalidAuthFixtures, NetworkFixtures } from '../test-fixtures';
import { authRoutes } from './auth';

// Fixed timestamp for deterministic testing
const FIXED_TIMESTAMP = 1697702400000; // October 19, 2023

describe('Auth Routes - Basic Login Tests', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('POST /api/auth/login', () => {
    it('should reject login for non-existent user', async () => {
      const testUser = createTestUser({ email: 'nonexistent@example.com' });

      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      // Create user using factory pattern
      const testUser = createTestUser();
      const user = db.createUser({
        email: testUser.email,
        name: testUser.name,
        password: testUser.password,
      });

      // Try to login with wrong password
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: TEST_PASSWORDS.WRONG,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should successfully login with correct credentials', async () => {
      // Create user using factory pattern
      const testUser = createTestUser();
      const user = db.createUser({
        email: testUser.email,
        name: testUser.name,
        password: testUser.password,
      });

      // Try to login with correct credentials
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      const data = await response.json();
      expect(data.token).toBeTruthy();
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.name).toBe(testUser.name);
      expect(data.user.id).toBe(user.id);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should create user with valid data', async () => {
      const testUser = createTestUser();

      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            name: testUser.name,
            password: testUser.password,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      const data = await response.json();
      expect(data.id).toBeTruthy();
      expect(data.email).toBe(testUser.email);
      expect(data.name).toBe(testUser.name);
      expect(data.tier).toBe('free');
    });

    it('should create user with pro tier', async () => {
      const testUser = createTestUser({ tier: 'pro' });

      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            name: testUser.name,
            password: testUser.password,
            tier: 'pro',
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      const data = await response.json();
      expect(data.tier).toBe('pro');
    });

    it('should reject registration with missing email', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: TEST_CREDENTIALS.NAME,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = await response.json();
      expect(data.error).toContain('Missing required fields: email');
    });

    it('should reject registration with missing name', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = await response.json();
      expect(data.error).toContain('Missing required fields: name');
    });

    it('should reject registration with missing password', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            name: TEST_CREDENTIALS.NAME,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = await response.json();
      expect(data.error).toContain('Missing required fields: password');
    });

    it('should reject registration with duplicate email', async () => {
      // Create user first
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Try to register again
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            name: 'Different Name',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      const data = await response.json();
      expect(data.error).toBe('User with this email already exists');
    });

    it('should reject registration with invalid tier', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            name: TEST_CREDENTIALS.NAME,
            password: TEST_CREDENTIALS.PASSWORD,
            tier: 'invalid',
          }),
        })
      );

      // This should be handled by Elysia's validation schema
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/api-keys', () => {
    it('should create API key with valid authorization', async () => {
      // Create authenticated user using fixture
      const authenticatedUser = createAuthenticatedUser();

      // Create API key using authenticated request fixture
      const response = await authRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/auth/api-keys',
          'POST',
          authenticatedUser.token,
          {
            name: 'Test API Key',
            scopes: ['read', 'write'],
          }
        )
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      const data = await response.json();
      expect(data.id).toBeTruthy();
      expect(data.name).toBe('Test API Key');
      expect(data.scopes).toEqual(['read', 'write']);
      expect(data.key).toBeTruthy();
    });

    it('should reject API key creation without authorization', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test API Key',
            scopes: ['read'],
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject API key creation with invalid token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer invalid-token',
          },
          body: JSON.stringify({
            name: 'Test API Key',
            scopes: ['read'],
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject API key creation with missing name', async () => {
      // Create and login user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const loginResponse = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Try to create API key without name
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            scopes: ['read'],
          }),
        })
      );

      // Elysia validation should catch this
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject API key creation with missing scopes', async () => {
      // Create and login user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const loginResponse = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Try to create API key without scopes
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Test API Key',
          }),
        })
      );

      // Elysia validation should catch this
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/auth/api-keys/:id', () => {
    it('should delete API key with valid ID', async () => {
      // Create and login user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const loginResponse = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Create API key
      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test API Key',
        scopes: ['read'],
      });

      // Delete API key
      const response = await authRoutes.handle(
        new Request(`http://localhost/api/auth/api-keys/${apiKey.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    });

    it('should reject API key deletion with non-existent ID', async () => {
      // Create and login user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const loginResponse = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Try to delete non-existent API key
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys/non-existent-id', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      const data = await response.json();
      expect(data.error).toBe('API key not found');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      // Create and login user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const loginResponse = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Get user info
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      const data = await response.json();
      expect(data.id).toBe(user.id);
      expect(data.email).toBe(TEST_CREDENTIALS.EMAIL);
      expect(data.name).toBe(TEST_CREDENTIALS.NAME);
    });

    it('should reject user info request without authorization', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject user info request with invalid token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  // Test for validation schema mutants
  describe('Schema Validation Tests', () => {
    it('should validate registration schema structure', async () => {
      // Test that empty object is rejected
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate login schema structure', async () => {
      // Test that empty object is rejected
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate API key creation schema structure', async () => {
      // Create and login user first
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const loginResponse = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Test that empty object is rejected
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // Network-first testing patterns for edge cases
  describe('Network-First Edge Case Testing', () => {
    it('should handle malformed JSON in registration', async () => {
      const response = await authRoutes.handle(
        NetworkFixtures.createMalformedJsonRequest(
          'http://localhost/api/auth/register',
          'some-token'
        )
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle requests with invalid authorization formats', async () => {
      const testUser = createTestUser();

      // Test malformed authorization header
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: InvalidAuthFixtures.malformed,
          },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should handle requests with empty authorization tokens', async () => {
      const response = await authRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/auth/me',
          'GET',
          InvalidAuthFixtures.empty
        )
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should handle concurrent authentication requests', async () => {
      const testUser = createTestUser();

      // Create user
      db.createUser({
        email: testUser.email,
        name: testUser.name,
        password: testUser.password,
      });

      // Send multiple concurrent login requests
      const loginPromises = Array.from({ length: 5 }, () =>
        authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: testUser.email,
              password: testUser.password,
            }),
          })
        )
      );

      const responses = await Promise.all(loginPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(HTTP_STATUS.OK);
      });

      // All tokens should be different
      const tokens = await Promise.all(
        responses.map(response => response.json().then(data => data.token))
      );
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it('should handle authentication with expired sessions', async () => {
      const authenticatedUser = createAuthenticatedUser();

      // Clear the database to simulate expired session
      db.clear();

      const response = await authRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/auth/me',
          'GET',
          authenticatedUser.token
        )
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should validate user input under network stress conditions', async () => {
      const authenticatedUser = createAuthenticatedUser();

      // Test with oversized payload
      const response = await authRoutes.handle(
        NetworkFixtures.createOversizedRequest(
          'http://localhost/api/auth/api-keys',
          authenticatedUser.token
        )
      );

      // Should handle gracefully based on implementation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
