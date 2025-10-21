/**
 * Test Fixtures Index
 *
 * Main export file for all test fixtures and utilities.
 * Import this file to get access to all test fixtures.
 */

// Import the existing legacy fixtures for backward compatibility
import { test as legacyTest, expect } from '@playwright/test';

// Import the new Clean Architecture fixtures
export {
  test,
  expect,
  cleanArchitectureTestUtils,
  testWithData,
} from './clean-architecture.fixture';

// Export types for convenience
export type {
  TestUser,
  TestProject,
  TestVoice,
  TestAudioFile,
} from './clean-architecture.fixture';

// Export factories directly if needed
export * from '../factories/user.factory';
export * from '../factories/project.factory';
export * from '../factories/voice.factory';
export * from '../factories/audio-file.factory';

// Re-export legacy fixtures for backward compatibility
export { legacyTest as base };

/**
 * Combined fixtures that merge legacy and Clean Architecture fixtures
 * Use this when you need both the existing API testing infrastructure
 * and the new Clean Architecture test utilities.
 */
export const testWithLegacy = test.extend({
  // Legacy fixtures are available through the existing infrastructure
  // Clean Architecture fixtures are available through the new architecture
});

export default test;
