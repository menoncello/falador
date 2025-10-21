/**
 * Drizzle schema exports
 *
 * This file exports all database schema definitions and provides
 * a central location for importing table definitions.
 */

// Import all schema files
export * from './users';
export * from './projects';
export * from './audio';
export * from './api-keys';

// Re-export commonly used types for convenience
export { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
