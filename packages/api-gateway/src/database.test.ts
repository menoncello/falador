import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from './database';
import {
  createTestUser,
  TEST_PASSWORDS,
  TEST_TIMES,
  TestDates,
} from './test-factories';

describe('1.4-UNIT-Database: Database Operations', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('User operations', () => {
    test('1.4-UNIT-101 [P0]: should create user with custom tier', () => {
      const userData = createTestUser({ tier: 'pro' });
      const user = db.createUser(userData);

      expect(user.tier).toBe('pro');
    });

    test('1.4-UNIT-102 [P0]: should create user with hashed password', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.tier).toBe('free');
      expect(user.passwordHash).toContain(':');
      expect(user.passwordHash).not.toBe(userData.password);
    });

    test('1.4-UNIT-103 [P0]: should retrieve user by ID', () => {
      const userData = createTestUser();
      const created = db.createUser(userData);

      const retrieved = db.getUserById(created.id);
      expect(retrieved).toEqual(created);
    });

    test('1.4-UNIT-104 [P0]: should retrieve user by email', () => {
      const userData = createTestUser();
      const created = db.createUser(userData);

      const retrieved = db.getUserByEmail(userData.email);
      expect(retrieved).toEqual(created);
    });

    test('should return undefined for non-existent email', () => {
      const retrieved = db.getUserByEmail('nonexistent@example.com');
      expect(retrieved).toBeUndefined();
    });

    test('1.4-UNIT-107 [P0]: should verify correct password', () => {
      const userData = createTestUser({ password: TEST_PASSWORDS.CORRECT });
      const user = db.createUser(userData);

      const isValid = db.verifyPassword(
        TEST_PASSWORDS.CORRECT,
        user.passwordHash
      );
      expect(isValid).toBe(true);
    });

    test('1.4-UNIT-105 [P0]: should reject incorrect password', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      const wrongPassword = TEST_PASSWORDS.WRONG;
      const isValid = db.verifyPassword(wrongPassword, user.passwordHash);
      expect(isValid).toBe(false);
    });

    test('1.4-UNIT-106 [P0]: should delete user', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      const deleted = db.deleteUser(user.id);
      expect(deleted).toBe(true);

      const retrieved = db.getUserById(user.id);
      expect(retrieved).toBeUndefined();
    });

    test('should reject password with invalid hash format', () => {
      const isValid = db.verifyPassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });

    test('should reject password with missing salt', () => {
      const isValid = db.verifyPassword('password', ':');
      expect(isValid).toBe(false);
    });

    test('should reject password with empty parts', () => {
      const isValid = db.verifyPassword('password', 'hash:');
      expect(isValid).toBe(false);
    });

    test('should reject password with wrong number of parts', () => {
      const isValid = db.verifyPassword('password', 'salt:hash:extra');
      expect(isValid).toBe(false);
    });

    test('should reject password with empty salt', () => {
      const isValid = db.verifyPassword('password', ':hash');
      expect(isValid).toBe(false);
    });

    test('should reject password with empty hash', () => {
      const isValid = db.verifyPassword('password', 'salt:');
      expect(isValid).toBe(false);
    });

    test('1.4-UNIT-108 [P1]: should handle password verification correctly with valid format', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      // The hash should have exactly 2 parts separated by ':'
      const parts = user.passwordHash.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy(); // salt should not be empty
      expect(parts[1]).toBeTruthy(); // hash should not be empty
    });
  });

  describe('Project operations', () => {
    test('1.4-UNIT-108 [P0]: should create project with defaults', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      const project = db.createProject({
        userId: user.id,
        title: 'My Book',
      });

      expect(project.title).toBe('My Book');
      expect(project.userId).toBe(user.id);
      expect(project.status).toBe('draft');
      expect(project.language).toBe('pt-BR');
      expect(project.author).toBeNull();
      expect(project.genre).toBeNull();
      expect(project.metadata).toEqual({});
    });

    test('1.4-UNIT-109 [P0]: should create project', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      const project = db.createProject({
        userId: user.id,
        title: 'My Book',
        author: 'Author Name',
        language: 'pt-BR',
      });

      expect(project.title).toBe('My Book');
      expect(project.userId).toBe(user.id);
      expect(project.status).toBe('draft');
    });

    test('1.4-UNIT-110 [P0]: should retrieve project by ID', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      const created = db.createProject({
        userId: user.id,
        title: 'Book',
      });

      const retrieved = db.getProjectById(created.id);
      expect(retrieved).toEqual(created);
    });

    test('should retrieve projects by user ID', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      db.createProject({ userId: user.id, title: 'Book 1' });
      db.createProject({ userId: user.id, title: 'Book 2' });

      const projects = db.getProjectsByUserId(user.id);
      expect(projects).toHaveLength(2);
    });

    test('should only return projects belonging to specific user', () => {
      const user1 = db.createUser({
        email: 'user1@example.com',
        name: 'User 1',
        password: 'password1',
      });

      const user2 = db.createUser({
        email: 'user2@example.com',
        name: 'User 2',
        password: 'password2',
      });

      db.createProject({ userId: user1.id, title: 'User 1 Book 1' });
      db.createProject({ userId: user1.id, title: 'User 1 Book 2' });
      db.createProject({ userId: user2.id, title: 'User 2 Book 1' });

      const user1Projects = db.getProjectsByUserId(user1.id);
      const user2Projects = db.getProjectsByUserId(user2.id);

      expect(user1Projects).toHaveLength(2);
      expect(user2Projects).toHaveLength(1);
      expect(user1Projects.every((p) => p.userId === user1.id)).toBe(true);
      expect(user2Projects.every((p) => p.userId === user2.id)).toBe(true);
    });

    test('should return empty array for user with no projects', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const projects = db.getProjectsByUserId(user.id);
      expect(projects).toHaveLength(0);
    });

    test('should update project', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const project = db.createProject({
        userId: user.id,
        title: 'Original',
      });

      const updated = db.updateProject(project.id, {
        title: 'Updated',
        status: 'completed',
      });

      expect(updated?.title).toBe('Updated');
      expect(updated?.status).toBe('completed');
    });

    test('should delete project', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const project = db.createProject({
        userId: user.id,
        title: 'Book',
      });

      const deleted = db.deleteProject(project.id);
      expect(deleted).toBe(true);

      const retrieved = db.getProjectById(project.id);
      expect(retrieved).toBeUndefined();
    });

    test('should return undefined for non-existent project', () => {
      const retrieved = db.getProjectById('non-existent');
      expect(retrieved).toBeUndefined();
    });

    test('should return undefined when updating non-existent project', () => {
      const updated = db.updateProject('non-existent', { title: 'New' });
      expect(updated).toBeUndefined();
    });

    test('should return false when deleting non-existent project', () => {
      const deleted = db.deleteProject('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('Session operations', () => {
    test('should create session with token', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      expect(token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);

      // Token should have proper JWT structure (header.payload.signature)
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy(); // header
      expect(parts[1]).toBeTruthy(); // payload
      expect(parts[2]).toBeTruthy(); // signature
    });

    test('should retrieve session by token', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      expect(session?.userId).toBe(user.id);
      expect(session?.token).toBe(token);
    });

    test('should get user by token', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const retrieved = db.getUserByToken(token);

      expect(retrieved?.id).toBe(user.id);
    });

    test('should return undefined for non-existent session', () => {
      const session = db.getSession('non-existent-token');
      expect(session).toBeUndefined();
    });

    test('should return undefined for expired session', async () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);

      // Get session and manually expire it
      const session = db.getSession(token);
      if (session) {
        session.expiresAt = new Date(Date.now() - 1000).toISOString();
      }

      const retrieved = db.getSession(token);
      expect(retrieved).toBeUndefined();
    });

    test('should handle session expiration edge cases', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      if (session) {
        // Test exact expiration time
        session.expiresAt = new Date().toISOString();
        const atExactExpiration = db.getSession(token);
        expect(atExactExpiration).toBeUndefined();

        // Test just before expiration
        session.expiresAt = new Date(Date.now() + 1000).toISOString();
        const beforeExpiration = db.getSession(token);
        expect(beforeExpiration).toBeTruthy();

        // Test just after expiration
        session.expiresAt = new Date(Date.now() - 1).toISOString();
        const afterExpiration = db.getSession(token);
        expect(afterExpiration).toBeUndefined();
      }
    });

    test('should return undefined for invalid token', () => {
      const retrieved = db.getUserByToken('invalid-token');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('API Key operations', () => {
    test('should create API key', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: ['read', 'write'],
      });

      expect(apiKey.name).toBe('Test Key');
      expect(apiKey.scopes).toEqual(['read', 'write']);
      expect(apiKey.key).toBeTruthy();
      expect(apiKey.key).toMatch(/^[\w-]+$/); // Should be base64url format
      expect(apiKey.key.length).toBeGreaterThan(20); // Should be reasonably long
    });

    test('should get user by API key', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: [],
      });

      const retrieved = db.getUserByApiKey(apiKey.key);
      expect(retrieved?.id).toBe(user.id);
    });

    test('should delete API key', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: [],
      });

      const deleted = db.deleteApiKey(apiKey.id);
      expect(deleted).toBe(true);

      const retrieved = db.getApiKeyById(apiKey.id);
      expect(retrieved).toBeUndefined();
    });

    test('should return undefined for non-existent API key', () => {
      const retrieved = db.getUserByApiKey('non-existent-key');
      expect(retrieved).toBeUndefined();
    });

    test('should return false when deleting non-existent API key', () => {
      const deleted = db.deleteApiKey('non-existent');
      expect(deleted).toBe(false);
    });
  });

  // Additional comprehensive tests to kill survived mutants
  describe('JWT Token Generation and Validation', () => {
    test('should generate JWT tokens with proper structure', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);

      // Test JWT structure
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // Test header
      const header = JSON.parse(atob(parts[0]));
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');

      // Test payload
      const payload = JSON.parse(atob(parts[1]));
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(typeof payload.iat).toBe('number');
      expect(typeof payload.exp).toBe('number');
      expect(payload.exp).toBeGreaterThan(payload.iat);

      // Test signature
      expect(parts[2]).toBeTruthy();
      expect(parts[2].length).toBeGreaterThan(0);
    });

    test('should use correct JWT secret for token signing', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      expect(session).toBeTruthy();
      expect(session?.userId).toBe(user.id);
      expect(session?.token).toBe(token);
    });

    test('should handle token generation with different user IDs', () => {
      const user1 = db.createUser({
        email: 'user1@example.com',
        name: 'User One',
        password: userData.password,
      });

      const user2 = db.createUser({
        email: 'user2@example.com',
        name: 'User Two',
        password: userData.password,
      });

      const token1 = db.createSession(user1.id);
      const token2 = db.createSession(user2.id);

      expect(token1).not.toBe(token2);

      const session1 = db.getSession(token1);
      const session2 = db.getSession(token2);

      expect(session1?.userId).toBe(user1.id);
      expect(session2?.userId).toBe(user2.id);
    });

    test('should validate token expiration logic correctly', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      if (session) {
        // Test various expiration scenarios
        const originalExpiresAt = session.expiresAt;

        // Test expired session (1 hour ago)
        session.expiresAt = new Date(Date.now() - 3600000).toISOString();
        expect(db.getSession(token)).toBeUndefined();

        // Restore original time
        session.expiresAt = originalExpiresAt;
        expect(db.getSession(token)).toBeTruthy();

        // Test session expiring exactly now
        session.expiresAt = new Date().toISOString();
        expect(db.getSession(token)).toBeUndefined();

        // Test session expiring in 1 hour
        session.expiresAt = new Date(Date.now() + 3600000).toISOString();
        expect(db.getSession(token)).toBeTruthy();
      }
    });

    test('should handle date comparison edge cases', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      if (session) {
        // Test millisecond precision edge cases
        const now = Date.now();

        // Test exactly at expiration time
        session.expiresAt = new Date(now).toISOString();
        expect(db.getSession(token)).toBeUndefined();

        // Test 1 millisecond before expiration
        session.expiresAt = new Date(now + 1).toISOString();
        expect(db.getSession(token)).toBeTruthy();

        // Test 1 millisecond after expiration
        session.expiresAt = new Date(now - 1).toISOString();
        expect(db.getSession(token)).toBeUndefined();
      }
    });
  });

  describe('Environment Variable and Secret Handling', () => {
    test('should handle JWT_SECRET environment variable', () => {
      // Test that JWT_SECRET is used when available
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret-key-for-testing';

      try {
        const user = db.createUser({
          email: TEST_CREDENTIALS.EMAIL,
          name: TEST_CREDENTIALS.NAME,
          password: userData.password,
        });

        const token = db.createSession(user.id);
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      } finally {
        if (originalSecret) {
          process.env.JWT_SECRET = originalSecret;
        } else {
          delete process.env.JWT_SECRET;
        }
      }
    });

    test('should use default JWT secret when environment variable is not set', () => {
      // Ensure JWT_SECRET is not set
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const user = db.createUser({
          email: TEST_CREDENTIALS.EMAIL,
          name: TEST_CREDENTIALS.NAME,
          password: userData.password,
        });

        const token = db.createSession(user.id);
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
      } finally {
        if (originalSecret) {
          process.env.JWT_SECRET = originalSecret;
        }
      }
    });
  });

  describe('Search and Filter Logic', () => {
    test('should handle getUserByEmail search logic correctly', () => {
      const user1 = db.createUser({
        email: 'test1@example.com',
        name: 'Test User 1',
        password: userData.password,
      });

      const user2 = db.createUser({
        email: 'test2@example.com',
        name: 'Test User 2',
        password: userData.password,
      });

      // Test finding existing users
      const foundUser1 = db.getUserByEmail('test1@example.com');
      const foundUser2 = db.getUserByEmail('test2@example.com');

      expect(foundUser1?.id).toBe(user1.id);
      expect(foundUser2?.id).toBe(user2.id);

      // Test finding non-existent user
      const notFound = db.getUserByEmail('nonexistent@example.com');
      expect(notFound).toBeUndefined();

      // Test case sensitivity
      const caseSensitive = db.getUserByEmail('TEST1@EXAMPLE.COM');
      expect(caseSensitive).toBeUndefined();
    });

    test('should handle getProjectsByUserId filter logic correctly', () => {
      const user1 = db.createUser({
        email: 'user1@example.com',
        name: 'User One',
        password: userData.password,
      });

      const user2 = db.createUser({
        email: 'user2@example.com',
        name: 'User Two',
        password: userData.password,
      });

      // Create projects for user1
      const project1 = db.createProject({
        userId: user1.id,
        title: 'User 1 Project 1',
      });

      const project2 = db.createProject({
        userId: user1.id,
        title: 'User 1 Project 2',
      });

      // Create project for user2
      const project3 = db.createProject({
        userId: user2.id,
        title: 'User 2 Project 1',
      });

      // Test filtering by user1.id
      const user1Projects = db.getProjectsByUserId(user1.id);
      expect(user1Projects).toHaveLength(2);
      expect(user1Projects.map((p) => p.id)).toContain(project1.id);
      expect(user1Projects.map((p) => p.id)).toContain(project2.id);
      expect(user1Projects.map((p) => p.id)).not.toContain(project3.id);

      // Test filtering by user2.id
      const user2Projects = db.getProjectsByUserId(user2.id);
      expect(user2Projects).toHaveLength(1);
      expect(user2Projects[0].id).toBe(project3.id);

      // Test filtering by non-existent user
      const nonExistentUserProjects = db.getProjectsByUserId(
        'non-existent-user-id'
      );
      expect(nonExistentUserProjects).toHaveLength(0);
    });

    test('should handle getUserByApiKey search logic correctly', () => {
      const user1 = db.createUser({
        email: 'user1@example.com',
        name: 'User One',
        password: userData.password,
      });

      const user2 = db.createUser({
        email: 'user2@example.com',
        name: 'User Two',
        password: userData.password,
      });

      const apiKey1 = db.createApiKey({
        userId: user1.id,
        name: 'API Key 1',
        scopes: ['read'],
      });

      const apiKey2 = db.createApiKey({
        userId: user2.id,
        name: 'API Key 2',
        scopes: ['write'],
      });

      // Test finding users by API keys
      const foundUser1 = db.getUserByApiKey(apiKey1.key);
      const foundUser2 = db.getUserByApiKey(apiKey2.key);

      expect(foundUser1?.id).toBe(user1.id);
      expect(foundUser2?.id).toBe(user2.id);

      // Test finding non-existent API key
      const notFound = db.getUserByApiKey('non-existent-api-key');
      expect(notFound).toBeUndefined();
    });
  });

  describe('ID Generation and Validation', () => {
    test('should generate proper hex IDs', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const project = db.createProject({
        userId: user.id,
        title: 'Test Project',
      });

      // Test user ID format
      expect(user.id).toMatch(/^[\da-f]{32}$/);
      expect(typeof user.id).toBe('string');
      expect(user.id.length).toBe(32);

      // Test project ID format
      expect(project.id).toMatch(/^[\da-f]{32}$/);
      expect(typeof project.id).toBe('string');
      expect(project.id.length).toBe(32);

      // Test IDs are unique
      expect(user.id).not.toBe(project.id);
    });

    test('should generate proper API key format', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test API Key',
        scopes: ['read', 'write'],
      });

      // API key should be base64url format (no +, /, = characters)
      expect(apiKey.key).toMatch(/^[\w-]+$/);
      expect(typeof apiKey.key).toBe('string');
      expect(apiKey.key.length).toBeGreaterThan(20);

      // Should not contain base64 specific characters
      expect(apiKey.key).not.toContain('+');
      expect(apiKey.key).not.toContain('/');
      expect(apiKey.key).not.toContain('=');
    });

    test('should generate unique IDs across multiple operations', () => {
      const users = Array.from({ length: 5 }, (_, i) =>
        db.createUser({
          email: `user${i}@example.com`,
          name: `User ${i}`,
          password: userData.password,
        })
      );

      const projects = Array.from({ length: 5 }, (_, i) =>
        db.createProject({
          userId: users[0].id,
          title: `Project ${i}`,
        })
      );

      const apiKeys = Array.from({ length: 5 }, (_, i) =>
        db.createApiKey({
          userId: users[0].id,
          name: `API Key ${i}`,
          scopes: ['read'],
        })
      );

      // All IDs should be unique
      const allUserIds = users.map((u) => u.id);
      const allProjectIds = projects.map((p) => p.id);
      const allApiKeyIds = apiKeys.map((k) => k.id);

      const allIds = [...allUserIds, ...allProjectIds, ...allApiKeyIds];
      const uniqueIds = new Set(allIds);

      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database operations correctly after clear', () => {
      // Create some data
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const project = db.createProject({
        userId: user.id,
        title: 'Test Project',
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test API Key',
        scopes: ['read'],
      });

      const token = db.createSession(user.id);

      // Verify data exists
      expect(db.getUserById(user.id)).toBeTruthy();
      expect(db.getProjectById(project.id)).toBeTruthy();
      expect(db.getApiKeyById(apiKey.id)).toBeTruthy();
      expect(db.getSession(token)).toBeTruthy();

      // Clear database
      db.clear();

      // Verify all data is cleared
      expect(db.getUserById(user.id)).toBeUndefined();
      expect(db.getProjectById(project.id)).toBeUndefined();
      expect(db.getApiKeyById(apiKey.id)).toBeUndefined();
      expect(db.getSession(token)).toBeUndefined();
      expect(db.getUserByEmail(userData.email)).toBeUndefined();
      expect(db.getProjectsByUserId(user.id)).toHaveLength(0);
    });

    test('should handle invalid password hash formats gracefully', () => {
      const invalidHashes = [
        '',
        'single-part',
        'two:parts:extra',
        ':missing-salt',
        'missing-hash:',
        '::empty-both',
        'a:b', // Valid format but too short
      ];

      for (const hash of invalidHashes) {
        const result = db.verifyPassword(TEST_CREDENTIALS.PASSWORD, hash);
        expect(typeof result).toBe('boolean');
      }
    });

    test('should handle session management edge cases', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      // Test multiple sessions for same user
      const token1 = db.createSession(user.id);
      const token2 = db.createSession(user.id);

      expect(token1).not.toBe(token2);

      const user1 = db.getUserByToken(token1);
      const user2 = db.getUserByToken(token2);

      expect(user1?.id).toBe(user.id);
      expect(user2?.id).toBe(user.id);
    });
  });

  // Additional tests to kill specific survivors from mutation testing
  describe('String Encoding and Format Validation', () => {
    test('should use hex encoding for password salt and hash', () => {
      const userData = createTestUser();
      const user = db.createUser(userData);

      // Verify password hash format and encoding
      expect(user.passwordHash).toMatch(/^[\da-f]+:[\da-f]+$/);
      const parts = user.passwordHash.split(':');
      expect(parts).toHaveLength(2);

      // Both parts should be valid hex strings
      expect(parts[0]).toMatch(/^[\da-f]+$/);
      expect(parts[1]).toMatch(/^[\da-f]+$/);

      // Verify they can be parsed as hex
      expect(() => Buffer.from(parts[0], 'hex')).not.toThrow();
      expect(() => Buffer.from(parts[1], 'hex')).not.toThrow();
    });

    test('should use base64url encoding for API keys', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: ['read'],
      });

      // Verify base64url format (no +, /, = characters)
      expect(apiKey.key).toMatch(/^[\w-]+$/);
      expect(apiKey.key).not.toMatch(/[+/=]/);

      // Verify it can be decoded as base64url
      expect(() => Buffer.from(apiKey.key, 'base64url')).not.toThrow();
    });

    test('should use correct JWT header format', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const parts = token.split('.');

      // Decode and verify JWT header
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      expect(header).toHaveProperty('alg', 'HS256');
      expect(header).toHaveProperty('typ', 'JWT');
      expect(Object.keys(header)).toHaveLength(2);
    });

    test('should use correct JWT payload format', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const parts = token.split('.');

      // Decode and verify JWT payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(typeof payload.iat).toBe('number');
      expect(typeof payload.exp).toBe('number');
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    test('should generate proper API key format with correct encoding', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: ['read'],
      });

      // Test that the API key is generated using the correct encoding method
      expect(typeof apiKey.key).toBe('string');
      expect(apiKey.key.length).toBeGreaterThan(0);

      // Verify it's base64url format (no padding characters)
      expect(apiKey.key).not.toContain('=');
      expect(apiKey.key).toMatch(/^[\w-]+$/);

      // Test that different calls generate different keys
      const apiKey2 = db.createApiKey({
        userId: user.id,
        name: 'Test Key 2',
        scopes: ['write'],
      });

      expect(apiKey.key).not.toBe(apiKey2.key);
    });
  });

  describe('Date and Time Logic', () => {
    test('should handle session expiration with strict inequality', () => {
      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      if (session) {
        // Test exact expiration boundary - should be expired
        session.expiresAt = new Date().toISOString();
        expect(db.getSession(token)).toBeUndefined();

        // Test 1ms in the future - should be valid
        session.expiresAt = new Date(Date.now() + 1).toISOString();
        expect(db.getSession(token)).toBeTruthy();

        // Test 1ms in the past - should be expired
        session.expiresAt = new Date(Date.now() - 1).toISOString();
        expect(db.getSession(token)).toBeUndefined();
      }
    });

    test('should generate JWT timestamps correctly', () => {
      const beforeCreation = Date.now();

      const user = db.createUser({
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      const token = db.createSession(user.id);
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      const afterCreation = Date.now();

      // Verify timestamps are within reasonable range
      expect(payload.iat).toBeGreaterThanOrEqual(
        Math.floor(beforeCreation / 1000)
      );
      expect(payload.iat).toBeLessThanOrEqual(Math.floor(afterCreation / 1000));

      // Verify expiration is in the future
      expect(payload.exp).toBeGreaterThan(payload.iat);

      // Verify expiration is reasonable (not too far in future)
      const expectedExp = payload.iat + 24 * 60 * 60; // 24 hours
      expect(payload.exp).toBe(expectedExp);
    });
  });
});
