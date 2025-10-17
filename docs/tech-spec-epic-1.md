# Technical Specification - Epic 1: Foundation & Basic TTS Generation (CLI MVP)

**Epic:** Epic 1 - Foundation & Basic TTS Generation (CLI MVP)
**Author:** Eduardo Menoncello
**Date:** 2025-10-17
**Status:** Ready for Implementation

---

## Epic Overview

**Goal:** Establish foundational infrastructure and deliver a working CLI tool that converts plain text files to Brazilian Portuguese audio using KokoroTTS.

**Value Delivered:**
- Development team has working infrastructure (CI/CD, testing, deployment)
- Early adopters can generate basic Portuguese audio from text files
- Technical feasibility validated with real TTS generation
- Foundation for all subsequent features established

**Total Stories:** 15 stories across 4 parallel tracks

---

## Architecture Extract (from solution-architecture.md)

### Technology Stack

**Core Technologies:**
- **Runtime:** Bun 1.1.34
- **Backend Framework:** Elysia 1.1.23
- **Language:** TypeScript 5.7.2
- **Database:** PostgreSQL 16.6 (Cloud SQL)
- **ORM:** Drizzle ORM 0.38.3
- **Queue:** BullMQ 5.28.1 + Redis (ioredis 5.4.2)
- **TTS Engine:** KokoroTTS 0.5.0
- **Audio Processing:** FFmpeg 7.1.0
- **CLI Framework:** Commander.js 12.1.0
- **Testing:** Bun Test (built-in), Stryker 8.8.0 (mutation testing)
- **Logging:** pino 9.5.0
- **DI Container:** tsyringe 4.8.0

### Component Boundaries

**Packages:**
- `core-domain`: Entities, interfaces, use cases (business logic)
- `api-gateway`: Elysia REST API, auth, routing
- `cli`: Bun CLI application
- `job-worker`: BullMQ worker for async processing

**Plugins:**
- `audio-generation`: TTS gateway, KokoroTTS adapter

**Infrastructure:**
- `database`: Drizzle ORM, PostgreSQL repositories
- `storage`: GCS adapter (Cloud Storage)
- `queue`: Redis + BullMQ configuration
- `logger`: Pino structured logging

### Data Models

```typescript
// users table
interface User {
  id: string; // UUID
  email: string;
  passwordHash: string | null;
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
  metadata: object; // JSONB
  createdAt: Date;
  updatedAt: Date;
}

// audio_generation_jobs table
interface AudioGenerationJob {
  id: string;
  projectId: string; // FK: projects.id
  chapterNumber: number | null;
  voiceId: string; // FK: voices.id
  text: string; // TEXT type
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

// api_keys table
interface ApiKey {
  id: string;
  userId: string;
  keyHash: string; // bcrypt hash
  name: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}
```

### API Routes (Epic 1 Subset)

**Authentication:**
- `POST /auth/register` - Create user account
- `POST /auth/login` - Email/password login
- `GET /auth/me` - Get current user
- `POST /auth/api-keys` - Generate API key

**Projects:**
- `GET /projects` - List user projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details

**Audio Generation:**
- `POST /audio/generate` - Queue audio generation job
- `GET /audio/jobs/:id` - Get job status
- `GET /audio/jobs/:id/download` - Download generated audio

---

## Implementation Guidance

### Directory Structure for Epic 1

