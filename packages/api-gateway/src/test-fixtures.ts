import { db } from './database';
import { createTestUser, createTestProject, TEST_PASSWORDS } from './test-factories';

/**
 * Test fixtures for common authentication and request patterns
 *
 * These fixtures provide reusable test setup utilities to reduce duplication
 * and ensure consistent authentication patterns across tests.
 */

export interface AuthenticatedUser {
  user: ReturnType<typeof db.createUser>;
  token: string;
}

/**
 * Create an authenticated user with a valid session token
 * @param userData - Optional user data overrides
 * @returns Authenticated user object with user data and token
 */
export function createAuthenticatedUser(userData?: Parameters<typeof createTestUser>[0]): AuthenticatedUser {
  const testUser = createTestUser(userData);

  const user = db.createUser({
    email: testUser.email,
    name: testUser.name,
    password: testUser.password,
    tier: testUser.tier,
  });

  const token = db.createSession(user.id);

  return { user, token };
}

/**
 * Create an authenticated HTTP request with proper headers
 * @param url - Request URL
 * @param method - HTTP method
 * @param token - Authentication token
 * @param body - Optional request body
 * @returns Configured Request object
 */
export function createAuthenticatedRequest(
  url: string,
  method: string,
  token: string,
  body?: Record<string, unknown>
): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create a user with specific tier for testing tier-based functionality
 * @param tier - User tier ('free', 'pro', 'enterprise')
 * @returns Authenticated user with specified tier
 */
export function createAuthenticatedUserWithTier(tier: 'free' | 'pro' | 'enterprise'): AuthenticatedUser {
  return createAuthenticatedUser({ tier });
}

/**
 * Create multiple authenticated users for testing multi-user scenarios
 * @param count - Number of users to create
 * @param userDataPrefix - Optional prefix for user data to ensure uniqueness
 * @returns Array of authenticated users
 */
export function createMultipleAuthenticatedUsers(
  count: number,
  userDataPrefix: string = 'test'
): AuthenticatedUser[] {
  const users: AuthenticatedUser[] = [];

  for (let i = 0; i < count; i++) {
    users.push(createAuthenticatedUser({
      email: `${userDataPrefix}-${i + 1}@example.com`,
      name: `${userDataPrefix.charAt(0).toUpperCase() + userDataPrefix.slice(1)} User ${i + 1}`,
    }));
  }

  return users;
}

/**
 * Create a project for a specific user with optional project data
 * @param userId - User ID to associate the project with
 * @param projectData - Optional project data overrides
 * @returns Created project
 */
export function createProjectForUser(
  userId: string,
  projectData?: Parameters<typeof createTestProject>[0]
): ReturnType<typeof db.createProject> {
  const testProject = createTestProject({ userId, ...projectData });

  return db.createProject({
    userId: testProject.userId,
    title: testProject.title,
    author: testProject.author,
    language: testProject.language,
    genre: testProject.genre,
    status: testProject.status,
    metadata: testProject.metadata,
  });
}

/**
 * Fixture for creating a complete authentication setup with user and projects
 * @param projectCount - Number of projects to create for the user
 * @returns Authenticated user with projects
 */
export function createAuthenticatedUserWithProjects(projectCount: number = 1): {
  authenticatedUser: AuthenticatedUser;
  projects: ReturnType<typeof db.createProject>[];
} {
  const authenticatedUser = createAuthenticatedUser();
  const projects: ReturnType<typeof db.createProject>[] = [];

  for (let i = 0; i < projectCount; i++) {
    const project = createProjectForUser(authenticatedUser.user.id, {
      title: `Test Project ${i + 1}`,
      author: `Test Author ${i + 1}`,
    });
    projects.push(project);
  }

  return { authenticatedUser, projects };
}

/**
 * Create API key fixture for testing API key functionality
 * @param userId - User ID to create API key for
 * @param keyData - Optional API key data overrides
 * @returns Created API key
 */
export function createApiKeyForUser(
  userId: string,
  keyData?: { name?: string; scopes?: string[] }
): ReturnType<typeof db.createApiKey> {
  return db.createApiKey({
    userId,
    name: keyData?.name || 'Test API Key',
    scopes: keyData?.scopes || ['read', 'write'],
  });
}

/**
 * Fixture for testing invalid authentication scenarios
 * @returns Object with various invalid authentication tokens
 */
export const InvalidAuthFixtures = {
  /** Empty token */
  empty: '',
  /** Malformed token (no Bearer prefix) */
  malformed: 'invalid-token-format',
  /** Non-existent token */
  nonExistent: 'non-existent-token',
  /** Null token */
  null: null as unknown as string,
  /** Undefined token */
  undefined: undefined as unknown as string,
} as const;

/**
 * Network-first testing utilities for edge cases
 * These utilities help test network-related scenarios and error conditions
 */
export const NetworkFixtures = {
  /**
   * Create a request that simulates a timeout scenario
   * @param url - Request URL
   * @param token - Authentication token
   * @returns Request configured for timeout testing
   */
  createTimeoutRequest: (url: string, token: string): Request =>
    new Request(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Test-Timeout': 'true',
      },
    }),

  /**
   * Create a request that simulates a network error
   * @param url - Request URL
   * @param token - Authentication token
   * @returns Request configured for network error testing
   */
  createNetworkErrorRequest: (url: string, token: string): Request =>
    new Request(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Test-Network-Error': 'true',
      },
    }),

  /**
   * Create a request with malformed JSON for testing parsing errors
   * @param url - Request URL
   * @param token - Authentication token
   * @returns Request with malformed JSON body
   */
  createMalformedJsonRequest: (url: string, token: string): Request =>
    new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: '{ malformed json }',
    }),

  /**
   * Create a request with oversized payload for testing size limits
   * @param url - Request URL
   * @param token - Authentication token
   * @returns Request with oversized payload
   */
  createOversizedRequest: (url: string, token: string): Request => {
    const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB
    return new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: largePayload }),
    });
  },
} as const;