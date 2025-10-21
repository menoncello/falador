/**
 * Dependency Injection Container Tests
 * Testing DI container configuration and resolution
 */

import 'reflect-metadata';
import {
  UserManagementUseCase,
  ProjectManagementUseCase,
  AudioGenerationUseCase,
  VoiceManagementUseCase,
} from '@falador/application/use-cases/index.js';
import { describe, it, expect, beforeEach } from 'bun:test';
import { container } from 'tsyringe';
import {
  configureContainer,
  resolve,
  clearContainer,
  getContainer,
} from './container.js';
import {
  InMemoryUserRepository,
  InMemoryProjectRepository,
  InMemoryVoiceRepository,
  InMemoryGenerationJobRepository,
  InMemoryAudioFileRepository,
  MockTTSEngine,
  InMemoryStorage,
  InMemoryQueue,
} from './index.js';

describe('Dependency Injection Container', () => {
  beforeEach(() => {
    clearContainer();
  });

  describe('configureContainer', () => {
    it('should configure container without throwing errors', () => {
      expect(() => configureContainer()).not.toThrow();
    });

    it('should register all required repositories', () => {
      configureContainer();

      // Should be able to resolve repositories
      expect(() => resolve('UserRepository')).not.toThrow();
      expect(() => resolve('ProjectRepository')).not.toThrow();
      expect(() => resolve('VoiceRepository')).not.toThrow();
      expect(() => resolve('GenerationJobRepository')).not.toThrow();
      expect(() => resolve('AudioFileRepository')).not.toThrow();
    });

    it('should register all required services', () => {
      configureContainer();

      // Should be able to resolve services
      expect(() => resolve('TTSEngine')).not.toThrow();
      expect(() => resolve('Storage')).not.toThrow();
      expect(() => resolve('Queue')).not.toThrow();
    });

    it('should register all required use cases', () => {
      configureContainer();

      // Should be able to resolve use cases
      expect(() => resolve(UserManagementUseCase)).not.toThrow();
      expect(() => resolve(ProjectManagementUseCase)).not.toThrow();
      expect(() => resolve(AudioGenerationUseCase)).not.toThrow();
      expect(() => resolve(VoiceManagementUseCase)).not.toThrow();
    });
  });

  describe('resolve', () => {
    beforeEach(() => {
      configureContainer();
    });

    it('should resolve repository implementations', () => {
      const userRepo = resolve('UserRepository');
      const projectRepo = resolve('ProjectRepository');
      const voiceRepo = resolve('VoiceRepository');
      const jobRepo = resolve('GenerationJobRepository');
      const audioRepo = resolve('AudioFileRepository');

      expect(userRepo).toBeInstanceOf(InMemoryUserRepository);
      expect(projectRepo).toBeInstanceOf(InMemoryProjectRepository);
      expect(voiceRepo).toBeInstanceOf(InMemoryVoiceRepository);
      expect(jobRepo).toBeInstanceOf(InMemoryGenerationJobRepository);
      expect(audioRepo).toBeInstanceOf(InMemoryAudioFileRepository);
    });

    it('should resolve service implementations', () => {
      const ttsEngine = resolve('TTSEngine');
      const storage = resolve('Storage');
      const queue = resolve('Queue');

      expect(ttsEngine).toBeInstanceOf(MockTTSEngine);
      expect(storage).toBeInstanceOf(InMemoryStorage);
      expect(queue).toBeInstanceOf(InMemoryQueue);
    });

    it('should resolve use case implementations', () => {
      const userUseCase = resolve(UserManagementUseCase);
      const projectUseCase = resolve(ProjectManagementUseCase);
      const audioUseCase = resolve(AudioGenerationUseCase);
      const voiceUseCase = resolve(VoiceManagementUseCase);

      expect(userUseCase).toBeInstanceOf(UserManagementUseCase);
      expect(projectUseCase).toBeInstanceOf(ProjectManagementUseCase);
      expect(audioUseCase).toBeInstanceOf(AudioGenerationUseCase);
      expect(voiceUseCase).toBeInstanceOf(VoiceManagementUseCase);
    });

    it('should resolve same instance for singletons', () => {
      const userRepo1 = resolve('UserRepository');
      const userRepo2 = resolve('UserRepository');

      expect(userRepo1).toBe(userRepo2); // Same instance
    });

    it('should resolve different instances for use cases', () => {
      const useCase1 = resolve(UserManagementUseCase);
      const useCase2 = resolve(UserManagementUseCase);

      expect(useCase1).not.toBe(useCase2); // Different instances
    });
  });

  describe('getContainer', () => {
    it('should return the tsyringe container', () => {
      configureContainer();
      const diContainer = getContainer();

      expect(diContainer).toBe(container);
    });
  });

  describe('clearContainer', () => {
    beforeEach(() => {
      configureContainer();
    });

    it('should clear all registrations', () => {
      // Verify container is configured
      expect(() => resolve('UserRepository')).not.toThrow();

      // Clear container
      clearContainer();

      // Should no longer be able to resolve dependencies
      expect(() => resolve('UserRepository')).toThrow();
    });

    it('should allow reconfiguration after clearing', () => {
      clearContainer();

      expect(() => resolve('UserRepository')).toThrow();

      configureContainer();

      expect(() => resolve('UserRepository')).not.toThrow();
    });
  });

  describe('dependency injection integration', () => {
    beforeEach(() => {
      configureContainer();
    });

    it('should inject dependencies into use cases', () => {
      const userUseCase = resolve(UserManagementUseCase);

      // Use case should have its dependencies injected
      expect(userUseCase).toBeDefined();
      expect(typeof (userUseCase as any).userRepository).toBe('object');
    });

    it('should work with dependency chains', () => {
      const audioUseCase = resolve(AudioGenerationUseCase);

      // Audio use case depends on multiple repositories and services
      expect(audioUseCase).toBeDefined();
      expect(typeof (audioUseCase as any).userRepository).toBe('object');
      expect(typeof (audioUseCase as any).projectRepository).toBe('object');
      expect(typeof (audioUseCase as any).voiceRepository).toBe('object');
      expect(typeof (audioUseCase as any).jobRepository).toBe('object');
      expect(typeof (audioUseCase as any).ttsEngine).toBe('object');
      expect(typeof (audioUseCase as any).storage).toBe('object');
      expect(typeof (audioUseCase as any).queue).toBe('object');
    });
  });

  describe('error handling', () => {
    it('should throw error for unregistered dependency', () => {
      expect(() => resolve('NonExistentDependency')).toThrow();
    });

    it('should handle circular dependencies gracefully', () => {
      configureContainer();

      // This test would catch circular dependency issues if they existed
      expect(() => resolve(UserManagementUseCase)).not.toThrow();
    });
  });
});
