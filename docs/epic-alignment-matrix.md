# Epic Alignment Matrix

**Project:** Falador
**Date:** 2025-10-17
**Purpose:** Visual mapping of epics to architectural components, packages, and technical implementations

---

## Matrix Overview

This document provides a comprehensive mapping between product epics (business value) and technical architecture (implementation). Each epic is aligned with specific packages, plugins, database entities, API routes, and infrastructure components.

---

## Epic-to-Component Mapping

| Epic | Package/Plugin | Database Entities | API Routes | Infrastructure | Tech Spec |
|------|---------------|-------------------|------------|----------------|-----------|
| **Epic 1: Foundation & Basic TTS Generation** | `packages/core-domain`<br>`packages/cli`<br>`infrastructure/database`<br>`infrastructure/logger`<br>`plugins/audio-generation` | `users`<br>`projects`<br>`audio_generation_jobs`<br>`audio_files` | `/auth/*`<br>`/projects/*`<br>`/audio/generate` | PostgreSQL<br>Docker<br>CI/CD (GitHub Actions)<br>Pino logging | tech-spec-epic-1.md<br>**Stories:** 15<br>**Status:** Detailed |
| **Epic 2: Multi-Format Book Processing** | `plugins/file-processing`<br>`packages/cli` (batch commands) | `projects` (metadata)<br>`audio_files` (chapters) | `/projects/:id/upload`<br>`/batch/*` | FFmpeg<br>File parsers (EPUB/PDF/MD) | tech-spec-epic-2.md<br>**Stories:** 10<br>**Status:** Detailed |
| **Epic 3: Voice Cloning & Custom Voices** | `plugins/voice-cloning` | `voices`<br>`voice_training_jobs` | `/voices/*`<br>`/voices/:id/clone`<br>`/voices/:id/preview` | KokoroTTS training<br>Audio sample validation | tech-spec-epic-3.md<br>**Stories:** 12-15<br>**Status:** High-level |
| **Epic 4: Web Dashboard & Project Management** | `packages/web-dashboard` (Astro)<br>`packages/api-gateway` (auth) | `users`<br>`sessions` (Lucia)<br>`projects` | `/auth/register`<br>`/auth/login`<br>`/projects/*` (GET/PATCH) | Astro SSR<br>React islands<br>Tailwind CSS | tech-spec-epic-4.md<br>**Stories:** 15-18<br>**Status:** High-level |
| **Epic 5: Quality Tools & Pronunciation Editor** | `plugins/quality-assessment` | `pronunciation_dictionaries`<br>`audio_files` (quality_score) | `/pronunciation/*`<br>`/quality/score/:audioId`<br>`/audio/regenerate` | Quality algorithms<br>Phonetic engine | tech-spec-epic-5.md<br>**Stories:** 8-10<br>**Status:** High-level |
| **Epic 6: API & Webhook Integration** | `packages/api-gateway`<br>`plugins/webhook` | `api_keys`<br>`webhook_subscriptions`<br>`webhook_deliveries` | `/auth/api-keys/*`<br>`/webhooks/*` | Svix (webhook delivery)<br>Rate limiting (Redis)<br>OAuth 2.0 | tech-spec-epic-6.md<br>**Stories:** 10-12<br>**Status:** High-level |
| **Epic 7: AI Direction & Genre Optimization** | `plugins/ai-direction` | `genre_profiles`<br>`narration_settings` | `/ai-direction/analyze`<br>`/projects/:id/direction` | NLP pipeline<br>Text analysis<br>SSML generation | tech-spec-epic-7.md<br>**Stories:** 10-12<br>**Status:** High-level |
| **Epic 8: Enterprise Collaboration & Publisher Workflow** | `plugins/workflow-engine`<br>`packages/api-gateway` (RBAC) | `teams`<br>`team_members`<br>`approval_workflows`<br>`workflow_states` | `/teams/*`<br>`/workflows/*`<br>`/auth/sso` | SAML/SSO<br>Approval engine<br>Audit logging | tech-spec-epic-8.md<br>**Stories:** 12-15<br>**Status:** High-level |
| **Epic 9: Distribution & Platform Integration** | `plugins/distribution` | `distribution_jobs`<br>`platform_credentials` | `/distribution/acx`<br>`/distribution/audible`<br>`/distribution/spotify` | ACX API<br>Audible API<br>Spotify API<br>Format conversion | tech-spec-epic-9.md<br>**Stories:** 8-10<br>**Status:** High-level |

---

## Detailed Epic Alignment

