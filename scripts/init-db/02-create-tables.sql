-- Core Tables Creation Script
-- Based on solution architecture database entities

-- =============================================================================
-- USERS SCHEMA
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'developer')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS users.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS users.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUDIOBOOKS SCHEMA
-- =============================================================================

-- Projects table
CREATE TABLE IF NOT EXISTS audiobooks.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    description TEXT,
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table (for EPUB/PDF input)
CREATE TABLE IF NOT EXISTS audiobooks.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES audiobooks.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    language VARCHAR(10) DEFAULT 'pt-BR',
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    page_count INTEGER,
    word_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS audiobooks.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES audiobooks.books(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT,
    order_index INTEGER NOT NULL,
    word_count INTEGER,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio files table
CREATE TABLE IF NOT EXISTS audiobooks.audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES audiobooks.chapters(id) ON DELETE CASCADE,
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    format VARCHAR(10) CHECK (format IN ('mp3', 'wav', 'ogg')),
    quality VARCHAR(20) DEFAULT 'standard',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TTS SCHEMA
-- =============================================================================

-- Voice profiles table
CREATE TABLE IF NOT EXISTS tts.voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    language VARCHAR(10) DEFAULT 'pt-BR',
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'neutral')),
    age_group VARCHAR(20) CHECK (age_group IN ('child', 'young', 'adult', 'senior')),
    voice_model VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TTS jobs table
CREATE TABLE IF NOT EXISTS tts.tts_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES audiobooks.chapters(id) ON DELETE CASCADE,
    voice_profile_id UUID REFERENCES tts.voice_profiles(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_text TEXT,
    output_file_path VARCHAR(500),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- JOBS SCHEMA
-- =============================================================================

-- Job queue table
CREATE TABLE IF NOT EXISTS jobs.job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
# =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users.users(email);
CREATE INDEX IF NOT EXISTS idx_users_sessions_token ON users.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_users_sessions_expires ON users.sessions(expires_at);

-- Audiobooks indexes
CREATE INDEX IF NOT EXISTS idx_audiobooks_projects_user ON audiobooks.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_projects_status ON audiobooks.projects(status);
CREATE INDEX IF NOT EXISTS idx_audiobooks_books_project ON audiobooks.books(project_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_chapters_book ON audiobooks.chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_audio_files_chapter ON audiobooks.audio_files(chapter_id);

-- TTS indexes
CREATE INDEX IF NOT EXISTS idx_tts_voice_profiles_user ON tts.voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_jobs_chapter ON tts.tts_jobs(chapter_id);
CREATE INDEX IF NOT EXISTS idx_tts_jobs_status ON tts.tts_jobs(status);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_queue_status ON jobs.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_jobs_queue_scheduled ON jobs.job_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_queue_type_priority ON jobs.job_queue(type, priority DESC);

-- =============================================================================
-- TRIGGERS
# =============================================================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON users.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON audiobooks.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON audiobooks.books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON audiobooks.chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audiobooks.audio_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_profiles_updated_at BEFORE UPDATE ON tts.voice_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tts_jobs_updated_at BEFORE UPDATE ON tts.tts_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo 'Core tables created successfully'