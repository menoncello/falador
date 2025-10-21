# Falador Product Requirements Document (PRD)

**Author:** Eduardo Menoncello
**Date:** 2025-10-16
**Project Level:** 4
**Target Scale:** Enterprise-scale audiobook production platform

---

## Goals and Background Context

### Goals

**Strategic Product Goals:**

1. **Establish Brazilian Portuguese TTS Quality Leadership** - Achieve and maintain 4.5/5 voice quality rating, surpassing the current market average of 3.8/5, to become the recognized leader in professional-grade Brazilian Portuguese audiobook narration

2. **Deliver Enterprise-Scale Production Efficiency** - Enable publishers and content creators to produce audiobooks in 48 hours (vs. 4-6 weeks traditional timeline) with 80% cost reduction ($75-200 vs. $1,600-6,000 per book)

3. **Capture Brazilian Audiobook TTS Market Share** - Achieve 10% market share by Year 3 in the $340M Brazilian audiobook market growing at 28% CAGR, with initial focus on technical publishers and independent authors

4. **Build Developer-First Platform Excellence** - Create best-in-class CLI tools, RESTful APIs, and automation capabilities that enable technical users to integrate audiobook production into their existing workflows and CI/CD pipelines

5. **Pioneer Voice Cloning Innovation** - Develop industry-leading voice cloning capabilities enabling authors to use their own voices, maintain character consistency across book series, and establish publisher brand voices across catalogs

6. **Enable Publisher Workflow Integration** - Build deep integration with publishing CMS, metadata management systems, and distribution platforms to create high switching costs and sustainable competitive advantages

7. **Achieve Sustainable Business Model** - Reach positive cash flow by Month 18 with $1.2M ARR by Year 2, maintaining 65% gross margins and 3.5x LTV/CAC ratio through superior Portuguese quality and specialized features

### Background Context

The Brazilian audiobook market represents a $340M opportunity growing at 28% CAGR, yet publishers face a critical quality gap that prevents widespread adoption of AI-generated narration. Current TTS solutions deliver only 3.8/5 quality when professional audiobook production requires 4.5/5 standards. This quality deficiency forces publishers to rely on expensive traditional narration ($1,600-6,000 per book, 4-6 weeks production time), creating significant barriers to catalog expansion and market responsiveness.

Falador addresses this market opportunity through a premium AI-directed TTS platform specifically engineered for Brazilian Portuguese excellence. By combining KokoroTTS foundation with Portuguese language optimization, CLI-first developer experience, voice cloning capabilities, and publisher workflow integration, Falador enables professional audiobook production at 80% cost savings with 10x faster timelines. The platform targets three primary segments: technical publishers requiring batch processing automation (20-500 books monthly), independent authors seeking personal voice cloning, and Brazilian publishing houses demanding workflow integration and quality excellence. Strategic market entry follows a phased approach starting with technical users, expanding to creative users, then business customers, positioning Falador to capture 8-12% market share by Year 3 through superior Portuguese specialization.

---

## Requirements

### Functional Requirements

**Audio Generation Core**

- FR001: The system shall convert text input (books, documents) to high-quality audio using KokoroTTS-based engine optimized for Brazilian Portuguese
- FR002: The system shall support multi-format input parsing including PDF, Markdown, HTML, DOC/DOCX, EPUB, and TXT formats
- FR003: The system shall automatically detect and segment book chapters, maintaining structural hierarchy and metadata
- FR004: The system shall generate audio at 2x real-time processing speed minimum for standard text content
- FR005: The system shall support regional Brazilian Portuguese accents including São Paulo, Rio, Northeast, and South variants
- FR005a: The system shall provide English language support for international market expansion

**Voice Management and Cloning**

- FR006: The system shall enable voice cloning from 30-second audio samples with 90% user satisfaction target
- FR007: The system shall maintain a voice library allowing users to manage multiple custom voices per account
- FR008: The system shall support character voice differentiation for fiction content with multiple speakers
- FR009: The system shall enable voice customization controls for pitch, speed, tone, and emotional expression
- FR010: The system shall validate voice clone quality through automated assessment before deployment

