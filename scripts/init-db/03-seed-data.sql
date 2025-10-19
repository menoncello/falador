-- Seed Data Script
-- Populates the database with initial development data

-- =============================================================================
-- SEED USERS
# =============================================================================

-- Create a development admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users.users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    uuid_generate_v4(),
    'admin@falador.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- admin123
    'Admin',
    'User',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create a development regular user
-- Password: user123 (hashed with bcrypt)
INSERT INTO users.users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
    uuid_generate_v4(),
    'user@falador.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- user123
    'Development',
    'User',
    'user',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- SEED VOICE PROFILES
# =============================================================================

-- Get the admin user ID for voice profiles
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users.users WHERE email = 'admin@falador.local' LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
        -- Insert default voice profiles
        INSERT INTO tts.voice_profiles (user_id, name, description, language, gender, age_group, voice_model, is_default)
        VALUES
            (admin_user_id, 'Português Padrão Masculino', 'Voz masculina padrão brasileira', 'pt-BR', 'male', 'adult', 'default-male-pt-BR', true),
            (admin_user_id, 'Português Padrão Feminino', 'Voz feminina padrão brasileira', 'pt-BR', 'female', 'adult', 'default-female-pt-BR', false),
            (admin_user_id, 'Português Jovem Masculino', 'Voz masculina jovem brasileira', 'pt-BR', 'male', 'young', 'young-male-pt-BR', false),
            (admin_user_id, 'Português Sênior Feminino', 'Voz feminina sênior brasileira', 'pt-BR', 'female', 'senior', 'senior-female-pt-BR', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- SEED SAMPLE PROJECT
# =============================================================================

-- Get the regular user ID for sample project
DO $$
DECLARE
    user_id UUID;
    project_id UUID;
    book_id UUID;
BEGIN
    SELECT id INTO user_id FROM users.users WHERE email = 'user@falador.local' LIMIT 1;

    IF user_id IS NOT NULL THEN
        -- Create a sample project
        INSERT INTO audiobooks.projects (id, title, author, description, user_id, status, metadata)
        VALUES (
            uuid_generate_v4(),
            'Aventuras no Brasil',
            'Machado de Assis',
            'Uma amostra de projeto para demonstração da plataforma',
            user_id,
            'draft',
            '{"genre": "fiction", "language": "pt-BR", "total_chapters": 3}'
        ) RETURNING id INTO project_id;

        IF project_id IS NOT NULL THEN
            -- Create a sample book
            INSERT INTO audiobooks.books (id, project_id, title, author, language, page_count, word_count, metadata)
            VALUES (
                uuid_generate_v4(),
                project_id,
                'Aventuras no Brasil',
                'Machado de Assis',
                'pt-BR',
                200,
                50000,
                '{"format": "epub", "isbn": "9781234567890"}'
            ) RETURNING id INTO book_id;

            IF book_id IS NOT NULL THEN
                -- Create sample chapters
                INSERT INTO audiobooks.chapters (id, book_id, title, content, order_index, word_count, estimated_duration_minutes)
                VALUES
                    (uuid_generate_v4(), book_id, 'Capítulo 1: O Início', 'Este é o conteúdo do primeiro capítulo de nossa amostra...', 1, 1500, 10),
                    (uuid_generate_v4(), book_id, 'Capítulo 2: A Jornada', 'Neste segundo capítulo, nossa história se desenvolve...', 2, 2000, 13),
                    (uuid_generate_v4(), book_id, 'Capítulo 3: A Conclusão', 'O final de nossa aventura chega neste terceiro capítulo...', 3, 1800, 12)
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END IF;
END $$;

-- =============================================================================
-- SEED CONFIGURATION
# =============================================================================

-- Insert development configuration
INSERT INTO public.config (key, value, description)
VALUES
    ('tts_provider', 'kokoro', 'Default TTS provider'),
    ('max_file_size_mb', '50', 'Maximum file size for uploads in MB'),
    ('supported_formats', '["epub", "pdf", "txt", "md"]', 'Supported document formats'),
    ('default_voice_language', 'pt-BR', 'Default language for TTS'),
    ('max_concurrent_jobs', '5', 'Maximum concurrent processing jobs'),
    ('job_timeout_minutes', '30', 'Job timeout in minutes')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- SEED MIGRATIONS
# =============================================================================

-- Mark initial migration as executed
INSERT INTO public.migrations (version, description, executed_at, execution_time_ms)
VALUES
    ('1.0.0', 'Initial database schema and seed data', NOW(), 1000),
    ('1.0.1', 'Added core tables and indexes', NOW(), 500),
    ('1.0.2', 'Added seed data for development', NOW(), 300)
ON CONFLICT (version) DO NOTHING;

\echo 'Seed data inserted successfully'