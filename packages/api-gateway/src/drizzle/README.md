# PostgreSQL Database Setup

This directory contains the PostgreSQL database setup and configuration for the Falador Audiobook Platform using Drizzle ORM.

## Files Structure

```
src/drizzle/
├── db.ts                 # Database connection and pool configuration
├── schema/
│   ├── index.ts          # Schema exports
│   ├── users.ts          # Users table schema
│   ├── projects.ts       # Projects table schema
│   ├── audio.ts          # Audio generation jobs and files schemas
│   └── api-keys.ts       # API keys table schema
├── migrations/
│   └── 0001_initial_schema.sql  # Initial migration file
├── db.test.ts            # Database connection tests
├── schema.test.ts        # Schema validation tests
├── migration.test.ts     # Migration system tests
└── README.md             # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd packages/api-gateway
bun install
```

Required dependencies:

- `drizzle-orm@0.44.6` - ORM
- `pg@8.11.3` - PostgreSQL driver
- `drizzle-kit@0.28.1` - Migration tool (dev dependency)
- `@types/pg@8.11.10` - PostgreSQL types (dev dependency)

### 2. Environment Configuration

Set up the following environment variables:

```bash
# PostgreSQL connection (for development with Docker Compose)
DATABASE_URL=postgresql://falador:falador_dev@localhost:5432/falador

# Optional: Override Docker Compose defaults
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=falador
POSTGRES_USER=falador
POSTGRES_PASSWORD=falador_dev

# Node environment
NODE_ENV=development
```

### 3. Start PostgreSQL (Docker Compose)

```bash
# From project root
docker-compose up -d postgres
```

This starts PostgreSQL 17.4 with the configuration from `docker-compose.yml`.

### 4. Run Database Migrations

```bash
cd packages/api-gateway
bun run db:migrate
```

This will:

- Create all tables (users, projects, audio_generation_jobs, audio_files, api_keys)
- Set up foreign key relationships
- Create performance indexes
- Add constraints and triggers

### 5. Verify Setup

Run the test suite to verify everything is working:

```bash
bun test src/drizzle/
```

## Available Scripts

- `bun run db:generate` - Generate new migration files from schema changes
- `bun run db:migrate` - Apply pending migrations to the database
- `bun run db:rollback` - Rollback the last migration
- `bun run db:push` - Push schema changes directly to database (development only)
- `bun run db:studio` - Open Drizzle Studio for database management

## Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `email` (VARCHAR(255), Unique)
- `name` (VARCHAR(255))
- `password_hash` (VARCHAR(255))
- `tier` (ENUM: free, pro, enterprise)
- `created_at`, `updated_at` (TIMESTAMP)

### Projects Table

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `title` (VARCHAR(500))
- `author` (VARCHAR(255))
- `language` (ENUM: pt-BR, en)
- `genre` (VARCHAR(100))
- `status` (ENUM: draft, queued, processing, completed, failed)
- `metadata` (JSONB)
- `created_at`, `updated_at` (TIMESTAMP)

### Audio Generation Jobs Table

- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key → projects.id)
- `chapter_number` (INTEGER)
- `voice_id` (UUID)
- `text` (TEXT)
- `status` (ENUM: pending, processing, completed, failed)
- `progress` (INTEGER, 0-100)
- `error_message` (TEXT)
- `processing_started_at`, `processing_completed_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### Audio Files Table

- `id` (UUID, Primary Key)
- `job_id` (UUID, Foreign Key → audio_generation_jobs.id)
- `file_path` (VARCHAR(1000))
- `file_name` (VARCHAR(500))
- `format` (ENUM: mp3, wav, m4a, ogg)
- `duration` (INTEGER, seconds)
- `file_size` (INTEGER, bytes)
- `quality_score` (INTEGER, 0-100)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

### API Keys Table

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `key_hash` (VARCHAR(255), Unique)
- `name` (VARCHAR(255))
- `scopes` (JSONB, array of strings)
- `last_used_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

## Performance Features

### Indexes

- Email lookup indexes for users
- User-project relationship indexes
- Status-based query indexes for processing queues
- Composite indexes for common query patterns
- GIN indexes for JSONB metadata fields

### Connection Pooling

- Maximum 20 connections
- 30-second idle timeout
- 10-second connection timeout
- SSL enabled for production

### Constraints

- Foreign key relationships with cascade delete
- Unique constraints on emails and API key hashes
- Check constraints for enum values
- Progress range validation (0-100)

## Troubleshooting

### Migration Issues

If migrations fail, check:

1. PostgreSQL is running (`docker-compose ps`)
2. Database connection is correct (`DATABASE_URL`)
3. User has necessary permissions

### Test Failures

Tests require database connection. If tests fail:

1. Ensure PostgreSQL is running
2. Run migrations first: `bun run db:migrate`
3. Check environment variables

### Performance Issues

For production deployment:

1. Configure connection pool size based on expected load
2. Monitor index usage with `EXPLAIN ANALYZE`
3. Consider partitioning for large tables
4. Set up regular VACUUM and ANALYZE jobs

## Acceptance Criteria Coverage

This implementation satisfies all acceptance criteria from Story 1.4:

- **AC-1**: PostgreSQL connection configuration via environment variables
- **AC-2**: Migration system using Drizzle ORM
- **AC-3**: Core entities schema creation
- **AC-4**: Performance indexes configuration
- **AC-5**: Foreign key relationships
- **AC-6**: Timestamp fields configuration
- **AC-7**: Database connection pooling
- **AC-8**: Development environment migration support

Test cases are mapped to specific acceptance criteria with IDs:

- `1.4-DB-001`: PostgreSQL connection tests
- `1.4-DB-002`: Migration system tests
- `1.4-DB-003`: Schema creation tests
- `1.4-DB-004`: Index configuration tests
- `1.4-DB-005`: Foreign key tests
- `1.4-DB-006`: Timestamp field tests
- `1.4-DB-007`: Connection pooling tests
- `1.4-DB-008`: Development environment tests