**CLI and Developer Experience**

- FR011: The system shall provide comprehensive CLI tools for all core functionality including batch processing
- FR012: The system shall support batch processing of multiple books/files with progress monitoring and logging
- FR013: The system shall enable configuration management through CLI with YAML/JSON config file support
- FR014: The system shall provide automation scripting capabilities with shell script integration
- FR015: The system shall support pipeline integration with CI/CD tools through CLI commands and exit codes

**API and Integration**

- FR016: The system shall expose RESTful API with comprehensive endpoints for all platform functionality
- FR017: The system shall implement authentication and authorization using industry-standard OAuth 2.0/JWT
- FR018: The system shall provide webhook support for asynchronous notifications on job completion and status changes
- FR019: The system shall support rate limiting with configurable limits per user tier (free, pro, enterprise)
- FR020: The system shall enable API key management with rotation, revocation, and usage tracking capabilities

**Project and Content Management**

- FR021: The system shall enable users to create and manage audiobook projects with metadata (title, author, genre, language)
- FR022: The system shall track production status for each project (queued, processing, completed, failed)
- FR023: The system shall preserve chapter structure and generate individual audio files per chapter with combined full-book option
- FR024: The system shall support project versioning enabling users to regenerate content with updated voice models
- FR025: The system shall enable users to preview audio segments before final generation

**Quality Assurance and Direction**

- FR026: The system shall implement AI-directed narration analyzing text for appropriate tone, pacing, and emotional expression
- FR027: The system shall detect and correctly pronounce technical terminology in specialized content (programming, science, medicine)
- FR028: The system shall provide quality scoring for generated audio against target benchmarks (4.5/5 minimum)
- FR029: The system shall enable manual pronunciation correction through custom dictionary functionality
- FR030: The system shall support genre-specific direction profiles (fiction, non-fiction, technical, educational)

**Export and Distribution**

- FR031: The system shall export audio in standard audiobook formats including MP3, M4B, and OGG with configurable bitrates
- FR032: The system shall embed metadata tags in exported files (ID3 tags) including title, author, narrator, chapter markers
- FR033: The system shall support direct distribution integration with major platforms (preparation for ACX, Audible, Spotify)
- FR034: The system shall generate chapter markers and table of contents for audiobook players
- FR035: The system shall provide bulk export functionality for batch-processed projects

### Non-Functional Requirements

**Performance and Scalability**

- NFR001: The system shall maintain 99.9% uptime with maximum 4 hours planned downtime per month for maintenance
- NFR002: The system shall support concurrent processing of 1,000+ audio generation requests without degradation
- NFR003: The system shall respond to API requests within 100ms for 95th percentile (excluding audio generation jobs)
- NFR004: The system shall scale horizontally to handle 10,000+ hours of monthly audio generation by Year 3

**Quality and Reliability**

- NFR005: The system shall achieve 4.5/5 Brazilian Portuguese voice quality rating by Month 9 of operation
- NFR006: The system shall maintain 90% quality assurance first-pass approval rate for generated audio
- NFR007: The system shall implement automated testing with 80% code coverage minimum and mutation testing thresholds

**Security and Privacy**

- NFR008: The system shall encrypt all data in transit using TLS 1.3 and at rest using AES-256 encryption
- NFR009: The system shall comply with GDPR and CCPA requirements for user data privacy and protection
- NFR010: The system shall implement comprehensive audit logging for all user actions and system events

**Usability and Documentation**

- NFR011: The system shall provide comprehensive API documentation with interactive examples and SDK libraries
- NFR012: The system shall maintain developer-focused documentation enabling user self-service for common tasks

---

## User Journeys

#### **Journey 1: Technical Publisher - Batch Audiobook Production**

**User:** Alex Chen, Technical Publisher at DevBooks Publishing
**Goal:** Process 25 programming books for audiobook conversion using CLI automation
**Context:** Monthly batch processing workflow integrated with CI/CD pipeline

**Flow:**

