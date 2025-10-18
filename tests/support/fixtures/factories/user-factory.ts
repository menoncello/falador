import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';

/**
 * User factory with faker-based data generation and auto-cleanup
 *
 * This factory follows best practices:
 * - Uses faker for random, realistic test data (no hardcoded values)
 * - Supports overrides for specific test scenarios
 * - Tracks created resources for automatic cleanup
 * - Provides helper methods for common operations
 *
 * @example
 * const user = await userFactory.createUser();
 * const adminUser = await userFactory.createUser({ tier: 'enterprise' });
 * const apiKey = await userFactory.createApiKey(user.id);
 */

interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  password?: string; // Password used for creation (for testing only)
}

interface UserOverrides {
  email?: string;
  name?: string;
  password?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export class UserFactory {
  private createdUserIds: string[] = [];
  private createdApiKeyIds: string[] = [];

  constructor(private request: APIRequestContext) {}

  /**
   * Create a test user with optional overrides
   *
   * @param overrides - Optional user properties to override
   * @returns Created user object
   */
  async createUser(overrides: UserOverrides = {}): Promise<User> {
    const password =
      overrides.password || faker.internet.password({ length: 12 });
    const userData = {
      email: overrides.email || faker.internet.email(),
      name: overrides.name || faker.person.fullName(),
      password,
      tier: overrides.tier || 'free',
    };

    const response = await this.request.post('/api/auth/register', {
      data: userData,
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to create user: ${response.status()} ${await response.text()}`
      );
    }

    const user = await response.json();
    this.createdUserIds.push(user.id);

    // Store password for testing purposes
    return { ...user, password };
  }

  /**
   * Create multiple test users
   *
   * @param count - Number of users to create
   * @returns Array of created user objects
   */
  async createUsers(count: number): Promise<User[]> {
    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const user = await this.createUser();
      users.push(user);
    }

    return users;
  }

  /**
   * Create an API key for a user
   *
   * @param user - User object with password
   * @param name - Optional name for the API key
   * @returns API key string
   */
  async createApiKey(user: User, name?: string): Promise<string> {
    // First login to get auth token
    if (!user.password) {
      throw new Error('User password is required to create API key');
    }
    const token = await this.login(user.email, user.password);

    const response = await this.request.post('/api/auth/api-keys', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        name: name || faker.word.words(2),
        scopes: ['read', 'write'],
      },
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to create API key: ${response.status()} ${await response.text()}`
      );
    }

    const data = await response.json();
    this.createdApiKeyIds.push(data.id);

    return data.key;
  }

  /**
   * Authenticate a user and return auth token
   *
   * @param email - User email
   * @param password - User password
   * @returns JWT auth token
   */
  async login(email: string, password: string): Promise<string> {
    const response = await this.request.post('/api/auth/login', {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(
        `Login failed: ${response.status()} ${await response.text()}`
      );
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Clean up all created test data
   * Called automatically by the fixture after each test
   */
  async cleanup(): Promise<void> {
    // Delete API keys first (foreign key constraint)
    for (const apiKeyId of this.createdApiKeyIds) {
      try {
        await this.request.delete(`/api/auth/api-keys/${apiKeyId}`);
      } catch (error) {
        // Ignore cleanup errors (resource might already be deleted)
        console.warn(`Failed to cleanup API key ${apiKeyId}:`, error);
      }
    }

    // Delete users
    for (const userId of this.createdUserIds) {
      try {
        await this.request.delete(`/api/users/${userId}`);
      } catch (error) {
        console.warn(`Failed to cleanup user ${userId}:`, error);
      }
    }

    // Reset tracking arrays
    this.createdUserIds = [];
    this.createdApiKeyIds = [];
  }
}
