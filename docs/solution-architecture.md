# Solution Architecture Document

**Project:** Falador
**Date:** 2025-10-17
**Author:** Eduardo Menoncello

## Executive Summary

Falador is an enterprise-scale AI-directed TTS platform for Brazilian Portuguese audiobook production. The platform delivers 4.5/5 voice quality through KokoroTTS optimization, achieving 80% cost reduction and 10x faster production timelines versus traditional narration.

**Architecture Style:** Modular Monolith with Plugin Architecture
**Repository Strategy:** Monorepo (Bun workspace)
**Primary Stack:** TypeScript, Bun, Elysia, Astro, PostgreSQL
**Deployment:** GCP Cloud Run (serverless containers), Cloud SQL, Cloud Storage
**Interfaces:** CLI (Bun executable), Web Dashboard (Astro), REST API (Elysia)

**Key Architectural Drivers:**

- Clean Architecture with dependency injection (constructor-based)
- Plugin-based extensibility (SOLID compliance)
- Adapter pattern for TTS engines and external integrations
- Async-first design for compute-intensive workloads
- Multi-tenant with role-based access control

**Scale Requirements:**

- 99.9% uptime, 1,000+ concurrent requests
- 10,000+ hours monthly audio generation by Year 3
- Horizontal scaling via Cloud Run auto-scaling
- Sub-100ms API response times (95th percentile)

## 1. Technology Stack and Decisions

### 1.1 Technology and Library Decision Table

| Category                    | Technology            | Version  | Justification                                                                                                              |
| --------------------------- | --------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**                 | Bun                   | 1.3.0    | Native TypeScript execution, 3x faster than Node.js, built-in test runner, native SQLite support, optimized for serverless |
| **Backend Framework**       | Elysia                | 1.4.12   | TypeScript-first, Bun-optimized, 20x faster than Express, built-in validation, OpenAPI generation, 0.16ms overhead         |
| **Frontend Framework**      | Astro                 | 5.14.5   | Island architecture, minimal JS shipped, optimal for content-heavy dashboard, React/Vue/Svelte interop                     |
| **Language**                | TypeScript            | 5.9.3    | Strict type safety, excellent IDE support, team expertise, enforced via eslint.config.js                                   |
| **Database**                | PostgreSQL            | 17.4     | ACID compliance, JSON support, proven scalability, GCP Cloud SQL managed service                                           |
| **ORM/Query Builder**       | Drizzle ORM           | 0.44.6   | TypeScript-first, lightweight, type-safe queries, migration support, Bun-compatible                                        |
| **Queue System**            | BullMQ                | 5.61.0   | Redis-based, distributed job processing, retry logic, priority queues, webhook delivery                                    |
| **Cache**                   | Node LRU Cache        | 12.0.0   | In-memory caching, TTL support, simple API, no external dependencies                                                       |
| **Authentication**          | Lucia Auth            | 3.2.2    | Session-based auth, type-safe, framework-agnostic, CSRF protection, OAuth provider support                                 |
| **Validation**              | Valibot               | 1.1.0    | Schema validation, 10x smaller than Zod, tree-shakeable, Bun-optimized                                                     |
| **Testing Framework**       | Bun Test              | Built-in | Native Bun test runner, fast execution, Jest-compatible API                                                                |
| **Mutation Testing**        | Stryker               | 0.35.1   | 80% mutation score threshold (per CLAUDE.md), comprehensive test quality validation                                        |
| **API Documentation**       | Scalar                | 1.37.4   | OpenAPI-based, interactive docs, TypeScript SDK generation                                                                 |
| **CLI Framework**           | Commander.js          | 14.0.1   | Robust command routing, help generation, subcommands, option parsing                                                       |
| **Audio Processing**        | FFmpeg                | 7.1.0    | Industry standard, format conversion, metadata embedding, chapter markers                                                  |
| **TTS Engine**              | KokoroTTS             | Latest   | Brazilian Portuguese optimization, voice cloning support, MIT license                                                      |
| **File Parsing - EPUB**     | epub2                 | 3.0.2    | EPUB 2/3 support, chapter extraction, metadata parsing                                                                     |
| **File Parsing - PDF**      | pdf-parse             | 2.4.3    | Text extraction, layout preservation, metadata extraction                                                                  |
| **File Parsing - Markdown** | marked                | 16.4.0   | CommonMark compliant, heading detection, frontmatter support                                                               |
| **Logging**                 | pino                  | 10.0.0   | High-performance, structured logging, log levels, cloud-friendly JSON output                                               |
| **Environment Config**      | dotenv                | 16.5.0   | Environment variable management, .env file support                                                                         |
| **DI Container**            | tsyringe              | 4.8.0    | Lightweight dependency injection, decorator-based, constructor injection support                                           |
| **Cloud Storage**           | @google-cloud/storage | 7.15.0   | GCS SDK, signed URLs, streaming uploads, lifecycle management                                                              |
| **Cloud SQL**               | @google-cloud/sql     | Built-in | PostgreSQL connection pooling, IAM authentication                                                                          |
| **Redis Client**            | ioredis               | 5.8.1    | Redis connection, BullMQ requirement, cluster support, TypeScript types                                                    |
| **Webhook Delivery**        | svix                  | 1.48.0   | Webhook infrastructure, retry logic, signature verification, delivery tracking                                             |
| **Rate Limiting**           | @elysiajs/rate-limit  | 1.3.0    | Elysia plugin, memory/Redis storage, per-route limits, IP/user-based                                                       |
| **CORS**                    | @elysiajs/cors        | 1.4.0    | Elysia CORS plugin, configurable origins, credentials support                                                              |
| **Static Files**            | @elysiajs/static      | 1.4.4    | Elysia static file serving, compression, caching headers                                                                   |
| **Linting**                 | ESLint                | 9.37.0   | Code quality, TypeScript support, strict rules (see eslint.config.js)                                                      |
| **Code Formatting**         | Prettier              | 3.5.3    | Consistent formatting, auto-fix, pre-commit hooks                                                                          |
| **Git Hooks**               | Husky                 | 9.2.0    | Pre-commit linting, test execution, commit message validation                                                              |
| **Monorepo Tools**          | Turborepo             | 2.5.8    | Build orchestration, caching, parallel task execution                                                                      |
| **Component Library**       | Tailwind CSS          | 4.1.14   | Utility-first CSS, responsive design, design system from UX spec                                                           |
| **Headless UI**             | @headlessui/react     | 2.2.9    | Accessible components, React integration, keyboard navigation                                                              |
| **Radix UI**                | @radix-ui/themes      | 3.2.1    | Low-level UI primitives, accessibility, composability                                                                      |
| **Icons**                   | lucide-react          | 0.546.0  | Consistent icon set, tree-shakeable, TypeScript support                                                                    |
| **Audio Player**            | Howler.js             | 2.2.4    | Web audio playback, format support, streaming, waveform visualization                                                      |
| **Charts/Visualization**    | Chart.js              | 4.4.7    | Quality metrics, usage analytics, responsive charts                                                                        |
| **E2E Testing**             | Playwright            | 1.56.1   | Cross-browser testing, headless execution, CI/CD integration                                                               |
| **Code Coverage**           | c8                    | 10.1.3   | Coverage reporting, 80% minimum threshold                                                                                  |
| **CI/CD**                   | GitHub Actions        | N/A      | Automated testing, deployment pipelines, matrix builds                                                                     |
| **Containerization**        | Docker                | 28.0.1   | Multi-stage builds, Cloud Run deployment, local dev environment                                                            |
| **Error Tracking**          | Sentry                | 10.20.0  | Exception tracking, performance monitoring, release tracking (Epic 2+)                                                     |
| **IaC (Future)**            | Terraform             | 1.11.3   | GCP infrastructure provisioning, state management                                                                          |