1. **Setup Phase**
   - Alex installs Falador CLI via npm/homebrew: `npm install -g falador-cli`
   - Configures authentication with API key: `falador auth login --api-key=xxx`
   - Creates YAML configuration file defining batch job parameters (voice selection, accent, quality settings)

2. **Batch Processing**
   - Alex runs batch command: `falador batch process --config=batch-config.yaml --input-dir=./books/`
   - System validates 25 EPUB files, extracts metadata, and queues generation jobs
   - CLI displays real-time progress dashboard with per-book status (queued → processing → completed)
   - Alex monitors logs: `falador batch status --job-id=batch-12345 --follow`

3. **Quality Assurance**
   - System completes processing in 36 hours (25 books averaging 200 pages each)
   - Alex reviews quality scores: `falador batch report --job-id=batch-12345`
   - System shows 23 books passed 4.5/5 quality threshold, 2 flagged for review
   - Alex listens to flagged samples, adjusts pronunciation dictionary for technical terms
   - Regenerates 2 books with corrections: `falador regenerate --book-ids=book-18,book-22`

4. **Export and Distribution**
   - Alex exports all audiobooks with metadata: `falador batch export --format=m4b --include-chapters`
   - System generates 25 M4B files with embedded chapter markers and ID3 tags
   - Alex uploads to distribution platform via automated script integration
   - Receives webhook notifications confirming successful processing

**Success Criteria:** 25 books processed in <48 hours, 92% first-pass quality approval, full automation via CLI

---

#### **Journey 2: Independent Author - Personal Voice Cloning for Fiction Series**

**User:** Carlos Silva, Fiction Author
**Goal:** Create audiobook of fantasy novel using his own voice for authentic reader connection
**Context:** First-time audiobook creator with trilogy series planned

**Flow:**

1. **Account Setup and Voice Sample Recording**
   - Carlos signs up via web interface, selects "Author Voice Cloning" plan
   - Completes onboarding tutorial explaining voice sample requirements
   - Records 30-second voice sample following guided prompts (reading provided script)
   - Uploads sample via web interface, system validates audio quality (clear, no background noise)

2. **Voice Clone Training**
   - System processes voice sample, creates custom voice model (estimated 2 hours)
   - Carlos receives email notification when voice clone is ready
   - Previews voice clone with test sentences: "Listen to your cloned voice preview"
   - Approves voice quality or requests adjustments (pitch, warmth, speaking rate)
   - System refines model based on preferences, Carlos approves final version

3. **Book Upload and Configuration**
   - Carlos uploads EPUB file of fantasy novel (350 pages, 12 chapters)
   - System extracts chapter structure and displays preview
   - Carlos configures narration settings:
     - Voice: Personal cloned voice
     - Accent: São Paulo variant
     - Genre profile: Fiction - Fantasy (for appropriate pacing and tone)
     - Character differentiation: Enabled (AI detects dialogue vs. narration)
   - Reviews estimated cost ($150) and timeline (48 hours), confirms generation

4. **Review and Iteration**
   - System generates audiobook, sends notification with sample chapters
   - Carlos listens to Chapter 1 and Chapter 6 samples
   - Identifies pronunciation issue with character name "Drakonius"
   - Adds custom pronunciation to dictionary: Drakonius → "Drah-KOH-nee-oos"
   - Requests regeneration of affected chapters (3 chapters with this character)
   - System regenerates only modified chapters (6 hours), Carlos approves

5. **Publication Preparation**
   - Downloads complete M4B audiobook with chapter markers
   - Exports individual chapter MP3 files for backup
   - Reviews quality score: 4.6/5 (exceeds expectations)
   - Plans to use same voice clone for Book 2 and Book 3 of trilogy
   - Shares preview clip on social media to build audience interest

**Success Criteria:** Personal voice clone quality 4.6/5, complete audiobook in 54 hours (including revision), author satisfaction with authentic voice

---

#### **Journey 3: Publishing House Director - Catalog Conversion and Workflow Integration**

**User:** Maria Santos, Digital Content Director at Editora Brasileira
**Goal:** Convert 100-book backlist to audiobooks with workflow integration into publishing CMS
**Context:** Enterprise deployment requiring team collaboration, quality control, and distribution automation

