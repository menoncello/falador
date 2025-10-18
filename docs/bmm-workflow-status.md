# Project Workflow Status

**Project:** Falador
**Created:** 2025-10-16
**Last Updated:** 2025-10-17
**Status File:** `bmm-workflow-status.md`

---

## Workflow Status Tracker

**Current Phase:** Implementation
**Current Workflow:** story-approved (Story 1.2) - Complete
**Current Agent:** Developer
**Overall Progress:** 68%

### Phase Completion Status

- [ ] **1-Analysis** - Research, brainstorm, brief (optional - SKIPPED)
- [x] **2-Plan** - PRD/GDD/Tech-Spec + Stories/Epics (COMPLETE)
- [x] **3-Solutioning** - Architecture + Tech Specs (COMPLETE)
- [ ] **4-Implementation** - Story development and delivery (IN PROGRESS - Story 1.1 drafted)

### Planned Workflow Journey

**This section documents your complete workflow plan from start to finish.**

| Phase            | Step                     | Agent     | Description                                              | Status   |
| ---------------- | ------------------------ | --------- | -------------------------------------------------------- | -------- |
| 2-Plan           | prd                      | PM        | Create Product Requirements Document and epics           | Complete |
| 2-Plan           | ux-spec                  | PM        | UX/UI specification (user flows, wireframes, components) | Complete |
| 3-Solutioning    | solution-architecture    | Architect | Design overall architecture                              | Complete |
| 3-Solutioning    | tech-spec (all epics)    | Architect | Epic-specific technical specs (Epics 1-9)                | Complete |
| 4-Implementation | create-story (iterative) | SM        | Draft stories from backlog                               | Planned  |
| 4-Implementation | story-ready              | SM        | Approve story for dev                                    | Planned  |
| 4-Implementation | story-context            | SM        | Generate context XML                                     | Planned  |
| 4-Implementation | dev-story (iterative)    | DEV       | Implement stories                                        | Planned  |
| 4-Implementation | story-approved           | DEV       | Mark complete, advance queue                             | Planned  |

**Current Step:** Tech Specifications Complete (All Epics)
**Next Step:** create-story (SM agent) - Begin Phase 4: Implementation

**Instructions:**

- This plan was created during initial workflow-status setup
- Status values: Planned, Optional, Conditional, In Progress, Complete
- Current/Next steps update as you progress through the workflow
- Use this as your roadmap to know what comes after each phase

### Implementation Progress (Phase 4 Only)

**Story Tracking:** Epic 1 - Story 1.2 complete, Story 1.3 queued for drafting, Story 1.4 moved to TODO

#### TODO (Needs Drafting)

- **Story ID:** 1.4
- **Story Title:** PostgreSQL Database Setup & Schema Design
- **Story File:** `story-1.4.md`
- **Status:** Not created yet
- **Action:** SM should run `*create-story` workflow to draft this story

#### IN PROGRESS (Approved for Development)

- **Story ID:** 1.3
- **Story Title:** Docker Containerization & Local Development
- **Story File:** `docs/stories/story-1.3.md`
- **Story Status:** Not created yet
- **Action:** SM should run `*create-story` workflow to draft story 1.3, then run `*story-ready` to approve for development

#### DONE (Completed Stories)

- **Story ID:** 1.2
- **Story Title:** CI/CD Pipeline & Testing Infrastructure
- **Story File:** `docs/stories/story-1.2.md`
- **Story Status:** Done
- **Review Outcome:** Approve (2 HIGH findings resolved, all 8 ACs satisfied)
- **Completion Date:** 2025-10-18
- **Summary:** Production-ready CI/CD infrastructure with GitHub Actions (6 jobs), Stryker mutation testing (80%), c8 coverage (80%), E2E tests (32/32 passing), Docker multi-stage build, GCP Cloud Run deployment, branch protection configured

