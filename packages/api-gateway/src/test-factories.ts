import { faker } from '@faker-js/faker';

// Constants for magic numbers
const RANDOM_SUFFIX_BASE = 36;
const CRYPTO_SUFFIX_BYTES = 4;

/**
 * Test Data Factories
 *
 * Factory functions for generating test data with faker.
 * Provides realistic, unique data for each test run.
 */

export interface UserFactoryData {
  email?: string;
  name?: string;
  password?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface ProjectFactoryData {
  userId?: string;
  title?: string;
  author?: string | null;
  language?: string;
  genre?: string | null;
  status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

/**
 * Create test user data with realistic values
 * @param overrides - Optional partial user data to override defaults
 * @returns Complete user data with all required fields
 */
export function createTestUser(
  overrides: UserFactoryData = {}
): Required<UserFactoryData> {
  // Use deterministic timestamp for reproducible tests
  const timestamp = TEST_TIMES.BASE_TIMESTAMP;
  const cryptoSuffix = crypto
    .getRandomValues(new Uint8Array(CRYPTO_SUFFIX_BYTES))
    .join('');
  const randomSuffix = (Date.now() - timestamp).toString(RANDOM_SUFFIX_BASE);
  const uniqueId = `${timestamp}-${randomSuffix}-${cryptoSuffix}`;

  return {
    email: `test-${uniqueId}@example.com`,
    name: faker.person.fullName(),
    password: overrides.password || `${TEST_PASSWORDS.VALID}${uniqueId}`, // Unique password by default
    tier: 'free',
    ...overrides,
  } as Required<UserFactoryData>;
}

/**
 * Create test project data with realistic values
 * @param overrides - Optional partial project data to override defaults
 * @returns Complete project data with generated test values
 */
export function createTestProject(
  overrides: ProjectFactoryData = {}
): ProjectFactoryData {
  const baseProject = {
    userId: faker.string.uuid(),
    title: faker.commerce.productName(),
    author: faker.person.fullName(),
    language: 'pt-BR',
    genre: faker.helpers.arrayElement([
      'Fiction',
      'Non-Fiction',
      'Technical',
      'Biography',
    ]),
    status: 'draft',
    metadata: {},
  };

  return {
    ...baseProject,
    ...overrides,
    metadata: overrides.metadata
      ? { ...overrides.metadata }
      : baseProject.metadata,
  };
}

/**
 * Test passwords for authentication tests (static, deterministic)
 * All passwords meet the complexity requirements:
 * - At least 12 characters
 * - Contains lowercase letters
 * - Contains uppercase letters
 * - Contains numbers
 * - Contains special characters
 */
export const TEST_PASSWORDS = {
  VALID: 'ValidPassword123!',
  CORRECT: 'CorrectPassword123!',
  WRONG: 'WrongPassword456!',
  INVALID: 'InvalidPassword789!',
  SECURE: 'SecurePassword123!',
  STANDARD: 'StandardPassword123!',
  GENERIC: 'GenericPassword123!',
} as const;

/**
 * Test time constants for deterministic time-based tests
 */
export const TEST_TIMES = {
  /** One second in milliseconds */
  ONE_SECOND_MS: 1000,
  /** One millisecond */
  ONE_MS: 1,
  /** One hour in milliseconds */
  ONE_HOUR_MS: 3600000,
  /** Fixed base timestamp for reproducible tests */
  BASE_TIMESTAMP: 1609459200000, // 2021-01-01 00:00:00 UTC
} as const;

/**
 * Test date utilities for deterministic date generation
 */
export const TestDates = {
  /**
   * Create a deterministic date in the past
   * @param ms - Milliseconds to subtract from base timestamp
   * @returns ISO string of the past date
   */
  past: (ms: number): string =>
    new Date(TEST_TIMES.BASE_TIMESTAMP - ms).toISOString(),

  /**
   * Create a deterministic date in the future
   * @param ms - Milliseconds to add to base timestamp
   * @returns ISO string of the future date
   */
  future: (ms: number): string =>
    new Date(TEST_TIMES.BASE_TIMESTAMP + ms).toISOString(),

  /**
   * Create a deterministic current time
   * @returns ISO string of the base timestamp
   */
  now: (): string => new Date(TEST_TIMES.BASE_TIMESTAMP).toISOString(),
} as const;