**Key Technology Principles:**

- **Bun-native features prioritized**: Native test runner, SQLite, fast module resolution
- **No `any` types**: Strict TypeScript enforcement via ESLint config
- **Classes/interfaces over functions**: SOLID compliance, DI-friendly architecture
- **Constructor injection only**: Testability, explicit dependencies
- **80% mutation score**: Stryker enforced via CI/CD

## 2. Application Architecture

### 2.1 Architecture Pattern

**Modular Monolith with Plugin Architecture**

**Core Principles:**

- **Clean Architecture** (Domain → Application → Infrastructure → Presentation)
- **Plugin-based extensibility** (SOLID Open/Closed Principle)
- **Adapter pattern** for external systems (TTS engines, file parsers, platform integrations)
- **Dependency Inversion** via tsyringe DI container
- **Async-first** for long-running operations (BullMQ job queue)

**Monorepo Structure:**

```
/packages
  /core-domain         # Entities, use cases, interfaces (business logic)
  /api-gateway         # Elysia REST API, auth, routing, rate limiting
  /cli                 # Bun CLI application (Commander.js)
  /web-dashboard       # Astro frontend (island architecture)
  /job-worker          # BullMQ worker for async processing

/plugins (injectable domain services)
  /audio-generation    # TTS gateway, KokoroTTS adapter, voice synthesis
  /file-processing     # EPUB/PDF/Markdown/HTML parsers
  /batch-processing    # Queue orchestration, job management
  /voice-cloning       # Voice training pipeline, quality assessment
  /quality-assessment  # Scoring algorithms, pronunciation service
  /ai-direction        # Text analysis, genre profiles, narration optimization
  /webhook             # Event publishing, delivery queue
  /workflow-engine     # Approval workflows (enterprise)
  /distribution        # Platform adapters (ACX, Audible, Spotify)

/infrastructure
  /database            # Drizzle ORM, PostgreSQL repositories, migrations
  /storage             # GCS adapter, signed URLs, file lifecycle
  /cache               # LRU cache implementation
  /queue               # Redis + BullMQ configuration
  /logger              # Pino structured logging

/shared
  /types               # TypeScript interfaces, DTOs
  /utils               # Common utilities, validators
  /config              # Environment configuration, constants
```

**Plugin Interface Example:**

```typescript
// Domain interface (plugins must implement)
export interface TTSEngine {
  generate(text: string, voice: VoiceConfig): Promise<AudioBuffer>;
  getVoices(): Promise<Voice[]>;
  validateVoice(voiceId: string): Promise<boolean>;
}

// KokoroTTS adapter (infrastructure layer)
@injectable()
export class KokoroTTSAdapter implements TTSEngine {
  constructor(
    @inject('Logger') private logger: Logger,
    @inject('Config') private config: Config
  ) {}

  async generate(text: string, voice: VoiceConfig): Promise<AudioBuffer> {
    // KokoroTTS-specific implementation
  }
}

// Elysia API route (presentation layer)
app.post('/api/audio/generate', async ({ body }) => {
  const ttsEngine = container.resolve<TTSEngine>('TTSEngine');
  const audio = await ttsEngine.generate(body.text, body.voice);
  return { audioUrl: await storage.save(audio) };
});
```

**Dependency Flow:**

- **CLI/Web/API** → **Application Use Cases** → **Domain Services (Plugins)** → **Infrastructure Adapters**
- All dependencies point inward toward domain core
- No circular dependencies (enforced by ESLint import rules)

### 2.2 Interface-Specific Architecture

**CLI Application (Bun Executable):**

- **Entry Point**: `packages/cli/src/index.ts`
- **Command Structure**: `falador [command] [subcommand] [options]`
- **File I/O**: Local file handling, config management (~/.falador/config)
- **API Consumption**: Calls REST API Gateway (same as web dashboard)
- **Authentication**: API key stored locally, passed in headers
- **Output**: Colored terminal output (chalk), progress bars, JSON mode for scripting

**Web Dashboard (Astro):**

- **Architecture**: Island architecture (partial hydration)
- **Static Pages**: Landing, docs, pricing (pre-rendered at build time)
- **Dynamic Islands**: Audio player, project dashboard, voice library (React components)
- **Data Fetching**: Server-side via Astro endpoints, client-side via fetch
- **Routing**: File-based routing (`src/pages/`)
- **State**: Nanostores for global state, React hooks for component state
- **Deployment**: Static assets to GCS, served via Cloud CDN

**REST API (Elysia):**

- **Entry Point**: `packages/api-gateway/src/index.ts`
- **OpenAPI**: Auto-generated via Elysia Eden plugin
- **Authentication**: Lucia session-based + JWT for API keys
- **Rate Limiting**: Memory-based (dev), Redis-based (production)
- **Validation**: Valibot schemas on all routes
- **CORS**: Configurable origins, credentials support
- **Deployment**: Cloud Run container, auto-scaling 0-100 instances

### 2.3 Async Processing Architecture

**Job Queue System (BullMQ + Redis):**

```typescript
// Job types
enum JobType {
  AUDIO_GENERATION = 'audio:generation',
  VOICE_TRAINING = 'voice:training',
  BATCH_PROCESSING = 'batch:processing',
  WEBHOOK_DELIVERY = 'webhook:delivery',
}

// Job worker (packages/job-worker/src/workers/)
export class AudioGenerationWorker {
  private queue: Queue;

  constructor(redis: Redis) {
    this.queue = new Queue(JobType.AUDIO_GENERATION, { connection: redis });
    this.worker = new Worker(
      JobType.AUDIO_GENERATION,
      this.processJob.bind(this),
      { connection: redis, concurrency: 10 }
    );
  }

  async processJob(job: Job<AudioGenerationData>): Promise<AudioResult> {
    const ttsEngine = container.resolve<TTSEngine>('TTSEngine');
    const audio = await ttsEngine.generate(job.data.text, job.data.voice);

    // Update progress
    await job.updateProgress(50);

    // Save to storage
    const url = await storage.save(audio);

    // Trigger webhook
    await webhooks.send(job.data.userId, 'audio.completed', { url });

    return { audioUrl: url };
  }
}
```

**Job Lifecycle:**

1. API receives request → Creates job → Returns job ID
2. Client polls status endpoint OR receives webhook
3. Worker processes job → Updates progress → Saves result
4. Webhook notifies client on completion/failure

**Retry Strategy:**

- Exponential backoff: 1s, 5s, 30s, 5m, 30m
- Max attempts: 5
- Failed jobs moved to dead letter queue for manual inspection

## 3. Data Architecture

### 3.1 Database Schema

**Core Entities (PostgreSQL):**

