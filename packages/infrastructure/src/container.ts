/**
 * Dependency Injection Container Configuration
 * Sets up and manages the DI container for the application
 */

import { container } from 'tsyringe';
import type {
  PasswordHasher,
  TokenGenerator,
  ApiKeyGenerator,
  Storage,
  Queue,
  TTSEngine,

  ProjectRepository,
  UserRepository,
  SessionRepository,
  VoiceRepository,
  GenerationJobRepository} from '../../core-domain/src/index';
import {
  CreateProjectUseCase,
  GetProjectUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  ListProjectsUseCase,
} from '../../application/src/use-cases';

/**
 * Configuration options for dependency registration
 */
export interface RegisterDependenciesOptions {
  database?: unknown;
  passwordHasher?: new () => PasswordHasher;
  tokenGenerator?: new () => TokenGenerator;
  apiKeyGenerator?: new () => ApiKeyGenerator;
  storage?: new () => Storage;
  queue?: new () => Queue;
  ttsEngine?: new () => TTSEngine;
  projectRepository?: new () => ProjectRepository | ((database: unknown) => ProjectRepository);
  userRepository?: new () => UserRepository | ((database: unknown) => UserRepository);
  sessionRepository?: new () => SessionRepository | ((database: unknown) => SessionRepository);
  voiceRepository?: new () => VoiceRepository | ((database: unknown) => VoiceRepository);
  generationJobRepository?: new () => GenerationJobRepository | ((database: unknown) => GenerationJobRepository);
}

/**
 * Registers singleton services (shared stateless services)
 */
function registerSingletonServices(options: RegisterDependenciesOptions): void {
  const singletonServices = [
    { key: 'PasswordHasher', constructor: options.passwordHasher },
    { key: 'TokenGenerator', constructor: options.tokenGenerator },
    { key: 'ApiKeyGenerator', constructor: options.apiKeyGenerator },
  ] as const;

  for (const service of singletonServices) {
    if (service.constructor) {
      container.register(service.key as string, {
        useClass: service.constructor as never,
      });
    }
  }
}

/**
 * Registers scoped services (per-request lifecycle where needed)
 */
function registerScopedServices(options: RegisterDependenciesOptions): void {
  const scopedServices = [
    { key: 'Storage', constructor: options.storage },
    { key: 'Queue', constructor: options.queue },
    { key: 'TTSEngine', constructor: options.ttsEngine },
  ] as const;

  for (const service of scopedServices) {
    if (service.constructor) {
      container.register(service.key as string, {
        useClass: service.constructor as never,
      });
    }
  }
}

/**
 * Registers repository implementations with proper lifecycle management
 */
function registerRepositories(options: RegisterDependenciesOptions): void {
  const repositories = [
    { key: 'ProjectRepository', constructor: options.projectRepository },
    { key: 'UserRepository', constructor: options.userRepository },
    { key: 'SessionRepository', constructor: options.sessionRepository },
    { key: 'VoiceRepository', constructor: options.voiceRepository },
    { key: 'GenerationJobRepository', constructor: options.generationJobRepository },
  ] as const;

  for (const repository of repositories) {
    if (repository.constructor) {
      // Use factory for all repositories to handle database dependency consistently
      container.register(repository.key as string, {
        useFactory: () => new (repository.constructor as any)(options.database),
      });
    }
  }
}

/**
 * Registers singleton services with proper lifecycle management
 */
function registerServices(options: RegisterDependenciesOptions): void {
  registerSingletonServices(options);
  registerScopedServices(options);
}

/**
 * Factory function to create CreateProjectUseCase
 */
function createCreateProjectUseCase(c: typeof container): CreateProjectUseCase {
  const projectRepo = c.resolve<ProjectRepository>('ProjectRepository');
  const userRepo = c.resolve<UserRepository>('UserRepository');
  return new CreateProjectUseCase(projectRepo, userRepo);
}

/**
 * Factory function to create GetProjectUseCase
 */
function createGetProjectUseCase(c: typeof container): GetProjectUseCase {
  const projectRepo = c.resolve<ProjectRepository>('ProjectRepository');
  return new GetProjectUseCase(projectRepo);
}

/**
 * Factory function to create UpdateProjectUseCase
 */
function createUpdateProjectUseCase(c: typeof container): UpdateProjectUseCase {
  const projectRepo = c.resolve<ProjectRepository>('ProjectRepository');
  return new UpdateProjectUseCase(projectRepo);
}

/**
 * Factory function to create DeleteProjectUseCase
 */
function createDeleteProjectUseCase(c: typeof container): DeleteProjectUseCase {
  const projectRepo = c.resolve<ProjectRepository>('ProjectRepository');
  return new DeleteProjectUseCase(projectRepo);
}

/**
 * Factory function to create ListProjectsUseCase
 */
function createListProjectsUseCase(c: typeof container): ListProjectsUseCase {
  const projectRepo = c.resolve<ProjectRepository>('ProjectRepository');
  return new ListProjectsUseCase(projectRepo);
}

/**
 * Registers project-related use cases with factory functions
 */
function registerProjectUseCases(): void {
  container.register(CreateProjectUseCase, {
    useFactory: createCreateProjectUseCase,
  });

  container.register(GetProjectUseCase, {
    useFactory: createGetProjectUseCase,
  });

  container.register(UpdateProjectUseCase, {
    useFactory: createUpdateProjectUseCase,
  });

  container.register(DeleteProjectUseCase, {
    useFactory: createDeleteProjectUseCase,
  });

  container.register(ListProjectsUseCase, {
    useFactory: createListProjectsUseCase,
  });
}

/**
 * Register use case implementations with transient lifecycle (new instance per resolution)
 */
function registerUseCases(): void {
  registerProjectUseCases();
}

/**
 * Registers database connection if provided
 */
function registerDatabaseConnection(database?: unknown): void {
  if (database) {
    container.register('Database', {
      useValue: database,
    });
  }
}

/**
 * Register all dependencies in the DI container
 * This should be called once at application startup
 */
export function registerDependencies(
  options: RegisterDependenciesOptions
): void {
  // Register database connection first as other dependencies might need it
  registerDatabaseConnection(options.database);

  // Register all dependency layers with proper lifecycle management
  registerRepositories(options);
  registerServices(options);
  registerUseCases();
}

/**
 * Create a child container for testing or scoped operations
 */
export function createChildContainer(): typeof container {
  return container.createChildContainer();
}

/**
 * Clear the container (useful for testing)
 */
export function clearContainer(): void {
  container.clearInstances();
}

/**
 * Get the DI container instance
 */
export function getContainer(): typeof container {
  return container;
}

/**
 * Token type for dependency resolution
 */
type DependencyToken<T> = string | symbol | (new (...args: never[]) => T);

/**
 * Resolve a dependency from the container
 */
export function resolve<T>(token: DependencyToken<T>): T {
  return container.resolve(token as never);
}