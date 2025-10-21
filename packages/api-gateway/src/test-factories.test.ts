import { describe, expect, it } from 'bun:test';
import {
  createTestUser,
  createTestProject,
  TEST_PASSWORDS,
  TEST_TIMES,
  TestDates,
} from './test-factories';

describe('Test Factories', () => {
  describe('createTestUser', () => {
    it('should create user with default values', () => {
      const user = createTestUser();

      expect(user.email).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(user.password).toBeTruthy();
      expect(user.tier).toBe('free');
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(user.password.length).toBeGreaterThan(17);
    });

    it('should create user with overridden values', () => {
      const overrides = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'CustomPassword123!',
        tier: 'pro' as const,
      };

      const user = createTestUser(overrides);

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password).toBe('CustomPassword123!');
      expect(user.tier).toBe('pro');
    });

    it('should create user with partial overrides', () => {
      const user = createTestUser({
        email: 'partial@example.com',
        tier: 'enterprise' as const,
      });

      expect(user.email).toBe('partial@example.com');
      expect(user.tier).toBe('enterprise');
      expect(user.name).toBeTruthy();
      expect(user.password).toBeTruthy();
    });

    it('should generate unique values for multiple calls', () => {
      const user1 = createTestUser();
      const user2 = createTestUser();

      expect(user1.email).not.toBe(user2.email);
      expect(user1.name).not.toBe(user2.name);
      expect(user1.password).not.toBe(user2.password);
    });

    it('should accept all valid tier values', () => {
      const tiers = ['free', 'pro', 'enterprise'] as const;

      for (const tier of tiers) {
        const user = createTestUser({ tier });
        expect(user.tier).toBe(tier);
      }
    });

    it('should handle empty overrides', () => {
      const user = createTestUser({});

      expect(user.email).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(user.password).toBeTruthy();
      expect(user.tier).toBe('free');
    });

    it('should preserve faker data generation patterns', () => {
      // Test multiple generations to ensure faker is working
      for (let i = 0; i < 5; i++) {
        const user = createTestUser();

        expect(typeof user.email).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.password).toBe('string');
        expect(['free', 'pro', 'enterprise']).toContain(user.tier);

        // Verify faker patterns
        expect(user.email).toContain('@');
        expect(user.name.split(' ').length).toBeGreaterThanOrEqual(2); // First and last name (may include middle name)
      }
    });
  });

  describe('createTestProject', () => {
    it('should create project with default values', () => {
      const project = createTestProject();

      expect(project.userId).toBeTruthy();
      expect(project.title).toBeTruthy();
      expect(project.author).toBeTruthy();
      expect(project.language).toBe('pt-BR');
      expect(project.genre).toBeTruthy();
      expect(project.status).toBe('draft');
      expect(project.metadata).toEqual({});

      // Verify generated values
      expect(['Fiction', 'Non-Fiction', 'Technical', 'Biography']).toContain(
        project.genre
      );
      expect(project.userId).toMatch(/^[\da-f-]{36}$/); // UUID format
    });

    it('should create project with overridden values', () => {
      const overrides = {
        userId: 'custom-user-id',
        title: 'Custom Project Title',
        author: 'Custom Author',
        language: 'en',
        genre: 'Science Fiction' as const,
        status: 'completed' as const,
        metadata: { key: 'value' },
      };

      const project = createTestProject(overrides);

      expect(project.userId).toBe('custom-user-id');
      expect(project.title).toBe('Custom Project Title');
      expect(project.author).toBe('Custom Author');
      expect(project.language).toBe('en');
      expect(project.genre).toBe('Science Fiction');
      expect(project.status).toBe('completed');
      expect(project.metadata).toEqual({ key: 'value' });
    });

    it('should create project with partial overrides', () => {
      const project = createTestProject({
        title: 'Partial Title',
        status: 'processing' as const,
      });

      expect(project.title).toBe('Partial Title');
      expect(project.status).toBe('processing');
      expect(project.userId).toBeTruthy();
      expect(project.author).toBeTruthy();
      expect(project.language).toBe('pt-BR');
    });

    it('should generate unique values for multiple calls', () => {
      const project1 = createTestProject();
      const project2 = createTestProject();

      expect(project1.userId).not.toBe(project2.userId);
      expect(project1.title).not.toBe(project2.title);
      // Note: author and genre might be the same due to random selection
    });

    it('should accept all valid status values', () => {
      const statuses = [
        'draft',
        'queued',
        'processing',
        'completed',
        'failed',
      ] as const;

      for (const status of statuses) {
        const project = createTestProject({ status });
        expect(project.status).toBe(status);
      }
    });

    it('should handle null author', () => {
      const project = createTestProject({ author: null });

      expect(project.author).toBeNull();
    });

    it('should handle null genre', () => {
      const project = createTestProject({ genre: null });

      expect(project.genre).toBeNull();
    });

    it('should handle custom metadata', () => {
      const customMetadata = {
        published: true,
        pages: 250,
        tags: ['fiction', 'bestseller'],
        rating: 4.5,
      };

      const project = createTestProject({ metadata: customMetadata });

      expect(project.metadata).toEqual(customMetadata);
    });

    it('should preserve faker data generation patterns', () => {
      // Test multiple generations to ensure faker is working
      const genres = ['Fiction', 'Non-Fiction', 'Technical', 'Biography'];

      for (let i = 0; i < 10; i++) {
        const project = createTestProject();

        expect(typeof project.userId).toBe('string');
        expect(typeof project.title).toBe('string');
        expect(typeof project.author).toBe('string');
        expect(typeof project.language).toBe('string');
        expect(typeof project.status).toBe('string');
        expect(typeof project.metadata).toBe('object');

        // Verify faker patterns
        expect(project.userId).toMatch(/^[\da-f-]{36}$/); // UUID format
        expect(genres).toContain(project.genre);
        expect([
          'draft',
          'queued',
          'processing',
          'completed',
          'failed',
        ]).toContain(project.status);
      }
    });

    it('should merge metadata correctly', () => {
      const baseMetadata = { base: 'value' };
      const project = createTestProject({ metadata: baseMetadata });

      expect(project.metadata).toEqual(baseMetadata);
      expect(project.metadata).not.toBe(baseMetadata); // Should be a new object
    });
  });

  describe('TEST_PASSWORDS', () => {
    it('should contain all expected password constants', () => {
      expect(TEST_PASSWORDS.VALID).toBe('ValidPassword123!');
      expect(TEST_PASSWORDS.CORRECT).toBe('CorrectPassword123!');
      expect(TEST_PASSWORDS.WRONG).toBe('WrongPassword456!');
      expect(TEST_PASSWORDS.INVALID).toBe('InvalidPassword789!');
      expect(TEST_PASSWORDS.SECURE).toBe('SecurePassword123!');
      expect(TEST_PASSWORDS.STANDARD).toBe('StandardPassword123!');
      expect(TEST_PASSWORDS.GENERIC).toBe('GenericPassword123!');
    });

    it('should have passwords that meet strength requirements', () => {
      const passwords = Object.values(TEST_PASSWORDS);

      for (const password of passwords) {
        expect(password.length).toBeGreaterThanOrEqual(12);
        expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
        expect(/[A-Z]/.test(password)).toBe(true); // Has uppercase
        expect(/\d/.test(password)).toBe(true); // Has numbers
        expect(/[^\dA-Za-z]/.test(password)).toBe(true); // Has special character
      }
    });

    it('should have unique passwords', () => {
      const passwords = Object.values(TEST_PASSWORDS);
      const uniquePasswords = [...new Set(passwords)];

      expect(uniquePasswords).toHaveLength(passwords.length);
    });

    it('should have consistent password patterns', () => {
      const passwords = Object.values(TEST_PASSWORDS);

      for (const password of passwords) {
        expect(password).toMatch(/^[A-Z][A-Za-z]+\d{3}!$/);
      }
    });
  });

  describe('Factory Integration', () => {
    it('should work together for user and project creation', () => {
      const user = createTestUser({ tier: 'pro' });
      const project = createTestProject({
        userId: user.email, // Use user email as project ID for test
        author: user.name,
      });

      expect(project.userId).toBe(user.email);
      expect(project.author).toBe(user.name);
      expect(user.tier).toBe('pro');
    });

    it('should maintain consistency across multiple creations', () => {
      const users = Array.from({ length: 5 }, () => createTestUser());
      const projects = Array.from({ length: 5 }, () => createTestProject());

      // All users should have required fields
      for (const user of users) {
        expect(user.email).toBeTruthy();
        expect(user.name).toBeTruthy();
        expect(user.password).toBeTruthy();
        expect(['free', 'pro', 'enterprise']).toContain(user.tier);
      }

      // All projects should have required fields
      for (const project of projects) {
        expect(project.userId).toBeTruthy();
        expect(project.title).toBeTruthy();
        expect(project.language).toBe('pt-BR');
        expect([
          'Fiction',
          'Non-Fiction',
          'Technical',
          'Biography',
          null,
        ]).toContain(project.genre);
        expect([
          'draft',
          'queued',
          'processing',
          'completed',
          'failed',
        ]).toContain(project.status);
      }
    });
  });

  describe('TEST_TIMES', () => {
    it('should contain all required time constants', () => {
      expect(TEST_TIMES.ONE_SECOND_MS).toBe(1000);
      expect(TEST_TIMES.ONE_MS).toBe(1);
      expect(TEST_TIMES.ONE_HOUR_MS).toBe(3600000);
      expect(TEST_TIMES.BASE_TIMESTAMP).toBe(1609459200000);
    });

    it('should have correct time relationships', () => {
      expect(TEST_TIMES.ONE_HOUR_MS).toBe(60 * 60 * TEST_TIMES.ONE_SECOND_MS);
      expect(TEST_TIMES.ONE_SECOND_MS).toBe(1000 * TEST_TIMES.ONE_MS);
    });

    it('should have positive values', () => {
      for (const value of Object.values(TEST_TIMES)) {
        expect(value).toBeGreaterThan(0);
      }
    });
  });

  describe('TestDates', () => {
    it('should create deterministic past dates', () => {
      const past1 = TestDates.past(TEST_TIMES.ONE_HOUR_MS);
      const past2 = TestDates.past(2 * TEST_TIMES.ONE_HOUR_MS);

      expect(past1).toBe('2020-12-31T23:00:00.000Z');
      expect(past2).toBe('2020-12-31T22:00:00.000Z');
      expect(new Date(past2).getTime()).toBeLessThan(new Date(past1).getTime());
    });

    it('should create deterministic future dates', () => {
      const future1 = TestDates.future(TEST_TIMES.ONE_HOUR_MS);
      const future2 = TestDates.future(2 * TEST_TIMES.ONE_HOUR_MS);

      expect(future1).toBe('2021-01-01T01:00:00.000Z');
      expect(future2).toBe('2021-01-01T02:00:00.000Z');
      expect(new Date(future1).getTime()).toBeLessThan(
        new Date(future2).getTime()
      );
    });

    it('should create deterministic current time', () => {
      const now = TestDates.now();

      expect(now).toBe('2021-01-01T00:00:00.000Z');
      expect(new Date(now).getTime()).toBe(TEST_TIMES.BASE_TIMESTAMP);
    });

    it('should return valid ISO strings', () => {
      const past = TestDates.past(TEST_TIMES.ONE_SECOND_MS);
      const future = TestDates.future(TEST_TIMES.ONE_SECOND_MS);
      const now = TestDates.now();

      for (const dateString of [past, future, now]) {
        expect(() => new Date(dateString)).not.toThrow();
        expect(new Date(dateString).toISOString()).toBe(dateString);
      }
    });

    it('should handle edge case time values', () => {
      const zeroTime = TestDates.past(0);
      const largeTime = TestDates.future(TEST_TIMES.ONE_HOUR_MS * 24);

      expect(zeroTime).toBe('2021-01-01T00:00:00.000Z');
      expect(largeTime).toBe('2021-01-02T00:00:00.000Z');
    });
  });
});
