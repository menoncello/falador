import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  createProjectForUser,
  NetworkFixtures
} from '../test-fixtures';
import { projectRoutes } from './projects';

describe('Project Routes Security Tests', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Given authentication and authorization scenarios', () => {
    it('should reject requests with invalid JWT token', async () => {
      // Given: A request with invalid JWT token
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer invalid.jwt.token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Test Book' }),
        })
      );

      // Then: Should return 401 unauthorized
      expect(response.status).toBe(401);
    });

    it('should reject requests with expired JWT token', async () => {
      // Given: A request with expired JWT token (using network fixtures)
      const expiredToken = NetworkFixtures.createExpiredJWT();
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${expiredToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Test Book' }),
        })
      );

      // Then: Should return 401 unauthorized
      expect(response.status).toBe(401);
    });

    it('should reject requests with malformed Authorization header', async () => {
      // Given: Various malformed authorization headers
      const malformedHeaders = [
        'Bearer', // Incomplete header
        'Bearer ', // Empty token
        'Token abc123', // Wrong scheme
        'Basic abc123', // Wrong scheme
        '', // Empty header
      ];

      for (const header of malformedHeaders) {
        // When: Making request with malformed auth header
        const response = await projectRoutes.handle(
          new Request('http://localhost/api/projects', {
            method: 'POST',
            headers: {
              'Authorization': header,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Test Book' }),
          })
        );

        // Then: Should return 401 unauthorized
        expect(response.status).toBe(401);
      }
    });

    it('should reject requests without Authorization header', async () => {
      // Given: A request without Authorization header
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Test Book' }),
        })
      );

      // Then: Should return 401 unauthorized
      expect(response.status).toBe(401);
    });

    it('should prevent cross-tenant data access', async () => {
      // Given: Two users from different tenants/projects
      const user1 = createAuthenticatedUser({ email: 'user1@tenant1.com', name: 'User 1' });
      const user2 = createAuthenticatedUser({ email: 'user2@tenant2.com', name: 'User 2' });

      const user1Project = createProjectForUser(user1.user.id, { title: 'User1 Project' });

      // When: User2 tries to access user1's project
      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          `http://localhost/api/projects/${user1Project.id}`,
          'GET',
          user2.token
        )
      );

      // Then: Should return 403 forbidden
      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Given network resilience scenarios', () => {
    it('should handle malformed JSON payloads gracefully', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Sending malformed JSON
      const malformedJSONPayloads = [
        '{ title: "missing quotes" }',
        '{ "title": "incomplete" ',
        '{"title": "extra comma",}',
        'not json at all',
        '',
      ];

      for (const payload of malformedJSONPayloads) {
        const response = await projectRoutes.handle(
          new Request('http://localhost/api/projects', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authenticatedUser.token}`,
              'Content-Type': 'application/json',
            },
            body: payload,
          })
        );

        // Then: Should return 400 bad request
        expect(response.status).toBe(400);
      }
    });

    it('should validate content-type header', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Sending request with wrong content-type
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authenticatedUser.token}`,
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ title: 'Test Book' }),
        })
      );

      // Then: Should accept or reject based on implementation
      // Most APIs accept JSON regardless of content-type, but strict ones reject
      expect([201, 400, 415]).toContain(response.status);
    });

    it('should handle oversized payloads', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Sending extremely large payload
      const largePayload = {
        title: 'A'.repeat(1000000), // 1MB title
        author: 'B'.repeat(1000000), // 1MB author
      };

      const response = await projectRoutes.handle(
        createAuthenticatedRequest(
          'http://localhost/api/projects',
          'POST',
          authenticatedUser.token,
          largePayload
        )
      );

      // Then: Should reject oversized payload
      expect([400, 413, 422]).toContain(response.status);
    });
  });
});