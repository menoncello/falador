import { test as base, APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Common test data types and interfaces
 */
export interface TestUser {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  password?: string;
}

export interface TestApiKey {
  id: string;
  key: string;
  name: string;
  scopes: string[];
  userId: string;
}

export interface TestProject {
  id: string;
  title: string;
  description?: string;
  language: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  userId: string;
  createdAt: string;
}

export interface UserOverrides {
  email?: string;
  name?: string;
  password?: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface ApiKeyOverrides {
  name?: string;
  scopes?: string[];
}

export interface ProjectOverrides {
  title?: string;
  description?: string;
  language?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

/**
 * Authentication management for tests
 */
export class AuthManager {
  constructor(private request: APIRequestContext) {}

  async login(email: string, password: string): Promise<string> {
    const response = await this.request.post('/api/auth/login', {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }

    const data = await response.json();
    return data.token;
  }

  async register(userData: { email: string; name: string; password: string; tier: string }): Promise<TestUser> {
    const response = await this.request.post('/api/auth/register', {
      data: userData,
    });

    if (!response.ok()) {
      throw new Error(`Registration failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }

  async createApiKey(token: string, keyData: { name: string; scopes: string[] }): Promise<TestApiKey> {
    const response = await this.request.post('/api/auth/api-keys', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: keyData,
    });

    if (!response.ok()) {
      throw new Error(`API key creation failed: ${response.status()} ${await response.text()}`);
    }

    return response.json();
  }
}

/**
 * Data factory base class with common functionality
 */
export abstract class BaseFactory<T, TOverrides = {}> {
  protected createdIds: string[] = [];
  protected request: APIRequestContext;
  protected auth: AuthManager;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.auth = new AuthManager(request);
  }

  abstract create(overrides?: TOverrides): Promise<T>;
  abstract cleanup(): Promise<void>;

  protected trackCreated(id: string): void {
    this.createdIds.push(id);
  }

  protected getCreatedIds(): string[] {
    return [...this.createdIds];
  }

  protected resetTracking(): void {
    this.createdIds = [];
  }
}

/**
 * Common test utilities and data generators
 */
export class TestUtils {
  static generateUserData(overrides: UserOverrides = {}): UserOverrides & { password: string } {
    return {
      email: overrides.email || faker.internet.email(),
      name: overrides.name || faker.person.fullName(),
      password: overrides.password || faker.internet.password({ length: 12 }),
      tier: overrides.tier || 'free',
    };
  }

  static generateApiKeyData(overrides: ApiKeyOverrides = {}): ApiKeyOverrides {
    return {
      name: overrides.name || faker.word.words(2),
      scopes: overrides.scopes || ['read', 'write'],
    };
  }

  static generateProjectData(overrides: ProjectOverrides = {}): ProjectOverrides {
    return {
      title: overrides.title || faker.book.title(),
      description: overrides.description || faker.lorem.paragraph(),
      language: overrides.language || 'en-US',
      status: overrides.status || 'draft',
    };
  }
}

/**
 * Extended base test fixture with common functionality
 */
export const baseTest = base.extend<{
  authManager: AuthManager;
  testUtils: typeof TestUtils;
}>({
  authManager: async ({ request }, use) => {
    const auth = new AuthManager(request);
    await use(auth);
  },
  testUtils: async ({}, use) => {
    await use(TestUtils);
  },
});

/**
 * Reusable test scenarios
 */
export const TestScenarios = {
  /**
   * Create a complete user setup with API key
   */
  async createUserWithApiKey(
    auth: AuthManager,
    userOverrides: UserOverrides = {},
    apiKeyOverrides: ApiKeyOverrides = {}
  ): Promise<{ user: TestUser; apiKey: TestApiKey; token: string }> {
    const userData = TestUtils.generateUserData(userOverrides);
    const user = await auth.register(userData);
    const token = await auth.login(user.email, userData.password!);
    const apiKeyData = TestUtils.generateApiKeyData(apiKeyOverrides);
    const apiKey = await auth.createApiKey(token, apiKeyData);

    return { user, apiKey, token };
  },

  /**
   * Create a user with specific tier
   */
  async createUserWithTier(
    auth: AuthManager,
    tier: 'free' | 'pro' | 'enterprise'
  ): Promise<{ user: TestUser; token: string }> {
    return TestScenarios.createUserWithApiKey(auth, { tier });
  },

  /**
   * Create multiple users with different tiers
   */
  async createTieredUsers(
    auth: AuthManager
  ): Promise<{
    freeUser: { user: TestUser; token: string };
    proUser: { user: TestUser; token: string };
    enterpriseUser: { user: TestUser; token: string };
  }> {
    const [freeUser, proUser, enterpriseUser] = await Promise.all([
      TestScenarios.createUserWithTier(auth, 'free'),
      TestScenarios.createUserWithTier(auth, 'pro'),
      TestScenarios.createUserWithTier(auth, 'enterprise'),
    ]);

    return { freeUser, proUser, enterpriseUser };
  },
};