```typescript
// users table
interface User {
  id: string; // UUID
  email: string;
  passwordHash: string | null; // Null for OAuth users
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

// projects table
interface Project {
  id: string;
  userId: string; // FK: users.id
  title: string;
  author: string | null;
  language: 'pt-BR' | 'en';
  genre: string | null;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata: object; // JSONB: ISBN, publisher, etc.
  createdAt: Date;
  updatedAt: Date;
}

// audio_generation_jobs table
interface AudioGenerationJob {
  id: string;
  projectId: string; // FK: projects.id
  chapterNumber: number | null;
  voiceId: string; // FK: voices.id
  text: string; // TEXT type for large content
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  errorMessage: string | null;
  processingStartedAt: Date | null;
  processingCompletedAt: Date | null;
  createdAt: Date;
}

// audio_files table
interface AudioFile {
  id: string;
  jobId: string; // FK: audio_generation_jobs.id
  filePath: string; // GCS path
  fileName: string;
  format: 'mp3' | 'm4b' | 'ogg';
  duration: number; // seconds
  fileSize: number; // bytes
  qualityScore: number | null; // 0-5 scale
  createdAt: Date;
}

// voices table
interface Voice {
  id: string;
  userId: string; // FK: users.id
  name: string;
  type: 'preset' | 'cloned' | 'brand';
  language: 'pt-BR' | 'en';
  modelPath: string | null; // GCS path for cloned voices
  sampleAudioPath: string | null;
  status: 'training' | 'ready' | 'failed';
  metadata: object; // JSONB: pitch, speed, tone settings
  createdAt: Date;
}

// pronunciation_dictionaries table
interface PronunciationDictionary {
  id: string;
  userId: string; // FK: users.id
  projectId: string | null; // FK: projects.id (null = global)
  word: string;
  phonetic: string;
  createdAt: Date;
}

// batch_jobs table
interface BatchJob {
  id: string;
  userId: string;
  name: string;
  config: object; // JSONB: voice, quality settings
  totalBooks: number;
  completedBooks: number;
  failedBooks: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// api_keys table
interface ApiKey {
  id: string;
  userId: string;
  keyHash: string; // bcrypt hash
  name: string;
  scopes: string[]; // Array of permitted scopes
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

// webhook_subscriptions table
interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: string[]; // ['audio.completed', 'batch.finished']
  secret: string; // For signature verification
  active: boolean;
  createdAt: Date;
}

// teams table (Enterprise)
interface Team {
  id: string;
  name: string;
  ownerId: string; // FK: users.id
  createdAt: Date;
}

// team_members table (Enterprise)
interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  createdAt: Date;
}
```

### 3.2 Indexes and Performance

**Critical Indexes:**

```sql
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_jobs_project_status ON audio_generation_jobs(project_id, status);
CREATE INDEX idx_audio_files_job ON audio_files(job_id);
CREATE INDEX idx_voices_user_status ON voices(user_id, status);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_batch_jobs_user_status ON batch_jobs(user_id, status);
```

**JSONB Indexes:**

```sql
CREATE INDEX idx_projects_metadata_isbn ON projects USING GIN ((metadata->>'isbn'));
CREATE INDEX idx_voices_metadata ON voices USING GIN (metadata);
```

### 3.3 Data Migration Strategy

**Drizzle ORM Migrations:**

- **Migration Files**: `infrastructure/database/migrations/`
- **Versioning**: Timestamp-based (e.g., `20250117_create_users.sql`)
- **Execution**: Automated in CI/CD, manual trigger for production
- **Rollback**: Down migrations for every up migration
- **Seed Data**: Separate seed scripts for development/staging

**Migration Workflow:**

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Rollback last migration
bun run db:rollback
```

## 4. API Design

### 4.1 API Structure

**Base URL:** `https://api.falador.ai/v1`

**Authentication:**

- **Session-based** (web dashboard): Lucia sessions, HTTP-only cookies
- **API Key** (CLI, integrations): `Authorization: Bearer <api_key>` header

**Versioning:** URL-based (`/v1/`) for breaking changes

**Response Format:**

```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

### 4.2 API Routes

**Authentication:**

- `POST /auth/register` - Create user account
- `POST /auth/login` - Email/password login
- `POST /auth/logout` - Invalidate session
- `GET /auth/me` - Get current user
- `POST /auth/api-keys` - Generate API key
- `DELETE /auth/api-keys/:id` - Revoke API key

**Projects:**

- `GET /projects` - List user projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project metadata
- `DELETE /projects/:id` - Delete project
- `POST /projects/:id/upload` - Upload book file

**Audio Generation:**

- `POST /audio/generate` - Queue audio generation job
- `GET /audio/jobs/:id` - Get job status
- `GET /audio/jobs/:id/download` - Download generated audio
- `POST /audio/regenerate` - Regenerate specific chapter
- `DELETE /audio/jobs/:id` - Cancel job

**Voices:**

- `GET /voices` - List available voices
- `POST /voices/clone` - Upload voice sample for cloning
- `GET /voices/:id` - Get voice details
- `PATCH /voices/:id` - Update voice settings
- `DELETE /voices/:id` - Delete voice
- `POST /voices/:id/preview` - Generate preview with voice

**Batch Processing:**

- `POST /batch` - Create batch job
- `GET /batch/:id` - Get batch status
- `GET /batch/:id/books` - List books in batch
- `POST /batch/:id/cancel` - Cancel batch job

**Quality & Pronunciation:**

- `GET /pronunciation` - List pronunciation rules
- `POST /pronunciation` - Add pronunciation rule
- `DELETE /pronunciation/:id` - Remove rule
- `GET /quality/score/:audioId` - Get quality score

**Webhooks:**

- `GET /webhooks` - List subscriptions
- `POST /webhooks` - Create subscription
- `PATCH /webhooks/:id` - Update subscription
- `DELETE /webhooks/:id` - Delete subscription

**Distribution (Future):**

- `POST /distribution/acx` - Export to ACX
- `POST /distribution/audible` - Export to Audible
- `POST /distribution/spotify` - Export to Spotify

### 4.3 Rate Limiting

**Tier-based Limits:**

- **Free**: 10 requests/minute, 100 requests/hour
- **Pro**: 60 requests/minute, 1000 requests/hour
- **Enterprise**: Custom limits (configurable)

**Rate Limit Headers:**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642780800
```

**429 Response:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

## 5. Authentication and Authorization

### 5.1 Auth Strategy

**Lucia Auth Integration:**

- Session-based for web dashboard
- API key authentication for CLI/integrations
- OAuth providers: Google (Month 6), GitHub (Month 7) - See ADR-011
- CSRF protection via tokens

**Password Security:**

- bcrypt hashing (cost factor: 12)
- Minimum 8 characters, complexity requirements
- Password reset via email token (15-minute expiry)

### 5.2 Session Management

**Session Storage:** PostgreSQL (lucia_sessions table)
**Session Duration:** 30 days
**Refresh Strategy:** Sliding window (extends on activity)
**Cookie Configuration:**

```typescript
{
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30 // 30 days
}
```

### 5.3 API Key Management

**Key Generation:**

- Cryptographically secure random (32 bytes)
- Prefix: `fal_` for easy identification
- Storage: bcrypt hash only (key shown once at creation)

**Scopes:**

- `audio:read`, `audio:write` - Audio operations
- `voice:read`, `voice:write` - Voice management
- `project:read`, `project:write` - Project management
- `batch:write` - Batch processing
- `webhook:write` - Webhook subscriptions

**Key Rotation:**

- Expiration dates (optional)
- Manual revocation via dashboard/CLI
- Audit log of key usage

### 5.4 Role-Based Access Control (Enterprise)

**Roles:**

- **Owner**: Full access, billing, team management
- **Admin**: User management, project settings, RBAC
- **Editor**: Create/edit projects, generate audio
- **Viewer**: Read-only access

**Permission Matrix:**
| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| Create Project | ✓ | ✓ | ✓ | ✗ |
| Edit Project | ✓ | ✓ | ✓ | ✗ |
| Delete Project | ✓ | ✓ | ✗ | ✗ |
| Generate Audio | ✓ | ✓ | ✓ | ✗ |
| Clone Voice | ✓ | ✓ | ✓ | ✗ |
| Manage Team | ✓ | ✓ | ✗ | ✗ |
| View Billing | ✓ | ✗ | ✗ | ✗ |

## 6. Component and Integration Overview

### 6.1 Plugin Architecture

**Audio Generation Plugin:**

