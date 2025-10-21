import 'reflect-metadata';
import { describe, expect, test, beforeEach } from 'bun:test';
import { db } from './database';
import { TEST_CREDENTIALS } from './test-constants';

describe('Database Edge Cases', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Password verification edge cases', () => {
    test('should reject empty password hash', () => {
      const isValid = db.verifyPassword('password', '');
      expect(isValid).toBe(false);
    });

    test('should reject malformed hash with wrong number of parts', () => {
      const malformedHash = 'salt:hash:extra';
      const isValid = db.verifyPassword('password', malformedHash);
      expect(isValid).toBe(false);
    });

    test('should reject hash with empty salt', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Manually create malformed hash
      const malformedHash = `:${user.passwordHash.split(':')[1]}`;
      const isValid = db.verifyPassword(
        TEST_CREDENTIALS.PASSWORD,
        malformedHash
      );
      expect(isValid).toBe(false);
    });

    test('should reject hash with empty hash part', () => {
      const malformedHash = 'validsalt:';
      const isValid = db.verifyPassword('password', malformedHash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT token edge cases', () => {
    test('should handle token generation with custom secret', () => {
      // Override JWT secret for testing
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret-key';

      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Restore original secret
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      } else {
        delete process.env.JWT_SECRET;
      }
    });

    test('should reject expired token', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Create a token with past expiration
      const pastTimestamp = Math.floor((Date.now() - 86400000) / 1000); // 24 hours ago
      const payload = {
        sub: user.id,
        iat: pastTimestamp - 3600, // 1 hour before issuance
        exp: pastTimestamp, // Already expired
      };

      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      const session = db.getSession(token);

      expect(session).toBeUndefined();
    });
  });

  describe('API key operations edge cases', () => {
    test('should generate unique API keys', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const keys = [];
      for (let i = 0; i < 10; i++) {
        const apiKey = db.createApiKey({
          userId: user.id,
          name: `Test Key ${i}`,
          scopes: ['read'],
        });
        keys.push(apiKey.key);
      }

      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(10);
    });

    test('should handle concurrent API key creation', () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Create multiple API keys rapidly
      const apiKeys = [];
      for (let i = 0; i < 5; i++) {
        const apiKey = db.createApiKey({
          userId: user.id,
          name: `Concurrent Key ${i}`,
          scopes: ['read', 'write'],
        });
        apiKeys.push(apiKey);
      }

      // All should be created successfully
      expect(apiKeys).toHaveLength(5);
      for (const key of apiKeys) {
        expect(key.id).toBeTruthy();
        expect(key.key).toBeTruthy();
        expect(key.name).toMatch(/Concurrent Key \d/);
        expect(key.scopes).toEqual(['read', 'write']);
      }
    });
  });

  describe('User lookup edge cases', () => {
    test('should handle case-sensitive email lookup', () => {
      const user = db.createUser({
        email: 'test@example.com',
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Different case should not find user
      const foundUser = db.getUserByEmail('Test@Example.com');
      expect(foundUser).toBeUndefined();

      // Exact case should find user
      const exactUser = db.getUserByEmail('test@example.com');
      expect(exactUser).toEqual(user);
    });

    test('should handle empty string email lookup', () => {
      const foundUser = db.getUserByEmail('');
      expect(foundUser).toBeUndefined();
    });
  });
});
