/**
 * Falador Application Layer
 *
 * This layer contains use cases that orchestrate business logic.
 * It depends on domain interfaces but is independent of infrastructure.
 */

export const version = '0.0.1';

// Re-export all use cases
export * from './use-cases/index';
