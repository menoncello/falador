/**
 * Test Data Factories
 *
 * Factory functions for creating test data with proper validation
 */

import { faker } from '@faker-js/faker';

// Constants for test data
const TEST_PASSWORD_LENGTH = 16;
const TEST_PASSWORDS_COUNT = 7;

// Constants for test data generation
const DEFAULT_TITLE_WORD_COUNT = 3;
const DEFAULT_GENRE_WORD_COUNT = 2;

// Type aliases
type UserTier = 'free' | 'pro' | 'enterprise';
type ProjectLanguage = 'pt-BR' | 'en';
type ProjectStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

// Factory data types
export interface UserFactoryData {
  email: string;
  name: string;
  password: string;
  tier: UserTier;
}

export interface ProjectFactoryData {
  userId: string;
  title: string;
  author?: string | null;
  language: ProjectLanguage;
  genre?: string | null;
  status: ProjectStatus;
  metadata?: Record<string, unknown>;
}

// Validation helpers
/**
 *
 * @param email
 */
function validateEmail(email: unknown): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  if (!email.includes('@')) {
    throw new Error('Email must contain @ symbol');
  }

  return email;
}

/**
 *
 * @param name
 */
function validateName(name: unknown): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string');
  }

  if (name.length === 0) {
    throw new Error('Name cannot be empty');
  }

  return name;
}

/**
 *
 * @param password
 */
function validatePassword(password: unknown): string {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length !== TEST_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be exactly ${TEST_PASSWORD_LENGTH} characters`
    );
  }

  return password;
}

/**
 *
 * @param tier
 */
function validateTier(tier: unknown): UserTier {
  const validTiers: UserTier[] = ['free', 'pro', 'enterprise'];
  if (!validTiers.includes(tier as UserTier)) {
    throw new Error('Tier must be one of: free, pro, enterprise');
  }

  return tier as UserTier;
}

/**
 *
 * @param value
 * @param fieldName
 */
function validateStringField(value: unknown, fieldName: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  if (value.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  return value;
}

/**
 *
 * @param author
 */
function validateAuthorField(author: unknown): void {
  if (author !== null) {
    validateStringField(author, 'Author');
  }
}

/**
 *
 * @param language
 */
function validateLanguage(language: ProjectLanguage): void {
  const validLanguages: ProjectLanguage[] = ['pt-BR', 'en'];
  if (!validLanguages.includes(language)) {
    throw new Error('Language must be one of: pt-BR, en');
  }
}

/**
 *
 * @param data
 */
function validateProjectData(data: ProjectFactoryData): void {
  validateStringField(data.userId, 'User ID');
  validateStringField(data.title, 'Title');
  validateAuthorField(data.author);
  validateLanguage(data.language);
}

/**
 * Creates test user data with validation
 * @param overrides - Optional overrides for user data
 * @returns Complete user data with all required fields
 */
export function createTestUser(
  overrides: Partial<UserFactoryData> = {}
): Required<UserFactoryData> {
  const userData = {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.internet.password({ length: TEST_PASSWORD_LENGTH }),
    tier: 'free' as UserTier,
    ...overrides,
  };

  return {
    email: validateEmail(userData.email),
    name: validateName(userData.name),
    password: validatePassword(userData.password),
    tier: validateTier(userData.tier),
  };
}

/**
 * Creates test project data with validation
 * @param overrides - Optional overrides for project data
 * @returns Complete project data with all required fields
 */
export function createTestProject(
  overrides: Partial<ProjectFactoryData> = {}
): Required<ProjectFactoryData> {
  const projectData = {
    userId: faker.string.uuid(),
    title: faker.lorem.words(DEFAULT_TITLE_WORD_COUNT),
    author: faker.person.fullName(),
    language: 'pt-BR' as ProjectLanguage,
    genre: faker.lorem.words(DEFAULT_GENRE_WORD_COUNT),
    status: 'draft' as ProjectStatus,
    metadata: {},
    ...overrides,
  };

  validateProjectData(projectData);

  return {
    userId: projectData.userId,
    title: projectData.title,
    author: projectData.author || null,
    language: projectData.language,
    genre: projectData.genre || null,
    status: projectData.status,
    metadata: projectData.metadata || {},
  };
}

/**
 * Test passwords for authentication tests (static, deterministic)
 */
export const TEST_PASSWORDS = {
  VALID_USER: 'valid1234567890ab',
  VALID_PRO: 'pro1234567890abcd',
  VALID_ENTERPRISE: 'enterprise1234567',
  ADMIN: 'admin1234567890ab',
  INVALID: 'invalid123456',
  SHORT: 'short',
  EMPTY: '',
} as const;

// Validate TEST_PASSWORDS at module load to catch mutants
(() => {
  const passwords = Object.values(TEST_PASSWORDS);

  if (passwords.length !== TEST_PASSWORDS_COUNT) {
    throw new Error(
      `TEST_PASSWORDS must contain exactly ${TEST_PASSWORDS_COUNT} passwords`
    );
  }

  const uniquePasswords = [...new Set(passwords)];
  if (uniquePasswords.length !== passwords.length) {
    throw new Error('All TEST_PASSWORDS must be unique');
  }

  for (const [key, password] of Object.entries(TEST_PASSWORDS)) {
    if (
      password === null ||
      password === undefined ||
      typeof password !== 'string'
    ) {
      throw new Error(`TEST_PASSWORDS.${key} must be a string`);
    }

    // Allow empty passwords only for explicitly named test cases
    if (password.length === 0 && !key.includes('EMPTY')) {
      throw new Error(
        `TEST_PASSWORDS.${key} cannot be empty (use EMPTY suffix for empty test passwords)`
      );
    }
  }
})();

/**
 * Test API keys for testing API authentication
 */
export const TEST_API_KEYS = {
  VALID: 'test-api-key-123456789',
  INVALID: 'invalid-key',
  EXPIRED: 'expired-key-123456',
  EMPTY: '',
} as const;

/**
 * Test project data for comprehensive testing
 */
export const TEST_PROJECTS = {
  BASIC: {
    userId: 'test-user-1',
    title: 'Test Project',
    author: 'Test Author',
    language: 'pt-BR' as const,
    genre: 'Fiction',
    status: 'draft' as const,
    metadata: {},
  },
  EMPTY_AUTHOR: {
    userId: 'test-user-2',
    title: 'Project Without Author',
    author: null,
    language: 'en' as const,
    genre: 'Non-Fiction',
    status: 'processing' as const,
    metadata: { tags: ['business'] },
  },
  COMPLETED: {
    userId: 'test-user-3',
    title: 'Completed Project',
    author: 'Completion Author',
    language: 'pt-BR' as const,
    genre: 'Science Fiction',
    status: 'completed' as const,
    metadata: { duration: 3600 },
  },
} as const;