- **TTS Gateway Interface**: Abstract TTS operations
- **KokoroTTS Adapter**: Primary implementation (Brazilian Portuguese)
- **Future Adapters**: ElevenLabs, Google Cloud TTS, AWS Polly, Azure Speech
- **Voice Configuration**: Pitch, speed, tone, emotion parameters
- **Quality Validation**: Post-generation scoring

**File Processing Plugin:**

- **EPUB Parser**: epub2 library, chapter extraction, TOC parsing
- **PDF Parser**: pdf-parse library, text extraction, layout preservation
- **Markdown Parser**: marked library, heading-based chapter detection
- **HTML Parser**: Cheerio, sanitization, structure extraction
- **Unified Interface**: `BookParser` interface for all formats

**Voice Cloning Plugin:**

- **Sample Validation**: Duration, quality, background noise detection
- **Training Pipeline**: Voice model generation (KokoroTTS fine-tuning)
- **Quality Assessment**: Automated scoring, user preview
- **Voice Library**: CRUD operations, metadata management

**Batch Processing Plugin:**

- **Queue Orchestration**: BullMQ job scheduling
- **Concurrency Control**: Configurable parallel processing
- **Progress Tracking**: Per-book status, overall batch progress
- **Error Handling**: Partial failure recovery, retry logic

**Quality Assessment Plugin:**

- **Scoring Algorithm**: Audio quality metrics (0-5 scale)
- **Pronunciation Service**: Dictionary management, phonetic mapping
- **Regeneration Workflow**: Selective chapter regeneration

**AI Direction Plugin:**

- **Text Analysis**: Genre detection, sentiment analysis
- **Narration Optimization**: Tone, pacing, emotional expression
- **Genre Profiles**: Configurable direction templates (fiction, non-fiction, technical)

**Webhook Plugin:**

- **Event Publishing**: Audio completion, batch status, errors
- **Delivery Queue**: BullMQ-based retry logic
- **Signature Verification**: HMAC-SHA256 signatures (svix library)
- **Subscription Management**: CRUD operations, event filtering

**Distribution Plugin (Future):**

- **ACX Adapter**: Metadata mapping, file requirements, API integration
- **Audible Adapter**: Format conversion, ISBN validation
- **Spotify Adapter**: API upload, metadata synchronization

### 6.2 Major Modules

**CLI Application:**

- **Commands**: `auth`, `generate`, `batch`, `voice`, `config`
- **Configuration**: YAML/JSON config files, environment variables
- **Progress Display**: Real-time progress bars, ETA calculation
- **Error Handling**: User-friendly messages, exit codes

**Web Dashboard:**

- **Landing Pages**: Marketing, pricing, docs (static)
- **Dashboard**: Project overview, recent activity, quick actions
- **Project Workspace**: Upload, configure, monitor, download
- **Voice Library**: Gallery view, cloning wizard, preview
- **Batch Monitor**: Status table, bulk actions, filtering
- **Settings**: User profile, API keys, team management (enterprise)

**API Gateway:**

- **Request Validation**: Valibot schemas on all routes
- **Authentication Middleware**: Session/API key verification
- **Rate Limiting Middleware**: Tier-based limits
- **Error Handling**: Standardized error responses
- **Logging**: Structured request/response logging (pino)

**Job Worker:**

- **Audio Generation Worker**: TTS processing, storage upload
- **Voice Training Worker**: Model training, quality validation
- **Batch Processing Worker**: Book processing orchestration
- **Webhook Delivery Worker**: Event notification delivery

### 6.3 Third-Party Integrations

**GCP Services:**

- **Cloud Run**: API Gateway, Job Worker deployment
- **Cloud SQL**: PostgreSQL managed database
- **Cloud Storage**: Audio files, voice models, user uploads
- **Cloud CDN**: Static asset delivery
- **Cloud Pub/Sub**: Migration from BullMQ at scale (See ADR-012 for trigger criteria and migration plan)

**External APIs:**

- **KokoroTTS**: Primary TTS engine
- **FFmpeg**: Audio processing, format conversion
- **Svix**: Webhook delivery infrastructure
- **OAuth Providers** (Future): Google, GitHub authentication

**Development Tools:**

- **GitHub Actions**: CI/CD pipelines
- **Docker**: Containerization, local development
- **Turborepo**: Monorepo build orchestration
- **Stryker**: Mutation testing

## 7. Deployment Architecture

### 7.1 Hosting Platform

**GCP Cloud Run:**

- **API Gateway**: Auto-scaling 0-100 instances, CPU: 2, Memory: 4GB
- **Job Worker**: Dedicated instances for long-running jobs, CPU: 4, Memory: 8GB
- **Scaling Strategy**: CPU-based (target 80% utilization)
- **Cold Start Mitigation**: Minimum 1 instance for API Gateway

**Cloud SQL:**

- **Instance Type**: db-n1-standard-2 (2 vCPU, 7.5GB RAM)
- **Storage**: 100GB SSD, auto-resize enabled
- **Backups**: Daily automated backups, 7-day retention
- **High Availability**: Multi-zone replication (production)

**Cloud Storage:**

- **Bucket Structure**: `{env}-falador-audio`, `{env}-falador-voices`, `{env}-falador-uploads`
- **Lifecycle Policy**: Delete uploads after 30 days, archive audio after 90 days
- **CDN**: Cloud CDN for audio file delivery
- **Signed URLs**: Temporary access for large file uploads/downloads

**Redis (Cloud Memorystore):**

- **Instance Type**: Basic tier (dev), Standard tier (production)
- **Memory**: 5GB (production)
- **Persistence**: Enabled (RDB snapshots)

### 7.2 Environment Configuration

**Environments:**

- **Development**: Local Docker Compose
- **Staging**: GCP Cloud Run (us-central1)
- **Production**: GCP Cloud Run (us-east1)

**Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# GCP
GCS_BUCKET_AUDIO=prod-falador-audio
GCS_BUCKET_VOICES=prod-falador-voices
GCS_PROJECT_ID=falador-prod

# Authentication
JWT_SECRET=<random-secret>
SESSION_SECRET=<random-secret>

# APIs
KOKOROTTS_API_KEY=<api-key>

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info
```

### 7.3 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main, staging]

jobs:
  test:
    - Lint (ESLint)
    - Type check (tsc)
    - Unit tests (Bun test)
    - Mutation tests (Stryker, 80% threshold)
    - E2E tests (Playwright)

  build:
    - Build Docker images
    - Push to GCP Artifact Registry

  deploy:
    - Deploy to Cloud Run (staging/production)
    - Run database migrations
    - Smoke tests
```

**Deployment Strategy:**

- **Blue/Green Deployment**: Zero-downtime deployments
- **Rollback**: Automated on health check failure
- **Database Migrations**: Run before new revision deployment
- **Feature Flags** (Future): Gradual rollout of new features

## 8. Architecture Decision Records

**ADR-001: Why Modular Monolith over Microservices?**

- **Context**: Enterprise-scale platform with multiple interfaces (CLI, Web, API)
- **Decision**: Modular monolith with plugin architecture
- **Rationale**:
  - Budget constraints (serverless monolith is cost-effective)
  - Shared domain logic across CLI/Web/API (monorepo benefits)
  - Easier debugging, deployment, transaction management
  - Plugin architecture provides extensibility without microservices complexity
  - Can extract plugins to services as scale demands
- **Consequences**: Single deployment unit, shared database, requires discipline in module boundaries

**ADR-002: Why Bun over Node.js?**

