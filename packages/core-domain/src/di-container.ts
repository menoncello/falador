/**
 * Dependency Injection Container Configuration
 *
 * Central DI container using tsyringe for Clean Architecture implementation
 */

import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';

// Configuration tokens
export const DI_TOKENS = {
  // Configuration
  JWT_SECRET: 'JwtSecret',
  NODE_ENV: 'NodeEnv',

  // Repositories
  USER_REPOSITORY: 'UserRepository',
  PROJECT_REPOSITORY: 'ProjectRepository',
  API_KEY_REPOSITORY: 'ApiKeyRepository',
  SESSION_REPOSITORY: 'SessionRepository',

  // Services
  PASSWORD_HASHER: 'PasswordHasher',
  TOKEN_GENERATOR: 'TokenGenerator',
  API_KEY_GENERATOR: 'ApiKeyGenerator',
} as const;

/**
 * Initialize and configure the DI container
 * Should be called at application startup
 */
export function initializeContainer(): void {
  // Register configuration values
  container.register(DI_TOKENS.JWT_SECRET, {
    useValue:
      process.env.JWT_SECRET || 'development-secret-change-in-production',
  });

  container.register(DI_TOKENS.NODE_ENV, {
    useValue: process.env.NODE_ENV || 'development',
  });

  // Register repositories
  // Note: These will be registered by the implementing classes
  // in the infrastructure layer (e.g., InMemoryUserRepository)

  // Register service implementations
  container.register(DI_TOKENS.PASSWORD_HASHER, {
    useFactory: () => {
      const CryptoPasswordHasher =
        require('../infrastructure/crypto-password-hasher.js').CryptoPasswordHasher;
      return new CryptoPasswordHasher();
    },
    lifecycle: Lifecycle.Singleton,
  });

  container.register(DI_TOKENS.TOKEN_GENERATOR, {
    useFactory: () => {
      const JwtTokenGenerator =
        require('../infrastructure/jwt-token-generator.js').JwtTokenGenerator;
      return new JwtTokenGenerator(container.resolve(DI_TOKENS.JWT_SECRET));
    },
    lifecycle: Lifecycle.Singleton,
  });

  container.register(DI_TOKENS.API_KEY_GENERATOR, {
    useFactory: () => {
      const CryptoApiKeyGenerator =
        require('../infrastructure/crypto-api-key-generator.js').CryptoApiKeyGenerator;
      return new CryptoApiKeyGenerator();
    },
    lifecycle: Lifecycle.Singleton,
  });
}

/**
 * Get the DI container instance
 */
export function getContainer() {
  return container;
}

/**
 * Resolve a dependency from the container
 * @param token
 */
export function resolve<T>(token: string): T {
  return container.resolve<T>(token);
}

/**
 * Register a repository implementation
 * @param token
 * @param implementation
 */
export function registerRepository(
  token: string,
  implementation: new (...args: any[]) => any
): void {
  container.register(token, implementation, { lifecycle: Lifecycle.Singleton });
}

/**
 * Register a singleton service
 * @param token
 * @param implementation
 */
export function registerSingleton(
  token: string,
  implementation: new (...args: any[]) => any
): void {
  container.register(token, implementation, { lifecycle: Lifecycle.Singleton });
}

/**
 * Register a scoped service (new instance per request)
 * @param token
 * @param implementation
 */
export function registerScoped(
  token: string,
  implementation: new (...args: any[]) => any
): void {
  container.register(token, implementation, {
    lifecycle: Lifecycle.Resolution,
  });
}

/**
 * Create a child container for testing or specific contexts
 */
export function createChildContainer() {
  return container.createChildContainer();
}
