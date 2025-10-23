import { test, expect } from '../support/fixtures';

/**
 * E2E Tests Demonstrating Network-First Patterns
 *
 * These tests showcase the improved architecture with:
 * 1. Network-first patterns to prevent race conditions
 * 2. Reusable fixture architecture to eliminate DRY violations
 * 3. Common test scenarios for better maintainability
 */

test.describe('1.2-E2E-NetworkFirst: Network-First Pattern Tests', () => {
  test('1.2-E2E-001 [P2]: should create user with network-first pattern', async ({
    userFactory,
  }) => {
    // GIVEN: Network-first user factory is ready
    // WHEN: Creating a test user with network interception
    const user = await userFactory.createUser({
      name: 'Network Test User',
      tier: 'pro'
    });

    // THEN: User is created successfully without race conditions
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.name).toBe('Network Test User');
    expect(user.tier).toBe('pro');
    expect(user.password).toBeDefined(); // Password available for testing
  });

  test('1.2-E2E-002 [P2]: should create project with network-first pattern', async ({
    projectFactory,
  }) => {
    // GIVEN: Network-first project factory is ready
    // WHEN: Creating a test project with network interception
    const project = await projectFactory.createProject({
      title: 'Network Test Audiobook',
      language: 'pt-BR',
      status: 'draft'
    });

    // THEN: Project is created successfully without race conditions
    expect(project.id).toBeDefined();
    expect(project.title).toBe('Network Test Audiobook');
    expect(project.language).toBe('pt-BR');
    expect(project.status).toBe('draft');
    expect(project.userId).toBeDefined();
  });

  test('1.2-E2E-003 [P1]: should demonstrate reusable test scenarios', async ({
    testScenarios,
    request,
  }) => {
    // GIVEN: Test scenarios are available for DRY patterns
    // WHEN: Creating multiple users with different tiers
    const { freeUser, proUser, enterpriseUser } = await testScenarios.createTieredUsers({
      request,
    });

    // THEN: All users are created with correct tiers
    expect(freeUser.user.tier).toBe('free');
    expect(proUser.user.tier).toBe('pro');
    expect(enterpriseUser.user.tier).toBe('enterprise');

    // THEN: All users have valid authentication tokens
    expect(freeUser.token).toBeDefined();
    expect(proUser.token).toBeDefined();
    expect(enterpriseUser.token).toBeDefined();
  });

  test('1.2-E2E-004 [P1]: should create complete user setup with API key using network-first', async ({
    testScenarios,
    request,
  }) => {
    // GIVEN: Test scenarios are available
    // WHEN: Creating a complete user setup with API key
    const { user, apiKey, token } = await testScenarios.createUserWithApiKey(
      { request },
      {
        name: 'Complete Test User',
        tier: 'enterprise'
      },
      {
        name: 'Test API Key',
        scopes: ['read', 'write', 'admin']
      }
    );

    // THEN: Complete setup is created successfully
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Complete Test User');
    expect(user.tier).toBe('enterprise');

    expect(apiKey.key).toBeDefined();
    expect(apiKey.name).toBe('Test API Key');
    expect(apiKey.scopes).toEqual(['read', 'write', 'admin']);

    expect(token).toBeDefined();
  });

  test('1.2-E2E-005 [P2]: should handle multiple concurrent operations without race conditions', async ({
    userFactory,
    projectFactory,
  }) => {
    // GIVEN: Factories with network-first patterns are ready
    // WHEN: Creating multiple resources concurrently
    const [users, projects] = await Promise.all([
      userFactory.createUsers(3),
      projectFactory.createProjects(2),
    ]);

    // THEN: All resources are created successfully without race conditions
    expect(users).toHaveLength(3);
    expect(projects).toHaveLength(2);

    users.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    projects.forEach(project => {
      expect(project.id).toBeDefined();
      expect(project.title).toBeDefined();
    });
  });

  test('1.2-E2E-006 [P2]: should demonstrate fixture auto-cleanup with network-first patterns', async ({
    userFactory,
    projectFactory,
    apiUser,
    apiKey,
  }) => {
    // GIVEN: All fixtures are available with auto-cleanup
    // WHEN: Creating test resources
    const user = await userFactory.createUser();
    const project = await projectFactory.createProject();

    // THEN: Resources are created and accessible via fixtures
    expect(user.id).toBeDefined();
    expect(project.id).toBeDefined();
    expect(apiUser.id).toBeDefined();
    expect(apiKey).toBeDefined();

    // Note: Cleanup happens automatically after test completion
    // No manual cleanup required - fixtures handle it
  });

  test('1.2-E2E-007 [P3]: should demonstrate consistent error handling in network-first patterns', async ({
    userFactory,
  }) => {
    // GIVEN: Network-first factory with proper error handling
    // WHEN: Attempting to create user with invalid data
    try {
      await userFactory.createUser({
        email: 'invalid-email', // Invalid email format
        name: '',
      });

      // If we reach here, the test should fail
      expect(true).toBe(false); // This should not execute
    } catch (error) {
      // THEN: Proper error handling with network-first patterns
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Failed to create user');
    }
  });
});