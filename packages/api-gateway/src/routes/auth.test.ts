import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';
import { authRoutes } from './auth';

describe('Auth Routes', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration without email', async () => {
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

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Missing required fields: email, name, password');
    });

    it('should reject registration without name', async () => {
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

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject registration without password', async () => {
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

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Missing required fields');
    });

    it('should register with optional tier field', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            name: TEST_CREDENTIALS.NAME,
            password: TEST_CREDENTIALS.PASSWORD,
            tier: 'pro',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { tier: string };
      expect(data.tier).toBe('pro');
    });

    it('should register with enterprise tier', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'enterprise@example.com',
            name: 'Enterprise User',
            password: TEST_CREDENTIALS.PASSWORD,
            tier: 'enterprise',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { tier: string };
      expect(data.tier).toBe('enterprise');
    });

    it('should register with free tier by default', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'free@example.com',
            name: 'Free User',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { tier: string };
      expect(data.tier).toBe('free');
    });

    it('should reject duplicate email registration', async () => {
      // Create first user
      await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            name: TEST_CREDENTIALS.NAME,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      // Try to create duplicate
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            name: 'Another Name',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(409);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login for non-existent user', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      // Create user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Try to login with wrong password
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: `wrong-${Date.now()}`,
          }),
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return unauthorized without token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me')
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('should return unauthorized with invalid token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/api-keys', () => {
    it('should create API key for authenticated user', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

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

    it('should reject creating API key without auth', async () => {
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

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/api-keys/:id', () => {
    it('should delete API key', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: [],
      });

      const token = db.createSession(user.id);
      const response = await authRoutes.handle(
        new Request(`http://localhost/api/auth/api-keys/${apiKey.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent API key', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys/nonexistent', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('API key not found');
    });
  });
});
