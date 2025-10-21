import {
  createTestUser,
  createTestProject,
  TEST_PASSWORDS,
} from '../../packages/api-gateway/src/test-factories';
import { test, expect } from '../support/fixtures';

/**
 * Test Data Factories Tests
 *
 * These tests validate the factory functions used to generate test data.
 * Ensures that factories produce valid, unique data for testing.
 */

test.describe('Test Factories', () => {
  test.describe('createTestUser', () => {
    test('should generate valid user data', () => {
      // WHEN: Creating test user data
      const userData = createTestUser();

      // THEN: All required fields are present and valid
      expect(userData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(userData.name).toBeTruthy();
      expect(userData.name.length).toBeGreaterThan(0);
      expect(userData.password).toBeTruthy();
      expect(userData.password.length).toBeGreaterThan(8);
      expect(userData.tier).toBe('free');
    });

    test('should generate unique emails', () => {
      // WHEN: Creating multiple test users
      const user1 = createTestUser();
      const user2 = createTestUser();

      // THEN: Emails are unique
      expect(user1.email).not.toBe(user2.email);
    });

    test('should accept overrides', () => {
      // GIVEN: Specific override values
      const overrides = {
        name: 'Test User',
        tier: 'pro' as const,
        email: 'test@example.com',
      };

      // WHEN: Creating test user with overrides
      const userData = createTestUser(overrides);

      // THEN: Override values are applied
      expect(userData.name).toBe('Test User');
      expect(userData.tier).toBe('pro');
      expect(userData.email).toBe('test@example.com');
    });

    test('should generate valid passwords by default', () => {
      // WHEN: Creating test user
      const userData = createTestUser();

      // THEN: Password meets complexity requirements
      expect(userData.password.length).toBeGreaterThanOrEqual(8);
      expect(userData.password).toMatch(/[a-z]/); // lowercase
      expect(userData.password).toMatch(/[A-Z]/); // uppercase
      expect(userData.password).toMatch(/\d/); // number
    });
  });

  test.describe('createTestProject', () => {
    test('should generate valid project data', () => {
      // WHEN: Creating test project data
      const projectData = createTestProject();

      // THEN: All required fields are present and valid
      expect(projectData.userId).toBeTruthy();
      expect(projectData.title).toBeTruthy();
      expect(projectData.title.length).toBeGreaterThan(0);
      expect(projectData.language).toBe('pt-BR');
      expect(projectData.status).toBe('draft');
      expect(projectData.metadata).toEqual({});
    });

    test('should accept all valid genres', () => {
      // WHEN: Creating multiple test projects
      const project1 = createTestProject();
      const project2 = createTestProject();
      const project3 = createTestProject();

      // THEN: Valid genres are assigned
      const validGenres = ['Fiction', 'Non-Fiction', 'Technical', 'Biography'];
      expect(validGenres).toContain(project1.genre);
      expect(validGenres).toContain(project2.genre);
      expect(validGenres).toContain(project3.genre);
    });

    test('should accept overrides', () => {
      // GIVEN: Specific override values
      const overrides = {
        title: 'Test Book',
        author: 'Test Author',
        language: 'en' as const,
        status: 'completed' as const,
      };

      // WHEN: Creating test project with overrides
      const projectData = createTestProject(overrides);

      // THEN: Override values are applied
      expect(projectData.title).toBe('Test Book');
      expect(projectData.author).toBe('Test Author');
      expect(projectData.language).toBe('en');
      expect(projectData.status).toBe('completed');
    });

    test('should handle optional fields', () => {
      // GIVEN: Override with null optional fields
      const overrides = {
        author: null,
        genre: null,
      };

      // WHEN: Creating test project
      const projectData = createTestProject(overrides);

      // THEN: Optional fields can be null
      expect(projectData.author).toBeNull();
      expect(projectData.genre).toBeNull();
    });
  });

  test.describe('TEST_PASSWORDS constants', () => {
    test('should provide valid test passwords', () => {
      // THEN: All test passwords meet complexity requirements
      for (const password of Object.values(TEST_PASSWORDS)) {
        expect(password.length).toBeGreaterThanOrEqual(8);
        expect(password).toMatch(/[a-z]/); // lowercase
        expect(password).toMatch(/[A-Z]/); // uppercase
        expect(password).toMatch(/\d/); // number
        expect(password).toMatch(/[!"#$%&()*,.:<>?@^{|}]/); // special char
      }
    });

    test('should provide unique passwords', () => {
      const passwords = Object.values(TEST_PASSWORDS);
      const uniquePasswords = [...new Set(passwords)];

      // THEN: All passwords are unique
      expect(passwords).toHaveLength(uniquePasswords.length);
    });
  });
});
