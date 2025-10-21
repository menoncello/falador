import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../../database';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  createProjectForUser,
  InvalidAuthFixtures,
  NetworkFixtures
} from '../../test-fixtures';
import { projectRoutes } from '../projects';

describe('Project Routes Security Authorization Tests', () => {
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

    it('should enforce rate limiting for brute force protection', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Making many rapid requests to test rate limiting
      const requests = Array.from({ length: 100 }, () =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            authenticatedUser.token,
            { title: 'Rate Limit Test' }
          )
        )
      );

      const responses = await Promise.allSettled(requests);

      // Then: Some requests should be rate limited (429 status)
      const statusCodes = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<Response>).value.status);

      expect(statusCodes.some(code => code === 429)).toBe(true);
    });

    it('should prevent SQL injection attempts', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Attempting SQL injection through project parameters
      const sqlInjectionPayloads = [
        "'; DROP TABLE projects; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users --",
        "' OR 1=1 --",
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            authenticatedUser.token,
            { title: payload }
          )
        );

        // Then: Should either succeed with sanitized data or return validation error
        // Should never cause server errors (500)
        expect([201, 400, 422]).toContain(response.status);
      }
    });

    it('should prevent XSS attacks through project fields', async () => {
      // Given: An authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Attempting XSS through project fields
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert(1)</script>',
      ];

      for (const payload of xssPayloads) {
        const response = await projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            authenticatedUser.token,
            { title: payload, author: payload }
          )
        );

        // Then: Should either succeed with sanitized data or return validation error
        if (response.status === 201) {
          const data = (await response.json()) as { title: string; author: string };
          // Title should be sanitized, not contain raw script tags
          expect(data.title).not.toContain('<script>');
          expect(data.author).not.toContain('<script>');
        } else {
          expect([400, 422]).toContain(response.status);
        }
      }
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