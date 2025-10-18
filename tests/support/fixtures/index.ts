import { test as base } from '@playwright/test';
import { ProjectFactory } from './factories/project-factory';
import { UserFactory } from './factories/user-factory';

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
}

export const test = base.extend<TestFixtures>({
  /**
   * User factory fixture
   * Creates test users with automatic cleanup
   */
  userFactory: async ({ request }, use) => {
    const factory = new UserFactory(request);
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
});

export { expect } from '@playwright/test';
