import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Projects table schema
 *
 * Stores audiobook project information including metadata
 * and processing status.
 */
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    author: varchar('author', { length: 255 }),
    language: varchar('language', { length: 10, enum: ['pt-BR', 'en'] })
      .notNull()
      .default('pt-BR'),
    genre: varchar('genre', { length: 100 }),
    status: varchar('status', {
      length: 50,
      enum: ['draft', 'queued', 'processing', 'completed', 'failed'],
    })
      .notNull()
      .default('draft'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index for user project queries (most common lookup)
    userIdIdx: index('projects_user_id_idx').on(table.userId),
    // Index for status filtering (processing queue)
    statusIdx: index('projects_status_idx').on(table.status),
    // Index for language filtering
    languageIdx: index('projects_language_idx').on(table.language),
    // Composite index for user + status (user's project list with filtering)
    userStatusIdx: index('projects_user_status_idx').on(
      table.userId,
      table.status
    ),
    // Index for created_at queries (project analytics)
    createdAtIdx: index('projects_created_at_idx').on(table.createdAt),
    // GIN index for metadata JSONB queries
    metadataIdx: index('projects_metadata_idx').using('gin', table.metadata),
  })
);

// Types for TypeScript
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