**Flow:**

1. **Enterprise Onboarding and Integration**
   - Maria schedules demo with Falador enterprise team
   - Reviews API documentation and integration requirements
   - IT team integrates Falador API with publishing CMS (Sistema Editorial)
   - Configures webhook endpoints for status notifications and quality alerts
   - Sets up SSO authentication for editorial team (10 users)

2. **Publisher Brand Voice Development**
   - Maria works with Falador team to create custom publisher brand voice
   - Provides samples from preferred professional narrator (5 minutes of audio)
   - Voice modeling team creates branded voice optimized for non-fiction content
   - Editorial team reviews and approves brand voice across multiple genres
   - Voice saved as "Editora Brasileira - Professional Narration" in voice library

3. **Workflow Setup and Team Roles**
   - Maria configures production workflow in Falador:
     - Content Manager: Uploads manuscripts, assigns metadata
     - Audio Director: Reviews AI direction settings, approves genre profiles
     - QA Editor: Validates audio quality, pronunciation, consistency
     - Distribution Manager: Exports final files, triggers distribution
   - Sets up approval gates: AI generation → QA review → Director approval → Distribution

4. **Batch Catalog Processing with Quality Control**
   - Content Manager uploads 100 books from CMS to Falador (automated sync)
   - System categorizes by genre, assigns appropriate direction profiles
   - AI generation processes 20 books/week (rolling schedule to manage QA load)
   - QA Editor reviews quality scores and flagged segments daily
   - Identifies 15 books requiring pronunciation corrections (proper names, technical terms)
   - Audio Director spot-checks 10% sample across genres for consistency

5. **Distribution and Analytics**
   - Completed audiobooks automatically exported to distribution platforms:
     - ACX/Audible integration (automated metadata submission)
     - Spotify Audiobooks (API upload)
     - Internal streaming platform (direct CDN delivery)
   - Distribution Manager monitors webhook logs for completion confirmations
   - Maria reviews analytics dashboard:
     - 100 books completed in 12 weeks
     - Average quality score: 4.7/5
     - 88% first-pass approval rate
     - Cost savings: $480,000 vs. traditional narration ($1.6M → $120K)
     - ROI: 4.2x in first year

6. **Ongoing Operations and Expansion**
   - Maria establishes monthly production quota: 15 new audiobooks
   - Team develops pronunciation dictionary with 200+ Portuguese proper names and terms
   - Plans expansion to educational textbook catalog (next 200 titles)
   - Negotiates volume discount with Falador based on annual commitment

**Success Criteria:** 100 books converted in 12 weeks, 88% first-pass quality, 4.7/5 average rating, $480K cost savings, successful workflow integration

---

#### **Journey 4: Author - Error Recovery and Support**

**User:** Ana Costa, Non-Fiction Author
**Goal:** Recover from failed audiobook generation and pronunciation issues
**Context:** Technical challenges requiring customer support intervention

**Flow:**

1. **Initial Generation Attempt**
   - Ana uploads PDF of business book (280 pages)
   - System fails parsing due to complex table layouts and embedded images
   - Error message displayed: "PDF parsing failed - complex layouts detected"
   - System suggests: "Try converting to plain text or Markdown format first"

2. **Support Engagement**
   - Ana clicks "Contact Support" button, creates ticket with PDF attachment
   - Support agent (4-hour response SLA) reviews file, identifies issues
   - Agent provides pre-processed Markdown version with tables converted
   - Ana uploads Markdown file, generation proceeds successfully

3. **Pronunciation Corrections**
   - Generated audio has multiple mispronunciations of industry-specific terms
   - Ana uses pronunciation editor to add 8 corrections
   - System regenerates only affected chapters (4 of 15 chapters)
   - Quality improves from 4.1/5 to 4.6/5

4. **Final Review and Approval**
   - Ana listens to corrected version, approves final audiobook
   - Downloads M4B file for self-publishing distribution
   - Provides 5-star rating with feedback: "Support was excellent, pronunciation editor saved my project"

