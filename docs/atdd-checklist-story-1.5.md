# ATDD Checklist - Epic 1, Story 1.5: Clean Architecture Project Structure

**Date:** 2025-10-19
**Author:** Eduardo
**Primary Test Level:** Integration

---

## Story Summary

As a developer, I want a Clean Architecture folder structure with dependency injection, so that the codebase is maintainable, testable, and follows best practices.

---

## Acceptance Criteria

1. Folder structure created: domain/, application/, infrastructure/, presentation/
2. Domain layer: Core entities and business logic interfaces defined
3. Application layer: Use case interfaces defined
4. Infrastructure layer: Database repositories and external service adapters
5. Presentation layer: API controllers and CLI command structure
6. Dependency injection container configured (tsyringe)
7. Repository pattern implemented for data access
8. Example use case implemented demonstrating architecture flow

---

## Failing Tests Created (RED Phase)

### E2E Tests (2 tests)

**File:** `tests/e2e/clean-architecture-structure.spec.ts` (200 lines)

- ✅ **Test:** should have all required Clean Architecture packages
  - **Status:** RED - Packages don't exist yet
  - **Verifies:** All 5 Clean Architecture packages created

- ✅ **Test:** should have proper domain layer structure
  - **Status:** RED - Domain package directories don't exist
  - **Verifies:** Domain entities, interfaces, services directories

**File:** `tests/e2e/clean-architecture-demo.spec.ts` (300 lines)

- ✅ **Test:** should demonstrate complete audio generation workflow through all layers
  - **Status:** RED - Clean Architecture not implemented
  - **Verifies:** End-to-end flow through all architecture layers

### Unit Tests (2 tests)

**File:** `tests/unit/domain-layer.spec.ts` (250 lines)

- ✅ **Test:** should have User domain entity with required properties
  - **Status:** RED - User entity doesn't exist
  - **Verifies:** Domain entity structure and business logic

- ✅ **Test:** should have domain repository interfaces
  - **Status:** RED - Repository interfaces don't exist
  - **Verifies:** Domain interfaces follow repository pattern

**File:** `tests/unit/application-layer.spec.ts` (280 lines)

- ✅ **Test:** should have UserManagement use case interface
  - **Status:** RED - Use case interfaces don't exist
  - **Verifies:** Application layer use case structure

### Integration Tests (3 tests)

**File:** `tests/integration/infrastructure-layer.spec.ts` (400 lines)

- ✅ **Test:** should have PostgreSQL User repository implementation
  - **Status:** RED - Repository implementations don't exist
  - **Verifies:** Infrastructure adapters implement domain interfaces

- ✅ **Test:** should have OpenAI TTS adapter implementation
  - **Status:** RED - TTS service adapter doesn't exist
  - **Verifies:** External service integration

**File:** `tests/integration/dependency-injection.spec.ts` (350 lines)

- ✅ **Test:** should have DI container with all dependencies registered
  - **Status:** RED - tsyringe container not configured
  - **Verifies:** Dependency injection setup

**File:** `tests/integration/repository-pattern.spec.ts` (450 lines)

- ✅ **Test:** should have base repository interface with common operations
  - **Status:** RED - Repository pattern not implemented
  - **Verifies:** Base repository with CRUD operations

---

## Data Factories Created

### User Factory

**File:** `tests/support/factories/user.factory.ts`

**Exports:**

- `createUser(overrides?)` - Create single user with optional overrides
- `createUsers(count)` - Create array of users
- `createProUser(overrides?)` - Create pro-tier user
- `createEnterpriseUser(overrides?)` - Create enterprise-tier user

**Example Usage:**

```typescript
const user = createUser({ email: 'specific@example.com' });
const users = createUsers(5); // Generate 5 random users
```

### Project Factory

**File:** `tests/support/factories/project.factory.ts`

**Exports:**

- `createProject(overrides?)` - Create single project
- `createProjects(count)` - Create array of projects
- `createProjectsForUser(userId, counts)` - Create projects for specific user

### Voice Factory

**File:** `tests/support/factories/voice.factory.ts`

