-- Initial database schema for Falador Audiobook Platform
-- Generated for Story 1.4: PostgreSQL Database Setup & Schema Design

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"tier" varchar(50) DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"author" varchar(255),
	"language" varchar(10) DEFAULT 'pt-BR' NOT NULL,
	"genre" varchar(100),
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create audio_generation_jobs table
CREATE TABLE IF NOT EXISTS "audio_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"chapter_number" integer NOT NULL,
	"voice_id" uuid,
	"text" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create audio_files table
CREATE TABLE IF NOT EXISTS "audio_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"file_path" varchar(1000) NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"format" varchar(10) NOT NULL,
	"duration" integer,
	"file_size" integer,
	"quality_score" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"scopes" jsonb DEFAULT '[]' NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);

-- Create foreign key constraints
DO $$ BEGIN
	ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "audio_generation_jobs" ADD CONSTRAINT "audio_generation_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_job_id_audio_generation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "audio_generation_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance optimization
-- Users table indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_tier_idx" ON "users" ("tier");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");

-- Projects table indexes
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" ("user_id");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" ("status");
CREATE INDEX IF NOT EXISTS "projects_language_idx" ON "projects" ("language");
CREATE INDEX IF NOT EXISTS "projects_user_status_idx" ON "projects" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "projects_created_at_idx" ON "projects" ("created_at");
CREATE INDEX IF NOT EXISTS "projects_metadata_idx" ON "projects" USING gin ("metadata");

-- Audio generation jobs table indexes
CREATE INDEX IF NOT EXISTS "audio_jobs_project_id_idx" ON "audio_generation_jobs" ("project_id");
CREATE INDEX IF NOT EXISTS "audio_jobs_status_idx" ON "audio_generation_jobs" ("status");
CREATE INDEX IF NOT EXISTS "audio_jobs_project_status_idx" ON "audio_generation_jobs" ("project_id", "status");
CREATE INDEX IF NOT EXISTS "audio_jobs_project_chapter_idx" ON "audio_generation_jobs" ("project_id", "chapter_number");
CREATE INDEX IF NOT EXISTS "audio_jobs_voice_id_idx" ON "audio_generation_jobs" ("voice_id");
CREATE INDEX IF NOT EXISTS "audio_jobs_created_at_idx" ON "audio_generation_jobs" ("created_at");

-- Audio files table indexes
CREATE INDEX IF NOT EXISTS "audio_files_job_id_idx" ON "audio_files" ("job_id");
CREATE INDEX IF NOT EXISTS "audio_files_format_idx" ON "audio_files" ("format");
CREATE INDEX IF NOT EXISTS "audio_files_quality_score_idx" ON "audio_files" ("quality_score");
CREATE INDEX IF NOT EXISTS "audio_files_created_at_idx" ON "audio_files" ("created_at");
CREATE INDEX IF NOT EXISTS "audio_files_metadata_idx" ON "audio_files" USING gin ("metadata");

-- API keys table indexes
CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx" ON "api_keys" ("user_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys" ("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_expires_at_idx" ON "api_keys" ("expires_at");
CREATE INDEX IF NOT EXISTS "api_keys_last_used_at_idx" ON "api_keys" ("last_used_at");
CREATE INDEX IF NOT EXISTS "api_keys_scopes_idx" ON "api_keys" USING gin ("scopes");

-- Add CHECK constraints for data integrity
ALTER TABLE "users" ADD CONSTRAINT "users_tier_check" CHECK ("tier" IN ('free', 'pro', 'enterprise'));
ALTER TABLE "projects" ADD CONSTRAINT "projects_language_check" CHECK ("language" IN ('pt-BR', 'en'));
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_check" CHECK ("status" IN ('draft', 'queued', 'processing', 'completed', 'failed'));
ALTER TABLE "audio_generation_jobs" ADD CONSTRAINT "audio_generation_jobs_status_check" CHECK ("status" IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE "audio_generation_jobs" ADD CONSTRAINT "audio_generation_jobs_progress_check" CHECK ("progress" >= 0 AND "progress" <= 100);
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_format_check" CHECK ("format" IN ('mp3', 'wav', 'm4a', 'ogg'));
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_quality_score_check" CHECK ("quality_score" >= 0 AND "quality_score" <= 100);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();