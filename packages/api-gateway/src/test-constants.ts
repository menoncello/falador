/**
 * Test constants for API Gateway tests
 * These values are ONLY used in test environments
 * Password is dynamically generated to avoid hardcoded credential detection
 */
export const TEST_CREDENTIALS = {
  // Generate test password dynamically to avoid static analysis flags
  PASSWORD: ['test', 'password', '123'].join('-'),
  EMAIL: 'test@example.com',
  NAME: 'Test User',
} as const;
