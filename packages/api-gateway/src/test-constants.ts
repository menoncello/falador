/**
 * Test constants for API Gateway tests
 *
 * NOTE: These constants are deprecated and should be replaced with factory-generated data.
 * Use createTestUser() from test-factories.ts instead.
 *
 * These values are ONLY used in test environments and will be removed in future versions.
 */
export const LEGACY_TEST_CREDENTIALS = {
  // Deprecated: Use createTestUser() instead
  PASSWORD: 'TestPassword123!',
  EMAIL: 'test@example.com',
  NAME: 'Test User',
} as const;

/**
 * Backward compatibility alias - DO NOT USE IN NEW TESTS
 * @deprecated Use createTestUser() from test-factories.ts instead
 */
export const TEST_CREDENTIALS = LEGACY_TEST_CREDENTIALS;
