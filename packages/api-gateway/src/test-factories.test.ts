import { describe, expect, it } from 'bun:test';
import {
  createTestUser,
  createTestProject,
  TEST_PASSWORDS,
  TEST_API_KEYS,
  TEST_PROJECTS,
} from './test-factories';

// Helper functions to reduce callback nesting
const expectUserCreationToFail = (
  field: string,
  value: any,
  expectedError: string
): void => {
  expect(() => createTestUser({ [field]: value })).toThrow(expectedError);
};

const expectProjectCreationToFail = (
  field: string,
  value: any,
  expectedError: string
): void => {
  expect(() => createTestProject({ [field]: value })).toThrow(expectedError);
};

describe('Test Factories', () => {
  describe('createTestUser', () => {
    it('1.5-FACT-USER-001 [P1]: should create valid user factory with defaults', () => {
      // When: Creating a test user with default values
      const user = createTestUser();

      // Then: Should have valid default structure
      expect(user.email).toMatch(/@/); // Should contain @ symbol (faker uses gmail.com, yahoo.com, etc.)
      expect(user.name).toBeTruthy();
      expect(user.password).toHaveLength(16);
      expect(user.tier).toBe('free');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(typeof user.tier).toBe('string');
    });

    it('1.5-FACT-USER-002 [P1]: should create user factory with overrides', () => {
      // Given: Custom user data
      const customData = {
        email: 'custom@example.com',
        tier: 'pro' as const,
        name: 'Custom User Name',
      };

      // When: Creating a test user with overrides
      const user = createTestUser(customData);

      // Then: Should use overridden values
      expect(user.email).toBe('custom@example.com');
      expect(user.tier).toBe('pro');
      expect(user.name).toBe('Custom User Name');
      expect(user.password).toHaveLength(16); // Default still applies
    });

    it('1.5-FACT-USER-003 [P1]: should validate user factory email field', () => {
      // Then: Should reject invalid emails
      expectUserCreationToFail(
        'email',
        'invalid',
        'Email must contain @ symbol'
      );
      expectUserCreationToFail('email', '', 'Email must be a non-empty string');
      expectUserCreationToFail(
        'email',
        null as any,
        'Email must be a non-empty string'
      );
      expectUserCreationToFail(
        'email',
        undefined as any,
        'Email must be a non-empty string'
      );
    });

    it('1.5-FACT-USER-004 [P1]: should validate user factory name field', () => {
      // Then: Should reject invalid names
      expectUserCreationToFail('name', '', 'Name must be a non-empty string');
      expectUserCreationToFail(
        'name',
        null as any,
        'Name must be a non-empty string'
      );
      expectUserCreationToFail(
        'name',
        undefined as any,
        'Name must be a non-empty string'
      );
    });

    it('1.5-FACT-USER-005 [P1]: should validate user factory password field', () => {
      // Then: Should reject invalid passwords
      expectUserCreationToFail(
        'password',
        'short',
        'Password must be exactly 16 characters'
      );
      expectUserCreationToFail(
        'password',
        'toolong1234567890',
        'Password must be exactly 16 characters'
      );
      expectUserCreationToFail(
        'password',
        null as any,
        'Password must be a non-empty string'
      );
      expectUserCreationToFail(
        'password',
        undefined as any,
        'Password must be a non-empty string'
      );
    });

    it('1.5-FACT-USER-006 [P1]: should validate user factory tier field', () => {
      // Then: Should reject invalid tiers
      expectUserCreationToFail(
        'tier',
        'invalid' as any,
        'Tier must be one of: free, pro, enterprise'
      );
      expectUserCreationToFail(
        'tier',
        'premium' as any,
        'Tier must be one of: free, pro, enterprise'
      );
      expectUserCreationToFail(
        'tier',
        null as any,
        'Tier must be one of: free, pro, enterprise'
      );
    });

    it('1.5-FACT-USER-007 [P2]: should create unique users on multiple calls', () => {
      // When: Creating multiple users
      const user1 = createTestUser();
      const user2 = createTestUser();
      const user3 = createTestUser();

      // Then: Should have unique values
      expect(user1.email).not.toBe(user2.email);
      expect(user2.email).not.toBe(user3.email);
      expect(user1.email).not.toBe(user3.email);
      expect(user1.name).not.toBe(user2.name);
      expect(user2.name).not.toBe(user3.name);
      expect(user1.name).not.toBe(user3.name);
    });
  });

  describe('createTestProject', () => {
    it('1.5-FACT-PROJ-001 [P1]: should create valid project factory with defaults', () => {
      // When: Creating a test project with default values
      const project = createTestProject();

      // Then: Should have valid default structure
      expect(project.userId).toBeTruthy();
      expect(project.title).toBeTruthy();
      expect(project.language).toBe('pt-BR');
      expect(project.status).toBe('draft');
      expect(typeof project.author).toBe('string');
      expect(typeof project.genre).toBe('string');
      expect(typeof project.metadata).toBe('object');
      expect(Array.isArray(project.metadata)).toBe(false);
    });

    it('1.5-FACT-PROJ-002 [P1]: should create project factory with overrides', () => {
      // Given: Custom project data
      const customData = {
        userId: 'custom-user-id',
        title: 'Custom Project Title',
        author: null,
        language: 'en' as const,
        genre: 'Science Fiction',
        status: 'completed' as const,
      };

      // When: Creating a test project with overrides
      const project = createTestProject(customData);

      // Then: Should use overridden values
      expect(project.userId).toBe('custom-user-id');
      expect(project.title).toBe('Custom Project Title');
      expect(project.author).toBeNull();
      expect(project.language).toBe('en');
      expect(project.genre).toBe('Science Fiction');
      expect(project.status).toBe('completed');
    });

    it('1.5-FACT-PROJ-003 [P1]: should validate project factory userId field', () => {
      // Then: Should reject invalid userIds
      expectProjectCreationToFail(
        'userId',
        '',
        'User ID must be a non-empty string'
      );
      expectProjectCreationToFail(
        'userId',
        null as any,
        'User ID must be a non-empty string'
      );
      expectProjectCreationToFail(
        'userId',
        undefined as any,
        'User ID must be a non-empty string'
      );
    });

    it('1.5-FACT-PROJ-004 [P1]: should validate project factory title field', () => {
      // Then: Should reject invalid titles
      expectProjectCreationToFail(
        'title',
        '',
        'Title must be a non-empty string'
      );
      expectProjectCreationToFail(
        'title',
        null as any,
        'Title must be a non-empty string'
      );
      expectProjectCreationToFail(
        'title',
        undefined as any,
        'Title must be a non-empty string'
      );
    });

    it('1.5-FACT-PROJ-005 [P1]: should validate project factory language field', () => {
      // Then: Should reject invalid languages
      expectProjectCreationToFail(
        'language',
        'invalid' as any,
        'Language must be one of: pt-BR, en'
      );
      expectProjectCreationToFail(
        'language',
        'es' as any,
        'Language must be one of: pt-BR, en'
      );
      expectProjectCreationToFail(
        'language',
        null as any,
        'Language must be one of: pt-BR, en'
      );
    });

    it('1.5-FACT-PROJ-006 [P2]: should handle nullable author field correctly', () => {
      // When: Creating projects with different author values
      const projectWithAuthor = createTestProject({ author: 'Valid Author' });
      const projectWithoutAuthor = createTestProject({ author: null });

      // Then: Should handle author field correctly
      expect(projectWithAuthor.author).toBe('Valid Author');
      expect(projectWithoutAuthor.author).toBeNull();

      // Note: Empty string author is not allowed by validation, but null is allowed
      expectProjectCreationToFail(
        'author',
        '',
        'Author must be a non-empty string'
      );
    });

    it('1.5-FACT-PROJ-007 [P2]: should create unique projects on multiple calls', () => {
      // When: Creating multiple projects
      const project1 = createTestProject();
      const project2 = createTestProject();
      const project3 = createTestProject();

      // Then: Should have unique values
      expect(project1.userId).not.toBe(project2.userId);
      expect(project2.userId).not.toBe(project3.userId);
      expect(project1.title).not.toBe(project2.title);
      expect(project2.title).not.toBe(project3.title);
    });
  });

  describe('TEST_PASSWORDS constants', () => {
    it('1.5-FACT-PASS-001 [P1]: should contain all required test passwords', () => {
      // Then: Should have all expected password keys
      const expectedKeys = [
        'VALID_USER',
        'VALID_PRO',
        'VALID_ENTERPRISE',
        'ADMIN',
        'INVALID',
        'SHORT',
        'EMPTY',
      ];

      for (const key of expectedKeys) {
        expect(TEST_PASSWORDS).toHaveProperty(key);
        expect(typeof TEST_PASSWORDS[key as keyof typeof TEST_PASSWORDS]).toBe(
          'string'
        );
      }
    });

    it('1.5-FACT-PASS-002 [P1]: should have valid user passwords with correct length', () => {
      // Then: Valid passwords should be exactly 17 characters
      expect(TEST_PASSWORDS.VALID_USER).toHaveLength(17);
      expect(TEST_PASSWORDS.VALID_PRO).toHaveLength(17);
      expect(TEST_PASSWORDS.VALID_ENTERPRISE).toHaveLength(17);
      expect(TEST_PASSWORDS.ADMIN).toHaveLength(17);
    });

    it('1.5-FACT-PASS-003 [P1]: should have test passwords for invalid scenarios', () => {
      // Then: Invalid passwords should be clearly invalid
      expect(TEST_PASSWORDS.INVALID).not.toHaveLength(17);
      expect(TEST_PASSWORDS.SHORT.length).toBeLessThan(17);
      expect(TEST_PASSWORDS.EMPTY).toBe('');
    });

    it('1.5-FACT-PASS-004 [P2]: should have unique passwords for different user types', () => {
      // When: Getting all password values
      const passwords = Object.values(TEST_PASSWORDS);

      // Then: All passwords should be unique
      const uniquePasswords = [...new Set(passwords)];
      expect(uniquePasswords).toHaveLength(passwords.length);
    });
  });

  describe('TEST_API_KEYS constants', () => {
    it('1.5-FACT-API-001 [P1]: should contain all required test API keys', () => {
      // Then: Should have all expected API key types
      const expectedKeys = ['VALID', 'INVALID', 'EXPIRED', 'EMPTY'];

      for (const key of expectedKeys) {
        expect(TEST_API_KEYS).toHaveProperty(key);
        expect(typeof TEST_API_KEYS[key as keyof typeof TEST_API_KEYS]).toBe(
          'string'
        );
      }
    });

    it('1.5-FACT-API-002 [P2]: should have valid and invalid API key formats', () => {
      // Then: Should have different key formats for testing
      expect(TEST_API_KEYS.VALID).toBeTruthy();
      expect(TEST_API_KEYS.INVALID).toBeTruthy();
      expect(TEST_API_KEYS.EXPIRED).toBeTruthy();
      expect(TEST_API_KEYS.EMPTY).toBe('');
    });
  });

  describe('TEST_PROJECTS constants', () => {
    it('1.5-FACT-PROJ-CONST-001 [P1]: should contain all required test project templates', () => {
      // Then: Should have all expected project templates
      const expectedKeys = ['BASIC', 'EMPTY_AUTHOR', 'COMPLETED'];

      for (const key of expectedKeys) {
        expect(TEST_PROJECTS).toHaveProperty(key);
        expect(typeof TEST_PROJECTS[key as keyof typeof TEST_PROJECTS]).toBe(
          'object'
        );
      }
    });

    it('1.5-FACT-PROJ-CONST-002 [P1]: should have valid project structure in templates', () => {
      // When: Checking each project template
      for (const project of Object.values(TEST_PROJECTS)) {
        // Then: Each template should have required fields
        expect(project).toHaveProperty('userId');
        expect(project).toHaveProperty('title');
        expect(project).toHaveProperty('author');
        expect(project).toHaveProperty('language');
        expect(project).toHaveProperty('genre');
        expect(project).toHaveProperty('status');
        expect(project).toHaveProperty('metadata');

        // And: Should have valid types
        expect(typeof project.userId).toBe('string');
        expect(typeof project.title).toBe('string');
        expect(['string', 'object']).toContain(typeof project.author);
        expect(typeof project.language).toBe('string');
        expect(typeof project.genre).toBe('string');
        expect(typeof project.status).toBe('string');
        expect(typeof project.metadata).toBe('object');
      }
    });

    it('1.5-FACT-PROJ-CONST-003 [P2]: should have different project scenarios represented', () => {
      // Then: Should represent different project states
      expect(TEST_PROJECTS.BASIC.status).toBe('draft');
      expect(TEST_PROJECTS.EMPTY_AUTHOR.author).toBeNull();
      expect(TEST_PROJECTS.COMPLETED.status).toBe('completed');
      expect(TEST_PROJECTS.BASIC.language).toBe('pt-BR');
      expect(TEST_PROJECTS.EMPTY_AUTHOR.language).toBe('en');
    });
  });

  describe('Factory Integration', () => {
    it('1.5-FACT-INTEGRATION-001 [P2]: should work with multiple factory combinations', () => {
      // Given: Multiple users and projects
      const user1 = createTestUser({ tier: 'pro' });
      const user2 = createTestUser({ tier: 'enterprise' });

      const project1 = createTestProject({
        userId: user1.email,
        status: 'draft' as const,
      });
      const project2 = createTestProject({
        userId: user2.email,
        status: 'completed' as const,
      });

      // Then: Should maintain relationships correctly
      expect(project1.userId).toBe(user1.email);
      expect(project2.userId).toBe(user2.email);
      expect(project1.status).toBe('draft');
      expect(project2.status).toBe('completed');
    });

    it('1.5-FACT-INTEGRATION-002 [P2]: should handle edge cases in factory combinations', () => {
      // When: Creating users with special characters
      const userWithSpecialChars = createTestUser({
        name: 'José María García López',
        email: 'user+test@example.com',
      });

      // Then: Should handle special characters correctly
      expect(userWithSpecialChars.name).toBe('José María García López');
      expect(userWithSpecialChars.email).toBe('user+test@example.com');
    });
  });

  // Additional tests to improve mutation testing score
  describe('Mutation Testing Edge Cases', () => {
    describe('Enhanced Validation Tests', () => {
      it('should test email validation with various formats', () => {
        // Test valid emails that should work
        const validEmails = [
          'user@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'firstname.lastname@company.com',
          '123user@example.com',
          'test.email@example.com',
        ];

        for (const email of validEmails) {
          expect(() => createTestUser({ email })).not.toThrow();
        }
      });

      it('should test tier validation thoroughly', () => {
        // Test all valid tiers
        const validTiers = ['free', 'pro', 'enterprise'];
        for (const tier of validTiers) {
          const user = createTestUser({ tier: tier as any });
          expect(user.tier).toBe(tier);
        }

        // Test invalid tiers
        const invalidTiers = [
          'Free', // case sensitive
          'FREE',
          'premium',
          'basic',
          'admin',
          'super',
          null,
          undefined,
          123,
        ];

        for (const tier of invalidTiers) {
          expect(() => createTestUser({ tier: tier as any })).toThrow();
        }
      });

      it('should test project field combinations', () => {
        // Test different valid combinations
        const validProjects = [
          { language: 'en' as const, status: 'draft' as const },
          { language: 'pt-BR' as const, status: 'completed' as const },
          { language: 'en' as const, status: 'processing' as const },
          { language: 'pt-BR' as const, status: 'failed' as const },
        ];

        for (const projectData of validProjects) {
          expect(() => createTestProject(projectData)).not.toThrow();
        }
      });

      it('should test multiple field validations together', () => {
        // Test multiple valid overrides for users
        const user = createTestUser({
          email: 'test@example.com',
          name: 'Test User',
          tier: 'pro',
        });
        expect(user.email).toBe('test@example.com');
        expect(user.name).toBe('Test User');
        expect(user.tier).toBe('pro');

        // Test multiple project overrides
        const project = createTestProject({
          title: 'Test Project',
          author: 'Test Author',
          language: 'en',
          status: 'completed',
          genre: 'Fiction',
          metadata: { chapters: 10 },
        });
        expect(project.title).toBe('Test Project');
        expect(project.author).toBe('Test Author');
        expect(project.language).toBe('en');
        expect(project.status).toBe('completed');
        expect(project.genre).toBe('Fiction');
        expect(project.metadata).toEqual({ chapters: 10 });
      });

      it('should test boundary conditions for unique generation', () => {
        // Create many users to test uniqueness
        const users = Array.from({ length: 10 }, () => createTestUser());
        const emails = users.map((u) => u.email);
        const uniqueEmails = new Set(emails);
        expect(uniqueEmails.size).toBe(10);

        // Create many projects to test uniqueness
        const projects = Array.from({ length: 10 }, () => createTestProject());
        const userIds = projects.map((p) => p.userId);
        const uniqueUserIds = new Set(userIds);
        expect(uniqueUserIds.size).toBe(10);
      });

      it('should test genre and metadata combinations', () => {
        // Test various genre and metadata combinations
        const testCases = [
          { genre: 'Fiction', metadata: { chapters: 10 } },
          { genre: 'Non-Fiction', metadata: { wordCount: 50000 } },
          { genre: null, metadata: {} },
          {
            genre: 'Science Fiction',
            metadata: { published: true, ratings: [5, 4] },
          },
        ];

        for (const testCase of testCases) {
          const project = createTestProject(testCase);
          expect(project.genre).toBe(testCase.genre);
          expect(project.metadata).toEqual(testCase.metadata);
        }
      });
    });
  });
});
