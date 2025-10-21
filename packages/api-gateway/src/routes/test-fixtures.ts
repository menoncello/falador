import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';
import { projectRoutes } from './projects';

/**
 * Test fixture for authenticated user setup
 * Follows fixture pattern recommended by TEA agent
 */
export interface AuthenticatedUserFixture {
  user: {
    id: string;
    email: string;
    name: string;
    password: string;
  };
  token: string;
  userData: {
    email: string;
    name: string;
    password: string;
  };
}

/**
 * Creates an authenticated user fixture for testing
 * @param overrides - Optional overrides for user data
 * @returns Authenticated user fixture with user, token, and userData
 */
export function createAuthenticatedUser(
  overrides: Partial<{
    email: string;
    name: string;
    password: string;
  }> = {}
): AuthenticatedUserFixture {
  const userData = {
    email: overrides.email || TEST_CREDENTIALS.EMAIL,
    name: overrides.name || TEST_CREDENTIALS.NAME,
    password: overrides.password || TEST_CREDENTIALS.PASSWORD,
  };

  const user = db.createUser({
    email: userData.email,
    name: userData.name,
    password: userData.password,
  });

  const token = db.createSession(user.id);

  return {
    user,
    token,
    userData,
  };
}

/**
 * Creates a request with proper authorization headers
 * @param url - Request URL
 * @param method - HTTP method
 * @param token - Authorization token
 * @param body - Request body (optional)
 * @param contentType - Content type header
 * @returns Request object with authorization headers
 */
export function createAuthenticatedRequest(
  url: string,
  method: string,
  token: string,
  body?: unknown,
  contentType: string = 'application/json'
): Request {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (body && contentType) {
    headers['Content-Type'] = contentType;
  }

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Test extension with authenticated user fixture
 * Following the recommended pattern from TEA agent
 */
export const authenticatedTest = {
  beforeEach: () => {
    db.clear();
  },
  createAuthenticatedUser,
  createAuthenticatedRequest,
};