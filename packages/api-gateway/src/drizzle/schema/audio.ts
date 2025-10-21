import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Audio generation jobs table schema
 *
 * Tracks individual audio generation tasks within projects,
 * including chapter-level processing information.
 */
export const audioGenerationJobs = pgTable(
  'audio_generation_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    chapterNumber: integer('chapter_number').notNull(),
    voiceId: uuid('voice_id'),
    text: text('text').notNull(),
    status: varchar('status', {
      length: 50,
      enum: ['pending', 'processing', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    progress: integer('progress').notNull().default(0),
    errorMessage: text('error_message'),
    processingStartedAt: timestamp('processing_started_at'),
    processingCompletedAt: timestamp('processing_completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index for project job queries
    projectIdIdx: index('audio_jobs_project_id_idx').on(table.projectId),
    // Index for job processing queue (status-based queries)
    statusIdx: index('audio_jobs_status_idx').on(table.status),
    // Composite index for project + status (project's job list)
    projectStatusIdx: index('audio_jobs_project_status_idx').on(
      table.projectId,
      table.status
    ),
    // Composite index for project + chapter number (job ordering)
    projectChapterIdx: index('audio_jobs_project_chapter_idx').on(
      table.projectId,
      table.chapterNumber
    ),
    // Index for voice ID queries
    voiceIdIdx: index('audio_jobs_voice_id_idx').on(table.voiceId),
    // Index for created_at queries (job analytics)
    createdAtIdx: index('audio_jobs_created_at_idx').on(table.createdAt),
  })
);

/**
 * Audio files table schema
 *
 * Stores metadata for generated audio files including
 * quality metrics and file information.
 */
export const audioFiles = pgTable(
  'audio_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => audioGenerationJobs.id, { onDelete: 'cascade' }),
    filePath: varchar('file_path', { length: 1000 }).notNull(),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    format: varchar('format', {
      length: 10,
      enum: ['mp3', 'wav', 'm4a', 'ogg'],
    }).notNull(),
    duration: integer('duration'), // Duration in seconds
    fileSize: integer('file_size'), // File size in bytes
    qualityScore: integer('quality_score'), // Quality score 0-100
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index for job file queries
    jobIdIdx: index('audio_files_job_id_idx').on(table.jobId),
    // Index for file format queries
    formatIdx: index('audio_files_format_idx').on(table.format),
    // Index for quality score filtering
    qualityScoreIdx: index('audio_files_quality_score_idx').on(
      table.qualityScore
    ),
    // Index for created_at queries (file analytics)
    createdAtIdx: index('audio_files_created_at_idx').on(table.createdAt),
    // GIN index for metadata JSONB queries
    metadataIdx: index('audio_files_metadata_idx').using('gin', table.metadata),
  })
);

// Types for TypeScript
export type AudioGenerationJob = typeof audioGenerationJobs.$inferSelect;
export type NewAudioGenerationJob = typeof audioGenerationJobs.$inferInsert;
export type AudioFile = typeof audioFiles.$inferSelect;
export type NewAudioFile = typeof audioFiles.$inferInsert;
