-- PostgreSQL Database Initialization Script
-- This script runs when the PostgreSQL container starts for the first time

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set up timezone
SET timezone = 'UTC';

-- Create custom types if needed
-- (These will be added as we implement specific features)

-- Create basic schemas
CREATE SCHEMA IF NOT EXISTS audiobooks;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS tts;
CREATE SCHEMA IF NOT EXISTS jobs;

-- Grant permissions to the falador user
GRANT ALL ON SCHEMA audiobooks TO falador;
GRANT ALL ON SCHEMA users TO falador;
GRANT ALL ON SCHEMA tts TO falador;
GRANT ALL ON SCHEMA jobs TO falador;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA audiobooks GRANT ALL ON TABLES TO falador;
ALTER DEFAULT PRIVILEGES IN SCHEMA users GRANT ALL ON TABLES TO falador;
ALTER DEFAULT PRIVILEGES IN SCHEMA tts GRANT ALL ON TABLES TO falador;
ALTER DEFAULT PRIVILEGES IN SCHEMA jobs GRANT ALL ON TABLES TO falador;

-- Create basic configuration table
CREATE TABLE IF NOT EXISTS public.config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert basic configuration
INSERT INTO public.config (key, value, description) VALUES
    ('app_version', '0.1.0', 'Application version'),
    ('db_version', '1.0.0', 'Database schema version'),
    ('init_timestamp', NOW()::text, 'Database initialization timestamp')
ON CONFLICT (key) DO NOTHING;

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER
);

-- Log initialization
\echo 'Database initialization completed successfully'