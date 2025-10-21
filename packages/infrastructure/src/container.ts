/**
 * Dependency Injection Container
 * Composition root for the Clean Architecture implementation
 */

import { AudioGenerationUseCase } from '@falador/application/use-cases/audio-generation.js';
import { ProjectManagementUseCase } from '@falador/application/use-cases/project-management.js';
import { UserManagementUseCase } from '@falador/application/use-cases/user-management.js';
import { VoiceManagementUseCase } from '@falador/application/use-cases/voice-management.js';
import { container } from 'tsyringe';
import { InMemoryAudioFileRepository } from './database/repositories/audio-file-repository.js';
import { InMemoryGenerationJobRepository } from './database/repositories/generation-job-repository.js';
import { InMemoryProjectRepository } from './database/repositories/project-repository.js';
import { InMemoryUserRepository } from './database/repositories/user-repository.js';
import { InMemoryVoiceRepository } from './database/repositories/voice-repository.js';
import { InMemoryQueue } from './external/services/queue.js';
import { InMemoryStorage } from './external/services/storage.js';
import { MockTTSEngine } from './external/services/tts-engine.js';

/**
 * Configure the dependency injection container
 */
export function configureContainer(): void {
  // Repository registrations
  container.register('UserRepository', { useClass: InMemoryUserRepository });
  container.register('ProjectRepository', {
    useClass: InMemoryProjectRepository,
  });
  container.register('VoiceRepository', { useClass: InMemoryVoiceRepository });
  container.register('GenerationJobRepository', {
    useClass: InMemoryGenerationJobRepository,
  });
  container.register('AudioFileRepository', {
    useClass: InMemoryAudioFileRepository,
  });

  // Service registrations
  container.register('TTSEngine', { useClass: MockTTSEngine });
  container.register('Storage', { useClass: InMemoryStorage });
  container.register('Queue', { useClass: InMemoryQueue });

  // Use case registrations
  container.register('UserManagementUseCase', {
    useClass: UserManagementUseCase,
  });
  container.register('ProjectManagementUseCase', {
    useClass: ProjectManagementUseCase,
  });
  container.register('AudioGenerationUseCase', {
    useClass: AudioGenerationUseCase,
  });
  container.register('VoiceManagementUseCase', {
    useClass: VoiceManagementUseCase,
  });

  // Controller registrations (these are only used by the presentation layer)
  // Note: Controllers are not in the infrastructure package but are registered here for DI convenience
  try {
    const {
      UserController,
    } = require('@falador/api-gateway/controllers/user-controller');
    const {
      ProjectController,
    } = require('@falador/api-gateway/controllers/project-controller');
    const {
      AudioGenerationController,
    } = require('@falador/api-gateway/controllers/audio-generation-controller');
    const {
      VoiceController,
    } = require('@falador/api-gateway/controllers/voice-controller');

    container.register('UserController', { useClass: UserController });
    container.register('ProjectController', { useClass: ProjectController });
    container.register('AudioGenerationController', {
      useClass: AudioGenerationController,
    });
    container.register('VoiceController', { useClass: VoiceController });
  } catch (error) {
    // Controllers may not be available during infrastructure-only initialization
    console.warn(
      'Could not register controllers in infrastructure container:',
      error
    );
  }
}

/**
 * Get the configured container
 */
export function getContainer() {
  return container;
}

/**
 * Resolve a dependency from the container
 * @param token
 */
export function resolve<T>(token: string | (new (...args: any[]) => T)): T {
  return container.resolve<T>(token);
}

/**
 * Clear all registrations (useful for testing)
 */
export function clearContainer(): void {
  container.clearInstances();
  container.reset();
}
