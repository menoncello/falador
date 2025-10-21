import { describe, expect, it, beforeEach } from 'bun:test';
import { HTTP_STATUS } from '../constants';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';
import { authRoutes } from './auth';

describe('Auth API Keys Routes', () => {
  beforeEach(() => {
    db.clear();
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

      expect(response.status).toBe(HTTP_STATUS.CREATED);
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

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should validate API key scopes are strings', async () => {
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
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.token}`,
          },
          body: JSON.stringify({
            name: 'Test API Key',
            scopes: ['read', 'write', 'admin'], // All strings
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should handle API key validation schema', async () => {
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
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Test API Key',
            scopes: ['read', 'write'],
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('key');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('scopes');
      expect(Array.isArray(data.scopes)).toBe(true);
    });

    it('should reject unauthorized access with correct error message', async () => {
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
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
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

      const response = await authRoutes.handle(
        new Request(`http://localhost/api/auth/api-keys/${apiKey.id}`, {
          method: 'DELETE',
        })
      );

      expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    });

    it('should return 404 for non-existent API key', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys/nonexistent', {
          method: 'DELETE',
        })
      );

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should return correct error message for missing API key', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys/nonexistent', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('API key not found');
    });

    it('should handle API key deletion with proper error response', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys/nonexistent-key', {
          method: 'DELETE',
          headers: { Authorization: 'Bearer some-token' },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('API key not found');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return unauthorized without token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me')
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('should return unauthorized with invalid token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('should return exact unauthorized error message for missing token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me')
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('should return exact unauthorized error message for invalid token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer invalid-token' },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('should test authorization logic edge cases', async () => {
      // Test with malformed authorization header
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'malformed-token-no-bearer' },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });

    it('should test authorization with empty token', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: 'Bearer ' },
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });
});
