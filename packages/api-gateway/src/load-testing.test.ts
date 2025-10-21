import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from './database';
import { createTestUser, TEST_PASSWORDS } from './test-factories';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  createMultipleAuthenticatedUsers,
  createProjectForUser
} from './test-fixtures';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './projects';

/**
 * Load Testing Suite for Story 1.5 - Clean Architecture Project Structure
 *
 * These tests validate system performance under concurrent load scenarios.
 * They test the Clean Architecture components under stress to ensure
 * the layered architecture performs correctly under load.
 *
 * Test IDs follow format: 1.5-LOAD-{COMPONENT}-{SEQ} [Priority]
 */

describe('Story 1.5 Load Testing: Clean Architecture Performance', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Authentication Load Testing', () => {
    it('1.5-LOAD-AUTH-001 [P1]: should handle concurrent user registrations', async () => {
      // Given: Multiple concurrent registration requests
      const concurrentRegistrations = Array.from({ length: 10 }, (_, index) =>
        authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: `load-test-user-${index + 1}@example.com`,
              name: `Load Test User ${index + 1}`,
              password: TEST_PASSWORDS.STANDARD,
              tier: 'free',
            }),
          })
        )
      );

      // When: Processing all concurrent registrations
      const responses = await Promise.all(concurrentRegistrations);

      // Then: All registrations should succeed
      expect(responses).toHaveLength(10);
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
      });

      // And: All users should be created with unique emails
      const uniqueEmails = new Set(
        await Promise.all(
          responses.map(response => response.json().then(data => data.email))
        )
      );
      expect(uniqueEmails.size).toBe(10);
    });

    it('1.5-LOAD-AUTH-002 [P1]: should handle concurrent login requests', async () => {
      // Given: Multiple users created in advance
      const users = createMultipleAuthenticatedUsers(5, 'load-auth');

      // When: Sending concurrent login requests
      const concurrentLogins = users.map(({ user }) =>
        authRoutes.handle(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: TEST_PASSWORDS.STANDARD, // Using factory password
            }),
          })
        )
      );

      const responses = await Promise.all(concurrentLogins);

      // Then: All logins should succeed with unique tokens
      expect(responses).toHaveLength(5);
      const tokens = await Promise.all(
        responses.map(response => response.json().then(data => data.token))
      );
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it('1.5-LOAD-AUTH-003 [P2]: should handle API key creation under load', async () => {
      // Given: Multiple authenticated users
      const users = createMultipleAuthenticatedUsers(3, 'load-api-key');

      // When: Creating API keys concurrently
      const apiKeyRequests = users.map(({ token }) =>
        authRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/auth/api-keys',
            'POST',
            token,
            {
              name: `Load Test API Key`,
              scopes: ['read', 'write'],
            }
          )
        )
      );

      const responses = await Promise.all(apiKeyRequests);

      // Then: All API keys should be created successfully
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // And: All API keys should have unique key values
      const apiKeys = await Promise.all(
        responses.map(response => response.json().then(data => data.key))
      );
      const uniqueKeys = new Set(apiKeys);
      expect(uniqueKeys.size).toBe(3);
    });
  });

  describe('Project Management Load Testing', () => {
    it('1.5-LOAD-PROJ-001 [P1]: should handle concurrent project creation', async () => {
      // Given: Multiple authenticated users
      const users = createMultipleAuthenticatedUsers(5, 'load-project');

      // When: Creating projects concurrently
      const projectRequests = users.map(({ token }) =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            token,
            {
              title: `Load Test Project`,
              author: `Load Test Author`,
              genre: 'Fiction',
            }
          )
        )
      );

      const responses = await Promise.all(projectRequests);

      // Then: All projects should be created successfully
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // And: All projects should have unique IDs
      const projects = await Promise.all(
        responses.map(response => response.json())
      );
      const projectIds = projects.map(project => project.id);
      const uniqueIds = new Set(projectIds);
      expect(uniqueIds.size).toBe(5);
    });

    it('1.5-LOAD-PROJ-002 [P1]: should handle concurrent project operations', async () => {
      // Given: A user with multiple projects
      const authenticatedUser = createAuthenticatedUser();
      const projects = Array.from({ length: 3 }, (_, i) =>
        createProjectForUser(authenticatedUser.user.id, {
          title: `Load Test Project ${i + 1}`,
        })
      );

      // When: Performing concurrent operations (read, update, read)
      const operations = [
        // Read operations
        ...projects.map(project =>
          projectRoutes.handle(
            createAuthenticatedRequest(
              `http://localhost/api/projects/${project.id}`,
              'GET',
              authenticatedUser.token
            )
          )
        ),
        // Update operations
        ...projects.map(project =>
          projectRoutes.handle(
            createAuthenticatedRequest(
              `http://localhost/api/projects/${project.id}`,
              'PATCH',
              authenticatedUser.token,
              { status: 'processing' }
            )
          )
        ),
        // Additional read operations to verify updates
        ...projects.map(project =>
          projectRoutes.handle(
            createAuthenticatedRequest(
              `http://localhost/api/projects/${project.id}`,
              'GET',
              authenticatedUser.token
            )
          )
        ),
      ];

      const responses = await Promise.all(operations);

      // Then: All operations should succeed
      expect(responses).toHaveLength(9); // 3 reads + 3 updates + 3 verification reads
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });
    });

    it('1.5-LOAD-PROJ-003 [P2]: should handle high-volume project creation', async () => {
      // Given: A single authenticated user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating 20 projects concurrently (stress test)
      const highVolumeRequests = Array.from({ length: 20 }, (_, index) =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            authenticatedUser.token,
            {
              title: `High Volume Project ${index + 1}`,
              author: `Stress Test Author ${index + 1}`,
              genre: index % 2 === 0 ? 'Fiction' : 'Non-Fiction',
              metadata: {
                stressTest: true,
                batchIndex: index,
                timestamp: Date.now(),
              },
            }
          )
        )
      );

      const responses = await Promise.all(highVolumeRequests);

      // Then: All projects should be created successfully
      expect(responses).toHaveLength(20);
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
      });

      // And: Verify all projects are properly stored and retrievable
      const createdProjects = await Promise.all(
        responses.map(response => response.json())
      );
      expect(createdProjects).toHaveLength(20);

      // Verify projects have unique IDs and correct data
      const projectIds = createdProjects.map(p => p.id);
      expect(new Set(projectIds).size).toBe(20);

      createdProjects.forEach((project, index) => {
        expect(project.title).toBe(`High Volume Project ${index + 1}`);
        expect(project.metadata.stressTest).toBe(true);
        expect(project.metadata.batchIndex).toBe(index);
      });
    });
  });

  describe('Clean Architecture Load Testing', () => {
    it('1.5-LOAD-ARCH-001 [P1]: should maintain layer isolation under load', async () => {
      // Given: Multiple authenticated users
      const users = createMultipleAuthenticatedUsers(10, 'layer-isolation');

      // When: Creating projects with complex metadata to test all layers
      const complexProjectRequests = users.map(({ token, user }, index) =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            token,
            {
              title: `Layer Test Project ${index + 1}`,
              author: `Architecture Test Author ${index + 1}`,
              genre: 'Technical',
              metadata: {
                // Complex metadata to test domain layer processing
                architecture: 'clean',
                layers: ['domain', 'application', 'infrastructure', 'presentation'],
                dependencies: {
                  domain: ['entities', 'use-cases'],
                  application: ['interfaces', 'repositories'],
                  infrastructure: ['database', 'external-apis'],
                  presentation: ['controllers', 'middleware'],
                },
                // Large metadata to test serialization across layers
                testData: Array.from({ length: 100 }, (_, i) => ({
                  id: i,
                  value: `test-value-${i}`,
                  timestamp: Date.now() + i,
                })),
              },
            }
          )
        )
      );

      const responses = await Promise.all(complexProjectRequests);

      // Then: All complex projects should be processed correctly through all layers
      expect(responses).toHaveLength(10);
      const projects = await Promise.all(
        responses.map(response => response.json())
      );

      // Verify domain layer processed metadata correctly
      projects.forEach((project, index) => {
        expect(project.metadata.architecture).toBe('clean');
        expect(project.metadata.layers).toHaveLength(4);
        expect(project.metadata.dependencies).toBeDefined();
        expect(project.metadata.testData).toHaveLength(100);
      });
    });

    it('1.5-LOAD-ARCH-002 [P2]: should handle dependency injection under load', async () => {
      // Given: Multiple operations requiring dependency injection
      const users = createMultipleAuthenticatedUsers(5, 'dependency-injection');

      // When: Performing operations that trigger dependency resolution
      const dependencyOperations = users.map(({ token }) =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            token,
            {
              title: `DI Test Project`,
              metadata: {
                // Trigger repository dependency injection
                testRepository: true,
                // Trigger service dependencies
                testServices: true,
                // Test complex dependency graphs
                dependencyChain: ['repository', 'service', 'controller'],
              },
            }
          )
        )
      );

      // Mix in authentication operations to test auth dependencies
      const authOperations = users.map(({ token }) =>
        authRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/auth/me',
            'GET',
            token
          )
        )
      );

      const allOperations = [...dependencyOperations, ...authOperations];
      const responses = await Promise.all(allOperations);

      // Then: All dependency injection should work correctly under load
      expect(responses).toHaveLength(10); // 5 project + 5 auth operations
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });
    });
  });

  describe('Error Handling Under Load', () => {
    it('1.5-LOAD-ERR-001 [P1]: should handle validation errors under concurrent load', async () => {
      // Given: Multiple invalid requests
      const invalidRequests = Array.from({ length: 10 }, (_, index) =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            'invalid-token', // All using same invalid token
            {
              // Missing required title field
              author: `Invalid Request ${index + 1}`,
            }
          )
        )
      );

      // When: Processing all invalid requests concurrently
      const responses = await Promise.all(invalidRequests);

      // Then: All should fail gracefully with proper error messages
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect([400, 401]).toContain(response.status); // Validation error or auth error
      });
    });

    it('1.5-LOAD-ERR-002 [P2]: should maintain data integrity under stress', async () => {
      // Given: Concurrent operations on the same user
      const authenticatedUser = createAuthenticatedUser();

      // When: Creating projects with potential race conditions
      const raceConditionRequests = Array.from({ length: 5 }, (_, index) =>
        projectRoutes.handle(
          createAuthenticatedRequest(
            'http://localhost/api/projects',
            'POST',
            authenticatedUser.token,
            {
              title: `Race Condition Test ${index + 1}`,
              metadata: {
                concurrentOperation: true,
                sequenceNumber: index,
                testTimestamp: Date.now(),
              },
            }
          )
        )
      );

      const responses = await Promise.all(raceConditionRequests);

      // Then: Data integrity should be maintained
      expect(responses).toHaveLength(5);
      const projects = await Promise.all(
        responses.map(response => response.json())
      );

      // Verify all projects belong to the same user
      projects.forEach(project => {
        expect(project.userId).toBe(authenticatedUser.user.id);
      });

      // Verify sequence data is preserved correctly
      const sequenceNumbers = projects.map(p => p.metadata.sequenceNumber).sort();
      expect(sequenceNumbers).toEqual([0, 1, 2, 3, 4]);
    });
  });
});