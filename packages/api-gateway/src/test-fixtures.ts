/**
 * Test Fixtures
 *
 * Reusable test setup patterns for common scenarios like authentication
 */

import { db } from './database';
import { createTestUser, UserFactoryData } from './test-factories';

export interface AuthenticatedUser {
  userData: UserFactoryData;
  user: { id: string; email: string; name: string; tier: string };
  token: string;
}

export interface TestFixture {
  createAuthenticatedUser: (
    overrides?: Partial<UserFactoryData>
  ) => AuthenticatedUser;
  createMultipleAuthenticatedUsers: (
    count: number,
    overrides?: Array<Partial<UserFactoryData>>
  ) => AuthenticatedUser[];
  clearDatabase: () => void;
}

/**
 * Creates a fixture with authenticated user setup
 * @returns A fixture object with helper methods for common test scenarios
 */

/**
 * Creates an authenticated user for testing
 * @param overrides - Optional overrides for user data
 * @returns Authenticated user data including user object and token
 */
function createAuthenticatedUserForFixture(
  overrides: Partial<UserFactoryData> = {}
): AuthenticatedUser {
  const userData = createTestUser(overrides);
  const user = db.createUser({
    email: userData.email,
    name: userData.name,
    password: userData.password,
    tier: userData.tier,
  });
  const token = db.createSession(user.id);

  return {
    userData,
    user,
    token,
  };
}

/**
 * Creates multiple authenticated users for testing
 * @param count - Number of users to create
 * @param overrides - Optional overrides for each user
 * @returns Array of authenticated users
 */
function createMultipleAuthenticatedUsersForFixture(
  count: number,
  overrides: Array<Partial<UserFactoryData>> = []
): AuthenticatedUser[] {
  const users: AuthenticatedUser[] = [];

  for (let i = 0; i < count; i++) {
    const userOverrides = overrides[i] || {};
    users.push(createAuthenticatedUserForFixture(userOverrides));
  }

  return users;
}
export function createTestFixture(): TestFixture {
  return {
    /**
     * Creates an authenticated user for testing
     * @param overrides - Optional overrides for user data
     * @returns Authenticated user data including user object and token
     */
    createAuthenticatedUser(
      overrides: Partial<UserFactoryData> = {}
    ): AuthenticatedUser {
      return createAuthenticatedUserForFixture(overrides);
    },

    /**
     * Creates multiple authenticated users for testing
     * @param count - Number of users to create
     * @param overrides - Optional overrides for each user
     * @returns Array of authenticated users
     */
    createMultipleAuthenticatedUsers(
      count: number,
      overrides: Array<Partial<UserFactoryData>> = []
    ): AuthenticatedUser[] {
      return createMultipleAuthenticatedUsersForFixture(count, overrides);
    },

    /**
     * Clears the database for clean test isolation
     */
    clearDatabase(): void {
      db.clear();
    },
  };
}

/**
 * Creates an authenticated request with proper headers
 * @param url - The request URL
 * @param token - Authentication token
 * @param options - Additional request options
 * @returns Request object with authentication headers
 */
export function createAuthenticatedRequest(
  url: string,
  token: string,
  options: RequestInit = {}
): Request {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return new Request(url, {
    ...options,
    headers,
  });
}

/**
 * Creates a project request with authentication
 * @param method - HTTP method
 * @param token - Authentication token
 * @param body - Request body
 * @param url - Request URL (optional, defaults to projects endpoint)
 * @returns Request object for project operations
 */
export function createProjectRequest(
  method: string,
  token: string,
  body?: unknown,
  url = 'http://localhost/api/projects'
): Request {
  return createAuthenticatedRequest(url, token, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Creates an auth request for authentication endpoints
 * @param method - HTTP method
 * @param endpoint - Auth endpoint (e.g., 'register', 'login', 'me')
 * @param body - Request body
 * @returns Request object for auth operations
 */
export function createAuthRequest(
  method: string,
  endpoint: string,
  body?: unknown
): Request {
  const url = `http://localhost/api/auth/${endpoint}`;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
