import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * API keys table schema
 *
 * Stores API key information for authentication and authorization.
 * Includes key hash, scopes, and usage tracking.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    scopes: jsonb('scopes').$type<string[]>().notNull().default('[]'),
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index for user API key queries
    userIdIdx: index('api_keys_user_id_idx').on(table.userId),
    // Index for key hash lookups (authentication)
    keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
    // Index for expiration queries (cleanup)
    expiresAtIdx: index('api_keys_expires_at_idx').on(table.expiresAt),
    // Index for last used tracking
    lastUsedAtIdx: index('api_keys_last_used_at_idx').on(table.lastUsedAt),
    // GIN index for scopes JSONB queries
    scopesIdx: index('api_keys_scopes_idx').using('gin', table.scopes),
  })
);

// Types for TypeScript
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
