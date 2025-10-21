import 'reflect-metadata';
import {
  UserManagementUseCase,
  AudioGenerationUseCase,
  VoiceManagementUseCase,
  ProjectManagementUseCase,
} from '@falador/application';
import type {
  UserRepository,
  ProjectRepository,
  ApiKeyRepository,
  SessionRepository,
  VoiceRepository,
  GenerationJobRepository,
  PasswordHasher,
  TokenGenerator,
  ApiKeyGenerator,
  TTSEngine,
  Storage,
  Queue,
} from '@falador/core-domain';
import { container } from 'tsyringe';

// Infrastructure implementations
import { InMemoryApiKeyRepository } from './repositories/in-memory-api-key-repository';
import { InMemoryGenerationJobRepository } from './repositories/in-memory-generation-job-repository';
import { InMemoryProjectRepository } from './repositories/in-memory-project-repository';
import { InMemorySessionRepository } from './repositories/in-memory-session-repository';
import { InMemoryUserRepository } from './repositories/in-memory-user-repository';
import { InMemoryVoiceRepository } from './repositories/in-memory-voice-repository';
import { BcryptPasswordHasher } from './services/bcrypt-password-hasher';
import { JWTTokenGenerator } from './services/jwt-token-generator';
import { LocalStorage } from './services/local-storage';
import { MemoryQueue } from './services/memory-queue';
import { OpenAITTSEngine } from './services/openai-tts-engine';
import { RandomApiKeyGenerator } from './services/random-api-key-generator';

// Application layer

/**
 * Dependency Injection Container Configuration
 *
 * This file configures all the dependencies for the Clean Architecture implementation.
 * It follows the Dependency Inversion Principle by depending on abstractions,
 * not concrete implementations.
 */

// Infrastructure layer registrations
container.register<UserRepository>('UserRepository', {
  useFactory: () => new InMemoryUserRepository(),
});

container.register<ProjectRepository>('ProjectRepository', {
  useFactory: () => new InMemoryProjectRepository(),
});

container.register<ApiKeyRepository>('ApiKeyRepository', {
  useFactory: () => new InMemoryApiKeyRepository(),
});

container.register<SessionRepository>('SessionRepository', {
  useFactory: () => new InMemorySessionRepository(),
});

container.register<VoiceRepository>('VoiceRepository', {
  useFactory: () => new InMemoryVoiceRepository(),
});

container.register<GenerationJobRepository>('GenerationJobRepository', {
  useFactory: () => new InMemoryGenerationJobRepository(),
});

// Service registrations
container.register<PasswordHasher>('PasswordHasher', {
  useClass: BcryptPasswordHasher,
});

container.register<TokenGenerator>('TokenGenerator', {
  useClass: JWTTokenGenerator,
});

container.register<ApiKeyGenerator>('ApiKeyGenerator', {
  useClass: RandomApiKeyGenerator,
});

container.register<TTSEngine>('TTSEngine', {
  useClass: OpenAITTSEngine,
});

container.register<Storage>('Storage', {
  useClass: LocalStorage,
});

container.register<Queue>('Queue', {
  useClass: MemoryQueue,
});

// Application layer registrations (use cases)
container.register<UserManagementUseCase>(UserManagementUseCase, {
  useFactory: (dependencyContainer) =>
    new UserManagementUseCase(
      dependencyContainer.resolve<UserRepository>('UserRepository')
    ),
});

container.register<ProjectManagementUseCase>(ProjectManagementUseCase, {
  useFactory: (dependencyContainer) =>
    new ProjectManagementUseCase(
      dependencyContainer.resolve<UserRepository>('UserRepository'),
      dependencyContainer.resolve<ProjectRepository>('ProjectRepository')
    ),
});

container.register<AudioGenerationUseCase>(AudioGenerationUseCase, {
  useFactory: (dependencyContainer) =>
    new AudioGenerationUseCase(
      dependencyContainer.resolve<UserRepository>('UserRepository'),
      dependencyContainer.resolve<ProjectRepository>('ProjectRepository'),
      dependencyContainer.resolve<VoiceRepository>('VoiceRepository'),
      dependencyContainer.resolve<GenerationJobRepository>(
        'GenerationJobRepository'
      ),
      dependencyContainer.resolve<TTSEngine>('TTSEngine'),
      dependencyContainer.resolve<Storage>('Storage'),
      dependencyContainer.resolve<Queue>('Queue')
    ),
});

container.register<VoiceManagementUseCase>(VoiceManagementUseCase, {
  useFactory: (dependencyContainer) =>
    new VoiceManagementUseCase(
      dependencyContainer.resolve<VoiceRepository>('VoiceRepository'),
      dependencyContainer.resolve<TTSEngine>('TTSEngine')
    ),
});

/**
 * Container utilities for resolving dependencies
 */
export class DIContainer {
  /**
   * Resolve a dependency by token
   * @param token
   */
  static resolve<T>(token: string | any): T {
    return container.resolve<T>(token);
  }

  /**
   * Resolve all dependencies needed for the API Gateway
   */
  static resolveAPIGatewayDependencies() {
    return {
      userManagement: this.resolve<UserManagementUseCase>(
        UserManagementUseCase
      ),
      projectManagement: this.resolve<ProjectManagementUseCase>(
        ProjectManagementUseCase
      ),
      audioGeneration: this.resolve<AudioGenerationUseCase>(
        AudioGenerationUseCase
      ),
      voiceManagement: this.resolve<VoiceManagementUseCase>(
        VoiceManagementUseCase
      ),
      userRepository: this.resolve<UserRepository>('UserRepository'),
      projectRepository: this.resolve<ProjectRepository>('ProjectRepository'),
      apiKeyRepository: this.resolve<ApiKeyRepository>('ApiKeyRepository'),
      sessionRepository: this.resolve<SessionRepository>('SessionRepository'),
    };
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clear() {
    container.reset();
    // Re-register dependencies after clearing
    this.configureDependencies();
  }

  /**
   * Check if a dependency is registered
   * @param token
   */
  static isRegistered<T>(token: string | any): boolean {
    return container.isRegistered(token);
  }

  /**
   * Get all registered tokens
   */
  static getRegisteredTokens(): string[] {
    return (container as any)._registry._registryMap.keys();
  }

  /**
   * Configure all dependencies (call this on application startup)
   */
  static configureDependencies() {
    // Dependencies are configured at the top of this file
    // This method exists for explicit configuration if needed
  }
}

/**
 * Export the container instance for advanced use cases
 */
export { container };

/**
 * Export type helpers for dependency resolution
 */
export type DIContainerDependencies = ReturnType<
  typeof DIContainer.resolveAPIGatewayDependencies
>;

/**
 * Singleton markers for lifecycle management - removed for compatibility
 */
