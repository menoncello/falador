import { test as base, expect } from '@playwright/test';
import {
  createAudioFile,
  createAudioFilesForProject,
  createCompletedAudioFile,
} from '../factories/audio-file.factory';
import {
  createProject,
  createProjects,
  createProjectsForUser,
} from '../factories/project.factory';
import {
  createUser,
  createUsers,
  createProUser,
  createEnterpriseUser,
} from '../factories/user.factory';
import {
  createVoice,
  createVoices,
  createOpenAIVoices,
} from '../factories/voice.factory';

/**
 * Clean Architecture Test Fixtures
 *
 * Fixtures that provide test data and utilities for Clean Architecture tests.
 * All fixtures include auto-cleanup and follow the pure function → fixture pattern.
 */

// Type definitions for test data
export type TestUser = ReturnType<typeof createUser>;
export type TestProject = ReturnType<typeof createProject>;
export type TestVoice = ReturnType<typeof createVoice>;
export type TestAudioFile = ReturnType<typeof createAudioFile>;

export const test = base.extend<{
  // User fixtures
  userFactory: typeof createUser;
  proUserFactory: typeof createProUser;
  enterpriseUserFactory: typeof createEnterpriseUser;
  multipleUsersFactory: typeof createUsers;

  // Project fixtures
  projectFactory: typeof createProject;
  projectsForUserFactory: typeof createProjectsForUser;
  multipleProjectsFactory: typeof createProjects;

  // Voice fixtures
  voiceFactory: typeof createVoice;
  openAIVoicesFactory: typeof createOpenAIVoices;
  multipleVoicesFactory: typeof createVoices;

  // Audio file fixtures
  audioFileFactory: typeof createAudioFile;
  audioFilesForProjectFactory: typeof createAudioFilesForProject;
  completedAudioFileFactory: typeof createCompletedAudioFile;

  // Integration fixtures
  cleanTestData: () => Promise<void>;
}>({
  // User fixtures
  userFactory: [
    async ({}, use) => {
      await use(createUser);
    },
    { scope: 'test' },
  ],

  proUserFactory: [
    async ({}, use) => {
      await use(createProUser);
    },
    { scope: 'test' },
  ],

  enterpriseUserFactory: [
    async ({}, use) => {
      await use(createEnterpriseUser);
    },
    { scope: 'test' },
  ],

  multipleUsersFactory: [
    async ({}, use) => {
      await use(createUsers);
    },
    { scope: 'test' },
  ],

  // Project fixtures
  projectFactory: [
    async ({}, use) => {
      await use(createProject);
    },
    { scope: 'test' },
  ],

  projectsForUserFactory: [
    async ({}, use) => {
      await use(createProjectsForUser);
    },
    { scope: 'test' },
  ],

  multipleProjectsFactory: [
    async ({}, use) => {
      await use(createProjects);
    },
    { scope: 'test' },
  ],

  // Voice fixtures
  voiceFactory: [
    async ({}, use) => {
      await use(createVoice);
    },
    { scope: 'test' },
  ],

  openAIVoicesFactory: [
    async ({}, use) => {
      await use(createOpenAIVoices);
    },
    { scope: 'test' },
  ],

  multipleVoicesFactory: [
    async ({}, use) => {
      await use(createVoices);
    },
    { scope: 'test' },
  ],

  // Audio file fixtures
  audioFileFactory: [
    async ({}, use) => {
      await use(createAudioFile);
    },
    { scope: 'test' },
  ],

  audioFilesForProjectFactory: [
    async ({}, use) => {
      await use(createAudioFilesForProject);
    },
    { scope: 'test' },
  ],

  completedAudioFileFactory: [
    async ({}, use) => {
      await use(createCompletedAudioFile);
    },
    { scope: 'test' },
  ],

  // Integration fixture for test cleanup
  cleanTestData: [
    async ({ request }, use) => {
      const cleanupQueue: Array<() => Promise<void>> = [];

      // Register cleanup function
      const addToCleanup = (cleanupFn: () => Promise<void>) => {
        cleanupQueue.push(cleanupFn);
      };

      // Provide cleanup function that can register cleanup tasks
      await use(async () => {
        // When called, add the provided function to cleanup queue
        return addToCleanup;
      });

      // Execute all cleanup tasks after test
      for (const cleanupFn of cleanupQueue) {
        try {
          await cleanupFn();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      }
    },
    { scope: 'test' },
  ],
});

// Helper fixtures for common test scenarios
export const testWithData = base.extend<{
  // Complete user scenario
  userWithProjects: {
    user: TestUser;
    projects: TestProject[];
  };
  // Audio generation scenario
  audioGenerationScenario: {
    user: TestUser;
    project: TestProject;
    voice: TestVoice;
    audioFiles: TestAudioFile[];
  };
}>({
  userWithProjects: [
    async ({ userFactory, projectsForUserFactory }, use) => {
      const user = userFactory();
      const projects = projectsForUserFactory(user.id, {
        draft: 1,
        in_progress: 1,
        completed: 2,
      });

      await use({ user, projects });
    },
    { scope: 'test' },
  ],

  audioGenerationScenario: [
    async (
      {
        userFactory,
        projectFactory,
        voiceFactory,
        audioFilesForProjectFactory,
      },
      use
    ) => {
      const user = userFactory();
      const project = projectFactory({
        userId: user.id,
        status: 'in_progress',
      });
      const voice = voiceFactory({ provider: 'openai' });
      const audioFiles = audioFilesForProjectFactory(project.id, {
        pending: 1,
        processing: 1,
        completed: 3,
      });

      await use({ user, project, voice, audioFiles });
    },
    { scope: 'test' },
  ],
});

// Re-export for convenience
export { expect };

// Utility functions for Clean Architecture testing
export const cleanArchitectureTestUtils = {
  // Verify layer isolation
  verifyDomainLayerHasNoExternalDeps: (domainCode: string) => {
    const externalImports = [
      'import.*from.*drizzle-orm',
      'import.*from.*postgres',
      'import.*from.*elysia',
      'import.*from.*tsyringe',
      'import.*from.*axios',
      'import.*from.*aws-sdk',
    ];

    for (const pattern of externalImports) {
      expect(domainCode).not.toMatch(new RegExp(pattern));
    }
  },

  // Verify dependency injection usage
  verifyDependencyInjection: (code: string) => {
    expect(code).toMatch(/constructor.*\(/);
    expect(code).toMatch(/@inject\(|@injectable\(\)|container\.resolve\(/);
  },

  // Verify repository pattern
  verifyRepositoryPattern: (
    interfaceCode: string,
    implementationCode: string
  ) => {
    expect(interfaceCode).toMatch(/interface.*Repository/);
    expect(implementationCode).toMatch(/class.*Repository.*implements/);
    expect(implementationCode).toMatch(/constructor.*\(/);
  },

  // Verify Clean Architecture folder structure
  verifyFolderStructure: (files: string[]) => {
    const expectedPatterns = [
      /packages\/core-domain\/src/,
      /packages\/application\/src/,
      /packages\/infrastructure\/src/,
      /packages\/api-gateway\/src/,
      /packages\/cli\/src/,
    ];

    for (const pattern of expectedPatterns) {
      expect(files.some((file) => pattern.test(file))).toBe(true);
    }
  },
};

// Export the extended test fixtures
export default test;
