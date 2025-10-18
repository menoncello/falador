import { faker } from '@faker-js/faker';

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
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.internet.password({ length: 16 }),
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
  return {
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
    ...overrides,
  };
}

/**
 * Test passwords for authentication tests (static, deterministic)
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
