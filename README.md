# Falador 🎙️

**Enterprise-scale AI-directed TTS platform for Brazilian Portuguese audiobook production**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3.0-orange)](https://bun.sh/)
[![Architecture: Clean](https://img.shields.io/badge/Architecture-Clean-green)](docs/solution-architecture.md)

---

## 🌟 Overview

Falador is a premium AI-directed TTS (Text-to-Speech) platform specifically engineered for Brazilian Portuguese audiobook production. It combines KokoroTTS foundation with Portuguese language optimization, CLI-first developer experience, voice cloning capabilities, and publisher workflow integration.

**Key Benefits:**
- 🎯 **4.5/5 Voice Quality** - Professional-grade Brazilian Portuguese narration
- ⚡ **10x Faster Production** - 48 hours vs. 4-6 weeks traditional timeline
- 💰 **80% Cost Reduction** - $75-200 vs. $1,600-6,000 per book
- 🔧 **Developer-First** - CLI tools, REST APIs, and automation capabilities
- 🎨 **Voice Cloning** - Clone your own voice from 30-second samples
- 🏢 **Enterprise-Ready** - Team collaboration, approval workflows, SSO

---

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.3.0
- **PostgreSQL** >= 17.4
- **Redis** >= 7.0
- **Docker** (for local development)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/falador.git
cd falador

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start Docker services (PostgreSQL + Redis)
docker-compose up -d

# Run database migrations
bun run db:migrate

# Start development servers
bun run dev
```

### Your First Audiobook

```bash
# Install CLI globally
npm install -g @falador/cli

# Authenticate
falador auth login --api-key=your_api_key

# Generate audio from text
falador generate input.txt --output audio.mp3

# Convert entire book (EPUB/PDF/Markdown)
falador generate book.epub --voice pt-BR-neural

# Batch processing
falador batch process --input-dir ./books/ --output-dir ./audiobooks/
```

---

## 📚 Documentation

### Core Documentation
- [**Solution Architecture**](docs/solution-architecture.md) - Complete technical architecture (1,888 lines)
- [**Product Requirements (PRD)**](docs/PRD.md) - Product vision and requirements
- [**Epic Breakdown**](docs/epics.md) - Detailed epic and story breakdown
- [**UX Specification**](docs/ux-specification.md) - User experience design

### Technical Specifications
- [**Tech Spec - Epic 1: Foundation**](docs/tech-spec-epic-1.md) - MVP infrastructure
- [**Tech Spec - Epic 2: Multi-Format**](docs/tech-spec-epic-2.md) - File processing
- [**Tech Spec - Epic 3: Voice Cloning**](docs/tech-spec-epic-3.md) - Voice cloning system
- [**Tech Spec - Epic 4: Web Dashboard**](docs/tech-spec-epic-4.md) - Web UI
- [**Tech Spec - Epic 5-9**](docs/) - Quality tools, API, AI direction, Enterprise, Distribution

### Validation & Alignment
- [**Cohesion Check Report**](docs/cohesion-check-report.md) - Requirements coverage validation (100%)
- [**Epic Alignment Matrix**](docs/epic-alignment-matrix.md) - Epic-to-component mapping
- [**Validation Report**](docs/validation-report-2025-10-17.md) - Phase 3 validation (100% complete)

---

## 🏗️ Architecture

### Architecture Style
**Modular Monolith with Plugin Architecture**

```
falador/
├── packages/           # Core application packages
│   ├── core-domain/   # Business logic (Clean Architecture)
│   ├── api-gateway/   # Elysia REST API
│   ├── cli/           # Bun CLI application
│   ├── web-dashboard/ # Astro frontend
│   └── job-worker/    # BullMQ async workers
│
├── plugins/           # Injectable domain services
│   ├── audio-generation/    # TTS gateway + KokoroTTS
│   ├── file-processing/     # EPUB/PDF/MD parsers
│   ├── voice-cloning/       # Voice training pipeline
│   ├── quality-assessment/  # Quality scoring
│   ├── ai-direction/        # Genre optimization
│   └── distribution/        # Platform integrations
│
└── infrastructure/    # External system adapters
    ├── database/      # PostgreSQL + Drizzle ORM
    ├── storage/       # Google Cloud Storage
    ├── queue/         # Redis + BullMQ
    └── logger/        # Pino structured logging
```

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Bun | 1.3.0 | Native TypeScript, 3x faster than Node.js |
| **Backend** | Elysia | 1.4.12 | TypeScript-first, 20x faster than Express |
| **Frontend** | Astro | 5.14.5 | Island architecture, minimal JS |
| **Language** | TypeScript | 5.9.3 | Strict type safety |
| **Database** | PostgreSQL | 17.4 | ACID compliance, JSON support |
| **ORM** | Drizzle | 0.44.6 | Type-safe queries |
| **Queue** | BullMQ | 5.61.0 | Distributed job processing |
| **Cache** | Node LRU Cache | 12.0.0 | In-memory caching |
| **Auth** | Lucia Auth | 3.2.2 | Session-based + API keys |
| **TTS** | KokoroTTS | Latest | Brazilian Portuguese optimization |
| **Audio** | FFmpeg | 7.1.0 | Format conversion, metadata |
| **Testing** | Bun Test | Built-in | Native test runner |
| **Mutation Testing** | Stryker | 0.35.1 | 80% mutation score |
| **Deployment** | GCP Cloud Run | N/A | Serverless containers |

**Full Stack:** [81 technologies documented](docs/solution-architecture.md#11-technology-and-library-decision-table)

---

## ✨ Features

### Current (MVP - Epic 1-2)
- ✅ **CLI Tool** - Convert text files to Brazilian Portuguese audio
- ✅ **Multi-Format Support** - EPUB, PDF, Markdown, HTML, TXT
- ✅ **Chapter Detection** - Automatic segmentation and structure preservation
- ✅ **Batch Processing** - Process multiple books concurrently
- ✅ **Progress Monitoring** - Real-time status and logging

### Planned (Epic 3-9)
- 🔄 **Voice Cloning** - Clone your voice from 30-second samples (Epic 3)
- 🔄 **Web Dashboard** - Visual project management UI (Epic 4)
- 🔄 **Quality Tools** - Pronunciation editor, regeneration workflows (Epic 5)
- 🔄 **REST API & Webhooks** - Programmatic access, TypeScript/Python SDKs (Epic 6)
- 🔄 **AI Direction** - Genre-specific narration optimization (Epic 7)
- 🔄 **Enterprise Collaboration** - Teams, RBAC, approval workflows (Epic 8)
- 🔄 **Distribution** - One-click export to ACX, Audible, Spotify (Epic 9)

**Roadmap:** [9 epics, 100-117 stories](docs/epics.md)

---

## 🎯 Use Cases

### 1. Technical Publisher - Batch Production
```bash
# Configure batch job
falador batch init > batch-config.yaml

# Edit configuration
vim batch-config.yaml

# Process 25 books
falador batch process --config batch-config.yaml --input-dir ./books/

# Monitor progress
falador batch status --job-id batch-12345 --follow
```

**Result:** 25 books processed in 36 hours, 92% quality approval

### 2. Independent Author - Voice Cloning
```bash
# Upload voice sample (30 seconds)
falador voice clone --sample my-voice.mp3 --name "Carlos Silva"

# Generate audiobook with personal voice
falador generate fantasy-novel.epub --voice "Carlos Silva" --output audiobook.m4b
```

**Result:** Personal voice clone, 4.6/5 quality, 48-hour completion

### 3. Developer - API Integration
```typescript
import { Falador } from '@falador/sdk';

const falador = new Falador({ apiKey: process.env.FALADOR_API_KEY });

// Generate audio
const job = await falador.audio.generate({
  text: courseContent,
  voice: 'pt-BR-neural',
  format: 'mp3',
  webhook: 'https://myapp.com/webhooks/falador'
});

// Poll status
const status = await falador.audio.getStatus(job.id);
```

**Result:** Seamless API integration, 99%+ success rate

---

## 🧪 Development

### Project Structure

```typescript
// Example: Creating a new plugin
// plugins/my-plugin/src/index.ts

import { injectable, inject } from 'tsyringe';
import { Logger } from '@falador/shared/types';

@injectable()
export class MyPlugin {
  constructor(
    @inject('Logger') private logger: Logger
  ) {}

  async execute(input: string): Promise<void> {
    this.logger.info({ input }, 'Processing...');
    // Plugin logic
  }
}
```

### Running Tests

```bash
# Unit tests
bun run test:unit

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e

# Mutation tests (80% threshold)
bun run test:mutation

# Coverage report
bun run test:coverage
```

### Code Quality

```bash
# Linting
bun run lint

# Type checking
bun run typecheck

# Format code
bun run format

# Pre-commit (runs automatically via Husky)
git commit -m "feat: add new feature"
```

**Standards:**
- ✅ 80% code coverage (enforced)
- ✅ 80% mutation score (enforced)
- ✅ ESLint strict mode (no `any` types)
- ✅ Prettier formatting
- ✅ No disabled ESLint rules (per CLAUDE.md)

---

## 🚀 Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# Run migrations
bun run db:migrate

# Start dev servers (Turborepo)
bun run dev

# Access services
# API Gateway: http://localhost:3000
# Web Dashboard: http://localhost:4321
```

### Production (GCP Cloud Run)

```bash
# Build Docker images
docker build -t gcr.io/falador-prod/api:latest -f Dockerfile.api .
docker build -t gcr.io/falador-prod/worker:latest -f Dockerfile.worker .

# Push to GCR
docker push gcr.io/falador-prod/api:latest
docker push gcr.io/falador-prod/worker:latest

# Deploy to Cloud Run
gcloud run deploy falador-api --image gcr.io/falador-prod/api:latest
gcloud run deploy falador-worker --image gcr.io/falador-prod/worker:latest
```

**CI/CD:** GitHub Actions (automated testing, deployment, rollback)

---

## 📊 Performance

### Benchmarks
- **Audio Generation:** 2x real-time processing speed (NFR004)
- **API Response Time:** <100ms (95th percentile) (NFR003)
- **Concurrent Requests:** 1,000+ without degradation (NFR002)
- **Uptime:** 99.9% SLA (NFR001)

### Scalability
- **Year 1:** 1,000 hours/month audio generation
- **Year 3:** 10,000+ hours/month (horizontal scaling)
- **Auto-scaling:** Cloud Run (0-100 instances)
- **Queue Migration:** BullMQ → Cloud Pub/Sub (at scale trigger)

---

## 🔒 Security

- **Data Encryption:** TLS 1.3 (transit), AES-256 (rest)
- **Authentication:** Lucia session-based + API keys + OAuth (Month 6)
- **Authorization:** Role-based access control (RBAC)
- **Compliance:** GDPR + CCPA ready
- **Rate Limiting:** Tier-based (Free: 10/min, Pro: 60/min, Enterprise: custom)
- **Audit Logging:** All user actions and system events

**Security Specialist Review:** Recommended for Epic 4+ (penetration testing, threat modeling)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add voice cloning feature
fix: resolve audio generation timeout
docs: update API documentation
test: add unit tests for TTS gateway
refactor: improve plugin architecture
```

---

## 📈 Roadmap

### Phase 1: MVP Foundation (Weeks 1-4)
- [x] Epic 1: Foundation & Basic TTS (15 stories) ✅
- [x] Epic 2: Multi-Format Processing (10 stories) ✅

### Phase 2: Competitive Differentiation (Weeks 5-10)
- [ ] Epic 3: Voice Cloning (12-15 stories)
- [ ] Epic 4: Web Dashboard (15-18 stories)

### Phase 3: Quality & Developer Ecosystem (Weeks 11-18)
- [ ] Epic 5: Quality Tools (8-10 stories)
- [ ] Epic 6: API & Webhooks (10-12 stories)
- [ ] Epic 7: AI Direction (10-12 stories)

### Phase 4: Enterprise Market (Weeks 19-24)
- [ ] Epic 8: Enterprise Collaboration (12-15 stories)
- [ ] Epic 9: Distribution (8-10 stories)

**Total:** 100-117 stories across 9 epics

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **KokoroTTS** - TTS engine foundation
- **Bun Team** - Blazing-fast JavaScript runtime
- **Elysia Team** - TypeScript-first web framework
- **Astro Team** - Modern web framework
- **BMAD Method** - Product development methodology

---

## 📞 Contact & Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/falador/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/falador/discussions)
- **Email:** support@falador.ai
- **Website:** https://falador.ai

---

## 🌐 Community

- [Discord Server](https://discord.gg/falador)
- [Twitter](https://twitter.com/falador_ai)
- [LinkedIn](https://linkedin.com/company/falador)

---

<p align="center">
  <strong>Built with ❤️ for the Brazilian Portuguese audiobook market</strong>
  <br>
  Made with <a href="https://bun.sh">Bun</a>, <a href="https://elysiajs.com">Elysia</a>, and <a href="https://astro.build">Astro</a>
</p>

<p align="center">
  🎙️ <strong>Falador</strong> - Enterprise AI-directed TTS for Brazilian Portuguese audiobooks
</p>