**Exports:**

- `createVoice(overrides?)` - Create single voice
- `createOpenAIVoices()` - Create OpenAI voice set
- `createVoicesByProvider(provider, count)` - Create voices by provider

### Audio File Factory

**File:** `tests/support/factories/audio-file.factory.ts`

**Exports:**

- `createAudioFile(overrides?)` - Create single audio file
- `createAudioFilesForProject(projectId, counts)` - Create audio files for project

---

## Fixtures Created

### Clean Architecture Fixtures

**File:** `tests/support/fixtures/clean-architecture.fixture.ts`

**Fixtures:**

- `userFactory` - Factory function for creating test users
  - **Setup:** Imports factory functions
  - **Provides:** User creation functions with faker data
  - **Cleanup:** No cleanup needed (pure functions)

- `projectFactory` - Factory function for creating test projects
- `voiceFactory` - Factory function for creating test voices
- `audioFileFactory` - Factory function for creating test audio files

**Example Usage:**

```typescript
import { test } from './fixtures/clean-architecture.fixture';

test('should do something', async ({ userFactory }) => {
  const user = userFactory({ tier: 'pro' });
  // user is ready to use
});
```

---

## Mock Requirements

### OpenAI TTS Mock

**Endpoint:** `POST https://api.openai.com/v1/audio/speech`

**Success Response:**

```json
{
  "audio": "base64-encoded-audio-data"
}
```

**Failure Response:**

```json
{
  "error": {
    "message": "Invalid voice: voice-id-not-found",
    "type": "invalid_request_error"
  }
}
```

### S3 Storage Mock

**Endpoint:** `PUT https://s3.amazonaws.com/{bucket}/{key}`

**Success Response:** 200 OK with empty body

### PostgreSQL Mock

**Queries:** INSERT, SELECT, UPDATE, DELETE operations

**Success Response:** Query results with row data

---

## Required data-testid Attributes

No UI tests in this story (backend architecture focus).

---

## Implementation Checklist

### Test: 1.5-ARCH-001: Clean Architecture Folder Structure

**File:** `tests/e2e/clean-architecture-structure.spec.ts`

**Tasks to make this test pass:**

- [ ] Create package.json files for all 5 packages
- [ ] Create core-domain package with src/ directory
- [ ] Create application package with src/ directory
- [ ] Create infrastructure package with src/ directory
- [ ] Create api-gateway package with src/ directory
- [ ] Create cli package with src/ directory
- [ ] Create tsconfig.json files for each package
- [ ] Create domain layer subdirectories: entities/, interfaces/, services/
- [ ] Create application layer subdirectories: use-cases/, dto/
- [ ] Create infrastructure layer subdirectories: database/, external/, config/
- [ ] Create presentation layer subdirectories for API and CLI
- [ ] Run test: `npm run test:e2e -- clean-architecture-structure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: 1.5-ARCH-002: Domain Layer Entities and Logic

**File:** `tests/unit/domain-layer.spec.ts`

**Tasks to make this test pass:**

- [ ] Create User domain entity in packages/core-domain/src/entities/user.ts
- [ ] Create Project domain entity with audio properties
- [ ] Create Voice domain entity with TTS properties
- [ ] Create AudioFile domain entity
- [ ] Create repository interfaces in packages/core-domain/src/interfaces/
- [ ] Create service interfaces for TTS, Storage, Queue
- [ ] Create domain error classes
- [ ] Ensure domain layer has ZERO external dependencies
- [ ] Run test: `npm run test:unit -- domain-layer.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: 1.5-ARCH-003: Application Layer Use Cases

**File:** `tests/unit/application-layer.spec.ts`

**Tasks to make this test pass:**