**Success Criteria:** Issue resolved within 24 hours, successful recovery, user satisfaction maintained

---

#### **Journey 5: Developer - API Integration for Educational Platform**

**User:** Diego Ramos, Backend Developer at EduTech Brasil
**Goal:** Integrate Falador API into e-learning platform for automatic course audio generation
**Context:** Programmatic integration requiring webhook automation and status monitoring

**Flow:**

1. **API Exploration and Testing**
   - Diego reviews API documentation at docs.falador.ai
   - Creates developer account, generates API key
   - Tests endpoints using Postman collection (provided in docs)
   - Validates authentication, file upload, and job creation flows
   - Reviews SDK options, selects TypeScript SDK for Node.js backend

2. **Integration Development**
   - Diego installs SDK: `npm install @falador/sdk`
   - Implements service class wrapping Falador API calls
   - Creates webhook endpoint to receive job status updates
   - Configures retry logic for failed jobs and error handling
   - Sets up job queue integration with BullMQ for async processing

3. **Automated Workflow Implementation**
   - User creates new course in EduTech platform (10 lessons, Markdown format)
   - Backend automatically triggers Falador generation via API:
     ```typescript
     const job = await falador.generate({
       text: courseContent,
       voice: 'educational-portuguese-female',
       format: 'mp3',
       webhook: 'https://edutech.com/api/falador-webhook',
     });
     ```
   - System polls job status every 30 seconds until completion
   - Webhook notification received, audio files downloaded to CDN
   - Course status updated: "Audio generation complete"

4. **Production Monitoring**
   - Diego implements CloudWatch monitoring for API health
   - Tracks metrics: API response time, success rate, error types
   - Sets up alerts for rate limit warnings and failed jobs
   - Reviews monthly usage: 500 courses generated, 99.2% success rate

**Success Criteria:** Seamless API integration, 99%+ success rate, automated workflow with webhook notifications

---

## UX Design Principles

**Core Experience Qualities:**

1. **Developer-First Efficiency** - CLI tools and APIs prioritize speed, automation, and scriptability for technical users who value terminal-based workflows and programmatic integration

2. **Progressive Disclosure** - Web interface reveals complexity gradually, starting with simple workflows (upload → generate → download) while providing advanced controls for power users (pronunciation editing, voice customization, batch management)

3. **Quality Transparency** - Users receive continuous feedback on audio quality scores, processing status, and improvement suggestions, building confidence in AI-generated output through measurable metrics

4. **Accessibility and Internationalization** - Platform supports screen readers, keyboard navigation, and Brazilian Portuguese localization as primary language with future multilingual support

**Key UX Principles:**

- **CLI-Web Complementarity**: CLI handles automation and batch operations; web handles voice cloning, quality review, and team collaboration
- **Trust Through Previews**: All workflows provide audio previews before final commitment (sample chapters, voice clone demos)
- **Iterative Refinement**: Easy correction workflows (pronunciation dictionary, regeneration of specific chapters) without full restart
- **Status Visibility**: Real-time progress indicators, estimated completion times, and webhook notifications keep users informed

---

## User Interface Design Goals

**Platform Coverage:**

- **Primary**: Web application (desktop browsers: Chrome, Firefox, Safari, Edge)
- **CLI**: Terminal interface for macOS, Linux, Windows (via npm/homebrew package)
- **API**: RESTful endpoints with comprehensive SDKs (TypeScript, Python, Go)
- **Future**: Mobile-responsive web for project monitoring and approval workflows

**Core Screens and Navigation:**

1. **Dashboard** (Web)
   - Project overview with status cards (queued, processing, completed, failed)
   - Quick actions: New project, Upload book, Clone voice
   - Recent activity feed and usage analytics

2. **Voice Library** (Web)
   - Gallery view of available voices (cloned, pre-built, publisher brand voices)
   - Voice creation wizard with sample recording and preview
   - Voice customization controls (pitch, speed, warmth sliders)

3. **Project Workspace** (Web)
   - Book upload with format detection and chapter preview
   - Configuration panel: Voice selection, accent, genre profile, advanced settings
   - Quality review interface with waveform visualization and playback controls
   - Pronunciation dictionary editor with phonetic spelling guidance