- **Context**: TypeScript runtime for backend services
- **Decision**: Bun 1.1.34
- **Rationale**:
  - 3x faster than Node.js (critical for TTS processing)
  - Native TypeScript execution (no transpilation)
  - Built-in test runner (simpler tooling)
  - SQLite support (future local CLI features)
  - Team expertise requirement acceptable
- **Consequences**: Smaller ecosystem, requires team upskilling, excellent documentation available

**ADR-003: Why Elysia over Express/Fastify?**

- **Context**: Backend API framework
- **Decision**: Elysia 1.1.23
- **Rationale**:
  - Bun-optimized (20x faster than Express)
  - TypeScript-first (type inference, validation)
  - Built-in OpenAPI generation
  - Minimal overhead (0.16ms)
  - Ecosystem growing rapidly
- **Consequences**: Smaller community, migration complexity if Bun adoption fails

**ADR-004: Why Astro over Next.js/Nuxt?**

- **Context**: Web dashboard framework
- **Decision**: Astro 4.16.18
- **Rationale**:
  - Island architecture (minimal JS shipped, critical for dashboard performance)
  - Content-heavy pages (project listings, docs) benefit from static generation
  - Framework-agnostic (can use React for interactive islands)
  - Excellent SEO (static HTML)
  - Simple mental model
- **Consequences**: Less real-time features, requires React for complex interactions

**ADR-005: Why PostgreSQL over MongoDB?**

- **Context**: Primary database for user data, projects, jobs
- **Decision**: PostgreSQL 16.6
- **Rationale**:
  - ACID compliance (critical for billing, job status)
  - JSON support (JSONB for flexible metadata)
  - Proven scalability (millions of rows)
  - GCP Cloud SQL managed service
  - Team expertise
- **Consequences**: Schema migrations required, less flexible than NoSQL

**ADR-006: Why Redis + BullMQ over Cloud Tasks?**

- **Context**: Job queue for async processing
- **Decision**: Redis + BullMQ
- **Rationale**:
  - More control over retry logic, priority queues
  - Better monitoring, debugging capabilities
  - Can migrate to Cloud Pub/Sub later if needed
  - BullMQ battle-tested, excellent TypeScript support
- **Consequences**: Self-managed Redis (Cloud Memorystore), additional infrastructure complexity

**ADR-007: Why Adapter Pattern for TTS Engines?**

- **Context**: TTS vendor lock-in risk
- **Decision**: TTS Gateway with vendor-specific adapters
- **Rationale**:
  - Vendor independence (swap engines without code changes)
  - Multi-provider support (route by quality/cost/language)
  - A/B testing different engines
  - Competitive advantage (best-of-breed approach)
- **Consequences**: Additional abstraction layer, consistent interface design required

**ADR-008: Why Constructor Injection over Property Injection?**

- **Context**: Dependency injection pattern
- **Decision**: Constructor-only injection
- **Rationale**:
  - Explicit dependencies (visible in constructor signature)
  - Immutability (dependencies set at construction)
  - Testability (easy to mock dependencies)
  - TypeScript type safety
- **Consequences**: Verbose constructors for complex classes, requires DI container

**ADR-009: Why 80% Mutation Score Threshold?**

- **Context**: Test quality standards
- **Decision**: Stryker mutation testing with 80% threshold
- **Rationale**:
  - Code coverage is insufficient (can have 100% coverage with poor tests)
  - Mutation testing validates test quality (tests must kill mutants)
  - 80% is industry best practice for critical systems
  - Enforced via CI/CD (builds fail below threshold)
- **Consequences**: Slower CI/CD, requires discipline in test writing

**ADR-010: Why Monorepo over Polyrepo?**

- **Context**: Repository structure for multi-package project
- **Decision**: Monorepo with Turborepo
- **Rationale**:
  - Shared types across CLI/Web/API (single source of truth)
  - Atomic commits across packages
  - Simplified dependency management
  - Easier refactoring (grep across entire codebase)
  - Build caching (Turborepo)
- **Consequences**: Larger repository, requires monorepo tooling

**ADR-011: OAuth Provider Integration Timeline**

- **Context**: User authentication expansion with social login
- **Decision**: Defer OAuth integration to Epic 4 completion (post-MVP)
- **Timeline**:
  - **Epic 1-3 (MVP)**: Email/password authentication only (Lucia Auth)
  - **Epic 4 (Web Dashboard)**: Enable OAuth providers after dashboard launch
  - **Target**: Month 6 post-launch (Google OAuth first, GitHub second)
- **Implementation Plan**:
  1. **Phase 1 (Month 6)**: Google OAuth integration
     - Add Google OAuth provider to Lucia Auth configuration
     - Implement OAuth callback routes (`/auth/google/callback`)
     - Update user schema to support OAuth users (null password field)
     - Add "Sign in with Google" button to web dashboard
  2. **Phase 2 (Month 7)**: GitHub OAuth integration
     - Follow same pattern as Google (developer-focused audience)
  3. **Phase 3 (Month 9)**: OAuth in CLI
     - Implement device flow for CLI OAuth (opens browser for authorization)
- **Rationale**:
  - MVP focus on core TTS functionality, not auth features
  - Email/password sufficient for early adopters and CLI users
  - OAuth adds complexity (callback handling, token management, account linking)
  - Lucia Auth already supports OAuth providers (low migration risk)
  - Google/GitHub cover 90% of developer audience
- **Consequences**: MVP users create traditional accounts, can link OAuth later

**ADR-012: Queue Migration Strategy - BullMQ to Cloud Pub/Sub**

- **Context**: Job queue scalability and operational overhead
- **Decision**: Start with Redis + BullMQ, migrate to Cloud Pub/Sub at scale trigger
- **Migration Trigger Criteria**:
  - **Queue depth consistently > 5,000 jobs** for 7+ days
  - **Redis memory > 10GB** (cost optimization threshold)
  - **Multi-region deployment** required (Redis replication complexity)
  - **Event-driven architecture expansion** beyond job queue (Pub/Sub is more versatile)
- **Migration Plan**:
  1. **Phase 1 (Pre-Migration)**: Abstract queue interface
     - Define `JobQueue` interface in `core-domain/interfaces/services/`
     - BullMQ implements this interface
     - All job producers/consumers use interface, not BullMQ directly
  2. **Phase 2 (Trigger Met)**: Implement Cloud Pub/Sub adapter
     - Create `PubSubQueue` class implementing `JobQueue` interface
     - Run parallel processing (BullMQ + Pub/Sub) for 2 weeks (validation)
     - Monitor: job success rates, latency, cost
  3. **Phase 3 (Cutover)**: Switch to Cloud Pub/Sub
     - Feature flag: `QUEUE_PROVIDER=pubsub`
     - Drain BullMQ queues (wait for all jobs to complete)
     - Switch flag, monitor for 48 hours
     - Decommission Redis if no other dependencies
  4. **Phase 4 (Optimization)**: Leverage Pub/Sub features
     - Dead letter topics for failed jobs
     - Cloud Functions for lightweight job processing
     - Cross-region message routing
- **Cost Analysis**:
  - **BullMQ (Redis)**: ~$200/month (5GB Cloud Memorystore)
  - **Cloud Pub/Sub**: ~$40/month for 1M messages (pay-per-use)
  - **Migration Trigger**: Pub/Sub becomes cost-effective at >2.5M messages/month
- **Rationale**:
  - BullMQ is simpler for MVP (developer-friendly API, excellent TypeScript support)
  - Cloud Pub/Sub is more scalable (serverless, auto-scaling, cross-region)
  - Abstract interface enables zero-downtime migration
  - Defer complexity until proven need
- **Consequences**: Migration effort required at scale, but interface abstraction minimizes risk

**ADR-013: Error Tracking and Monitoring Strategy**

