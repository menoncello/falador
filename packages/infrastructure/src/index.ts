/**
 * Falador Infrastructure Layer
 * Database and external service implementations
 */

export const version = '0.0.1';

// Export database implementations
export * from './database/index.js';

// Export external service implementations
export * from './external/index.js';

// Export DI container
export * from './container.js';

// Import domain types
export type {
  User,
  Project,
  AudioFile,
  Voice,
  GenerationJob,
} from '@falador/core-domain';