4. **Batch Processing Monitor** (Web + CLI)
   - Table view of batch jobs with per-book status and quality scores
   - Bulk actions: Export all, regenerate failed, apply corrections
   - Filter and search capabilities for large batches

5. **CLI Interface**
   - Command structure: `falador [command] [subcommand] [options]`
   - Real-time progress bars with ETA and throughput metrics
   - Colored output for status (green=success, yellow=warning, red=error)
   - JSON output mode for scripting and automation

**Key Interaction Patterns:**

- **Drag-and-Drop**: File uploads via drag-and-drop zones in web interface
- **Inline Editing**: Click-to-edit for project metadata, pronunciation corrections
- **Batch Selection**: Multi-select with checkboxes for bulk operations
- **Contextual Help**: Inline tooltips and help text with links to documentation
- **Keyboard Shortcuts**: Power user shortcuts for common actions (CLI-style efficiency in web UI)

**Design Constraints:**

- **Brand Guidelines**: Clean, professional design reflecting premium positioning and Brazilian market aesthetic
- **Performance**: Sub-second page load times, lazy loading for large lists
- **Browser Support**: Modern browsers (last 2 versions), no IE11 support
- **Responsive Breakpoints**: Desktop-first (1440px), tablet (768px), mobile monitoring (375px)
- **Accessibility**: WCAG 2.1 AA compliance minimum, keyboard navigation for all workflows

---

## Epic List

**Epic 1: Foundation & Basic TTS Generation (CLI MVP)**
_Deliverable: Working CLI tool that converts plain text files to Portuguese audio using KokoroTTS_
**What users can do:** Install CLI, run `falador generate input.txt --output audio.mp3`, get Brazilian Portuguese audio file
Estimated Stories: 10-12

**Epic 2: Multi-Format Book Processing**
_Deliverable: CLI processes real books (EPUB, PDF, Markdown) with chapter detection and batch generation_
**What users can do:** Convert entire books with `falador generate book.epub`, get chapter-by-chapter audio files with metadata
Estimated Stories: 8-10

**Epic 3: Voice Cloning & Custom Voices**
_Deliverable: Users can clone their own voice and use it for audiobook narration_
**What users can do:** Upload 30-second sample, train custom voice, generate audiobook with their cloned voice
Estimated Stories: 12-15

**Epic 4: Web Dashboard & Project Management**
_Deliverable: Web application for managing projects, monitoring progress, and reviewing audio_
**What users can do:** Sign up, upload books via web UI, track generation status, preview/download completed audiobooks
Estimated Stories: 15-18

**Epic 5: Quality Tools & Pronunciation Editor**
_Deliverable: Interactive quality review with pronunciation corrections and chapter regeneration_
**What users can do:** Listen to generated audio, mark pronunciation errors, add corrections, regenerate specific chapters
Estimated Stories: 8-10

**Epic 6: API & Webhook Integration**
_Deliverable: RESTful API with SDKs enabling third-party integrations and automated workflows_
**What users can do:** Integrate Falador into existing systems, receive webhook notifications, automate audiobook production pipelines
Estimated Stories: 10-12

**Epic 7: AI Direction & Genre Optimization**
_Deliverable: Intelligent narration that adapts tone, pacing, and emotion based on content genre and context_
**What users can do:** Select genre profile (fiction/non-fiction/technical), system automatically applies appropriate narration style
Estimated Stories: 10-12

**Epic 8: Enterprise Collaboration & Publisher Workflow**
_Deliverable: Team workspaces with role-based access, approval workflows, and publishing system integrations_
**What users can do:** Create team accounts, assign roles (editor/QA/director), implement approval gates, integrate with publishing CMS
Estimated Stories: 12-15

**Epic 9: Distribution & Platform Integration**
_Deliverable: Direct export to major audiobook platforms (ACX, Audible, Spotify) with automated metadata submission_
**What users can do:** One-click distribution to audiobook platforms, automatic format conversion, metadata synchronization
Estimated Stories: 8-10

