import { test, expect } from '@playwright/test';
import {
  createTestUser,
  TEST_PASSWORDS,
} from '../../packages/api-gateway/src/test-factories';

/**
 * API Performance Tests
 *
 * Performance tests to validate <100ms response time target for API endpoints.
 * Tests focus on critical authentication and project management endpoints.
 */

test.describe('API Performance - Load Testing', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const TARGET_RESPONSE_TIME = 100; // ms

  test.describe('Authentication Endpoints', () => {
    test('POST /api/auth/login - responds within 100ms', async ({
      request,
    }) => {
      // Setup: Create a user first
      const userData = createTestUser({
        password: TEST_PASSWORDS.VALID,
      });
      await request.post(`${baseURL}/api/auth/register`, { data: userData });

      // Performance test
      const startTime = Date.now();
      const response = await request.post(`${baseURL}/api/auth/login`, {
        data: {
          email: userData.email,
          password: TEST_PASSWORDS.VALID,
        },
      });
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      console.log(`Login response time: ${responseTime}ms`);
    });

    test('POST /api/auth/register - responds within 100ms', async ({
      request,
    }) => {
      const userData = createTestUser({
        password: TEST_PASSWORDS.SECURE,
      });

      const startTime = Date.now();
      const response = await request.post(`${baseURL}/api/auth/register`, {
        data: userData,
      });
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(201);
      expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      console.log(`Register response time: ${responseTime}ms`);
    });

    test('GET /api/auth/me - responds within 100ms with valid token', async ({
      request,
    }) => {
      // Setup: Create and login user
      const userData = createTestUser({
        password: TEST_PASSWORDS.VALID,
      });
      await request.post(`${baseURL}/api/auth/register`, { data: userData });

      const loginResponse = await request.post(`${baseURL}/api/auth/login`, {
        data: {
          email: userData.email,
          password: TEST_PASSWORDS.VALID,
        },
      });
      const loginResult = await loginResponse.json();

      // Performance test
      const startTime = Date.now();
      const response = await request.get(`${baseURL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginResult.token}`,
        },
      });
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      console.log(`Auth me response time: ${responseTime}ms`);
    });
  });

  test.describe('Error Handling Performance', () => {
    test('Invalid login error response within 100ms', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.post(`${baseURL}/api/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: TEST_PASSWORDS.WRONG,
        },
      });
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(401);
      expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      console.log(`Invalid login error response time: ${responseTime}ms`);
    });

    test('Missing authorization error response within 100ms', async ({
      request,
    }) => {
      const startTime = Date.now();
      const response = await request.get(`${baseURL}/api/auth/me`);
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(401);
      expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      console.log(`Missing auth error response time: ${responseTime}ms`);
    });

    test('Validation error response within 100ms', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.post(`${baseURL}/api/auth/register`, {
        data: {}, // Missing required fields
      });
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(400);
      expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      console.log(`Validation error response time: ${responseTime}ms`);
    });
  });

  test.describe('Health Check Performance', () => {
    test('GET /health - responds within 50ms (should be faster)', async ({
      request,
    }) => {
      const startTime = Date.now();
      const response = await request.get(`${baseURL}/health`);
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(50); // Health check should be faster
      console.log(`Health check response time: ${responseTime}ms`);
    });
  });

  test.describe('Concurrent Load Testing', () => {
    test('Multiple concurrent login requests - all within 100ms', async ({
      request,
    }) => {
      // Setup: Create a user
      const userData = createTestUser({
        password: TEST_PASSWORDS.VALID,
      });
      await request.post(`${baseURL}/api/auth/register`, { data: userData });

      // Create 5 concurrent login requests
      const createLoginRequest = async (): Promise<number> => {
        const startTime = Date.now();
        const response = await request.post(`${baseURL}/api/auth/login`, {
          data: {
            email: userData.email,
            password: TEST_PASSWORDS.VALID,
          },
        });
        const responseTime = Date.now() - startTime;

        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
        return responseTime;
      };

      const concurrentRequests = Array(5)
        .fill(null)
        .map(() => createLoginRequest());
      const responseTimes = await Promise.all(concurrentRequests);
      const averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;

      console.log(
        `Concurrent login response times: ${responseTimes.join(', ')}ms`
      );
      console.log(
        `Average concurrent login response time: ${averageResponseTime}ms`
      );
      expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME);
    });

    test('Multiple concurrent registration requests - all within 100ms', async ({
      request,
    }) => {
      // Create 5 concurrent registration requests with unique data
      const createRegistrationRequest = async (): Promise<number> => {
        const userData = createTestUser({
          password: TEST_PASSWORDS.VALID,
        });

        const startTime = Date.now();
        const response = await request.post(`${baseURL}/api/auth/register`, {
          data: userData,
        });
        const responseTime = Date.now() - startTime;

        expect(response.status()).toBe(201);
        expect(responseTime).toBeLessThan(TARGET_RESPONSE_TIME);
        return responseTime;
      };

      const concurrentRequests = Array(5)
        .fill(null)
        .map(() => createRegistrationRequest());
      const responseTimes = await Promise.all(concurrentRequests);
      const averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;

      console.log(
        `Concurrent registration response times: ${responseTimes.join(', ')}ms`
      );
      console.log(
        `Average concurrent registration response time: ${averageResponseTime}ms`
      );
      expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME);
    });
  });

  test.describe('Performance Under Load', () => {
    test('Sequential requests maintain <100ms average', async ({ request }) => {
      // Setup: Create a user
      const userData = createTestUser({
        password: TEST_PASSWORDS.VALID,
      });
      await request.post(`${baseURL}/api/auth/register`, { data: userData });

      // Create helper function for login requests
      const performLogin = async (): Promise<number> => {
        const startTime = Date.now();
        const response = await request.post(`${baseURL}/api/auth/login`, {
          data: {
            email: userData.email,
            password: TEST_PASSWORDS.VALID,
          },
        });
        const responseTime = Date.now() - startTime;

        expect(response.status()).toBe(200);
        return responseTime;
      };

      // Make 10 sequential login requests
      const responseTimes = [];
      for (let i = 0; i < 10; i++) {
        responseTimes.push(await performLogin());
      }

      const averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      console.log(
        `Sequential login response times: ${responseTimes.join(', ')}ms`
      );
      console.log(`Average sequential response time: ${averageResponseTime}ms`);
      console.log(`Max sequential response time: ${maxResponseTime}ms`);

      expect(averageResponseTime).toBeLessThan(TARGET_RESPONSE_TIME);
      expect(maxResponseTime).toBeLessThan(TARGET_RESPONSE_TIME * 1.5); // Allow some variance
    });
  });
});
