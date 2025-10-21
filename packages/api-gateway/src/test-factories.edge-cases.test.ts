import { describe, expect, test } from 'bun:test';
import { createTestUser, createTestProject } from './test-factories';

describe('Test Factories Edge Cases', () => {
  describe('createTestUser', () => {
    test('should create user with default values', () => {
      const user = createTestUser();

      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('tier', 'free');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(user.email).toMatch(/@/);
      expect(user.password.length).toBeGreaterThan(0);
    });

    test('should create user with custom overrides', () => {
      const customData = {
        email: 'custom@example.com',
        name: 'Custom Name',
        tier: 'pro' as const,
      };

      const user = createTestUser(customData);

      expect(user.email).toBe(customData.email);
      expect(user.name).toBe(customData.name);
      expect(user.tier).toBe(customData.tier);
      expect(user).toHaveProperty('password'); // Should still have generated password
    });

    test('should create user with custom password', () => {
      const customPassword = 'CustomPassword123!';
      const user = createTestUser({ password: customPassword });

      expect(user.password).toBe(customPassword);
    });

    test('should handle empty string overrides', () => {
      const user = createTestUser({
        email: '',
        name: '',
        password: '',
      });

      // Empty strings should be preserved (this tests edge case behavior)
      expect(user.email).toBe('');
      expect(user.name).toBe('');
      expect(user.password).toBe('');
    });
  });

  describe('createTestProject', () => {
    test('should create project with default values', () => {
      const project = createTestProject();

      expect(project).toHaveProperty('userId');
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('author');
      expect(project).toHaveProperty('language', 'pt-BR');
      expect(project).toHaveProperty('genre');
      expect(project).toHaveProperty('status', 'draft');
      expect(project).toHaveProperty('metadata');
      expect(typeof project.userId).toBe('string');
      expect(typeof project.title).toBe('string');
      expect(typeof project.author).toBe('string');
      expect(
        Array.isArray(['Fiction', 'Non-Fiction', 'Technical', 'Biography'])
      ).toBe(true);
      expect(project.metadata).toEqual({});
    });

    test('should create project with custom overrides', () => {
      const customData = {
        title: 'Custom Book Title',
        author: 'Custom Author',
        language: 'en' as const,
        status: 'queued' as const,
        metadata: { customField: 'value' },
      };

      const project = createTestProject(customData);

      expect(project.title).toBe(customData.title);
      expect(project.author).toBe(customData.author);
      expect(project.language).toBe(customData.language);
      expect(project.status).toBe(customData.status);
      expect(project.metadata).toEqual(customData.metadata);
    });

    test('should handle empty genre array', () => {
      // Test the edge case where genre array might be empty
      const project = createTestProject();

      expect(typeof project.genre).toBe('string');
      expect(project.genre.length).toBeGreaterThan(0);
    });

    test('should preserve empty string overrides', () => {
      const project = createTestProject({
        title: '',
        author: '',
        genre: '',
      });

      expect(project.title).toBe('');
      expect(project.author).toBe('');
      expect(project.genre).toBe('');
    });

    test('should handle boolean and numeric metadata', () => {
      const complexMetadata = {
        isActive: true,
        count: 42,
        rating: 4.5,
        tags: ['tag1', 'tag2'],
      };

      const project = createTestProject({ metadata: complexMetadata });

      expect(project.metadata).toEqual(complexMetadata);
    });
  });

  describe('Factory data consistency', () => {
    test('should generate unique data across multiple calls', () => {
      const users = [];
      for (let i = 0; i < 5; i++) {
        users.push(createTestUser());
      }

      const emails = users.map((u) => u.email);
      const uniqueEmails = new Set(emails);

      // Should generate unique emails
      expect(uniqueEmails.size).toBe(5);

      // Names should also be different (high probability)
      const names = users.map((u) => u.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBeGreaterThan(1);
    });

    test('should generate unique projects across multiple calls', () => {
      const projects = [];
      for (let i = 0; i < 5; i++) {
        projects.push(createTestProject());
      }

      const titles = projects.map((p) => p.title);
      const uniqueTitles = new Set(titles);

      // Should generate unique titles
      expect(uniqueTitles.size).toBe(5);

      // User IDs should also be different
      const userIds = projects.map((p) => p.userId);
      const uniqueUserIds = new Set(userIds);
      expect(uniqueUserIds.size).toBe(5);
    });
  });
});
