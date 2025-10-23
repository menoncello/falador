import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import { createTestUser } from '../test-factories';
import { authRoutes } from './auth';

describe('Auth Routes', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('POST /api/auth/register', () => {
    it('1.5-AUTH-REG-001 [P1]: should reject registration without email', async () => {
      // Given: User data without email field
      const userData = createTestUser();
      delete userData.email; // Remove email to test validation

      // When: Submitting registration without email
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userData.name,
            password: userData.password,
          }),
        })
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Valid email is required');
    });

    it('1.5-AUTH-REG-002 [P1]: should reject registration without name', async () => {
      // Given: User registration data without name field
      const userData = createTestUser();

      // When: Submitting registration without name
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
          }),
        })
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Missing required fields');
    });

    it('1.5-AUTH-REG-003 [P0]: should reject registration without password', async () => {
      // Given: User registration data without password field
      const userData = createTestUser();
      delete userData.password;

      // When: Submitting registration without password
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            name: userData.name,
          }),
        })
      );

      // Then: Should return validation error
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Missing required fields');
    });

    it('1.5-AUTH-REG-004 [P1]: should register with optional tier field', async () => {
      // Given: User registration data with tier field
      const userData = createTestUser({ tier: 'pro' });

      // When: Submitting registration with tier
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            name: userData.name,
            password: userData.password,
            tier: userData.tier,
          }),
        })
      );

      // Then: Should successfully register with specified tier
      expect(response.status).toBe(201);
      const data = (await response.json()) as { tier: string };
      expect(data.tier).toBe('pro');
    });

    it('1.5-AUTH-REG-005 [P0]: should reject duplicate email registration', async () => {
      // Given: A user already registered with an email
      const userData = createTestUser();
      await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            name: userData.name,
            password: userData.password,
          }),
        })
      );

      // When: Trying to register another user with the same email
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            name: 'Another Name',
            password: userData.password,
          }),
        })
      );

      // Then: Should return conflict error
      expect(response.status).toBe(409);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('already exists');
    });

    it('1.5-AUTH-REG-010 [P1]: should handle concurrent registration attempts gracefully', async () => {
      // Given: Same user data for multiple concurrent requests
      const userData = createTestUser();

      // Helper function to create registration request
      const createRegistrationRequest = (): Promise<Response> => {
        return authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              name: userData.name,
              password: userData.password,
            }),
          })
        );
      };

      // When: Making multiple concurrent registration requests with same email
      const request1 = createRegistrationRequest();
      const request2 = createRegistrationRequest();
      const request3 = createRegistrationRequest();

      const responses = await Promise.all([request1, request2, request3]);

      // Then: Only one should succeed and others should get conflict errors
      const successCount = responses.filter((r) => r.status === 201).length;
      const conflictCount = responses.filter((r) => r.status === 409).length;
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    });
  });

  describe('POST /api/auth/login', () => {
    it('1.5-AUTH-LOG-001 [P0]: should reject login for non-existent user', async () => {
      // Given: Non-existent user credentials
      const userData = createTestUser();

      // When: Attempting to login with non-existent user
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
          }),
        })
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('1.5-AUTH-LOG-002 [P0]: should reject login with wrong password', async () => {
      // Given: A registered user
      const userData = createTestUser();
      db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      // When: Attempting to login with wrong password
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            password: `wrong-${Date.now()}`,
          }),
        })
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('1.5-AUTH-LOG-003 [P0]: should login successfully with valid credentials', async () => {
      // Given: A registered user
      const userData = createTestUser();
      db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      // When: Attempting to login with valid credentials
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
          }),
        })
      );

      // Then: Should return success with token
      expect(response.status).toBe(200);
      const data = (await response.json()) as { token: string };
      expect(data.token).toBeTruthy();
    });

    it('1.5-AUTH-LOG-010 [P2]: should handle concurrent login attempts correctly', async () => {
      // Given: A registered user
      const userData = createTestUser();
      db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      // When: Making multiple concurrent login requests with valid credentials
      const responses = await Promise.all([
        authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
            }),
          })
        ),
        authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
            }),
          })
        ),
        authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
            }),
          })
        ),
      ]);

      // Then: All login attempts should succeed
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBe(3);

      // Verify each response contains a valid token
      for (const response of responses) {
        const data = (await response.json()) as { token: string };
        expect(data.token).toBeTruthy();
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('1.5-AUTH-ME-001 [P0]: should return unauthorized without token', async () => {
      // Given: No authentication token provided

      // When: Attempting to access protected endpoint
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me')
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('1.5-AUTH-ME-002 [P0]: should return unauthorized with invalid token', async () => {
      // Given: Invalid authentication token

      // When: Attempting to access protected endpoint with invalid token
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        })
      );

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/api-keys', () => {
    it('1.5-AUTH-API-001 [P0]: should create API key for authenticated user', async () => {
      // Given: An authenticated user
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Creating a new API key
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Test API Key',
            scopes: ['read', 'write'],
          }),
        })
      );

      // Then: Should successfully create API key
      expect(response.status).toBe(201);
      const data = (await response.json()) as {
        id: string;
        key: string;
        name: string;
        scopes: string[];
      };
      expect(data.name).toBe('Test API Key');
      expect(data.scopes).toEqual(['read', 'write']);
      expect(data.key).toBeTruthy();
    });

    it('1.5-AUTH-API-002 [P0]: should reject creating API key without auth', async () => {
      // Given: No authentication token provided

      // When: Attempting to create API key without authentication
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

      // Then: Should return unauthorized error
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/api-keys/:id', () => {
    it('1.5-AUTH-API-003 [P0]: should delete API key', async () => {
      // Given: An authenticated user with an existing API key
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);
      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: [],
      });

      // When: Deleting the API key
      const response = await authRoutes.handle(
        new Request(`http://localhost/api/auth/api-keys/${apiKey.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      // Then: Should successfully delete the API key
      expect(response.status).toBe(204);
    });

    it('1.5-AUTH-API-004 [P1]: should return 404 for non-existent API key', async () => {
      // Given: An authenticated user with no existing API key
      const userData = createTestUser();
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });
      const token = db.createSession(user.id);

      // When: Attempting to delete a non-existent API key
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys/nonexistent', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      // Then: Should return not found error
      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('API key not found');
    });
  });
});
