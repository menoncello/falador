import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from './database';
import { TEST_CREDENTIALS } from './test-constants';

describe('Database', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('User operations', () => {
    test('should create user with custom tier', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
        tier: 'pro',
      });

      expect(user.tier).toBe('pro');
    });

    test('should create user with hashed password', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      expect(user.email).toBe(TEST_CREDENTIALS.EMAIL);
      expect(user.name).toBe(TEST_CREDENTIALS.NAME);
      expect(user.tier).toBe('free');
      expect(user.passwordHash).toContain(':');
      expect(user.passwordHash).not.toBe(TEST_CREDENTIALS.PASSWORD);
    });

    test('should retrieve user by ID', () => {
      const created = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const retrieved = db.getUserById(created.id);
      expect(retrieved).toEqual(created);
    });

    test('should retrieve user by email', () => {
      const created = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const retrieved = db.getUserByEmail(TEST_CREDENTIALS.EMAIL);
      expect(retrieved).toEqual(created);
    });

    test('should verify correct password', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const isValid = db.verifyPassword(
        TEST_CREDENTIALS.PASSWORD,
        user.passwordHash
      );
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const wrongPassword = `invalid-${Date.now()}`;
      const isValid = db.verifyPassword(wrongPassword, user.passwordHash);
      expect(isValid).toBe(false);
    });

    test('should delete user', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

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
  });

  describe('Project operations', () => {
    test('should create project with defaults', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

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

    test('should create project', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

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

    test('should retrieve project by ID', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const created = db.createProject({
        userId: user.id,
        title: 'Book',
      });

      const retrieved = db.getProjectById(created.id);
      expect(retrieved).toEqual(created);
    });

    test('should retrieve projects by user ID', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      db.createProject({ userId: user.id, title: 'Book 1' });
      db.createProject({ userId: user.id, title: 'Book 2' });

      const projects = db.getProjectsByUserId(user.id);
      expect(projects).toHaveLength(2);
    });

    test('should update project', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
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
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
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

  describe('Password hashing and verification', () => {
    test('should generate consistent hash format', () => {
      const hash = db.hashPassword('test-password');
      expect(hash).toMatch(/^[\da-f]{32}:[\da-f]{128}$/);
    });

    test('should verify password with valid hash', () => {
      const password = 'test-password';
      const hash = db.hashPassword(password);
      expect(db.verifyPassword(password, hash)).toBe(true);
    });

    test('should reject password with malformed hash - too many parts', () => {
      const malformedHash = 'salt:hash:extra';
      expect(db.verifyPassword('password', malformedHash)).toBe(false);
    });

    test('should reject password with malformed hash - too few parts', () => {
      const malformedHash = 'singlepart';
      expect(db.verifyPassword('password', malformedHash)).toBe(false);
    });

    test('should reject password with empty salt', () => {
      const malformedHash = `:${'a'.repeat(128)}`;
      expect(db.verifyPassword('password', malformedHash)).toBe(false);
    });

    test('should reject password with empty hash', () => {
      const malformedHash = `${'a'.repeat(32)}:`;
      expect(db.verifyPassword('password', malformedHash)).toBe(false);
    });
  });

  describe('Token generation', () => {
    test('should generate JWT-like token with correct structure', () => {
      const token = db.generateToken();
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // Verify token has proper JWT-like structure (header.payload.signature)
      expect(token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
    });

    test('should generate valid tokens', () => {
      const token1 = db.generateToken();

      // Verify token has valid JWT structure
      expect(token1).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);

      // Verify token has proper structure (header.payload.signature)
      const parts = token1.split('.');
      expect(parts).toHaveLength(3);

      // Verify token can be decoded (has valid payload)
      const payload = JSON.parse(atob(parts[1]));
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
    });
  });

  describe('API key generation', () => {
    test('should generate API key with correct format', () => {
      const apiKey = db.generateApiKey();

      // Verify API key has proper base64url format
      expect(apiKey).toMatch(/^[\w-]+$/);
      expect(apiKey.length).toBeGreaterThan(0);
    });

    test('should generate unique API keys', () => {
      const key1 = db.generateApiKey();
      const key2 = db.generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('Session operations', () => {
    test('should create session with token', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);
      expect(token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
    });

    test('should retrieve session by token', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);
      const session = db.getSession(token);

      expect(session?.userId).toBe(user.id);
      expect(session?.token).toBe(token);
    });

    test('should get user by token', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
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
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
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

    test('should handle session expiration at exact boundary', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      // Get session and set to expire in the past
      const session = db.getSession(token);
      if (session) {
        session.expiresAt = new Date(Date.now() - 1).toISOString();
      }

      // Should be considered expired
      const retrieved = db.getSession(token);
      expect(retrieved).toBeUndefined();
    });

    test('should clean up expired sessions', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      // Expire the session
      const session = db.getSession(token);
      if (session) {
        session.expiresAt = new Date(Date.now() - 1000).toISOString();
      }

      // Try to get the expired session (should return undefined and clean up)
      const retrieved = db.getSession(token);
      expect(retrieved).toBeUndefined();

      // Try again to confirm it was cleaned up
      const retrievedAgain = db.getSession(token);
      expect(retrievedAgain).toBeUndefined();
    });

    test('should return undefined for invalid token', () => {
      const retrieved = db.getUserByToken('invalid-token');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('API Key operations', () => {
    test('should create API key', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const apiKey = db.createApiKey({
        userId: user.id,
        name: 'Test Key',
        scopes: ['read', 'write'],
      });

      expect(apiKey.name).toBe('Test Key');
      expect(apiKey.scopes).toEqual(['read', 'write']);
      expect(apiKey.key).toBeTruthy();
    });

    test('should get user by API key', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
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
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
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
});