- **Context**: Production error tracking and observability
- **Decision**: Implement Sentry integration in Epic 2 completion (Month 4 post-launch)
- **Timeline**:
  - **Epic 1-2 (MVP)**: Structured logging only (pino + Cloud Logging)
  - **Epic 2 Completion (Month 4)**: Add Sentry for exception tracking
  - **Epic 4 (Month 6)**: Add Sentry performance monitoring (web dashboard)
- **Implementation Plan**:
  1. **Phase 1 (Month 4 - Backend Integration)**:
     - Install: `@sentry/bun` SDK
     - Initialize Sentry in API Gateway and Job Worker entry points
     - Configure: Release tracking, environment tags, user context
     - Error sampling: 100% errors, 10% transactions (cost optimization)
  2. **Phase 2 (Month 6 - Frontend Integration)**:
     - Install: `@sentry/astro` SDK
     - Add Sentry to Astro config
     - Track: Frontend exceptions, unhandled promise rejections
     - Performance: Core Web Vitals, React component render times
  3. **Phase 3 (Month 8 - Advanced Features)**:
     - Breadcrumbs: User actions leading to errors
     - Source maps: Upload for readable stack traces
     - Alerts: Slack/email notifications for critical errors
     - Cron monitoring: Job worker health checks
- **Configuration**:

  ```typescript
  // infrastructure/logger/sentry-integration.ts
  import * as Sentry from '@sentry/bun';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.GIT_SHA,
    tracesSampleRate: 0.1, // 10% of transactions
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.BullMQ(),
    ],
    beforeSend(event) {
      // Filter sensitive data from error reports
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    },
  });
  ```

- **Technology Stack Addition**:
  | Category | Technology | Version | Justification |
  |----------|------------|---------|---------------|
  | **Error Tracking** | Sentry | 8.42.0 | Exception tracking, performance monitoring, release tracking, breadcrumbs |
- **Cost Estimate**:
  - **Development Team Plan**: $26/month (100k events)
  - **Production**: ~$80/month (500k events estimated)
- **Rationale**:
  - Structured logging (pino) sufficient for MVP debugging
  - Sentry provides superior error grouping, release tracking, user context
  - Month 4 timing allows production traffic patterns to emerge
  - Frontend errors are critical for web dashboard UX (Month 6 integration)
  - Deferred cost (~$1k/year) justified by production stability needs
- **Consequences**: Slight increase in bundle size (~50KB), monthly operational cost, improved error resolution time

## 9. Implementation Guidance

### 9.1 Development Workflow

**Local Development:**

```bash
# Clone repository
git clone https://github.com/falador/falador.git
cd falador

# Install dependencies
bun install

# Start Docker Compose (PostgreSQL, Redis)
docker-compose up -d

# Run database migrations
bun run db:migrate

# Start development servers (Turborepo)
bun run dev

# API Gateway: http://localhost:3000
# Web Dashboard: http://localhost:4321
# Job Worker: Background process
```

**Testing:**

```bash
# Run all tests
bun run test

# Unit tests only
bun run test:unit

# E2E tests
bun run test:e2e

# Mutation tests
bun run test:mutation

# Coverage report
bun run test:coverage
```

**Linting:**

```bash
# Lint all packages
bun run lint

# Fix auto-fixable issues
bun run lint:fix

# Type check
bun run typecheck
```

### 9.2 File Organization

**Package Structure:**

```
packages/core-domain/
  src/
    entities/         # Domain entities (User, Project, AudioFile)
    interfaces/       # Repository interfaces, service interfaces
    use-cases/        # Application business logic
    errors/           # Custom error classes
  tests/
    unit/
    integration/

packages/api-gateway/
  src/
    routes/           # Elysia route handlers
    middleware/       # Auth, rate limiting, CORS
    validators/       # Valibot schemas
  tests/
    e2e/

packages/cli/
  src/
    commands/         # Commander.js commands
    utils/            # CLI-specific utilities
  tests/
    integration/

packages/web-dashboard/
  src/
    pages/            # Astro pages (file-based routing)
    components/       # React islands
    layouts/          # Page layouts
  tests/
    e2e/

plugins/audio-generation/
  src/
    gateway/          # TTS Gateway interface
    adapters/         # KokoroTTS, future vendors
  tests/
    unit/
    integration/
```

### 9.3 Naming Conventions

**Files:**

- **Kebab-case**: `audio-generation-service.ts`
- **Test files**: `audio-generation-service.test.ts`
- **Interfaces**: `i-tts-engine.ts` (enforced by ESLint to NOT use `I` prefix in type name)

**Classes:**

- **PascalCase**: `AudioGenerationService`
- **Interfaces**: `TTSEngine` (no `I` prefix per ESLint config)
- **Types**: `AudioConfig`, `VoiceSettings`

**Functions:**

- **camelCase**: `generateAudio`, `validateVoice`
- **Pure functions**: `calculateDuration`, `formatTimestamp`

**Constants:**

- **UPPER_SNAKE_CASE**: `MAX_FILE_SIZE`, `DEFAULT_VOICE_ID`

**Database:**

- **snake_case**: `audio_generation_jobs`, `created_at`

### 9.4 Best Practices

**Dependency Injection:**

```typescript
// ✅ Good: Constructor injection
@injectable()
export class AudioGenerationService {
  constructor(
    @inject('TTSEngine') private ttsEngine: TTSEngine,
    @inject('Storage') private storage: Storage,
    @inject('Logger') private logger: Logger
  ) {}
}

// ❌ Bad: Property injection
export class AudioGenerationService {
  @inject('TTSEngine') private ttsEngine: TTSEngine; // Avoid
}
```

**Error Handling:**

```typescript
// ✅ Good: Custom error classes
export class VoiceNotFoundError extends Error {
  constructor(voiceId: string) {
    super(`Voice ${voiceId} not found`);
    this.name = 'VoiceNotFoundError';
  }
}

// ❌ Bad: Generic errors
throw new Error('Voice not found'); // Avoid
```

**Logging:**

```typescript
// ✅ Good: Structured logging
logger.info({ userId, projectId, duration }, 'Audio generation completed');

// ❌ Bad: String concatenation
logger.info('Audio generation completed for user ' + userId); // Avoid
```

**Async/Await:**

```typescript
// ✅ Good: Explicit error handling
try {
  const audio = await ttsEngine.generate(text, voice);
} catch (error) {
  logger.error({ error }, 'TTS generation failed');
  throw new AudioGenerationError('Failed to generate audio', { cause: error });
}

// ❌ Bad: Unhandled promise rejection
const audio = await ttsEngine.generate(text, voice); // No try/catch
```

**Type Safety:**

```typescript
// ✅ Good: Explicit return types
export function calculateDuration(audioBuffer: Buffer): number {
  // Implementation
}

// ❌ Bad: Inferred return type
export function calculateDuration(audioBuffer: Buffer) {
  // Missing return type
  // Implementation
}
```

## 10. Proposed Source Tree

