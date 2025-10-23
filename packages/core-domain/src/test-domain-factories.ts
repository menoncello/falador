/**
 * Domain Test Factories
 *
 * Factory functions for creating domain-compatible test data
 * following the TEA agent's recommendation to use factories in unit tests
 */

import { faker } from '@faker-js/faker';
import { User, Project } from './index';

// Type definitions based on domain interfaces
type UserTier = 'free' | 'pro' | 'enterprise';
type ProjectLanguage = 'pt-BR' | 'en';
type ProjectStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

// Constants to avoid magic numbers
const DEFAULT_PASSWORD_LENGTH = 32;
const DEFAULT_WORDS_COUNT = 3;
const DEFAULT_LANGUAGE: ProjectLanguage = 'pt-BR';
const DEFAULT_STATUS: ProjectStatus = 'draft';
const DEFAULT_PROJECT_WORDS = 2;
const FREE_USER_PROJECT_LIMIT = 3;
const PRO_USER_PROJECT_LIMIT = 10;

/**
 * Creates a domain User object with faker-generated data
 * @param overrides - Optional properties to override in the generated user
 * @returns Domain User object for testing
 */
export function createDomainUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    passwordHash: faker.string.alphanumeric(DEFAULT_PASSWORD_LENGTH),
    tier: 'free' as UserTier,
    createdAt: faker.date.past().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a domain Project object with faker-generated data
 * @param overrides - Optional properties to override in the generated project
 * @returns Domain Project object for testing
 */
export function createDomainProject(overrides: Partial<Project> = {}): Project {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.words(DEFAULT_WORDS_COUNT),
    author: faker.person.fullName(),
    language: DEFAULT_LANGUAGE,
    genre: faker.lorem.words(DEFAULT_PROJECT_WORDS),
    status: DEFAULT_STATUS,
    metadata: {},
    createdAt: faker.date.past().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a pro-tier user for testing tier-based limits
 * @param overrides - Optional properties to override
 * @returns Pro-tier domain User object
 */
export function createProUser(overrides: Partial<User> = {}): User {
  return createDomainUser({
    tier: 'pro' as UserTier,
    ...overrides,
  });
}

/**
 * Creates an enterprise-tier user for testing tier-based limits
 * @param overrides - Optional properties to override
 * @returns Enterprise-tier domain User object
 */
export function createEnterpriseUser(overrides: Partial<User> = {}): User {
  return createDomainUser({
    tier: 'enterprise' as UserTier,
    ...overrides,
  });
}

/**
 * Creates a completed project for testing status-based operations
 * @param overrides - Optional properties to override
 * @returns Completed domain Project object
 */
export function createCompletedProject(
  overrides: Partial<Project> = {}
): Project {
  return createDomainProject({
    status: 'completed' as ProjectStatus,
    ...overrides,
  });
}

/**
 * Creates a project with specific language for testing language-specific features
 * @param language - Target language
 * @param overrides - Optional properties to override
 * @returns Domain Project object with specified language
 */
export function createProjectWithLanguage(
  language: ProjectLanguage,
  overrides: Partial<Project> = {}
): Project {
  return createDomainProject({
    language,
    ...overrides,
  });
}

/**
 * Creates multiple projects for testing pagination and limits
 * @param userId - User ID to associate projects with
 * @param count - Number of projects to create
 * @param overrides - Optional properties to override in all projects
 * @returns Array of domain Project objects
 */
export function createMultipleProjects(
  userId: string,
  count: number,
  overrides: Partial<Project> = {}
): Project[] {
  return Array.from({ length: count }, (_, index) =>
    createDomainProject({
      userId,
      title: `Project ${index + 1}: ${faker.lorem.words(DEFAULT_WORDS_COUNT)}`,
      ...overrides,
    })
  );
}

/**
 * Creates a user with specific email for testing user-specific operations
 * @param email - Specific email address
 * @param overrides - Optional properties to override
 * @returns Domain User object with specified email
 */
export function createUserWithEmail(
  email: string,
  overrides: Partial<User> = {}
): User {
  return createDomainUser({
    email,
    ...overrides,
  });
}

/**
 * Creates test data specifically for testing business rules
 */
export const BusinessRuleTestData = {
  /**
   * Creates data for testing project limits
   */
  projectLimits: {
    freeUser: (): User => createDomainUser({ tier: 'free' as UserTier }),
    proUser: (): User => createProUser(),
    enterpriseUser: (): User => createEnterpriseUser(),
    projectsAtFreeLimit: (userId: string): Project[] =>
      createMultipleProjects(userId, FREE_USER_PROJECT_LIMIT), // Free user limit
    projectsAtProLimit: (userId: string): Project[] =>
      createMultipleProjects(userId, PRO_USER_PROJECT_LIMIT), // Pro user limit
  },

  /**
   * Creates data for testing project validation
   */
  projectValidation: {
    validProject: (userId: string): Project => createDomainProject({ userId }),
    projectWithoutTitle: (userId: string): Project =>
      createDomainProject({ userId, title: '' }),
    projectWithInvalidLanguage: (userId: string): Project =>
      createDomainProject({ userId, language: 'invalid' as ProjectLanguage }),
  },
};