- **Story ID:** 1.1
- **Story Title:** Project Foundation & Repository Setup
- **Story File:** `docs/stories/story-1.1.md`
- **Story Status:** Done
- **Review Outcome:** Approve (0 High, 0 Medium, 1 Low finding)
- **Completion Date:** 2025-10-18
- **Summary:** Exemplary implementation with production-ready foundation, zero quality gate violations, industry best-practice TypeScript/ESLint config

#### BACKLOG (Remaining Stories)

**Epic 1:** Foundation & Basic TTS Generation (15 stories total)

- Story 1.5: Clean Architecture Project Structure
- Story 1.6: Error Handling & Logging Infrastructure
- Story 1.7: KokoroTTS Gateway Interface
- Story 1.8: KokoroTTS Integration & Portuguese Optimization
- Story 1.9: Audio File Processing & Storage
- Story 1.10: CLI Framework & Command Structure
- Story 1.11: 'generate' Command Implementation
- Story 1.12: CLI Configuration & Authentication Setup
- Story 1.13: End-to-End Integration Testing
- Story 1.14: CLI Documentation & Developer Guide
- Story 1.15: MVP Release Preparation

**Epic 2-9:** 85-102 additional stories (detailed in epics.md)

### Artifacts Generated

| Artifact                        | Status   | Location                                         | Date       |
| ------------------------------- | -------- | ------------------------------------------------ | ---------- |
| Workflow Status                 | Updated  | docs/bmm-workflow-status.md                      | 2025-10-17 |
| Product Brief                   | Complete | docs/product-brief-audiobook-2025-10-09.md       | 2025-10-09 |
| Brainstorming Results           | Complete | docs/brainstorming-session-results-2025-01-09.md | 2025-01-09 |
| PRD                             | Complete | docs/PRD.md                                      | 2025-10-16 |
| Epic Breakdown                  | Complete | docs/epics.md                                    | 2025-10-16 |
| UX/UI Specification             | Complete | docs/ux-specification.md                         | 2025-10-16 |
| Solution Architecture           | Complete | docs/solution-architecture.md                    | 2025-10-17 |
| Tech Spec - Epic 1              | Complete | docs/tech-spec-epic-1.md                         | 2025-10-17 |
| Tech Spec - Epic 2              | Complete | docs/tech-spec-epic-2.md                         | 2025-10-17 |
| Tech Spec - Epic 3              | Complete | docs/tech-spec-epic-3.md                         | 2025-10-17 |
| Tech Spec - Epic 4              | Complete | docs/tech-spec-epic-4.md                         | 2025-10-17 |
| Tech Spec - Epic 5              | Complete | docs/tech-spec-epic-5.md                         | 2025-10-17 |
| Tech Spec - Epic 6              | Complete | docs/tech-spec-epic-6.md                         | 2025-10-17 |
| Tech Spec - Epic 7              | Complete | docs/tech-spec-epic-7.md                         | 2025-10-17 |
| Tech Spec - Epic 8              | Complete | docs/tech-spec-epic-8.md                         | 2025-10-17 |
| Tech Spec - Epic 9              | Complete | docs/tech-spec-epic-9.md                         | 2025-10-17 |
| Story 1.1 (Draft)               | Complete | docs/stories/story-1.1.md                        | 2025-10-17 |
| Story 1.2 (Draft)               | Complete | docs/stories/story-1.2.md                        | 2025-10-18 |
| Story 1.2 (Context)             | Complete | docs/stories/story-context-1.2.xml               | 2025-10-18 |
| Test Review (Story 1.4)         | Complete | docs/test-review.md                              | 2025-10-17 |
| Traceability Matrix (Story 1.4) | Complete | docs/traceability-matrix-story-1.4.md            | 2025-10-17 |

### Next Action Required

**What to do next:** Draft Story 1.3 (Docker Containerization & Local Development)

**Command to run:** Load SM agent and run `*create-story` workflow

**Agent to load:** SM (Scrum Master) - bmad/bmm/agents/sm.md

**Story Details:** Story 1.3 needs to be drafted before development can begin

**Workflow State:** Story 1.2 context XML created with all artifacts, constraints, interfaces, and testing standards

