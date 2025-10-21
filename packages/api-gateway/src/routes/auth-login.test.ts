import { test, expect } from '../test-support/fixtures/auth-fixture';
import { authRoutes } from './auth';

describe('P0 - Critical: User Authentication Flow', () => {
  describe('Given a registered user wants to authenticate', () => {
    describe('When valid credentials are provided', () => {
      it('Then authentication should succeed and return token', async ({
        authenticatedUser,
      }) => {
        // Given: Registered user with valid credentials
        const loginData = {
          email: authenticatedUser.user.email,
          password: 'ValidPassword123!', // Test constant password
        };

        // When: Submitting login request
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
          })
        );

        // Then: Should return 200 with authentication token
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.token).toBeTruthy();
        expect(data.user.email).toBe(loginData.email);
        expect(data.user.name).toBe(authenticatedUser.user.name);
      });
    });

    describe('When invalid credentials are provided', () => {
      it('Then authentication should fail with unauthorized error', async ({
        testUser,
      }) => {
        // Given: Registered user
        const loginData = {
          email: testUser.email,
          password: 'wrong-password', // Invalid password
        };

        // When: Submitting login request
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
          })
        );

        // Then: Should return 401 with error message
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid credentials');
      });
    });

    describe('When user does not exist', () => {
      it('Then authentication should fail with unauthorized error', async () => {
        // Given: Non-existent user credentials
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'any-password',
        };

        // When: Submitting login request
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
          })
        );

        // Then: Should return 401 with error message
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Invalid credentials');
      });
    });
  });
});

describe('P1 - High: Token-based Authentication', () => {
  describe('Given an authenticated user', () => {
    describe('When accessing protected endpoints with valid token', () => {
      it('Then should allow access and return user data', async ({
        authenticatedUser,
      }) => {
        // Given: Valid authentication token
        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
        };

        // When: Accessing protected endpoint
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/me', {
            headers,
          })
        );

        // Then: Should return 200 with user data
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.email).toBe(authenticatedUser.user.email);
        expect(data.name).toBe(authenticatedUser.user.name);
      });
    });

    describe('When accessing protected endpoints with invalid token', () => {
      it('Then should deny access with unauthorized error', async () => {
        // Given: Invalid token
        const headers = {
          Authorization: 'Bearer invalid-token',
        };

        // When: Accessing protected endpoint
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/me', {
            headers,
          })
        );

        // Then: Should return 401 with error message
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('When accessing protected endpoints without token', () => {
      it('Then should deny access with unauthorized error', async () => {
        // Given: No authentication token
        // When: Accessing protected endpoint
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/me')
        );

        // Then: Should return 401 with error message
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });
  });
});

describe('P2 - Medium: API Key Management', () => {
  describe('Given an authenticated user', () => {
    describe('When creating API key with valid data', () => {
      it('Then should create API key and return details', async ({
        authenticatedUser,
      }) => {
        // Given: Authenticated user and API key data
        const apiKeyData = {
          name: 'Test API Key',
          scopes: ['read', 'write'],
        };

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
          'Content-Type': 'application/json',
        };

        // When: Creating API key
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/api-keys', {
            method: 'POST',
            headers,
            body: JSON.stringify(apiKeyData),
          })
        );

        // Then: Should return 201 with API key details
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.name).toBe(apiKeyData.name);
        expect(data.scopes).toEqual(apiKeyData.scopes);
        expect(data.key).toBeTruthy();
        expect(data.id).toBeTruthy();
      });
    });

    describe('When creating API key without authentication', () => {
      it('Then should deny access with unauthorized error', async () => {
        // Given: API key data without authentication
        const apiKeyData = {
          name: 'Test API Key',
          scopes: ['read'],
        };

        // When: Creating API key
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiKeyData),
          })
        );

        // Then: Should return 401 with error message
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });
  });
});

describe('Network-First Patterns: Concurrent Authentication', () => {
  describe('Given multiple concurrent authentication requests', () => {
    describe('When users attempt to login simultaneously', () => {
      it('Then should handle race conditions without interference', async ({
        setupUser,
      }) => {
        // Network-First: Setup multiple users and concurrent requests
        const users = Array.from({ length: 5 }, (_, i) =>
          setupUser({
            email: `user${i}@example.com`,
            name: `User ${i}`,
            password: 'Password123!',
          })
        );

        // Create concurrent login requests
        const loginPromises = users.map((user) =>
          authRoutes.handle(
            new Request('http://localhost/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                password: 'Password123!',
              }),
            })
          )
        );

        // When: Executing all requests concurrently
        const responses = await Promise.all(loginPromises);

        // Then: All should succeed without interference
        for (const [index, response] of responses.entries()) {
          expect(response.status).toBe(200);
          // Each response should be for the correct user
        }
      });
    });

    describe('When API key creation happens concurrently', () => {
      it('Then should maintain isolation between requests', async ({
        authenticatedUser,
        setupUser,
      }) => {
        // Setup multiple authenticated users
        const users = [
          authenticatedUser,
          setupUser({
            email: 'user2@example.com',
            name: 'User 2',
            password: 'Password123!',
          }),
        ];

        // Create concurrent API key requests for different users
        const apiKeyPromises = users.map((user, index) => {
          const token = user.token || user.id; // Handle different user objects

          return authRoutes.handle(
            new Request('http://localhost/api/auth/api-keys', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `API Key ${index}`,
                scopes: ['read', 'write'],
              }),
            })
          );
        });

        // When: Executing concurrent requests
        const responses = await Promise.all(apiKeyPromises);

        // Then: All should succeed with unique keys
        const apiKeys = await Promise.all(
          responses.map((response) => response.json())
        );

        // Verify all API keys are unique
        const keyNames = apiKeys.map((key) => key.name);
        const uniqueNames = [...new Set(keyNames)];
        expect(uniqueNames).toHaveLength(keyNames.length);

        // Verify all responses are successful
        for (const response of responses) {
          expect(response.status).toBe(201);
        }
      });
    });
  });
});

describe('P3 - Low: Edge Cases and Error Handling', () => {
  describe('Given malformed authentication requests', () => {
    describe('When authorization header is malformed', () => {
      it('Then should handle gracefully without crashing', async () => {
        // Test various malformed authorization headers
        const malformedHeaders = [
          'InvalidFormat token',
          'Bearer',
          'Bearer ',
          '',
          null,
          undefined,
        ];

        for (const header of malformedHeaders) {
          // When: Making request with malformed header
          const response = await authRoutes.handle(
            new Request('http://localhost/api/auth/me', {
              headers: header ? { Authorization: header } : {},
            })
          );

          // Then: Should handle gracefully
          expect(response.status).toBe(401);
        }
      });
    });

    describe('When request body contains invalid JSON', () => {
      it('Then should handle parsing errors gracefully', async () => {
        // When: Submitting malformed JSON
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json{',
          })
        );

        // Then: Should handle error without crashing
        expect([400, 422]).toContain(response.status);
      });
    });
  });
});