```
falador/
├── packages/
│   ├── core-domain/
│   │   └── src/
│   │       ├── entities/
│   │       │   ├── user.ts
│   │       │   ├── project.ts
│   │       │   ├── audio-file.ts
│   │       │   └── api-key.ts
│   │       ├── interfaces/
│   │       │   ├── repositories/
│   │       │   │   ├── user-repository.ts
│   │       │   │   ├── project-repository.ts
│   │       │   │   └── audio-repository.ts
│   │       │   └── services/
│   │       │       ├── tts-engine.ts
│   │       │       ├── storage.ts
│   │       │       └── queue.ts
│   │       └── use-cases/
│   │           └── generate-audio.ts
│   │
│   ├── api-gateway/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       │   ├── auth.ts
│   │       │   ├── projects.ts
│   │       │   └── audio.ts
│   │       └── middleware/
│   │           ├── auth.ts
│   │           └── error-handler.ts
│   │
│   ├── cli/
│   │   └── src/
│   │       ├── index.ts
│   │       └── commands/
│   │           ├── auth.ts
│   │           └── generate.ts
│   │
│   └── job-worker/
│       └── src/
│           ├── index.ts
│           └── workers/
│               └── audio-generation-worker.ts
│
├── plugins/
│   └── audio-generation/
│       └── src/
│           ├── gateway/
│           │   └── tts-gateway.ts
│           └── adapters/
│               └── kokoro-tts-adapter.ts
│
└── infrastructure/
    ├── database/
    │   └── src/
    │       ├── drizzle.config.ts
    │       ├── schema/
    │       │   ├── users.ts
    │       │   ├── projects.ts
    │       │   └── audio.ts
    │       ├── repositories/
    │       │   ├── user-repository.ts
    │       │   ├── project-repository.ts
    │       │   └── audio-repository.ts
    │       └── migrations/
    │           └── 20250117_initial_schema.sql
    │
    ├── storage/
    │   └── src/
    │       └── gcs-adapter.ts
    │
    ├── queue/
    │   └── src/
    │       ├── bullmq-config.ts
    │       └── redis-client.ts
    │
    └── logger/
        └── src/
            └── pino-logger.ts
```

### Development Workflow

**1. Initial Setup (Stories 1.1-1.3):**
```bash
# Initialize project
bun init
bun add -D typescript @types/bun

# Setup monorepo
bun add -D turborepo

# Configure Docker
docker-compose up -d  # PostgreSQL, Redis
```

**2. Database Setup (Story 1.4):**
```bash
# Install Drizzle
bun add drizzle-orm postgres
bun add -D drizzle-kit

# Generate migration
bun run db:generate

# Apply migration
bun run db:migrate
```

**3. Clean Architecture (Story 1.5):**
```typescript
// Example: core-domain/src/entities/project.ts
export class Project {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public title: string,
    public readonly createdAt: Date
  ) {}

  static create(userId: string, title: string): Project {
    return new Project(
      crypto.randomUUID(),
      userId,
      title,
      new Date()
    );
  }
}

// Example: core-domain/src/interfaces/repositories/project-repository.ts
export interface ProjectRepository {
  create(project: Project): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
}

// Example: infrastructure/database/src/repositories/project-repository.ts
@injectable()
export class DrizzleProjectRepository implements ProjectRepository {
  constructor(
    @inject('Database') private db: Database
  ) {}

  async create(project: Project): Promise<void> {
    await this.db.insert(projectsTable).values({
      id: project.id,
      userId: project.userId,
      title: project.title,
      createdAt: project.createdAt
    });
  }
}
```

**4. TTS Integration (Stories 1.7-1.9):**
```typescript
// plugins/audio-generation/src/gateway/tts-gateway.ts
export interface TTSEngine {
  generate(text: string, voice: VoiceConfig): Promise<AudioBuffer>;
  getVoices(): Promise<Voice[]>;
}

// plugins/audio-generation/src/adapters/kokoro-tts-adapter.ts
@injectable()
export class KokoroTTSAdapter implements TTSEngine {
  constructor(
    @inject('Logger') private logger: Logger,
    @inject('Config') private config: Config
  ) {}

  async generate(text: string, voice: VoiceConfig): Promise<AudioBuffer> {
    this.logger.info({ text, voice }, 'Generating audio with KokoroTTS');

    // KokoroTTS integration
    const audio = await kokoroTTS.synthesize({
      text,
      voice: voice.id,
      language: 'pt-BR',
      sampleRate: 44100
    });

    return audio;
  }
}
```