```
falador/
├── packages/
│   ├── core-domain/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   │   ├── user.ts
│   │   │   │   ├── project.ts
│   │   │   │   ├── audio-file.ts
│   │   │   │   ├── voice.ts
│   │   │   │   └── batch-job.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── user-repository.ts
│   │   │   │   │   ├── project-repository.ts
│   │   │   │   │   └── audio-repository.ts
│   │   │   │   └── services/
│   │   │   │       ├── tts-engine.ts
│   │   │   │       ├── storage.ts
│   │   │   │       └── queue.ts
│   │   │   ├── use-cases/
│   │   │   │   ├── generate-audio.ts
│   │   │   │   ├── clone-voice.ts
│   │   │   │   └── process-batch.ts
│   │   │   └── errors/
│   │   │       ├── domain-error.ts
│   │   │       ├── validation-error.ts
│   │   │       └── not-found-error.ts
│   │   └── package.json
│   │
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── audio.ts
│   │   │   │   ├── voices.ts
│   │   │   │   ├── batch.ts
│   │   │   │   └── webhooks.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   ├── cors.ts
│   │   │   │   └── error-handler.ts
│   │   │   └── validators/
│   │   │       ├── audio-schema.ts
│   │   │       └── voice-schema.ts
│   │   └── package.json
│   │
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── generate.ts
│   │   │   │   ├── batch.ts
│   │   │   │   ├── voice.ts
│   │   │   │   └── config.ts
│   │   │   └── utils/
│   │   │       ├── api-client.ts
│   │   │       ├── config-manager.ts
│   │   │       └── progress-bar.ts
│   │   └── package.json
│   │
│   ├── web-dashboard/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro
│   │   │   │   ├── dashboard.astro
│   │   │   │   ├── projects/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [id].astro
│   │   │   │   ├── voices/
│   │   │   │   │   └── index.astro
│   │   │   │   └── settings.astro
│   │   │   ├── components/
│   │   │   │   ├── audio-player.tsx
│   │   │   │   ├── project-card.tsx
│   │   │   │   ├── voice-cloning-wizard.tsx
│   │   │   │   └── batch-monitor.tsx
│   │   │   ├── layouts/
│   │   │   │   ├── base-layout.astro
│   │   │   │   └── dashboard-layout.astro
│   │   │   └── styles/
│   │   │       └── global.css
│   │   └── package.json
│   │
│   └── job-worker/
│       ├── src/
│       │   ├── index.ts
│       │   └── workers/
│       │       ├── audio-generation-worker.ts
│       │       ├── voice-training-worker.ts
│       │       ├── batch-processing-worker.ts
│       │       └── webhook-delivery-worker.ts
│       └── package.json
│
├── plugins/
│   ├── audio-generation/
│   │   ├── src/
│   │   │   ├── gateway/
│   │   │   │   └── tts-gateway.ts
│   │   │   └── adapters/
│   │   │       ├── kokoro-tts-adapter.ts
│   │   │       └── elevenlabs-adapter.ts (future)
│   │   └── package.json
│   │
│   ├── file-processing/
│   │   ├── src/
│   │   │   ├── parsers/
│   │   │   │   ├── epub-parser.ts
│   │   │   │   ├── pdf-parser.ts
│   │   │   │   ├── markdown-parser.ts
│   │   │   │   └── html-parser.ts
│   │   │   └── chapter-segmentation.ts
│   │   └── package.json
│   │
│   ├── voice-cloning/
│   │   ├── src/
│   │   │   ├── training-pipeline.ts
│   │   │   ├── quality-assessment.ts
│   │   │   └── voice-library.ts
│   │   └── package.json
│   │
│   ├── batch-processing/
│   │   ├── src/
│   │   │   ├── queue-orchestrator.ts
│   │   │   └── progress-tracker.ts
│   │   └── package.json
│   │
│   ├── quality-assessment/
│   │   ├── src/
│   │   │   ├── scoring-algorithm.ts
│   │   │   └── pronunciation-service.ts
│   │   └── package.json
│   │
│   ├── ai-direction/
│   │   ├── src/
│   │   │   ├── text-analyzer.ts
│   │   │   └── genre-profiles.ts
│   │   └── package.json
│   │
│   ├── webhook/
│   │   ├── src/
│   │   │   ├── event-publisher.ts
│   │   │   └── delivery-queue.ts
│   │   └── package.json
│   │
│   ├── workflow-engine/
│   │   ├── src/
│   │   │   ├── approval-workflows.ts
│   │   │   └── state-machine.ts
│   │   └── package.json
│   │
│   └── distribution/
│       ├── src/
│       │   └── adapters/
│       │       ├── acx-adapter.ts
│       │       ├── audible-adapter.ts
│       │       └── spotify-adapter.ts
│       └── package.json
│
├── infrastructure/
│   ├── database/
│   │   ├── src/
│   │   │   ├── drizzle.config.ts
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── projects.ts
│   │   │   │   ├── audio.ts
│   │   │   │   └── voices.ts
│   │   │   ├── repositories/
│   │   │   │   ├── user-repository.ts
│   │   │   │   ├── project-repository.ts
│   │   │   │   └── audio-repository.ts
│   │   │   └── migrations/
│   │   │       └── 20250117_initial_schema.sql
│   │   └── package.json
│   │
│   ├── storage/
│   │   ├── src/
│   │   │   ├── gcs-adapter.ts
│   │   │   └── signed-url-generator.ts
│   │   └── package.json
│   │
│   ├── cache/
│   │   ├── src/
│   │   │   └── lru-cache.ts
│   │   └── package.json
│   │
│   ├── queue/
│   │   ├── src/
│   │   │   ├── bullmq-config.ts
│   │   │   └── redis-client.ts
│   │   └── package.json
│   │
│   └── logger/
│       ├── src/
│       │   └── pino-logger.ts
│       └── package.json
│
├── shared/
│   ├── types/
│   │   ├── src/
│   │   │   ├── entities.ts
│   │   │   ├── dtos.ts
│   │   │   └── api-responses.ts
│   │   └── package.json
│   │
│   ├── utils/
│   │   ├── src/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   └── config/
│       ├── src/
│       │   └── environment.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── Dockerfile
├── turbo.json
├── package.json
├── bun.lockb
├── eslint.config.js
├── .prettierrc
├── tsconfig.json
└── README.md
```

**Critical Folders:**

- **`packages/core-domain`**: Pure business logic, no external dependencies (framework-agnostic)
- **`plugins/`**: Domain services implementing Clean Architecture interfaces (dependency-injectable)
- **`infrastructure/`**: External system adapters (database, storage, queue, logger)

## 11. Testing Strategy

### 11.1 Unit Tests

**Framework:** Bun Test (native test runner)
**Location:** `*.test.ts` files adjacent to source files
**Coverage Target:** 80% line coverage (enforced via c8)

**Example:**

```typescript
// audio-generation-service.test.ts
import { describe, test, expect, mock } from 'bun:test';
import { AudioGenerationService } from './audio-generation-service';

describe('AudioGenerationService', () => {
  test('should generate audio successfully', async () => {
    const mockTTS = {
      generate: mock(() => Promise.resolve(Buffer.from('audio'))),
    };

    const service = new AudioGenerationService(
      mockTTS,
      mockStorage,
      mockLogger
    );
    const result = await service.generate('Hello world', voiceConfig);

    expect(mockTTS.generate).toHaveBeenCalledWith('Hello world', voiceConfig);
    expect(result).toBeDefined();
  });
});
```

### 11.2 Integration Tests

**Framework:** Bun Test
**Database:** Testcontainers for PostgreSQL
**Scope:** API routes, database repositories, plugin integration

**Example:**

```typescript
// audio-routes.integration.test.ts
import { describe, test, expect } from 'bun:test';
import { treaty } from '@elysiajs/eden';
import { app } from '../src/index';

describe('Audio API Integration', () => {
  test('POST /audio/generate should queue job', async () => {
    const client = treaty(app);
    const response = await client.audio.generate.post({
      text: 'Test audio',
      voiceId: 'voice-123',
    });

    expect(response.status).toBe(200);
    expect(response.data.jobId).toBeDefined();
  });
});
```

### 11.3 Mutation Tests

**Framework:** Stryker 8.8.0
**Threshold:** 80% mutation score (per CLAUDE.md)
**Configuration:** `stryker.config.json`

