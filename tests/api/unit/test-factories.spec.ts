import { describe, test, expect } from 'bun:test';
import {
  createTestUser,
  createTestProject,
  TEST_PASSWORDS,
  UserFactoryData,
  ProjectFactoryData,
} from '../../../packages/api-gateway/src/test-factories';

// Safe email validation function
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;

  // Basic email validation (simple validation without complex regex)
  const hasAtSymbol = email.includes('@');
  const hasDot = email.includes('.');
  return hasAtSymbol && hasDot;
}

describe('Test Factories', () => {
  describe('createTestUser', () => {
    test('should generate user with all required fields', () => {
      // WHEN: Creating test user
      const user = createTestUser();

      // THEN: User should have all required fields
      expect(user).toBeDefined();
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(['free', 'pro', 'enterprise']).toContain(user.tier);
    });

    test('should generate valid email addresses', () => {
      // WHEN: Creating test user
      const user = createTestUser();

      // THEN: Email should be valid
      expect(isValidEmail(user.email)).toBe(true);
    });

    test('should generate different users each time', () => {
      // WHEN: Creating multiple test users
      const user1 = createTestUser();
      const user2 = createTestUser();

      // THEN: Users should be different
      expect(user1.email).not.toBe(user2.email);
      expect(user1.name).not.toBe(user2.name);
    });

    test('should accept custom data', () => {
      // WHEN: Creating user with custom data
      const customData: UserFactoryData = {
        email: 'custom@example.com',
        name: 'Custom User',
        tier: 'enterprise',
      };
      const user = createTestUser(customData);

      // THEN: Custom data should be used
      expect(user.email).toBe('custom@example.com');
      expect(user.name).toBe('Custom User');
      expect(user.tier).toBe('enterprise');
    });
  });

  describe('createTestProject', () => {
    test('should generate project with all required fields', () => {
      // WHEN: Creating test project
      const project = createTestProject();

      // THEN: Project should have all required fields
      expect(project).toBeDefined();
      expect(typeof project.userId).toBe('string');
      expect(typeof project.title).toBe('string');
      expect(typeof project.language).toBe('string');
      expect([
        'draft',
        'queued',
        'processing',
        'completed',
        'failed',
      ]).toContain(project.status);
      expect(typeof project.metadata).toBe('object');
    });

    test('should accept custom data', () => {
      // WHEN: Creating project with custom data
      const customData: ProjectFactoryData = {
        title: 'Custom Project',
        author: 'Custom Author',
        language: 'pt-BR',
        genre: 'Sci-Fi',
        status: 'processing',
      };
      const project = createTestProject(customData);

      // THEN: Custom data should be used
      expect(project.title).toBe('Custom Project');
      expect(project.author).toBe('Custom Author');
      expect(project.language).toBe('pt-BR');
      expect(project.genre).toBe('Sci-Fi');
      expect(project.status).toBe('processing');
    });

    test('should handle optional fields correctly', () => {
      // WHEN: Creating project with minimal data and setting optional fields to null
      const project = createTestProject({
        author: null,
        genre: null,
      });

      // THEN: Optional fields should be null when explicitly set
      expect(project.author).toBeNull();
      expect(project.genre).toBeNull();
    });
  });

  describe('TEST_PASSWORDS constant', () => {
    test('should contain all expected password constants', () => {
      // THEN: All expected constants are present
      expect(TEST_PASSWORDS).toMatchObject({
        VALID: expect.any(String),
        CORRECT: expect.any(String),
        WRONG: expect.any(String),
        INVALID: expect.any(String),
        SECURE: expect.any(String),
        STANDARD: expect.any(String),
        GENERIC: expect.any(String),
      });
    });

    test('should have valid password that meets requirements', () => {
      // THEN: Valid password should meet requirements
      expect(TEST_PASSWORDS.VALID.length).toBeGreaterThanOrEqual(8);
      expect(TEST_PASSWORDS.VALID.length).toBeLessThanOrEqual(128);
      expect(/[A-Z]/.test(TEST_PASSWORDS.VALID)).toBe(true);
      expect(/[a-z]/.test(TEST_PASSWORDS.VALID)).toBe(true);
      expect(/\d/.test(TEST_PASSWORDS.VALID)).toBe(true);
      expect(/[^\dA-Za-z]/.test(TEST_PASSWORDS.VALID)).toBe(true);
    });

    test('should have different password variants for testing', () => {
      // THEN: Should have different password variants
      expect(TEST_PASSWORDS.VALID).not.toBe(TEST_PASSWORDS.CORRECT);
      expect(TEST_PASSWORDS.VALID).not.toBe(TEST_PASSWORDS.WRONG);
      expect(TEST_PASSWORDS.CORRECT).not.toBe(TEST_PASSWORDS.WRONG);
      expect(TEST_PASSWORDS.SECURE).not.toBe(TEST_PASSWORDS.STANDARD);
    });
  });
});