**Total Estimated Stories:** 93-114 stories across 9 epics

> **Note:** Detailed epic breakdown with full story specifications is available in [epics.md](./epics.md)

---

## Out of Scope

**Features Deferred to Future Phases:**

- **Real-time Streaming Audio Generation** - Live audio generation during text input is not supported in initial release; async batch processing only
- **Mobile Native Applications** - No iOS/Android native apps; mobile-responsive web interface only for monitoring workflows
- **Video Content Generation** - Text-to-video or synchronized video narration not included; audio-only output
- **Live Collaboration and Co-editing** - Real-time collaborative editing of projects deferred; async workflow with role-based approval gates only
- **Blockchain/NFT Integration** - No cryptocurrency payments or NFT-based voice ownership in initial release
- **White-label and Self-hosted Solutions** - SaaS-only model; on-premises deployments deferred to enterprise roadmap
- **Advanced Analytics and BI Dashboards** - Basic usage metrics only; comprehensive business intelligence and predictive analytics deferred
- **Additional Language Support Beyond PT-BR and English** - Spanish, French, German, and other languages deferred to Phase 2 (MVP includes Brazilian Portuguese and English only)

**Adjacent Problems Not Being Solved:**

- **Content Rights Management** - Platform assumes users have legal rights to convert content; no DRM or rights verification system
- **Content Creation and Writing Tools** - No AI-assisted writing, editing, or manuscript generation; users provide finished manuscripts only
- **Professional Narration Marketplace** - No marketplace for hiring human narrators or voice actors; AI-only solution
- **Audio Editing and Post-production** - No advanced audio editing tools (noise removal, mastering, sound effects); generated audio is final output
- **Marketing and Distribution Strategy** - Platform handles technical distribution to platforms but not marketing, pricing strategy, or promotional campaigns

**Integrations and Platforms Not Supported (Initial Release):**

- **Publishing Platforms:** No direct integration with AuthorHub, Draft2Digital, IngramSpark, or Lulu (export files manually)
- **CMS Systems:** No native plugins for WordPress, Drupal, or other content management systems
- **E-learning Platforms:** No LMS integrations (Moodle, Canvas, Blackboard) beyond generic API access
- **Social Media:** No direct posting or preview sharing to social platforms
- **Project Management Tools:** No Jira, Asana, or Trello integrations for workflow tracking

**Technical Limitations and Constraints:**

- **Browser Plugin/Extension** - No browser extension for reading web content aloud (mentioned in brainstorming but out of MVP scope)
- **Offline Mode** - Cloud-based processing only; no offline TTS generation capability
- **Custom TTS Model Training** - Users cannot train entirely new TTS models; voice cloning and customization only within platform parameters
- **Audio Formats:** Limited to MP3, M4B, and OGG formats; no FLAC, WAV, or other lossless formats in initial release
- **Book Length Limits** - Maximum 500 pages or 150,000 words per book in initial release; larger works require splitting

**User Segments Not Targeted (Initial Release):**

- **Gaming and Interactive Entertainment** - No support for dynamic dialogue trees, branching narratives, or game engine integration
- **Podcasting and News** - Platform optimized for long-form audiobook content, not episodic or news-based audio
- **Accessibility Tools for General Web Content** - Focus on book-length content; not a general-purpose screen reader or web accessibility tool
- **Corporate Training and HR** - No specialized features for employee training, onboarding, or corporate communications

**Scope Boundaries Requiring Clarification:**

- **Voice Clone Ownership** - Users own their voice clones; Falador cannot use customer voice clones for other purposes
- **Content Ownership** - Generated audio files are owned by users; platform retains no rights to distribute or monetize user content
- **Quality Guarantees** - Target 4.5/5 quality is a goal, not a contractual guarantee; refunds/credits based on measurable quality failures only
- **API Rate Limits** - Enterprise plans have negotiated limits; standard plans subject to fair use policies detailed in API documentation
- **Support SLAs** - 4-hour response time for support tickets is target, not guaranteed SLA except for enterprise contracts
