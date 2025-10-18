import { defineConfig, devices } from '@playwright/test';

// Test timeout constants (in milliseconds)
const CI_RETRY_COUNT = 2;
const CI_WORKER_COUNT = 2;
const TEST_TIMEOUT_SECONDS = 60;
const EXPECT_TIMEOUT_SECONDS = 15;
const ACTION_TIMEOUT_SECONDS = 15;
const NAVIGATION_TIMEOUT_SECONDS = 30;
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Playwright configuration for Falador audiobook platform
 *
 * This configuration supports:
 * - API testing (REST endpoints)
 * - E2E testing (CLI workflows)
 * - Integration testing (Database, Queue, TTS)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const playwrightConfig = defineConfig({
  testDir: './tests',

  // Run tests in parallel for faster execution
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only to handle flakiness
  retries: process.env.CI ? CI_RETRY_COUNT : 0,

  // Limit workers on CI to avoid resource exhaustion
  workers: process.env.CI ? CI_WORKER_COUNT : undefined,

  // Test timeout: 60 seconds (TTS processing can be slow)
  timeout: TEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND,

  // Assertion timeout: 15 seconds
  expect: {
    timeout: EXPECT_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND,
  },

  // Shared settings for all tests
  use: {
    // Base URL for API tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on failure for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure only
    screenshot: 'only-on-failure',

    // Video on failure only (saves storage)
    video: 'retain-on-failure',

    // Action timeout: 15 seconds
    actionTimeout: ACTION_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND,

    // Navigation timeout: 30 seconds
    navigationTimeout: NAVIGATION_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND,
  },

  // Test reporters
  reporter: [
    // HTML report for local viewing
    ['html', { outputFolder: 'test-results/html' }],

    // JUnit XML for CI integration
    ['junit', { outputFile: 'test-results/junit.xml' }],

    // List reporter for console output
    ['list'],
  ],

  // Project configuration
  // Note: For backend API testing, we primarily use 'api' project
  // Chromium is included for future web UI testing
  projects: [
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        // API tests don't need a browser
      },
    },
    {
      name: 'e2e',
      testMatch: '**/e2e/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/artifacts',

  // Global setup/teardown (if needed)
  // globalSetup: require.resolve('./tests/support/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/support/global-teardown.ts'),
});

export default playwrightConfig;