### Epic 1: Foundation & Basic TTS Generation (CLI MVP)

**Business Value:** Working CLI tool for text-to-Portuguese audio conversion

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Domain** | `packages/core-domain/entities/` | User, Project, AudioFile entities |
| **Domain** | `packages/core-domain/use-cases/` | GenerateAudio, CreateProject use cases |
| **Application** | `packages/cli/commands/generate.ts` | CLI command implementation |
| **Infrastructure** | `plugins/audio-generation/adapters/kokoro-tts-adapter.ts` | TTS engine integration |
| **Infrastructure** | `infrastructure/database/schema/` | PostgreSQL schema (users, projects, jobs, files) |
| **Infrastructure** | `infrastructure/logger/pino-logger.ts` | Structured logging |

**API Endpoints:**
- `POST /auth/login` - User authentication
- `POST /projects` - Create project
- `POST /audio/generate` - Queue audio generation
- `GET /audio/jobs/:id` - Job status
- `GET /audio/jobs/:id/download` - Download audio

**Database Schema:**
- `users` (id, email, password_hash, tier)
- `projects` (id, user_id, title, language, status)
- `audio_generation_jobs` (id, project_id, status, progress)
- `audio_files` (id, job_id, file_path, duration)

---

### Epic 2: Multi-Format Book Processing

**Business Value:** Convert real books (EPUB, PDF, Markdown) with chapter detection

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `plugins/file-processing/parsers/` | EPUB, PDF, Markdown parsers |
| **Application** | `plugins/file-processing/chapter-segmentation.ts` | Chapter detection logic |
| **Application** | `plugins/batch-processing/` | Queue orchestration, concurrency |
| **Application** | `packages/cli/commands/batch.ts` | Batch CLI commands |
| **Infrastructure** | FFmpeg integration | Audio concatenation, M4B export |

**API Endpoints:**
- `POST /projects/:id/upload` - Upload book file
- `POST /batch` - Create batch job
- `GET /batch/:id` - Batch status
- `GET /batch/:id/books` - List books in batch

**Database Extensions:**
- `projects.metadata` (JSONB) - Book metadata (title, author, ISBN)
- `batch_jobs` table - Batch processing tracking
- `audio_files.chapter_number` - Chapter tracking

---

### Epic 3: Voice Cloning & Custom Voices

**Business Value:** Custom voice creation from 30-second samples

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `plugins/voice-cloning/training-pipeline.ts` | Voice model training |
| **Application** | `plugins/voice-cloning/quality-assessment.ts` | Voice quality scoring |
| **Application** | `plugins/voice-cloning/voice-library.ts` | CRUD operations |
| **Infrastructure** | KokoroTTS fine-tuning | Voice model generation |

**API Endpoints:**
- `GET /voices` - List available voices
- `POST /voices/clone` - Upload sample for cloning
- `GET /voices/:id` - Voice details
- `PATCH /voices/:id` - Update voice settings
- `POST /voices/:id/preview` - Generate preview

**Database Schema:**
- `voices` (id, user_id, name, type, model_path, status)
- `voice_training_jobs` (id, voice_id, status, progress)

---

### Epic 4: Web Dashboard & Project Management

**Business Value:** Visual interface for non-technical users

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Presentation** | `packages/web-dashboard/pages/` | Astro pages (SSR) |
| **Presentation** | `packages/web-dashboard/components/` | React islands (interactive UI) |
| **Application** | `packages/api-gateway/routes/auth.ts` | Session-based auth (Lucia) |
| **Application** | `packages/api-gateway/middleware/auth.ts` | Auth middleware |
| **Infrastructure** | Tailwind CSS + Radix UI | Component library |

**API Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - Session login
- `GET /auth/me` - Current user
- `GET /projects` - List projects (paginated)
- `PATCH /projects/:id` - Update project

**Database Schema:**
- `sessions` (Lucia auth) - Session management
- `oauth_accounts` (future) - OAuth provider links

---

### Epic 5: Quality Tools & Pronunciation Editor

**Business Value:** Iterative quality improvement through pronunciation correction

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `plugins/quality-assessment/scoring-algorithm.ts` | Audio quality metrics |
| **Application** | `plugins/quality-assessment/pronunciation-service.ts` | Dictionary management |
| **Presentation** | Web dashboard pronunciation editor UI | Phonetic spelling interface |

**API Endpoints:**
- `GET /pronunciation` - List pronunciation rules
- `POST /pronunciation` - Add rule
- `DELETE /pronunciation/:id` - Remove rule
- `GET /quality/score/:audioId` - Quality score
- `POST /audio/regenerate` - Regenerate chapter

