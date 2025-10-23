import { faker } from '@faker-js/faker';
import type { APIRequestContext, Page } from '@playwright/test';
import { shouldUseMockMode } from '../mock-api-server';
import {
  createUserWithNetworkIntercept,
  loginWithNetworkIntercept,
  createApiKeyWithNetworkIntercept,
  waitForResponseWithValidation
} from '../../helpers/network-first-helpers';
import {
  BaseFactory,
  TestUser,
  UserOverrides,
  TestApiKey,
  ApiKeyOverrides,
  AuthManager
} from '../base/base-fixture';

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

/**
 * Enhanced User Factory with network-first patterns and base factory integration
 */
export class UserFactory extends BaseFactory<TestUser, UserOverrides> {
  private createdApiKeyIds: string[] = [];
  private page?: Page;

  constructor(request: APIRequestContext, page?: Page) {
    super(request);
    this.page = page;
  }

  /**
   * Create a test user with optional overrides
   *
   * @param overrides - Optional user properties to override
   * @returns Created user object
   */
  async create(overrides: UserOverrides = {}): Promise<TestUser> {
    return this.createUser(overrides);
  }

  /**
   * Create a test user with optional overrides
   *
   * @param overrides - Optional user properties to override
   * @returns Created user object
   */
  async createUser(overrides: UserOverrides = {}): Promise<TestUser> {
    const userData = this.generateUserData(overrides);

    try {
      // Use network-first pattern to prevent race conditions
      const { userResponse, user } = await createUserWithNetworkIntercept(
        this.request,
        userData
      );

      this.trackCreated(user.id);

      // Store password for testing purposes
      return { ...user, password: userData.password };
    } catch (error) {
      // If real API fails and mock mode is available, try to provide helpful error
      if (shouldUseMockMode() && this.page) {
        throw new Error(`API connection failed. Mock mode should handle this automatically. Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate user data with faker and overrides
   */
  private generateUserData(overrides: UserOverrides = {}): UserOverrides & { password: string } {
    return {
      email: overrides.email || faker.internet.email(),
      name: overrides.name || faker.person.fullName(),
      password: overrides.password || faker.internet.password({ length: 12 }),
      tier: overrides.tier || 'free',
    };
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

    try {
      // Use network-first pattern for API key creation
      const { apiKey, apiKeyId } = await createApiKeyWithNetworkIntercept(
        this.request,
        token,
        {
          name: name || faker.word.words(2),
          scopes: ['read', 'write'],
        }
      );

      this.createdApiKeyIds.push(apiKeyId);
      return apiKey;
    } catch (error) {
      if (shouldUseMockMode() && this.page) {
        throw new Error(`API connection failed. Mock mode should handle this automatically. Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Authenticate a user and return auth token
   *
   * @param email - User email
   * @param password - User password
   * @returns JWT auth token
   */
  async login(email: string, password: string): Promise<string> {
    try {
      // Use network-first pattern for login to prevent race conditions
      const { token } = await loginWithNetworkIntercept(
        this.request,
        { email, password }
      );

      return token;
    } catch (error) {
      if (shouldUseMockMode() && this.page) {
        throw new Error(`API connection failed. Mock mode should handle this automatically. Error: ${error.message}`);
      }
      throw error;
    }
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

    // Delete users using base factory cleanup
    const userIds = this.getCreatedIds();
    for (const userId of userIds) {
      try {
        await this.request.delete(`/api/users/${userId}`);
      } catch (error) {
        console.warn(`Failed to cleanup user ${userId}:`, error);
      }
    }

    // Reset tracking arrays
    this.createdApiKeyIds = [];
    this.resetTracking();
  }
}
