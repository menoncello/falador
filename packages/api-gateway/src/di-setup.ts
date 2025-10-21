/**
 * Dependency Injection Setup for API Gateway
 *
 * Configures all the dependencies for the API Gateway module
 */

import 'reflect-metadata';
import {
  initializeContainer,
  registerRepository,
  DI_TOKENS,
} from '@falador/core-domain';
import { Database } from './database.js';
import { CryptoApiKeyGenerator } from './infrastructure/crypto-api-key-generator.js';
import { CryptoPasswordHasher } from './infrastructure/crypto-password-hasher.js';
import { JwtTokenGenerator } from './infrastructure/jwt-token-generator.js';
import { InMemoryApiKeyRepository } from './repositories/in-memory-api-key-repository.js';
import { InMemoryProjectRepository } from './repositories/in-memory-project-repository.js';
import { InMemorySessionRepository } from './repositories/in-memory-session-repository.js';
import { InMemoryUserRepository } from './repositories/in-memory-user-repository.js';

/**
 * Set up dependency injection for the API Gateway module
 */
export function setupDI(): void {
  // Initialize the base container
  initializeContainer();

  // Register infrastructure services
  registerSingleton(DI_TOKENS.PASSWORD_HASHER, CryptoPasswordHasher);
  registerSingleton(DI_TOKENS.TOKEN_GENERATOR, JwtTokenGenerator);
  registerSingleton(DI_TOKENS.API_KEY_GENERATOR, CryptoApiKeyGenerator);

  // Register database as singleton
  registerRepository('Database', Database);

  // Register repositories
  registerRepository(DI_TOKENS.USER_REPOSITORY, InMemoryUserRepository);
  registerRepository(DI_TOKENS.PROJECT_REPOSITORY, InMemoryProjectRepository);
  registerRepository(DI_TOKENS.API_KEY_REPOSITORY, InMemoryApiKeyRepository);
  registerRepository(DI_TOKENS.SESSION_REPOSITORY, InMemorySessionRepository);
}
