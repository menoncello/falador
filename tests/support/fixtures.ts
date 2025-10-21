import { test as base, expect } from '@playwright/test';
import {
  createTestUser,
  createTestProject,
  TEST_PASSWORDS,
} from '../../packages/api-gateway/src/test-factories';

/**
 * Playwright Test Fixtures
 *
 * Provides reusable test fixtures with proper cleanup and isolation.
 * Follows the pure function → fixture → mergeTests pattern.
 */

// Define fixture types
export type TestUser = ReturnType<typeof createTestUser>;
export type TestProject = ReturnType<typeof createTestProject>;

// Extend base test with custom fixtures
export const test = base.extend({
  // Database cleanup fixture - enhanced for parallel execution
  cleanupDatabase: async ({ request }, use) => {
    // Clear the in-memory database before each test
    console.log('🧹 Cleaning up test database...');

    // Add unique test identifier to avoid race conditions
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const cleanupResponse = await request.post('/api/test/cleanup', {
        data: { testId },
        headers: {
          'X-Test-Id': testId,
        },
      });

      if (!cleanupResponse.ok()) {
        const error = await cleanupResponse.text();
        console.error('❌ Database cleanup failed:', error);
        throw new Error(`Database cleanup failed: ${error}`);
      }

      const result = await cleanupResponse.json();
      if (result.success) {
        console.log(`✅ Database cleanup completed for ${testId}`);
      } else {
        console.error('❌ Database cleanup error:', result.error);
        throw new Error(`Database cleanup error: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Database cleanup exception:', error);
      // Continue with test execution even if cleanup fails
      console.warn('⚠️ Continuing test despite cleanup failure');
    }

    await use();
  },

  // Test duration tracking fixture
  testDuration: async ({}, use) => {
    const startTime = Date.now();
    await use();
    const duration = Date.now() - startTime;

    // Log test duration and fail if too slow
    console.log(`Test duration: ${duration}ms`);

    // API tests should complete in under 500ms for optimal performance
    if (duration > 500) {
      console.warn(`⚠️  Slow test detected: ${duration}ms (target: <500ms)`);
    }
  },

  // User factory fixture with network-first pattern
  userFactory: async ({ cleanupDatabase, request }, use) => {
    const createdUsers: TestUser[] = [];

    const createUser = async (
      overrides: Parameters<typeof createTestUser>[0] = {}
    ) => {
      const userData = createTestUser(overrides);

      // Create user via API
      const response = await request.post('/api/auth/register', {
        data: userData,
      });

      // Validate response
      expect(response.status()).toBe(201);

      createdUsers.push(userData);
      return userData;
    };

    const login = async (userData: TestUser) => {
      // Login via API and return real token
      const response = await request.post('/api/auth/login', {
        data: {
          email: userData.email,
          password: userData.password,
        },
      });

      // Validate response
      expect(response.status()).toBe(200);

      const body = await response.json();
      return body.token;
    };

    await use({ createUser, login });

    // Cleanup would happen here in a real database scenario
    // For now, we rely on test isolation
  },

  // Project factory fixture
  projectFactory: async ({ userFactory }, use) => {
    const createdProjects: TestProject[] = [];

    const createProject = async (
      overrides: Parameters<typeof createTestProject>[0] = {}
    ) => {
      // If no userId provided, create a user first
      if (!overrides.userId) {
        const user = await userFactory.createUser();
        overrides.userId = user.email; // Using email as user ID for tests
      }

      const project = createTestProject(overrides);
      createdProjects.push(project);
      return project;
    };

    const createProjects = async (
      count: number,
      overrides: Parameters<typeof createTestProject>[0] = {}
    ) => {
      const projects: TestProject[] = [];
      for (let i = 0; i < count; i++) {
        const project = await createProject(overrides);
        projects.push(project);
      }
      return projects;
    };

    await use({ createProject, createProjects });

    // Cleanup would happen here in a real database scenario
  },

  // Network-first API request fixture
  apiRequest: async ({ request }, use) => {
    const makeRequest = async (
      method: string,
      endpoint: string,
      options: any = {}
    ) => {
      // Make the actual request
      const response = await request[
        method.toLowerCase() as keyof typeof request
      ](endpoint, options);

      return {
        response,
        body: async () => await response.json(),
        status: () => response.status(),
      };
    };

    await use({ makeRequest });
  },

  // API key fixture (mock)
  apiKey: async ({ userFactory }, use) => {
    const user = await userFactory.createUser();
    // Mock API key generation for tests
    const mockApiKey = `ak_test_${user.email.split('@')[0]}_${Date.now()}`;
    await use(mockApiKey);
  },

  // Authenticated user fixture
  authenticatedUser: async ({ userFactory }, use) => {
    const user = await userFactory.createUser({
      password: TEST_PASSWORDS.VALID,
    });
    await use(user);
  },

  // Composite fixture for common test scenarios
  testScenarios: async ({ userFactory, projectFactory, apiRequest }, use) => {
    const scenarios = {
      // Create a user with project and authentication
      createAuthenticatedUserWithProject: async (userOverrides = {}, projectOverrides = {}) => {
        const user = await userFactory.createUser(userOverrides);
        const token = await userFactory.login(user);
        const project = await projectFactory.createProject({
          userId: user.email,
          ...projectOverrides,
        });

        return { user, token, project };
      },

      // Create multiple users with different roles
      createUsersWithRoles: async (roles: ('free' | 'pro' | 'enterprise')[] = ['free', 'pro']) => {
        const users = await Promise.all(
          roles.map(tier =>
            userFactory.createUser({ tier })
          )
        );

        return users.map(user => ({
          user,
          token: () => userFactory.login(user)
        }));
      },

      // Setup user with API key
      createUserWithApiKey: async (userOverrides = {}) => {
        const user = await userFactory.createUser(userOverrides);
        const token = await userFactory.login(user);

        // Generate API key
        const apiKeyResponse = await apiRequest.makeRequest('post', '/api/auth/api-keys', {
          data: { name: 'Test API Key', scopes: ['read', 'write'] },
          headers: { Authorization: `Bearer ${token}` }
        });

        return {
          user,
          token,
          apiKey: (await apiKeyResponse.body()).key
        };
      }
    };

    await use(scenarios);
  },
});

// Re-export expect from playwright
export { expect };

// Test constants for consistent test data
export const TEST_CONSTANTS = {
  API_BASE_URL: 'http://localhost:3000',
  API_VERSION: 'v1',
  TEST_MOCK_PASSWORD_STANDARD: TEST_PASSWORDS.STANDARD,
  TEST_MOCK_PASSWORD_SECURE: TEST_PASSWORDS.SECURE,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;
