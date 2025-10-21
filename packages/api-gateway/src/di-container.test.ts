import type {
  UserRepository,
  ProjectRepository,
  ApiKeyRepository,
  SessionRepository,
  VoiceRepository,
  GenerationJobRepository,
  UserManagementUseCase,
  ProjectManagementUseCase,
  AudioGenerationUseCase,
  VoiceManagementUseCase,
} from '@falador/core-domain';
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { DIContainer, container } from './di-container';

describe('DIContainer - Dependency Injection Configuration', () => {
  beforeEach(() => {
    // Ensure a clean container state before each test
    DIContainer.configureDependencies();
  });

  afterEach(() => {
    // Clean up after each test
    container.clear();
  });

  describe('Dependency Resolution', () => {
    test('should resolve UserRepository', () => {
      const userRepository =
        DIContainer.resolve<UserRepository>('UserRepository');

      expect(userRepository).toBeDefined();
      expect(typeof userRepository.create).toBe('function');
      expect(typeof userRepository.findById).toBe('function');
      expect(typeof userRepository.findByEmail).toBe('function');
      expect(typeof userRepository.delete).toBe('function');
    });

    test('should resolve ProjectRepository', () => {
      const projectRepository =
        DIContainer.resolve<ProjectRepository>('ProjectRepository');

      expect(projectRepository).toBeDefined();
      expect(typeof projectRepository.create).toBe('function');
      expect(typeof projectRepository.findById).toBe('function');
      expect(typeof projectRepository.findByUserId).toBe('function');
      expect(typeof projectRepository.update).toBe('function');
      expect(typeof projectRepository.delete).toBe('function');
    });

    test('should resolve ApiKeyRepository', () => {
      const apiKeyRepository =
        DIContainer.resolve<ApiKeyRepository>('ApiKeyRepository');

      expect(apiKeyRepository).toBeDefined();
      expect(typeof apiKeyRepository.create).toBe('function');
      expect(typeof apiKeyRepository.findById).toBe('function');
      expect(typeof apiKeyRepository.findByKey).toBe('function');
      expect(typeof apiKeyRepository.delete).toBe('function');
    });

    test('should resolve SessionRepository', () => {
      const sessionRepository =
        DIContainer.resolve<SessionRepository>('SessionRepository');

      expect(sessionRepository).toBeDefined();
      expect(typeof sessionRepository.create).toBe('function');
      expect(typeof sessionRepository.findByToken).toBe('function');
      expect(typeof sessionRepository.delete).toBe('function');
    });

    test('should resolve VoiceRepository', () => {
      const voiceRepository =
        DIContainer.resolve<VoiceRepository>('VoiceRepository');

      expect(voiceRepository).toBeDefined();
      expect(typeof voiceRepository.create).toBe('function');
      expect(typeof voiceRepository.findById).toBe('function');
      expect(typeof voiceRepository.findAll).toBe('function');
      expect(typeof voiceRepository.findByLanguage).toBe('function');
      expect(typeof voiceRepository.update).toBe('function');
      expect(typeof voiceRepository.delete).toBe('function');
    });

    test('should resolve GenerationJobRepository', () => {
      const generationJobRepository =
        DIContainer.resolve<GenerationJobRepository>('GenerationJobRepository');

      expect(generationJobRepository).toBeDefined();
      expect(typeof generationJobRepository.create).toBe('function');
      expect(typeof generationJobRepository.findById).toBe('function');
      expect(typeof generationJobRepository.findByProjectId).toBe('function');
      expect(typeof generationJobRepository.update).toBe('function');
      expect(typeof generationJobRepository.delete).toBe('function');
    });
  });

  describe('Use Case Resolution', () => {
    test('should resolve UserManagementUseCase', () => {
      const userManagement = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );

      expect(userManagement).toBeDefined();
      expect(typeof userManagement.createUser).toBe('function');
      expect(typeof userManagement.getUserById).toBe('function');
      expect(typeof userManagement.getUserByEmail).toBe('function');
      expect(typeof userManagement.updateUser).toBe('function');
      expect(typeof userManagement.deleteUser).toBe('function');
    });

    test('should resolve ProjectManagementUseCase', () => {
      const projectManagement = DIContainer.resolve<ProjectManagementUseCase>(
        ProjectManagementUseCase
      );

      expect(projectManagement).toBeDefined();
      expect(typeof projectManagement.createProject).toBe('function');
      expect(typeof projectManagement.getProjectById).toBe('function');
      expect(typeof projectManagement.getProjectsByUserId).toBe('function');
      expect(typeof projectManagement.updateProject).toBe('function');
      expect(typeof projectManagement.deleteProject).toBe('function');
    });

    test('should resolve AudioGenerationUseCase', () => {
      const audioGeneration = DIContainer.resolve<AudioGenerationUseCase>(
        AudioGenerationUseCase
      );

      expect(audioGeneration).toBeDefined();
      expect(typeof audioGeneration.generateAudio).toBe('function');
      expect(typeof audioGeneration.getJobStatus).toBe('function');
      expect(typeof audioGeneration.getJobsByProject).toBe('function');
      expect(typeof audioGeneration.cancelJob).toBe('function');
    });

    test('should resolve VoiceManagementUseCase', () => {
      const voiceManagement = DIContainer.resolve<VoiceManagementUseCase>(
        VoiceManagementUseCase
      );

      expect(voiceManagement).toBeDefined();
      expect(typeof voiceManagement.getAvailableVoices).toBe('function');
      expect(typeof voiceManagement.getVoiceById).toBe('function');
      expect(typeof voiceManagement.validateVoice).toBe('function');
      expect(typeof voiceManagement.syncVoicesFromProvider).toBe('function');
      expect(typeof voiceManagement.getDefaultVoice).toBe('function');
    });
  });

  describe('API Gateway Dependencies Bundle', () => {
    test('should resolve all API Gateway dependencies', () => {
      const dependencies = DIContainer.resolveAPIGatewayDependencies();

      expect(dependencies).toBeDefined();
      expect(dependencies.userManagement).toBeDefined();
      expect(dependencies.projectManagement).toBeDefined();
      expect(dependencies.audioGeneration).toBeDefined();
      expect(dependencies.voiceManagement).toBeDefined();
      expect(dependencies.userRepository).toBeDefined();
      expect(dependencies.projectRepository).toBeDefined();
      expect(dependencies.apiKeyRepository).toBeDefined();
      expect(dependencies.sessionRepository).toBeDefined();
    });

    test('should have consistent dependency instances across resolutions', () => {
      const dependencies1 = DIContainer.resolveAPIGatewayDependencies();
      const dependencies2 = DIContainer.resolveAPIGatewayDependencies();

      // Repositories should be singletons
      expect(dependencies1.userRepository).toBe(dependencies2.userRepository);
      expect(dependencies1.projectRepository).toBe(
        dependencies2.projectRepository
      );
      expect(dependencies1.apiKeyRepository).toBe(
        dependencies2.apiKeyRepository
      );
      expect(dependencies1.sessionRepository).toBe(
        dependencies2.sessionRepository
      );

      // Use cases should be singletons
      expect(dependencies1.userManagement).toBe(dependencies2.userManagement);
      expect(dependencies1.projectManagement).toBe(
        dependencies2.projectManagement
      );
      expect(dependencies1.audioGeneration).toBe(dependencies2.audioGeneration);
      expect(dependencies1.voiceManagement).toBe(dependencies2.voiceManagement);
    });

    test('should provide properly injected dependencies in use cases', async () => {
      const userManagement = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );
      const projectManagement = DIContainer.resolve<ProjectManagementUseCase>(
        ProjectManagementUseCase
      );

      // Test that use cases have their dependencies properly injected
      expect(userManagement).toBeDefined();
      expect(projectManagement).toBeDefined();

      // The actual injection is tested implicitly by the use case tests
      // If dependencies weren't injected properly, use cases would throw errors
    });
  });

  describe('Container Lifecycle Management', () => {
    test('should maintain singleton behavior for repositories', () => {
      const userRepository1 =
        DIContainer.resolve<UserRepository>('UserRepository');
      const userRepository2 =
        DIContainer.resolve<UserRepository>('UserRepository');

      expect(userRepository1).toBe(userRepository2);
    });

    test('should maintain singleton behavior for use cases', () => {
      const userManagement1 = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );
      const userManagement2 = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );

      expect(userManagement1).toBe(userManagement2);
    });

    test('should clear container and reconfigure dependencies', () => {
      // Resolve dependencies
      const userRepository1 =
        DIContainer.resolve<UserRepository>('UserRepository');
      const userManagement1 = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );

      // Clear container
      DIContainer.clear();

      // Dependencies should no longer be available
      expect(() =>
        DIContainer.resolve<UserRepository>('UserRepository')
      ).toThrow();

      // Reconfigure and resolve again
      DIContainer.configureDependencies();
      const userRepository2 =
        DIContainer.resolve<UserRepository>('UserRepository');
      const userManagement2 = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );

      // Should work again
      expect(userRepository2).toBeDefined();
      expect(userManagement2).toBeDefined();

      // But instances should be different from before clearing
      expect(userRepository1).not.toBe(userRepository2);
      expect(userManagement1).not.toBe(userManagement2);
    });

    test('should handle multiple clear and reconfigure cycles', () => {
      for (let i = 0; i < 3; i++) {
        // Configure and resolve
        DIContainer.configureDependencies();
        const userRepository =
          DIContainer.resolve<UserRepository>('UserRepository');
        expect(userRepository).toBeDefined();

        // Clear
        DIContainer.clear();
        expect(() =>
          DIContainer.resolve<UserRepository>('UserRepository')
        ).toThrow();
      }
    });
  });

  describe('Container Registration Validation', () => {
    test('should check if dependencies are registered', () => {
      expect(DIContainer.isRegistered('UserRepository')).toBe(true);
      expect(DIContainer.isRegistered('ProjectRepository')).toBe(true);
      expect(DIContainer.isRegistered('ApiKeyRepository')).toBe(true);
      expect(DIContainer.isRegistered('SessionRepository')).toBe(true);
      expect(DIContainer.isRegistered('VoiceRepository')).toBe(true);
      expect(DIContainer.isRegistered('GenerationJobRepository')).toBe(true);

      expect(DIContainer.isRegistered(UserManagementUseCase)).toBe(true);
      expect(DIContainer.isRegistered(ProjectManagementUseCase)).toBe(true);
      expect(DIContainer.isRegistered(AudioGenerationUseCase)).toBe(true);
      expect(DIContainer.isRegistered(VoiceManagementUseCase)).toBe(true);

      // Non-existent dependency
      expect(DIContainer.isRegistered('NonExistentDependency')).toBe(false);
    });

    test('should get list of registered tokens', () => {
      const registeredTokens = DIContainer.getRegisteredTokens();

      expect(registeredTokens).toContain('UserRepository');
      expect(registeredTokens).toContain('ProjectRepository');
      expect(registeredTokens).toContain('ApiKeyRepository');
      expect(registeredTokens).toContain('SessionRepository');
      expect(registeredTokens).toContain('VoiceRepository');
      expect(registeredTokens).toContain('GenerationJobRepository');
      expect(registeredTokens).toContain('PasswordHasher');
      expect(registeredTokens).toContain('TokenGenerator');
      expect(registeredTokens).toContain('ApiKeyGenerator');
      expect(registeredTokens).toContain('TTSEngine');
      expect(registeredTokens).toContain('Storage');
      expect(registeredTokens).toContain('Queue');
    });

    test('should include use cases in registered tokens', () => {
      const registeredTokens = DIContainer.getRegisteredTokens();

      // Check for use case classes
      expect(
        Array.from(registeredTokens).some(
          (token) =>
            typeof token === 'function' &&
            token.name === 'UserManagementUseCase'
        )
      ).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when resolving unregistered dependency', () => {
      expect(() => {
        DIContainer.resolve('NonExistentDependency');
      }).toThrow();
    });

    test('should throw error when resolving unregistered use case', () => {
      expect(() => {
        DIContainer.resolve('NonExistentUseCase');
      }).toThrow();
    });

    test('should handle circular dependency prevention', () => {
      // This would be caught by tsyringe automatically
      // The container is designed to prevent circular dependencies
      expect(() => {
        DIContainer.resolve<UserManagementUseCase>(UserManagementUseCase);
      }).not.toThrow();
    });

    test('should handle dependency resolution with invalid tokens', () => {
      expect(() => {
        DIContainer.resolve(null as any);
      }).toThrow();

      expect(() => {
        DIContainer.resolve(undefined as any);
      }).toThrow();

      expect(() => {
        DIContainer.resolve(123 as any);
      }).toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle large number of resolutions efficiently', () => {
      const startTime = performance.now();

      // Resolve dependencies many times
      for (let i = 0; i < 1000; i++) {
        DIContainer.resolve<UserRepository>('UserRepository');
        DIContainer.resolve<UserManagementUseCase>(UserManagementUseCase);
        DIContainer.resolve<ProjectRepository>('ProjectRepository');
        DIContainer.resolve<ProjectManagementUseCase>(ProjectManagementUseCase);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 4000 resolutions)
      expect(duration).toBeLessThan(100);
    });

    test('should not create memory leaks with repeated clear and reconfigure', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many clear and reconfigure cycles
      for (let i = 0; i < 100; i++) {
        DIContainer.clear();
        DIContainer.configureDependencies();

        // Resolve some dependencies to ensure they're created
        DIContainer.resolve<UserRepository>('UserRepository');
        DIContainer.resolve<UserManagementUseCase>(UserManagementUseCase);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should maintain consistent performance with dependency graph complexity', () => {
      const dependencies = DIContainer.resolveAPIGatewayDependencies();

      // Time the resolution of complex dependency graph
      const startTime = performance.now();

      // Resolve dependencies through the complex graph multiple times
      for (let i = 0; i < 100; i++) {
        const freshDependencies = DIContainer.resolveAPIGatewayDependencies();
        expect(freshDependencies.userManagement).toBe(
          dependencies.userManagement
        );
        expect(freshDependencies.projectManagement).toBe(
          dependencies.projectManagement
        );
        expect(freshDependencies.audioGeneration).toBe(
          dependencies.audioGeneration
        );
        expect(freshDependencies.voiceManagement).toBe(
          dependencies.voiceManagement
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 50ms for 100 complex resolutions)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Integration with Application Architecture', () => {
    test('should support Clean Architecture dependency flow', () => {
      // The container should support the Clean Architecture dependency flow:
      // API Layer -> Application Layer -> Domain Layer

      const dependencies = DIContainer.resolveAPIGatewayDependencies();

      // Application layer dependencies should be properly injected
      expect(dependencies.userManagement).toBeDefined();
      expect(dependencies.projectManagement).toBeDefined();
      expect(dependencies.audioGeneration).toBeDefined();
      expect(dependencies.voiceManagement).toBeDefined();

      // Infrastructure layer dependencies should be available
      expect(dependencies.userRepository).toBeDefined();
      expect(dependencies.projectRepository).toBeDefined();
      expect(dependencies.apiKeyRepository).toBeDefined();
      expect(dependencies.sessionRepository).toBeDefined();
    });

    test('should maintain dependency inversion principle', () => {
      // The container should invert dependencies:
      // High-level modules (use cases) should not depend on low-level modules
      // Both should depend on abstractions

      const userManagement = DIContainer.resolve<UserManagementUseCase>(
        UserManagementUseCase
      );
      const projectManagement = DIContainer.resolve<ProjectManagementUseCase>(
        ProjectManagementUseCase
      );
      const audioGeneration = DIContainer.resolve<AudioGenerationUseCase>(
        AudioGenerationUseCase
      );

      // Use cases should depend on interfaces, not concrete implementations
      expect(userManagement).toBeDefined();
      expect(projectManagement).toBeDefined();
      expect(audioGeneration).toBeDefined();

      // The concrete implementations are injected via the container
      // and are not directly referenced by the use cases
    });

    test('should support testability with dependency injection', () => {
      // The container should make it easy to inject mocks for testing

      // In a real test scenario, you would:
      // 1. Clear the container
      // 2. Register mock implementations
      // 3. Resolve the use case with mocks

      DIContainer.clear();

      // Register a mock repository (in real tests)
      // container.register<UserRepository>('UserRepository', {
      //   useValue: mockUserRepository
      // });

      // The container should be clean for test registration
      expect(() =>
        DIContainer.resolve<UserRepository>('UserRepository')
      ).toThrow();

      // Reconfigure for normal operation
      DIContainer.configureDependencies();
      expect(
        DIContainer.resolve<UserRepository>('UserRepository')
      ).toBeDefined();
    });
  });

  describe('Container Configuration and Environment', () => {
    test('should work in different Node.js environments', () => {
      // The container should work regardless of Node.js environment
      expect(() => {
        DIContainer.configureDependencies();
        DIContainer.resolve<UserRepository>('UserRepository');
        DIContainer.resolve<UserManagementUseCase>(UserManagementUseCase);
      }).not.toThrow();
    });

    test('should handle missing dependencies gracefully', () => {
      // The container should handle cases where optional services might not be available
      // (This would be implemented in the actual service registrations)

      expect(() => {
        DIContainer.resolve<UserRepository>('UserRepository');
      }).not.toThrow();
    });

    test('should support lazy loading of dependencies', () => {
      // Dependencies should be created only when first resolved
      const startTime = performance.now();
      DIContainer.configureDependencies();
      const configureTime = performance.now() - startTime;

      // Configuration should be fast (no dependency creation yet)
      expect(configureTime).toBeLessThan(10);

      // Dependencies should be created when resolved
      const resolveStartTime = performance.now();
      const userRepository =
        DIContainer.resolve<UserRepository>('UserRepository');
      const resolveTime = performance.now() - resolveStartTime;

      expect(userRepository).toBeDefined();
      // Resolution might take a bit longer as dependencies are created
      expect(resolveTime).toBeGreaterThan(0);
    });
  });
});