**5. CLI Implementation (Stories 1.10-1.12):**
```typescript
// packages/cli/src/commands/generate.ts
import { Command } from 'commander';

export const generateCommand = new Command('generate')
  .description('Generate audio from text file')
  .argument('<input-file>', 'Input text file')
  .option('-o, --output <file>', 'Output audio file')
  .option('-v, --voice <id>', 'Voice ID to use')
  .action(async (inputFile, options) => {
    // Read input file
    const text = await Bun.file(inputFile).text();

    // Call API
    const apiClient = new FaladorAPIClient();
    const job = await apiClient.audio.generate({
      text,
      voiceId: options.voice || 'default-pt-br'
    });

    // Poll for completion
    console.log(`Job created: ${job.id}`);
    console.log('Processing...');

    const result = await pollJobStatus(job.id);

    // Download audio
    const outputFile = options.output || 'output.mp3';
    await downloadAudio(result.audioUrl, outputFile);

    console.log(`✓ Audio saved to ${outputFile}`);
  });
```

---

## Testing Approach

### Unit Tests (Story 1.13)

**Test Structure:**
```typescript
// plugins/audio-generation/src/adapters/kokoro-tts-adapter.test.ts
import { describe, test, expect, mock } from 'bun:test';
import { KokoroTTSAdapter } from './kokoro-tts-adapter';

describe('KokoroTTSAdapter', () => {
  test('should generate audio successfully', async () => {
    const mockLogger = { info: mock(() => {}), error: mock(() => {}) };
    const mockConfig = { kokoroApiKey: 'test-key' };

    const adapter = new KokoroTTSAdapter(mockLogger, mockConfig);
    const audio = await adapter.generate('Olá mundo', { id: 'pt-br-1' });

    expect(audio).toBeInstanceOf(Buffer);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  test('should handle generation errors', async () => {
    const mockLogger = { info: mock(() => {}), error: mock(() => {}) };
    const mockConfig = { kokoroApiKey: 'invalid-key' };

    const adapter = new KokoroTTSAdapter(mockLogger, mockConfig);

    await expect(
      adapter.generate('Test', { id: 'invalid-voice' })
    ).rejects.toThrow();
  });
});
```

### Integration Tests

**API Integration:**
```typescript
// packages/api-gateway/src/routes/audio.integration.test.ts
import { describe, test, expect } from 'bun:test';
import { treaty } from '@elysiajs/eden';
import { app } from '../index';

describe('Audio API Integration', () => {
  test('POST /audio/generate should queue job', async () => {
    const client = treaty(app);

    // Create authenticated user
    const user = await createTestUser();
    const apiKey = await createTestApiKey(user.id);

    const response = await client.audio.generate.post(
      { text: 'Teste de áudio', voiceId: 'pt-br-default' },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.jobId).toBeDefined();
  });
});
```

### Mutation Testing (Story 1.2)

**Stryker Configuration:**
```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "bun",
  "testRunner": "command",
  "testRunnerNodeArgs": [],
  "commandRunner": {
    "command": "bun test"
  },
  "mutate": [
    "packages/*/src/**/*.ts",
    "plugins/*/src/**/*.ts",
    "infrastructure/*/src/**/*.ts",
    "!**/*.test.ts",
    "!**/*.spec.ts"
  ],
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 80
  }
}
```

### E2E Tests (Story 1.13)

**CLI E2E Test:**
```typescript
// packages/cli/tests/e2e/generate.e2e.test.ts
import { describe, test, expect } from 'bun:test';
import { spawn } from 'bun';
import { unlink } from 'fs/promises';

describe('CLI E2E: generate command', () => {
  test('should generate audio from text file', async () => {
    // Create test input
    await Bun.write('test-input.txt', 'Olá, este é um teste de áudio.');

    // Run CLI
    const proc = spawn([
      'bun',
      'run',
      'cli',
      'generate',
      'test-input.txt',
      '-o',
      'test-output.mp3'
    ]);

    await proc.exited;

    // Verify output
    const outputFile = Bun.file('test-output.mp3');
    expect(await outputFile.exists()).toBe(true);
    expect(outputFile.size).toBeGreaterThan(0);

    // Cleanup
    await unlink('test-input.txt');
    await unlink('test-output.mp3');
  }, 60000); // 60s timeout for TTS processing
});
```

