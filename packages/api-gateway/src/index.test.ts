import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from './database';
import { TEST_CREDENTIALS } from './test-constants';
import { getAuthToken } from './test-helpers';
import { app } from './index';

describe('1.1-UNIT-Gateway: API Gateway', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Health endpoint', () => {
    it('1.1-UNIT-001 [P1]: returns ok status', async () => {
      const response = await app.handle(new Request('http://localhost/health'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'falador-api-gateway',
      });
    });
  });

  describe('Auth endpoints', () => {
    it('should register new user', async () => {
      const response = await app.handle(
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

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.email).toBe(TEST_CREDENTIALS.EMAIL);
    });

    it('should reject registration with missing fields', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
          }),
        })
      );

      expect(response.status).toBe(400);
    });

    it('should login with valid credentials', async () => {
      // Create user first
      await app.handle(
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

      // Login
      const response = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: `invalid-${Date.now()}`,
          }),
        })
      );

      expect(response.status).toBe(401);
    });

    it('should get current user with valid token', async () => {
      // Register and login
      await app.handle(
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

      const loginRes = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );
      const { token } = await loginRes.json();

      // Get user
      const response = await app.handle(
        new Request('http://localhost/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toBe(TEST_CREDENTIALS.EMAIL);
    });
  });

  describe('User cleanup endpoint', () => {
    it('should delete existing user', async () => {
      // Register user first
      const registerRes = await app.handle(
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
      const { id } = await registerRes.json();

      // Delete user
      const response = await app.handle(
        new Request(`http://localhost/api/users/${id}`, {
          method: 'DELETE',
        })
      );

      expect(response.status).toBe(204);
      const body = await response.text();
      expect(body).toBe('');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/non-existent-id', {
          method: 'DELETE',
        })
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('Project endpoints', () => {
    it('should create project', async () => {
      const token = await getAuthToken();

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'My Book',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.title).toBe('My Book');
    });

    it('should list projects', async () => {
      const token = await getAuthToken();

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should reject unauthorized access', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/projects')
      );

      expect(response.status).toBe(401);
    });
  });
});
