/**
 * Test Patterns and Constants for API Gateway Tests
 *
 * This file provides modern test patterns that should be used instead of
 * hardcoded constants. Prefer factory-generated data for better test isolation.
 */

import { createTestUser, createTestProject } from './test-factories';

/**
 * Factory-based test data generators
 * Use these instead of hardcoded constants
 */
export const TestData = {
  /**
   * Generate a test user with default or custom properties
   * @example TestData.user({ tier: 'pro' })
   */
  user: createTestUser,

  /**
   * Generate a test project with default or custom properties
   * @example TestData.project({ userId: 'custom-id' })
   */
  project: createTestProject,
};

/**
 * Common test scenarios using factories
 */
export const TestScenarios = {
  /**
   * Create a complete user registration scenario
   */
  userRegistration: () => ({
    user: TestData.user(),
    expectedStatus: 201,
    expectedFields: ['id', 'email', 'name', 'tier'],
  }),

  /**
   * Create a login scenario with valid credentials
   */
  userLogin: () => {
    const user = TestData.user();
    return {
      user,
      credentials: {
        email: user.email,
        password: user.password,
      },
      expectedToken: true,
    };
  },

  /**
   * Create a project management scenario
   */
  projectManagement: () => {
    const user = TestData.user();
    const project = TestData.project({ userId: user.id });
    return {
      user,
      project,
      operations: ['create', 'read', 'update', 'delete'],
    };
  },
};

/**
 * Resilient test identifiers for when UI is implemented
 * Use these instead of CSS selectors
 */
export const TestSelectors = {
  // Authentication
  emailInput: 'email-input',
  passwordInput: 'password-input',
  loginButton: 'login-button',
  registerButton: 'register-button',
  logoutButton: 'logout-button',

  // User Management
  userMenu: 'user-menu',
  profileLink: 'profile-link',
  settingsLink: 'settings-link',

  // Project Management
  projectTitle: 'project-title',
  projectAuthor: 'project-author',
  createProjectButton: 'create-project-button',
  saveProjectButton: 'save-project-button',
  deleteProjectButton: 'delete-project-button',

  // Audio Generation
  uploadTextButton: 'upload-text-button',
  generateAudioButton: 'generate-audio-button',
  audioPlayer: 'audio-player',
  downloadButton: 'download-button',

  // Status and Feedback
  loadingSpinner: 'loading-spinner',
  errorMessage: 'error-message',
  successMessage: 'success-message',
  validationError: 'validation-error',
};

/**
 * Network-first testing patterns
 */
export const NetworkPatterns = {
  /**
   * Setup response monitoring before request
   * @param page Playwright page object
   * @param endpoint API endpoint to monitor
   */
  setupResponseMonitoring: async (page: any, endpoint: string) => {
    return page.waitForResponse(`**${endpoint}`);
  },

  /**
   * Mock API response for testing
   * @param page Playwright page object
   * @param endpoint API endpoint to mock
   * @param response Mock response data
   */
  mockApiResponse: async (page: any, endpoint: string, response: any) => {
    await page.route(`**${endpoint}`, (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  },

  /**
   * Wait for network response before assertions
   * @param responsePromise Promise from setupResponseMonitoring
   */
  waitForNetwork: async (responsePromise: Promise<any>) => {
    return await responsePromise;
  },
};

/**
 * Assertion helpers for common test scenarios
 */
export const TestAssertions = {
  /**
   * Assert user object has expected structure
   * @param user
   */
  userStructure: (user: any) => {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('tier');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  },

  /**
   * Assert project object has expected structure
   * @param project
   */
  projectStructure: (project: any) => {
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('userId');
    expect(project).toHaveProperty('title');
    expect(project).toHaveProperty('status');
    expect(project).toHaveProperty('createdAt');
    expect(project).toHaveProperty('updatedAt');
  },

  /**
   * Assert JWT token has valid structure
   * @param token
   */
  jwtStructure: (token: string) => {
    expect(token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
    const parts = token.split('.');
    expect(parts).toHaveLength(3);

    // Verify header
    const header = JSON.parse(atob(parts[0]));
    expect(header).toHaveProperty('alg');
    expect(header).toHaveProperty('typ');

    // Verify payload
    const payload = JSON.parse(atob(parts[1]));
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
  },

  /**
   * Assert error response has expected structure
   * @param response
   * @param expectedStatus
   */
  errorStructure: (response: any, expectedStatus: number) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toHaveProperty('error');
    expect(typeof response.data.error).toBe('string');
  },
};

/**
 * Test data cleanup helpers
 */
export const TestCleanup = {
  /**
   * Create cleanup function for test data
   * @param cleanupFunction Function to call for cleanup
   */
  createCleanupTask: (cleanupFunction: () => Promise<void>) => {
    return cleanupFunction;
  },

  /**
   * Execute multiple cleanup tasks
   * @param cleanupTasks Array of cleanup functions
   */
  executeCleanup: async (cleanupTasks: Array<() => Promise<void>>) => {
    for (const cleanup of cleanupTasks) {
      try {
        await cleanup();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
  },
};

/**
 * Default test configurations
 */
export const TestConfig = {
  /**
   * Default timeouts for different operations
   */
  timeouts: {
    network: 30000,
    navigation: 15000,
    assertion: 5000,
    short: 1000,
  },

  /**
   * Default retry configurations
   */
  retries: {
    network: 2,
    flaky: 3,
  },

  /**
   * Test user configurations
   */
  users: {
    free: () => TestData.user({ tier: 'free' }),
    pro: () => TestData.user({ tier: 'pro' }),
    enterprise: () => TestData.user({ tier: 'enterprise' }),
  },
};

/**
 * Example usage patterns
 */

// ✅ GOOD: Factory-based test data
export const ExampleTests = {
  userRegistration: `// Example: User registration with factory
const userData = TestData.user({ tier: 'pro' });
const response = await request.post('/api/auth/register', { data: userData });
expect(response.status()).toBe(201);
TestAssertions.userStructure(await response.json());`,

  networkFirstTesting: `// Example: Network-first testing
const responsePromise = NetworkPatterns.setupResponseMonitoring(page, '/api/auth/login');
await page.getByTestId(TestSelectors.emailInput).fill(user.email);
await page.getByTestId(TestSelectors.passwordInput).fill(user.password);
await page.getByTestId(TestSelectors.loginButton).click();
const response = await NetworkPatterns.waitForNetwork(responsePromise);
TestAssertions.jwtStructure(response.token);`,

  resilientSelectors: `// Example: Resilient selectors
await page.getByTestId(TestSelectors.emailInput).fill('user@example.com');
await page.getByTestId(TestSelectors.passwordInput).fill('password123');
await page.getByTestId(TestSelectors.loginButton).click();
// Alternative: await page.getByRole('button', { name: 'Login' }).click();`,
};