**Database Schema:**
- `pronunciation_dictionaries` (id, user_id, project_id, word, phonetic)
- `audio_files.quality_score` (0-5 scale)

---

### Epic 6: API & Webhook Integration

**Business Value:** Third-party integrations and programmatic access

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `packages/api-gateway/middleware/rate-limit.ts` | Rate limiting (tier-based) |
| **Application** | `plugins/webhook/event-publisher.ts` | Event publishing |
| **Application** | `plugins/webhook/delivery-queue.ts` | Webhook delivery (Svix) |
| **Infrastructure** | Redis | Rate limit storage |

**API Endpoints:**
- `POST /auth/api-keys` - Generate API key
- `DELETE /auth/api-keys/:id` - Revoke key
- `GET /webhooks` - List subscriptions
- `POST /webhooks` - Create subscription
- All existing endpoints support API key auth

**Database Schema:**
- `api_keys` (id, user_id, key_hash, scopes, expires_at)
- `webhook_subscriptions` (id, user_id, url, events, secret)
- `webhook_deliveries` (id, subscription_id, status, response)

---

### Epic 7: AI Direction & Genre Optimization

**Business Value:** Intelligent narration adapting to content genre

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `plugins/ai-direction/text-analyzer.ts` | NLP analysis, sentiment |
| **Application** | `plugins/ai-direction/genre-profiles.ts` | Genre-specific settings |
| **Application** | TTS integration | SSML markup generation |

**API Endpoints:**
- `POST /ai-direction/analyze` - Analyze text content
- `GET /projects/:id/direction` - Get direction settings
- `PATCH /projects/:id/direction` - Update settings

**Database Schema:**
- `genre_profiles` (id, name, settings)
- `narration_settings` (project_id, tone, pacing, emotion)

---

### Epic 8: Enterprise Collaboration & Publisher Workflow

**Business Value:** Team workspaces and approval workflows

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `plugins/workflow-engine/approval-workflows.ts` | Workflow state machine |
| **Application** | `packages/api-gateway/middleware/rbac.ts` | Role-based access control |
| **Infrastructure** | SAML/SSO integration | Enterprise authentication |

**API Endpoints:**
- `POST /teams` - Create team
- `POST /teams/:id/members` - Invite member
- `GET /teams/:id/members` - List members
- `POST /workflows` - Create approval workflow
- `PATCH /workflows/:id/state` - Advance workflow state

**Database Schema:**
- `teams` (id, name, owner_id)
- `team_members` (id, team_id, user_id, role)
- `approval_workflows` (id, team_id, state, settings)
- `workflow_states` (id, workflow_id, actor_id, action, timestamp)

---

### Epic 9: Distribution & Platform Integration

**Business Value:** One-click distribution to audiobook platforms

**Technical Components:**

| Layer | Component | Responsibility |
|-------|-----------|---------------|
| **Application** | `plugins/distribution/adapters/acx-adapter.ts` | ACX API integration |
| **Application** | `plugins/distribution/adapters/audible-adapter.ts` | Audible API integration |
| **Application** | `plugins/distribution/adapters/spotify-adapter.ts` | Spotify API integration |
| **Infrastructure** | Format conversion pipeline | Platform-specific formats |

**API Endpoints:**
- `POST /distribution/acx` - Export to ACX
- `POST /distribution/audible` - Export to Audible
- `POST /distribution/spotify` - Export to Spotify
- `GET /distribution/jobs/:id` - Distribution status

**Database Schema:**
- `distribution_jobs` (id, project_id, platform, status)
- `platform_credentials` (id, user_id, platform, encrypted_credentials)

---

## Cross-Cutting Concerns

### Authentication & Authorization

**Components:**
- `packages/api-gateway/middleware/auth.ts`
- `infrastructure/database/schema/users.ts`
- `infrastructure/database/schema/sessions.ts` (Lucia)
- `infrastructure/database/schema/api_keys.ts`

**Used By:** All epics requiring user identification

---

### Job Queue & Async Processing

**Components:**
- `packages/job-worker/workers/audio-generation-worker.ts`
- `packages/job-worker/workers/voice-training-worker.ts`
- `packages/job-worker/workers/batch-processing-worker.ts`
- `infrastructure/queue/bullmq-config.ts`

**Used By:**
- Epic 1: Audio generation jobs
- Epic 2: Batch processing jobs
- Epic 3: Voice training jobs
- Epic 6: Webhook delivery jobs
- Epic 9: Distribution jobs