**Phase 3 Summary (Solutioning Complete):**

- ✅ Solution Architecture: Modular monolith + plugin architecture, 40+ technologies with latest versions, 11 database entities, 30+ API routes, complete source tree, 13 ADRs
- ✅ Tech Spec Epic 1: MVP foundation (15 stories) - Infrastructure, TTS integration, CLI
- ✅ Tech Spec Epic 2: Multi-format processing (10 stories) - EPUB/PDF/MD parsers, batch processing
- ✅ Tech Spec Epic 3: Voice cloning (12-15 stories) - Sample upload, training pipeline, multi-voice support
- ✅ Tech Spec Epic 4: Web dashboard (15-18 stories) - Astro + React, authentication, project management UI
- ✅ Tech Spec Epic 5: Quality tools (8-10 stories) - Quality scoring, pronunciation dictionary, regeneration
- ✅ Tech Spec Epic 6: API & webhooks (10-12 stories) - OAuth 2.0, REST API, TypeScript/Python SDKs
- ✅ Tech Spec Epic 7: AI direction (10-12 stories) - Genre classification, dialogue detection, emotional tone, SSML generation
- ✅ Tech Spec Epic 8: Enterprise collaboration (12-15 stories) - Organizations, RBAC, approval workflows, SSO
- ✅ Tech Spec Epic 9: Distribution (8-10 stories) - ACX, Audible, Spotify, Apple Books integrations

---

## Gate History

### Story 1.4 - User Authentication & Project Management API (2025-10-17)

- **Decision**: ⚠️ CONCERNS
- **Reason**: 100% test coverage (P0/P1/P2) but test execution results pending
- **Document**: [traceability-matrix-story-1.4.md](traceability-matrix-story-1.4.md)
- **Action**: Execute tests, verify P0 pass rate = 100%, add data factories
- **Residual Risk**: MEDIUM (tests not executed yet, NFR validation missing)
- **Next Steps**:
  1. Run full test suite and verify P0 pass rate = 100%
  2. Add data factories for test data generation (P1 priority)
  3. Add performance assertions for API tests (P2 priority)

---

## Assessment Results

### Project Classification

- **Project Type:** web (Web Application)
- **Project Level:** 4 (Enterprise scale - multiple products/systems)
- **Instruction Set:** Full BMM workflow (Phases 2 → 3 → 4)
- **Greenfield/Brownfield:** greenfield

### Scope Summary

- **Brief Description:** Enterprise-scale Brazilian Portuguese audiobook production platform with AI-directed TTS, voice cloning, and publisher workflow integration
- **Estimated Stories:** 100-117 stories (determined during PRD phase)
- **Estimated Epics:** 9 epics (determined during PRD phase)
- **Timeline:** TBD

### Context

- **Existing Documentation:** None (greenfield project)
- **Team Size:** TBD
- **Deployment Intent:** TBD

## Recommended Workflow Path

### Primary Outputs

**Phase 2: Planning**

1. Product Requirements Document (PRD) with epic breakdown
2. UX/UI Specification (user flows, wireframes, component library)

**Phase 3: Solutioning**

1. Solution Architecture Document
2. Epic-specific Technical Specifications (JIT - Just In Time)

**Phase 4: Implementation**

1. Development stories (created iteratively)
2. Story context files
3. Working software increments

### Workflow Sequence

1. **PM Agent** → Run `prd` workflow to create Product Requirements Document
2. **PM Agent** → Run `ux-spec` workflow to design UX/UI (after PRD)
3. **Architect Agent** → Run `solution-architecture` workflow to design system architecture
4. **Architect Agent** → Run `tech-spec` workflow for each epic (JIT approach)
5. **SM Agent** → Begin implementation phase with `create-story` workflow
6. **SM/DEV Agents** → Iterate through story lifecycle (draft → ready → implement → approved)

### Next Actions

**Immediate Next Step:**

1. Load PM agent
2. Run `*prd` command
3. Complete Product Requirements Document