---

## Deployment

### Docker Configuration (Story 1.3)

**Dockerfile (API Gateway):**
```dockerfile
# Multi-stage build for Bun application
FROM oven/bun:1.1.34 AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build
FROM base AS build
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "dist/index.js"]
```

**docker-compose.yml (Local Dev):**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: falador
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: falador_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://falador:dev_password@postgres:5432/falador_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  job-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      DATABASE_URL: postgresql://falador:dev_password@postgres:5432/falador_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### CI/CD (Story 1.2)

**GitHub Actions (.github/workflows/ci.yml):**
```yaml
name: CI - Epic 1

on:
  pull_request:
  push:
    branches: [main, epic-1]

jobs:
  lint-and-typecheck:
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
      - run: bun run test
      - run: bun run test:coverage

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
```

---

## Story Breakdown Summary

### Track A: Infrastructure & DevOps
- **Story 1.1**: Project foundation (TypeScript, Bun, Elysia, ESLint, Prettier)
- **Story 1.2**: CI/CD pipeline (GitHub Actions, mutation testing)
- **Story 1.3**: Docker containerization (local dev environment)

### Track B: Database & Core Architecture
- **Story 1.4**: PostgreSQL setup (Drizzle ORM, migrations, schema)
- **Story 1.5**: Clean Architecture structure (layers, DI container)
- **Story 1.6**: Error handling & logging (pino, custom errors)

### Track C: TTS Engine Integration
- **Story 1.7**: TTS Gateway interface (abstraction layer)
- **Story 1.8**: KokoroTTS integration (adapter implementation)
- **Story 1.9**: Audio file storage (GCS, file processing)

### Track D: CLI Interface
- **Story 1.10**: CLI framework (Commander.js, command routing)
- **Story 1.11**: Generate command (file input, API calls, download)
- **Story 1.12**: Auth configuration (API key management)

### Synchronization: Integration & Testing
- **Story 1.13**: E2E integration testing (full workflow validation)
- **Story 1.14**: Documentation (README, API docs, guides)
- **Story 1.15**: MVP release (npm publish, deployment)

---

## Acceptance Criteria Checklist

### Functionality
- [ ] User can install CLI via npm/homebrew
- [ ] User can authenticate with API key
- [ ] User can generate audio from plain text file
- [ ] Generated audio is Brazilian Portuguese (KokoroTTS)
- [ ] Audio files saved to Cloud Storage
- [ ] Job status can be queried via CLI/API

### Quality
- [ ] 80% code coverage (unit tests)
- [ ] 80% mutation score (Stryker)
- [ ] E2E tests pass for complete workflow
- [ ] All ESLint rules pass (strict TypeScript)

### Performance
- [ ] API response time <100ms (p95)
- [ ] TTS generation at 2x real-time speed minimum
- [ ] Database queries optimized with indexes

### DevOps
- [ ] CI/CD pipeline green (all tests pass)
- [ ] Docker images build successfully
- [ ] Local dev environment works (docker-compose)
- [ ] Deployment to Cloud Run succeeds

### Documentation
- [ ] README with setup instructions
- [ ] API documentation (Scalar/OpenAPI)
- [ ] CLI help text for all commands
- [ ] Architecture documentation updated

---

**Epic 1 Status:** Ready for implementation
**Next Steps:** Begin Story 1.1 (Project Foundation & Repository Setup)

---

_Generated from solution-architecture.md and epics.md_
_Date: 2025-10-17_