**Mutators Enabled:**

- Arithmetic operators
- Boolean literals
- Conditional expressions
- String literals
- Array mutations

**CI Enforcement:** Build fails if mutation score < 80%

### 11.4 E2E Tests

**Framework:** Playwright 1.49.1
**Browsers:** Chromium, Firefox, Safari (WebKit)
**Scope:** Critical user flows

**Test Scenarios:**

- User registration and login
- Voice cloning workflow (upload sample, preview, generate)
- Audio generation (upload book, configure, generate, download)
- Batch processing (create batch, monitor progress, download all)
- API key management (create, use, revoke)

**Example:**

```typescript
// voice-cloning.e2e.test.ts
import { test, expect } from '@playwright/test';

test('voice cloning flow', async ({ page }) => {
  await page.goto('/voices');
  await page.click('button:has-text("Clone Voice")');

  // Upload sample
  await page.setInputFiles('input[type="file"]', 'sample.mp3');
  await page.click('button:has-text("Upload")');

  // Wait for training
  await expect(page.locator('.status')).toContainText('Training', {
    timeout: 60000,
  });
  await expect(page.locator('.status')).toContainText('Ready', {
    timeout: 180000,
  });

  // Preview
  await page.click('button:has-text("Preview")');
  await expect(page.locator('audio')).toBeVisible();
});
```

### 11.5 Coverage Goals

**Targets:**

- **Line Coverage**: 80% minimum (c8)
- **Branch Coverage**: 75% minimum
- **Function Coverage**: 85% minimum
- **Mutation Score**: 80% minimum (Stryker)

**Exclusions:**

- Generated code (migrations, OpenAPI schemas)
- Type definitions
- Test files
- Configuration files

## 12. DevOps and CI/CD

### 12.1 CI Pipeline

**GitHub Actions Workflow (.github/workflows/ci.yml):**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, staging]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:unit
      - run: bun run test:integration
      - run: bun run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:mutation
      - name: Check mutation score
        run: |
          SCORE=$(cat reports/mutation/mutation-score.txt)
          if (( $(echo "$SCORE < 80" | bc -l) )); then
            echo "Mutation score $SCORE% is below 80% threshold"
            exit 1
          fi

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 12.2 CD Pipeline

**GitHub Actions Workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build Docker images
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/falador-api:${{ github.sha }} -f Dockerfile.api .
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/falador-worker:${{ github.sha }} -f Dockerfile.worker .

      - name: Push to GCR
        run: |
          gcloud auth configure-docker
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/falador-api:${{ github.sha }}
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/falador-worker:${{ github.sha }}

      - name: Run database migrations
        run: |
          bun run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy falador-api \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/falador-api:${{ github.sha }} \
            --region us-east1 \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars="NODE_ENV=production"

          gcloud run deploy falador-worker \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/falador-worker:${{ github.sha }} \
            --region us-east1 \
            --platform managed \
            --no-allow-unauthenticated

      - name: Smoke tests
        run: |
          curl -f https://api.falador.ai/health || exit 1
```

### 12.3 Monitoring and Observability

**Logging:**

- **Structured JSON logs** via pino
- **Log aggregation**: GCP Cloud Logging
- **Retention**: 30 days (development), 90 days (production)

**Metrics:**

- **Cloud Run metrics**: Request count, latency, error rate, instance count
- **Database metrics**: Connection pool, query duration, slow queries
- **Queue metrics**: Job throughput, queue length, processing time

**Alerting:**

- **Error rate > 5%**: Immediate notification
- **Latency p95 > 1s**: Warning notification
- **Queue depth > 1000**: Investigate scaling

**Error Tracking:**

- **Sentry integration**: Exception tracking, breadcrumbs, release tracking
  - **Timeline**: Epic 2 completion (Month 4) for backend, Epic 4 (Month 6) for frontend
  - **Implementation**: See ADR-013 for complete integration plan
  - **Cost**: ~$80/month production, $26/month development

## 13. Security

### 13.1 Security Measures

**Data Encryption:**

- **In Transit**: TLS 1.3 for all HTTP traffic
- **At Rest**: AES-256 for Cloud Storage, Cloud SQL encrypted by default

**Authentication:**

- **Password Security**: bcrypt (cost factor 12), minimum 8 characters
- **Session Security**: HTTP-only cookies, SameSite=Lax, secure flag
- **API Keys**: bcrypt hashed, prefix `fal_` for identification

**Input Validation:**

- **Valibot schemas** on all API routes
- **SQL injection prevention**: Drizzle ORM parameterized queries
- **XSS prevention**: Astro auto-escapes templates, React sanitizes inputs

**Rate Limiting:**

- **Tier-based limits**: Free (10/min), Pro (60/min), Enterprise (custom)
- **DDoS mitigation**: Cloud Armor (future)

**CORS:**

- **Allowed origins**: Configurable whitelist
- **Credentials**: Enabled for dashboard domain only

**Webhook Security:**

- **HMAC-SHA256 signatures**: Verify webhook payloads
- **Replay attack prevention**: Timestamp validation (5-minute window)

**Secrets Management:**

- **Environment variables**: Never committed to version control
- **GCP Secret Manager** (future): Centralized secret storage

### 13.2 Compliance

**GDPR:**

- **User consent**: Explicit consent for data processing
- **Data portability**: Export user data via API
- **Right to deletion**: Cascade delete user data

**CCPA:**

- **Data disclosure**: Privacy policy explains data usage
- **Opt-out**: Users can opt out of data sale (N/A - no data sale)

**Audit Logging:**

- **User actions**: Project creation, audio generation, API key usage
- **Admin actions**: User management, team changes
- **Retention**: 1 year

## 14. Specialist Sections

### 14.1 Testing Specialist

**DEFERRED TO SPECIALIST AGENT**

Complexity Assessment: **Simple**

- Basic unit/integration/E2E testing with Bun Test and Playwright
- Mutation testing with Stryker (80% threshold)
- Standard coverage goals (80% line coverage)

**Inline Coverage:**

- Test infrastructure established in CI/CD
- Coverage thresholds enforced
- Mutation testing configured

**Recommendation:** No specialist agent required. Standard testing practices sufficient for MVP.

### 14.2 DevOps Specialist

**DEFERRED TO SPECIALIST AGENT**

Complexity Assessment: **Simple**

- Cloud Run serverless (no Kubernetes complexity)
- Standard CI/CD with GitHub Actions
- Managed services (Cloud SQL, Cloud Storage, Cloud Memorystore)

**Inline Coverage:**

- Docker containerization configured
- CI/CD pipelines defined
- Deployment strategy documented

**Recommendation:** No specialist agent required. Serverless approach minimizes DevOps complexity.

### 14.3 Security Specialist

**DEFERRED TO SPECIALIST AGENT**

Complexity Assessment: **Moderate**

- Standard auth (Lucia session-based, API keys)
- GDPR/CCPA compliance required
- Webhook signature verification
- No HIPAA/PCI/SOC2 requirements

**Inline Coverage:**

- Basic security measures documented
- Encryption, validation, rate limiting covered
- Audit logging planned

**Recommendation:** Security specialist agent **optional**. Consider engaging for:

- Penetration testing plan
- Security audit checklist
- Advanced threat modeling
- OAuth provider integration

---

## Specialist Sections Summary

**Testing**: Handled inline (simple)
**DevOps**: Handled inline (simple - serverless)
**Security**: **Optional specialist engagement** recommended for advanced security audit and OAuth integration planning

---

_Generated using BMad Method Solution Architecture workflow_
_Date: 2025-10-17_
_Author: Eduardo Menoncello_