---

### Storage & File Management

**Components:**
- `infrastructure/storage/gcs-adapter.ts`
- `infrastructure/storage/signed-url-generator.ts`

**Used By:**
- Epic 1: Audio file storage
- Epic 2: Uploaded book files
- Epic 3: Voice sample storage, model storage
- Epic 9: Distribution exports

---

### Logging & Monitoring

**Components:**
- `infrastructure/logger/pino-logger.ts`
- Sentry integration (Epic 2+ completion)

**Used By:** All epics for debugging and observability

---

## Technology Stack Alignment

### Runtime & Core
- **Bun 1.3.0** - All packages (CLI, API, Workers)
- **TypeScript 5.9.3** - Strict mode across all components

### Backend
- **Elysia 1.4.12** - API Gateway (Epics 1, 4, 6, 8)
- **PostgreSQL 17.4** - Primary database (All epics)
- **Redis + BullMQ 5.61.0** - Job queue (Epics 1, 2, 3, 6, 9)

### Frontend
- **Astro 5.14.5** - Web dashboard (Epic 4)
- **Tailwind CSS 4.1.14** - Design system (Epic 4)
- **Radix UI 3.2.1** - UI primitives (Epic 4, 5)

### Audio & TTS
- **KokoroTTS** - TTS engine (Epic 1, 3, 7)
- **FFmpeg 7.1.0** - Audio processing (Epic 2)

### External Integrations
- **ACX API** - Distribution (Epic 9)
- **Audible API** - Distribution (Epic 9)
- **Spotify Audiobooks API** - Distribution (Epic 9)

---

## Implementation Sequence

### Phase 1: MVP Foundation (Epics 1-2)
**Stories:** 25 detailed stories
**Timeline:** Weeks 1-4
**Deliverable:** Working CLI with multi-format processing

**Dependencies:**
- Epic 1 must complete before Epic 2
- Parallel work possible within Epic 1 (4 teams)
- Epic 2 builds on Epic 1 infrastructure

---

### Phase 2: Competitive Differentiation (Epics 3-4)
**Stories:** 27-33 stories (to be detailed JIT)
**Timeline:** Weeks 5-10
**Deliverable:** Voice cloning + Web dashboard

**Dependencies:**
- Epic 3 requires Epic 1 (TTS infrastructure)
- Epic 4 requires Epic 1 (API routes, auth)
- Epics 3 and 4 can run in parallel

---

### Phase 3: Quality & Developer Ecosystem (Epics 5-7)
**Stories:** 28-34 stories (to be detailed JIT)
**Timeline:** Weeks 11-18
**Deliverable:** Quality tools, API/webhooks, AI direction

**Dependencies:**
- Epic 5 requires Epics 1, 2 (audio generation)
- Epic 6 requires Epic 4 (web auth foundation)
- Epic 7 requires Epic 1 (TTS integration)
- All three can run in parallel after dependencies met

---

### Phase 4: Enterprise Market (Epics 8-9)
**Stories:** 20-25 stories (to be detailed JIT)
**Timeline:** Weeks 19-24
**Deliverable:** Team collaboration, distribution

**Dependencies:**
- Epic 8 requires Epic 4 (auth, web UI)
- Epic 9 requires Epic 2 (export formats)
- Epic 9 requires Epic 5 (quality validation)
- Epics 8 and 9 can run in parallel

---

## Coverage Summary

### Requirements Coverage
- **Functional Requirements:** 41/41 FRs mapped to epics (100%)
- **Non-Functional Requirements:** 12/12 NFRs addressed (100%)
- **Epics:** 9/9 epics mapped to architecture (100%)
- **Stories:** 25/100 detailed for immediate development (25%)

### Architectural Coverage
- **Packages:** 5 packages defined (core-domain, api-gateway, cli, web-dashboard, job-worker)
- **Plugins:** 9 plugins defined (audio, file-processing, voice-cloning, batch, quality, ai-direction, webhook, workflow, distribution)
- **Infrastructure:** 5 modules (database, storage, cache, queue, logger)
- **Database Entities:** 15+ tables mapped to epics
- **API Endpoints:** 30+ routes defined

---

## Validation Status

✅ **Epic alignment is complete and comprehensive**
- All epics map to specific architectural components
- All components serve clear epic objectives
- No orphaned components or unmapped epics
- Dependencies clearly identified
- Implementation sequence validated

**Next Action:** Begin Phase 4 Implementation with Epic 1, Story 1.1

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-10-17
**Author:** Bob (Scrum Master)
