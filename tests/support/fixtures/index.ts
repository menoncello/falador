import { test as base } from '@playwright/test';
import { ProjectFactory } from './factories/project-factory';
import { UserFactory } from './factories/user-factory';
import { setupMockApi, shouldUseMockMode } from '../mock-api-server';
import { baseTest, TestScenarios } from './base/base-fixture';

/**
 * Extended Playwright test fixtures with auto-cleanup
 *
 * This fixture architecture follows best practices:
 * - Pure function → fixture → mergeTests composition
 * - Auto-cleanup (all created data is deleted after test)
 * - Type-safe fixtures
 * - Composable (fixtures can depend on other fixtures)
 *
 * @example
 * import { test, expect } from './fixtures';
 *
 * test('should create user', async ({ userFactory }) => {
 *   const user = await userFactory.createUser();
 *   expect(user.email).toBeDefined();
 *   // No manual cleanup needed - fixture handles it automatically
 * });
 */

interface TestFixtures {
  userFactory: UserFactory;
  projectFactory: ProjectFactory;
  apiKey: string;
  apiUser: { id: string; email: string; password: string }; // User associated with apiKey
  testScenarios: typeof TestScenarios;
}

// Auto-enable mock mode if environment variable is set
const testWithMock = base.extend<TestFixtures>({
  // Setup mock mode before any test fixtures
  page: [async ({ page }, use) => {
    if (shouldUseMockMode()) {
      await setupMockApi(page);
    }
    await use(page);
  }, { scope: 'test' }],
});

// Create mock API context for tests
const createMockApiRequestContext = (page: any) => {
  return {
    post: async (url: string, options?: any) => {
      const response = await page.evaluate(async ({ apiUrl, requestOptions }) => {
        const response = await fetch(apiUrl, {
          method: 'POST',
          ...requestOptions,
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions?.headers,
          },
        });

        const body = await response.text();
        return {
          status: response.status,
          ok: response.ok,
          text: () => body,
          json: () => JSON.parse(body),
        };
      }, { apiUrl: url, requestOptions: options });

      return response;
    },
    get: async (url: string, options?: any) => {
      const response = await page.evaluate(async ({ apiUrl, requestOptions }) => {
        const response = await fetch(apiUrl, {
          method: 'GET',
          ...requestOptions,
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions?.headers,
          },
        });

        const body = await response.text();
        return {
          status: response.status,
          ok: response.ok,
          text: () => body,
          json: () => JSON.parse(body),
        };
      }, { apiUrl: url, requestOptions: options });

      return response;
    },
  };
};

export const test = testWithMock.extend<TestFixtures>({
  /**
   * User factory fixture
   * Creates test users with automatic cleanup
   */
  userFactory: async ({ request, page }, use) => {
    const factory = new UserFactory(request, page);
    await use(factory);
    await factory.cleanup();
  },

  /**
   * API user fixture
   * Provides a user object with credentials for API testing
   */
  apiUser: async ({ userFactory }, use) => {
    const user = await userFactory.createUser();
    await use({
      id: user.id,
      email: user.email,
      password: user.password ?? '',
    });
    // Cleanup handled by userFactory fixture
  },

  /**
   * API key fixture
   * Provides a valid API key for authenticated requests
   * Creates a test user and generates an API key automatically
   */
  apiKey: async ({ apiUser, userFactory }, use) => {
    const token = await userFactory.login(apiUser.email, apiUser.password);
    await use(token);
    // Cleanup handled by userFactory fixture
  },

  /**
   * Project factory fixture
   * Creates test projects with automatic cleanup
   * Automatically uses the apiUser's authentication
   */
  projectFactory: async ({ request, userFactory, apiUser, apiKey }, use) => {
    const factory = new ProjectFactory(request, userFactory);
    // Set default auth to use the same user as apiKey fixture
    factory.setDefaultAuth(apiKey, apiUser.id);
    await use(factory);
    await factory.cleanup();
  },

  /**
   * Test scenarios fixture
   * Provides common test scenarios with DRY patterns
   */
  testScenarios: async ({ request }, use) => {
    await use(TestScenarios);
  },
});

export { expect } from '@playwright/test';