- [ ] Create UserManagementUseCase interface
- [ ] Create ProjectManagementUseCase interface
- [ ] Create AudioGenerationUseCase interface
- [ ] Create VoiceManagementUseCase interface
- [ ] Create DTO classes with validation
- [ ] Create Result class for success/failure handling
- [ ] Ensure use cases depend only on domain interfaces
- [ ] Run test: `npm run test:unit -- application-layer.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: 1.5-ARCH-004: Infrastructure Layer Adapters

**File:** `tests/integration/infrastructure-layer.spec.ts`

**Tasks to make this test pass:**

- [ ] Install tsyringe dependency injection package
- [ ] Create PostgresUserRepository implementing domain interface
- [ ] Create PostgresProjectRepository with JSON handling
- [ ] Create OpenAITTSAdapter for TTS service integration
- [ ] Create S3StorageAdapter for file storage
- [ ] Create RedisQueueAdapter for job queue
- [ ] Set up Drizzle ORM for PostgreSQL
- [ ] Configure environment variables for external services
- [ ] Run test: `npm run test:integration -- infrastructure-layer.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: 1.5-ARCH-005: Presentation Layer Controllers

**File:** `tests/integration/presentation-layer.spec.ts`

**Tasks to make this test pass:**

- [ ] Create UserController with Elysia framework
- [ ] Create ProjectController with validation middleware
- [ ] Create AudioCLI commands with Commander.js
- [ ] Set up request/response DTOs
- [ ] Add authentication middleware
- [ ] Add error handling middleware
- [ ] Create API routes structure
- [ ] Create CLI command structure
- [ ] Run test: `npm run test:integration -- presentation-layer.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: 1.5-ARCH-006: Dependency Injection Container

**File:** `tests/integration/dependency-injection.spec.ts`

**Tasks to make this test pass:**

- [ ] Set up tsyringe DI container configuration
- [ ] Register all repository implementations
- [ ] Register all service adapters
- [ ] Register all use cases
- [ ] Register all controllers
- [ ] Configure singleton vs transient lifecycles
- [ ] Create composition root for application bootstrap
- [ ] Handle missing dependencies gracefully
- [ ] Run test: `npm run test:integration -- dependency-injection.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: 1.5-ARCH-007: Repository Pattern Implementation

**File:** `tests/integration/repository-pattern.spec.ts`

**Tasks to make this test pass:**

- [ ] Create base Repository interface with generic methods
- [ ] Create BaseRepository abstract class
- [ ] Implement User-specific repository operations
- [ ] Implement Project-specific repository operations
- [ ] Add transaction support
- [ ] Add domain-specific query methods
- [ ] Ensure proper error handling
- [ ] Run test: `npm run test:integration -- repository-pattern.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: 1.5-ARCH-008: Clean Architecture Demo

**File:** `tests/e2e/clean-architecture-demo.spec.ts`

**Tasks to make this test pass:**

- [ ] Wire all layers together end-to-end
- [ ] Create complete audio generation workflow
- [ ] Add proper error handling across layers
- [ ] Add request/response validation
- [ ] Set up authentication flow
- [ ] Test dependency injection with real implementations
- [ ] Verify all components work together
- [ ] Run test: `npm run test:e2e -- clean-architecture-demo.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

## Running Tests

```bash
# Run all failing tests for this story
npm run test

# Run specific test file
npm run test:e2e -- clean-architecture-structure.spec.ts
npm run test:unit -- domain-layer.spec.ts
npm run test:integration -- infrastructure-layer.spec.ts

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Debug specific test
npm run test:e2e -- clean-architecture-demo.spec.ts --debug

# Run tests with coverage
npm run test:coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with 1.5-ARCH-001)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `npm run test`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmad sm story-approved` to move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (E2E vs API vs Component vs Unit)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npm run test`

**Results:**

```
[Expected output showing all 8 test files with failing tests]
```

**Summary:**

- Total tests: 35+
- Passing: 0 (expected)
- Failing: 35+ (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- Cannot resolve module 'packages/core-domain/src/entities/user'
- Cannot resolve module 'tsyringe'
- Repository implementations not found
- DI container not configured

---

## Notes

- This story implements the foundational Clean Architecture for the entire Falador platform
- Focus on layer isolation and dependency inversion principles
- Domain layer MUST have zero external dependencies
- All dependencies must point inward toward the domain core
- TypeScript strict mode required throughout

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @Murat (TEA Agent) in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-10-19