**After PRD:**

1. Run `*ux-spec` to define UX/UI specifications
2. Proceed to Phase 3: Solutioning

## Special Considerations

- **Level 4 Project:** This is an enterprise-scale project requiring Phase 3 (Solutioning) with formal architecture design
- **UI Components:** UX workflow is mandatory due to user-facing interface
- **Greenfield:** No existing codebase constraints, full design freedom
- **Architecture First:** Phase 3 architecture must precede implementation to ensure proper system design for enterprise scale

## Technical Preferences Captured

None yet - will be captured during PRD and architecture phases

## Story Naming Convention

### Level 2+ (Multiple Epics)

- **Format:** `story-<epic>.<story>.md`
- **Example:** `story-1.1.md`, `story-1.2.md`, `story-2.1.md`
- **Location:** `/Users/menoncello/repos/audiobook/falador/docs/stories/`
- **Max Stories:** Per epic breakdown in epics.md (determined during PRD)

## Decision Log

### Planning Decisions Made

- **2025-10-16**: Project classified as Level 4 (Enterprise scale) web application
- **2025-10-16**: Greenfield approach - starting from scratch
- **2025-10-16**: UX workflow included due to UI components
- **2025-10-16**: Full workflow path: Phase 2 → Phase 3 → Phase 4 (skipping optional Phase 1: Analysis)
- **2025-10-17**: Completed dev-story for Story 1.1 (Project Foundation & Repository Setup). All tasks complete, tests passing. Story status: Ready for Review. Next: User reviews and runs story-approved when satisfied with implementation.
- **2025-10-18**: Completed create-story for Story 1.2 (CI/CD Pipeline & Testing Infrastructure). Story file: `docs/stories/story-1.2.md`. Status: Draft (needs review via story-ready). Next: Review and approve story.
- **2025-10-18**: Story 1.2 (CI/CD Pipeline & Testing Infrastructure) marked ready for development by SM agent. Moved from TODO → IN PROGRESS. Next story 1.3 moved from BACKLOG → TODO.
- **2025-10-18**: Completed story-context for Story 1.2 (CI/CD Pipeline & Testing Infrastructure). Context file: docs/stories/story-context-1.2.xml. Next: DEV agent should run dev-story to implement.
- **2025-10-18**: Completed review-story for Story 1.2. Review outcome: Changes Requested. Findings: 2 (1 HIGH - AC #8 branch protection incomplete, 1 MEDIUM - E2E test verification needed). Action items: 6 (2 required before approval). Story status: InProgress. Next: Address review findings (configure GitHub branch protection, verify E2E tests pass), then re-submit for review or proceed to story-approved when ready.
- **2025-10-18**: Completed review-story for Story 1.1 (Project Foundation & Repository Setup). Review outcome: Approve. Findings: 1 LOW (Husky version variance 9.0.0 vs 9.2.0). Action items: 3 recommended enhancements (markdown formatting, version documentation, bun.lockb gitignore). Story status: Review Passed. Next: User can proceed with story-approved when ready, or address recommended enhancements.
- **2025-10-18**: Completed dev-story for Story 1.2 (CI/CD Pipeline & Testing Infrastructure) - Review findings addressed. AC #8 branch protection configured by user (ACTION-1.2-001 COMPLETED). E2E test suite verified by DEV agent: 32/32 tests passing, 2.3s execution time, zero flaky tests (ACTION-1.2-002 COMPLETED). All acceptance criteria satisfied, quality gates green. Story status: Ready for Review. Next: User reviews and runs story-approved when satisfied.
- **2025-10-18**: Story 1.2 (CI/CD Pipeline & Testing Infrastructure) approved and marked done by DEV agent via story-approved workflow. Moved from IN PROGRESS → DONE. Story 1.3 (Docker Containerization & Local Development) moved from TODO → IN PROGRESS. Story 1.4 (PostgreSQL Database Setup & Schema Design) moved from BACKLOG → TODO. Next: SM agent should draft Story 1.3.

---

## Change History

### 2025-10-18 - Story 1.2 Context Generated

- **Phase**: Implementation (Phase 4) - IN PROGRESS
- **Changes**: Story 1.2 implementation context assembled by SM agent via story-context workflow
- **Deliverable**: story-context-1.2.xml - Comprehensive implementation context for CI/CD Pipeline & Testing Infrastructure
- **Context Details**:
  - 9 documentation artifacts (solution architecture, tech spec, epics, testing docs, CI/CD templates, CLAUDE.md)
  - 11 code artifacts (Playwright config, Stryker configs, package.json, test examples, fixtures, GitHub Actions template)
  - 9 Node dependencies (Playwright 1.49.1, Stryker 9.2.0, Faker, ESLint, Prettier, TypeScript, Husky)
  - 6 constraints (architecture, quality gates, testing standards, CI performance, deployment, commit standards)
  - 5 interfaces (GitHub Actions workflows, Stryker config, Playwright config, package.json scripts)
  - Testing standards with framework details, coverage requirements (80% line/mutation), test structure patterns
  - 10 test ideas mapped to acceptance criteria with story-based IDs (1.2-CI-001 through 1.2-CI-010)
- **Progress**: 62% (Story 1.2 context generated, ready for DEV implementation)
- **Next Step**: Load DEV agent and run `*dev-story` workflow to implement Story 1.2
- **Context Validation**: All checklist items satisfied ✓

### 2025-10-18 - Story 1.2 Approved for Development

- **Phase**: Implementation (Phase 4) - IN PROGRESS
- **Changes**: Story 1.2 marked ready for development by SM agent via story-ready workflow
- **Story Status Update**: Story 1.2 status changed from "Draft" → "Ready"
- **Queue Management**:
  - Story 1.2 moved from TODO → IN PROGRESS (approved for development)
  - Story 1.3 moved from BACKLOG → TODO (next story to draft)
- **Progress**: 61% (Story 1.2 approved, Story 1.3 queued for drafting)
- **Next Steps**:
  1. **Recommended:** Run `*story-context` workflow to generate Story 1.2 implementation context
  2. **Alternative:** Skip context and proceed directly to `*dev-story` workflow
- **User Action**: Eduardo approved Story 1.2 by running `*story-ready` command

### 2025-10-18 - Story 1.2 Drafted

- **Phase**: Implementation (Phase 4) - IN PROGRESS
- **Changes**: Story 1.2 (CI/CD Pipeline & Testing Infrastructure) drafted by SM agent via create-story workflow
- **Deliverable**: story-1.2.md - CI/CD Pipeline & Testing Infrastructure
- **Story Details**:
  - Epic 1, Story 1.2: CI/CD Pipeline & Testing Infrastructure
  - User story: "As a developer, I want automated testing and deployment pipelines, so that code quality is maintained and deployments are reliable"
  - 8 acceptance criteria from epics.md
  - 9 tasks with detailed subtasks (45+ subtasks total)
  - Dev Notes with CI/CD architecture, testing strategy, GitHub Actions workflows, Stryker config
  - All references cited from solution-architecture.md, tech-spec-epic-1.md, epics.md, and CLAUDE.md
- **Progress**: 60% (Phase 4 in progress, 2 stories drafted out of 100-117 total)
- **Next Step**: Review Story 1.2 draft, then run `*story-ready` to approve for development

### 2025-10-17 - Story 1.1 Context Generated

- Phase: Implementation (Phase 4) - IN PROGRESS
- Changes: Comprehensive implementation context generated for Story 1.1
- Deliverable: story-context-1.1.xml
- Context Contents:
  - User story fields: As a developer / I want / So that
  - 8 acceptance criteria with test ideas
  - 9 implementation tasks
  - 8 documentation artifacts from solution-architecture.md, tech-spec-epic-1.md, epics.md
  - Technology stack: Bun 1.3.0, TypeScript 5.9.3, Elysia 1.4.12, Turborepo 2.5.8
  - Architecture constraints: Clean Architecture, SOLID principles, constructor DI
  - Code quality standards: No any types, explicit return types, 80% mutation score
  - Naming conventions: kebab-case files, PascalCase classes, camelCase functions
  - Testing standards: Bun test runner, Stryker mutation testing, .test.ts files
- Story file updated: Context reference added to Dev Agent Record section
- Progress: 53% (context ready for DEV agent)
- Next Step: Load DEV agent and run `*dev-story` workflow to implement Story 1.1

### 2025-10-17 - Story 1.1 Approved for Development

- Phase: Implementation (Phase 4) - IN PROGRESS
- Changes: Story 1.1 marked ready for development by SM agent via story-ready workflow
- Story Status Update: Story 1.1 status changed from "Draft" → "Ready"
- Queue Management:
  - Story 1.1 moved from drafting queue → IN PROGRESS (approved for development)
  - Story 1.2 moved from BACKLOG → TODO (next story to draft)
- Progress: 52% (1 story ready, 1 story queued for drafting)
- Next Steps:
  1. **Recommended:** Run `*story-context` workflow to generate Story 1.1 implementation context
  2. **Alternative:** Skip context and proceed directly to `*dev-story` workflow
- User Approval: Eduardo approved Story 1.1 by running `*story-ready` command

### 2025-10-17 - Story 1.1 Drafted (Phase 4 Implementation Begins)

- Phase: Implementation (Phase 4) - STARTED
- Changes: First user story (Story 1.1) drafted and ready for review
- Deliverable: story-1.1.md - Project Foundation & Repository Setup
- Story Details:
  - Epic 1, Story 1.1: Project Foundation & Repository Setup
  - User story: "As a developer, I want a properly configured project repository with TypeScript, Bun, and Elysia, so that the team can begin development with consistent tooling and standards"
  - 8 acceptance criteria from epics.md
  - 9 tasks with detailed subtasks (45 subtasks total)
  - Dev Notes with architecture constraints, technology stack, and project structure
  - All references cited from solution-architecture.md, tech-spec-epic-1.md, and epics.md
- Progress: 51% (Phase 4 started, 1 story drafted out of 100-117 total)
- Next Step: Review Story 1.1 draft, then run `*story-ready` to approve for development

### 2025-10-17 - Solution Architecture & Tech Specs Complete

- Phase: Solutioning (Phase 3) - COMPLETE
- Changes: Complete solution architecture and all 9 epic tech specs created
- Deliverables:
  - solution-architecture.md: 1760+ lines, 40+ technologies (latest versions), 11 database entities, 30+ API routes, complete source tree, 13 ADRs
  - tech-spec-epic-1.md: MVP foundation (15 stories) - Infrastructure, database, TTS integration, CLI
  - tech-spec-epic-2.md: Multi-format processing (10 stories) - EPUB/PDF/Markdown parsers, batch processing
  - tech-spec-epic-3.md: Voice cloning (12-15 stories) - Sample upload, training pipeline, multi-voice support
  - tech-spec-epic-4.md: Web dashboard (15-18 stories) - Astro + React, authentication, project management UI
  - tech-spec-epic-5.md: Quality tools (8-10 stories) - Quality scoring, pronunciation dictionary, regeneration workflows
  - tech-spec-epic-6.md: API & webhooks (10-12 stories) - OAuth 2.0, REST API, TypeScript/Python SDKs
  - tech-spec-epic-7.md: AI direction (10-12 stories) - Genre classification, dialogue detection, emotional tone analysis
  - tech-spec-epic-8.md: Enterprise collaboration (12-15 stories) - Organizations, RBAC, approval workflows, SAML SSO
  - tech-spec-epic-9.md: Distribution (8-10 stories) - ACX, Audible, Spotify, Apple Books integrations
- Technology Stack Decisions: Bun 1.3.0, Elysia 1.4.12, Astro 5.14.5, PostgreSQL 17.4, Redis + BullMQ 5.61.0, Clean Architecture, Plugin pattern, Constructor DI
- Architecture Pattern: Modular monolith with plugin architecture (SOLID principles)
- Next Step: Begin Phase 4 Implementation with create-story workflow (SM agent)

### 2025-10-16 - UX Specification Workflow Complete

- Phase: Planning (Phase 2) - COMPLETE
- Changes: UX/UI Specification created with comprehensive user experience design
- Deliverables: ux-specification.md with 3 user personas, information architecture, 5 user flows (Mermaid diagrams), 12 component specifications, design system foundation (colors, typography, spacing), responsive design strategy, WCAG 2.1 AA accessibility requirements, interaction patterns, 3 detailed screen layouts
- Design System Decisions: Tailwind CSS + Headless UI + Radix UI, Inter font (UI), JetBrains Mono (code), Brazilian teal primary (#00a8a8), warm amber secondary (#ffb800)
- Next Step: Solution Architecture workflow (Phase 3: Solutioning)

### 2025-10-16 - PRD Workflow Complete

- Phase: Planning (Phase 2)
- Changes: PRD and epics.md created with comprehensive requirements, user journeys, and epic breakdown
- Deliverables: PRD.md (strategic), epics.md (tactical with 25 fully detailed stories in Epics 1-2, high-level summaries for Epics 3-9)
- Team Size Identified: 4 developers with parallelization strategy
- Next Step: UX/UI Specification workflow

### 2025-10-16 - System

- Phase: Workflow Definition
- Changes: Initial workflow status file created; project classified; workflow path planned

---

## Agent Usage Guide

### For SM (Scrum Master) Agent

**When to use this file:**

- Running `create-story` workflow → Read "TODO (Needs Drafting)" section for exact story to draft
- Running `story-ready` workflow → Update status file, move story from TODO → IN PROGRESS, move next story from BACKLOG → TODO
- Checking epic/story progress → Read "Epic/Story Summary" section

**Key fields to read:**

- `todo_story_id` → The story ID to draft (e.g., "1.1", "auth-feature-1")
- `todo_story_title` → The story title for drafting
- `todo_story_file` → The exact file path to create

**Key fields to update:**

- Move completed TODO story → IN PROGRESS section
- Move next BACKLOG story → TODO section
- Update story counts

**Workflows:**

1. `create-story` - Drafts the story in TODO section (user reviews it)
2. `story-ready` - After user approval, moves story TODO → IN PROGRESS

### For DEV (Developer) Agent

**When to use this file:**

- Running `dev-story` workflow → Read "IN PROGRESS (Approved for Development)" section for current story
- Running `story-approved` workflow → Update status file, move story from IN PROGRESS → DONE, move TODO story → IN PROGRESS, move BACKLOG story → TODO
- Checking what to work on → Read "IN PROGRESS" section

**Key fields to read:**

- `current_story_file` → The story to implement
- `current_story_context_file` → The context XML for this story
- `current_story_status` → Current status (Ready | In Review)

**Key fields to update:**

- Move completed IN PROGRESS story → DONE section with completion date
- Move TODO story → IN PROGRESS section
- Move next BACKLOG story → TODO section
- Update story counts and points

**Workflows:**

1. `dev-story` - Implements the story in IN PROGRESS section
2. `story-approved` - After user approval (DoD complete), moves story IN PROGRESS → DONE

### For PM (Product Manager) Agent

**When to use this file:**

- Checking overall progress → Read "Phase Completion Status"
- Planning next phase → Read "Overall Progress" percentage
- Course correction → Read "Decision Log" for context

**Key fields:**

- `progress_percentage` → Overall project progress
- `current_phase` → What phase are we in
- `artifacts` table → What's been generated

---

_This file serves as the **single source of truth** for project workflow status, epic/story tracking, and next actions. All BMM agents and workflows reference this document for coordination._

_Template Location: `bmad/bmm/workflows/_shared/bmm-workflow-status-template.md`_

_File Created: 2025-10-16_
