# ATDD Checklist - Epic 1, Story 1.2: CI/CD Pipeline & Testing Infrastructure

**Date:** 2025-10-18
**Author:** Eduardo Menoncello
**Primary Test Level:** E2E (Infrastructure Validation)

---

## Story Summary

As a developer, I want automated testing and deployment pipelines so that code quality is maintained and deployments are reliable.

This story focuses on establishing comprehensive CI/CD infrastructure including automated testing, code quality gates, and staging deployment workflows.

**Key Deliverables**:

- GitHub Actions CI workflow with quality gates
- Code coverage reporting (80% minimum)
- Mutation testing with Stryker (80% threshold per CLAUDE.md)
- Automated deployment to Cloud Run staging
- Commit message validation (Conventional Commits)

---

## Acceptance Criteria

1. ✅ GitHub Actions (or equivalent) workflow configured for CI
2. ✅ Automated testing runs on every pull request
3. ✅ Code coverage reporting integrated (80% minimum target)
4. ✅ Mutation testing configured with Stryker (thresholds per CLAUDE.md)
5. ✅ Automated linting and type checking in CI pipeline
6. ✅ Build process validated in CI environment
7. ✅ Deployment workflow configured for staging environment
8. ✅ Branch protection rules configured requiring CI to pass

---

## Failing Tests Created (RED Phase)

### E2E Infrastructure Tests (29 tests)

**File:** `tests/e2e/ci-infrastructure.spec.ts` (393 lines)

#### AC #1: GitHub Actions CI Workflow (7 tests - ALL RED)

- ❌ **Test:** should have ci.yml workflow file
  - **Status:** RED - File does not exist
  - **Verifies:** `.github/workflows/ci.yml` exists
  - tests/e2e/ci-infrastructure.spec.ts:20

- ❌ **Test:** should have valid YAML syntax in ci.yml
  - **Status:** RED - Cannot parse (file missing)
  - **Verifies:** Workflow file has valid YAML syntax
  - tests/e2e/ci-infrastructure.spec.ts:31

- ❌ **Test:** should configure pull_request trigger in ci.yml
  - **Status:** RED - Trigger not configured
  - **Verifies:** Workflow runs on PRs
  - tests/e2e/ci-infrastructure.spec.ts:43

- ❌ **Test:** should have lint job in ci.yml
  - **Status:** RED - Job missing
  - **Verifies:** Lint job configured
  - tests/e2e/ci-infrastructure.spec.ts:57

- ❌ **Test:** should have test job in ci.yml
  - **Status:** RED - Job missing
  - **Verifies:** Test job configured
  - tests/e2e/ci-infrastructure.spec.ts:70

- ❌ **Test:** should configure PostgreSQL service in test job
  - **Status:** RED - Service not configured
  - **Verifies:** PostgreSQL 17.4 service container
  - tests/e2e/ci-infrastructure.spec.ts:83

- ❌ **Test:** should configure Redis service in test job
  - **Status:** RED - Service not configured
  - **Verifies:** Redis 7 service container
  - tests/e2e/ci-infrastructure.spec.ts:96

#### AC #3: Code Coverage Reporting (5 tests - 4 RED, 1 GREEN)

- ❌ **Test:** should have c8 coverage tool installed
  - **Status:** RED - Package not installed
  - **Verifies:** c8 in devDependencies
  - tests/e2e/ci-infrastructure.spec.ts:111

- ✅ **Test:** should have test:coverage script in package.json
  - **Status:** GREEN - Script exists
  - **Verifies:** test:coverage script configured
  - tests/e2e/ci-infrastructure.spec.ts:123

- ❌ **Test:** should have .c8rc.json configuration file
  - **Status:** RED - File does not exist
  - **Verifies:** Coverage configuration file exists
  - tests/e2e/ci-infrastructure.spec.ts:135

- ❌ **Test:** should configure 80% coverage threshold in .c8rc.json
  - **Status:** RED - Threshold not configured
  - **Verifies:** 80% line coverage threshold
  - tests/e2e/ci-infrastructure.spec.ts:146

- ❌ **Test:** should upload coverage to Codecov in ci.yml
  - **Status:** RED - Upload step missing
  - **Verifies:** Codecov integration in CI
  - tests/e2e/ci-infrastructure.spec.ts:158

#### AC #4: Mutation Testing with Stryker (4 tests - 2 RED, 2 GREEN)

- ✅ **Test:** should have Stryker installed
  - **Status:** GREEN - Package exists
  - **Verifies:** @stryker-mutator/core installed
  - tests/e2e/ci-infrastructure.spec.ts:173

- ✅ **Test:** should have stryker.config.json configuration
  - **Status:** GREEN - File exists
  - **Verifies:** Stryker configuration file
  - tests/e2e/ci-infrastructure.spec.ts:185

- ❌ **Test:** should configure 80% mutation threshold (per CLAUDE.md)
  - **Status:** RED - Threshold is 50%, expected 80%
  - **Verifies:** Break threshold = 80% per CLAUDE.md
  - tests/e2e/ci-infrastructure.spec.ts:196

- ❌ **Test:** should have mutation-test job in ci.yml
  - **Status:** RED - Job missing
  - **Verifies:** Mutation testing in CI
  - tests/e2e/ci-infrastructure.spec.ts:208

#### AC #5: Linting and Type Checking (2 tests - ALL RED)

- ❌ **Test:** should run ESLint in lint job
  - **Status:** RED - Lint command missing
  - **Verifies:** ESLint runs in CI
  - tests/e2e/ci-infrastructure.spec.ts:224

- ❌ **Test:** should run TypeScript type checking in lint job
  - **Status:** RED - Typecheck command missing
  - **Verifies:** TypeScript checking in CI
  - tests/e2e/ci-infrastructure.spec.ts:238

#### AC #6: Build Process Validation (3 tests - ALL RED)

- ❌ **Test:** should have build job in ci.yml
  - **Status:** RED - Job missing
  - **Verifies:** Build job configured
  - tests/e2e/ci-infrastructure.spec.ts:254

- ❌ **Test:** should build Docker image in build job
  - **Status:** RED - Docker build missing
  - **Verifies:** Docker build command in CI
  - tests/e2e/ci-infrastructure.spec.ts:267

- ❌ **Test:** should have Dockerfile.api for API gateway
  - **Status:** RED - File does not exist
  - **Verifies:** Dockerfile.api exists
  - tests/e2e/ci-infrastructure.spec.ts:279

#### AC #7: Staging Deployment (4 tests - ALL RED)

- ❌ **Test:** should have deploy.yml workflow file
  - **Status:** RED - File does not exist
  - **Verifies:** `.github/workflows/deploy.yml` exists
  - tests/e2e/ci-infrastructure.spec.ts:292

- ❌ **Test:** should have valid YAML syntax in deploy.yml
  - **Status:** RED - Cannot parse (file missing)
  - **Verifies:** Deployment workflow valid YAML
  - tests/e2e/ci-infrastructure.spec.ts:303

- ❌ **Test:** should configure GCP authentication in deploy.yml
  - **Status:** RED - Auth not configured
  - **Verifies:** GCP Workload Identity setup
  - tests/e2e/ci-infrastructure.spec.ts:315

- ❌ **Test:** should deploy to Cloud Run in deploy.yml
  - **Status:** RED - Deployment step missing
  - **Verifies:** Cloud Run deployment configured
  - tests/e2e/ci-infrastructure.spec.ts:328

#### AC #2: Commitlint (4 tests - ALL RED)

- ❌ **Test:** should have commitlint installed
  - **Status:** RED - Package not installed
  - **Verifies:** @commitlint/cli in devDependencies
  - tests/e2e/ci-infrastructure.spec.ts:343

- ❌ **Test:** should have commitlint.config.js configuration
  - **Status:** RED - File does not exist
  - **Verifies:** Commitlint config file exists
  - tests/e2e/ci-infrastructure.spec.ts:355

- ❌ **Test:** should have commit-msg hook in .husky/
  - **Status:** RED - Hook file missing
  - **Verifies:** `.husky/commit-msg` exists
  - tests/e2e/ci-infrastructure.spec.ts:368

- ❌ **Test:** should run commitlint in commit-msg hook
  - **Status:** RED - Hook doesn't run commitlint
  - **Verifies:** Hook executes commitlint validation
  - tests/e2e/ci-infrastructure.spec.ts:379

---

## Implementation Checklist

### ✅ Task 1: Configure GitHub Actions CI Workflow (AC #1, #2, #5, #6)

**Tests to make green (7 tests):**

- ci-infrastructure.spec.ts:20 - ci.yml exists
- ci-infrastructure.spec.ts:31 - Valid YAML syntax
- ci-infrastructure.spec.ts:43 - PR trigger configured
- ci-infrastructure.spec.ts:57 - Lint job exists
- ci-infrastructure.spec.ts:70 - Test job exists
- ci-infrastructure.spec.ts:83 - PostgreSQL service
- ci-infrastructure.spec.ts:96 - Redis service

**Implementation tasks:**

- [ ] Create `.github/workflows/` directory
- [ ] Create `.github/workflows/ci.yml` with workflow structure
- [ ] Configure workflow triggers (pull_request, push to main/staging)
- [ ] Add lint job with:
  - [ ] Bun setup
  - [ ] `bun run lint` step
  - [ ] `bun run typecheck` step
- [ ] Add test job with:
  - [ ] PostgreSQL 17.4 service container with health checks
  - [ ] Redis 7 service container with health checks
  - [ ] `bun run test:unit` step
  - [ ] `bun run test:integration` step
- [ ] Add build job with Docker build validation
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #1"`
- [ ] ✅ All AC #1 tests pass (green phase)

**Estimated Effort:** 2-3 hours

---

### ✅ Task 2: Configure Code Coverage Reporting (AC #3)

**Tests to make green (4 tests):**

- ci-infrastructure.spec.ts:111 - c8 installed
- ci-infrastructure.spec.ts:135 - .c8rc.json exists
- ci-infrastructure.spec.ts:146 - 80% threshold configured
- ci-infrastructure.spec.ts:158 - Codecov upload step

**Implementation tasks:**

- [ ] Install c8 coverage tool: `bun add -d c8@10.1.3`
- [ ] Create `.c8rc.json` configuration file
- [ ] Configure thresholds in `.c8rc.json`:
  - [ ] `"lines": 80`
  - [ ] `"branches": 75`
  - [ ] `"functions": 85`
  - [ ] `"statements": 80`
- [ ] Add coverage upload step to test job in ci.yml:
  - [ ] Add `codecov/codecov-action@v4` step
  - [ ] Configure `CODECOV_TOKEN` secret
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #3"`
- [ ] ✅ All AC #3 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### ✅ Task 3: Configure Mutation Testing with Stryker (AC #4)

**Tests to make green (2 tests):**

- ci-infrastructure.spec.ts:196 - 80% threshold (currently 50%)
- ci-infrastructure.spec.ts:208 - mutation-test job in CI

**Implementation tasks:**

- [ ] Update `stryker.config.json` thresholds:
  - [ ] Change `"break": 50` to `"break": 80`
  - [ ] Change `"high": 60` to `"high": 80`
  - [ ] Change `"low": 40` to `"low": 70`
- [ ] Add mutation-test job to ci.yml:
  - [ ] Bun setup
  - [ ] `bun run test:mutation` step
  - [ ] Threshold enforcement script
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #4"`
- [ ] ✅ All AC #4 tests pass (green phase)

**Critical:** Per CLAUDE.md, NEVER reduce mutation thresholds. If mutation score is below 80%, improve tests instead.

**Estimated Effort:** 1 hour

---

### ✅ Task 4: Validate Linting and Type Checking in CI (AC #5)

**Tests to make green (2 tests):**

- ci-infrastructure.spec.ts:224 - ESLint in lint job
- ci-infrastructure.spec.ts:238 - TypeScript checking in lint job

**Implementation tasks:**

- [ ] Verify lint job runs `bun run lint` (should be done in Task 1)
- [ ] Verify lint job runs `bun run typecheck` (should be done in Task 1)
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #5"`
- [ ] ✅ All AC #5 tests pass (green phase)

**Estimated Effort:** 15 minutes (validation only)

---

### ✅ Task 5: Configure Docker Build Process (AC #6)

**Tests to make green (3 tests):**

- ci-infrastructure.spec.ts:254 - build job exists
- ci-infrastructure.spec.ts:267 - Docker build command
- ci-infrastructure.spec.ts:279 - Dockerfile.api exists

**Implementation tasks:**

- [ ] Create `Dockerfile.api` for API gateway service
  - [ ] Multi-stage build (build + runtime)
  - [ ] Bun runtime base image
  - [ ] Copy dependencies and build artifacts
  - [ ] Expose port 3000
  - [ ] Health check configured
- [ ] Verify build job in ci.yml includes Docker build (should be done in Task 1)
- [ ] Add Docker build step: `docker build -t falador-api:test -f Dockerfile.api .`
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #6"`
- [ ] ✅ All AC #6 tests pass (green phase)

**Estimated Effort:** 1-2 hours

---

### ✅ Task 6: Configure Staging Deployment Workflow (AC #7)

**Tests to make green (4 tests):**

- ci-infrastructure.spec.ts:292 - deploy.yml exists
- ci-infrastructure.spec.ts:303 - Valid YAML syntax
- ci-infrastructure.spec.ts:315 - GCP authentication
- ci-infrastructure.spec.ts:328 - Cloud Run deployment

**Implementation tasks:**

- [ ] Create `.github/workflows/deploy.yml` with deployment structure
- [ ] Configure workflow trigger (push to staging branch)
- [ ] Add GCP authentication step:
  - [ ] Use `google-github-actions/auth@v2`
  - [ ] Configure Workload Identity Federation
  - [ ] Set up service account with Cloud Run permissions
- [ ] Add Docker build and push step:
  - [ ] Build image with git SHA tag
  - [ ] Push to Google Container Registry (GCR)
- [ ] Add Cloud Run deployment step:
  - [ ] Deploy api-gateway service
  - [ ] Configure environment variables
  - [ ] Set traffic to 100% on new revision
- [ ] Add smoke test step:
  - [ ] Curl health endpoint
  - [ ] Verify 200 response
- [ ] Configure GitHub repository secrets:
  - [ ] `GCP_PROJECT_ID`
  - [ ] `GCP_SERVICE_ACCOUNT`
  - [ ] `WORKLOAD_IDENTITY_PROVIDER`
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #7"`
- [ ] ✅ All AC #7 tests pass (green phase)

**Estimated Effort:** 2-3 hours

---

### ✅ Task 7: Configure Commitlint (AC #2)

**Tests to make green (4 tests):**

- ci-infrastructure.spec.ts:343 - commitlint installed
- ci-infrastructure.spec.ts:355 - commitlint.config.js exists
- ci-infrastructure.spec.ts:368 - commit-msg hook exists
- ci-infrastructure.spec.ts:379 - Hook runs commitlint

**Implementation tasks:**

- [ ] Install commitlint dependencies:
  - [ ] `bun add -d @commitlint/cli@latest`
  - [ ] `bun add -d @commitlint/config-conventional@latest`
- [ ] Create `commitlint.config.js` (or `.cjs` for ESM)
- [ ] Configure conventional commit rules:
  ```javascript
  export default {
    extends: ['@commitlint/config-conventional'],
  };
  ```
- [ ] Create `.husky/commit-msg` hook file
- [ ] Add commitlint command to hook:
  ```bash
  bunx --no -- commitlint --edit ${1}
  ```
- [ ] Make hook executable: `chmod +x .husky/commit-msg`
- [ ] Test hook with valid and invalid commit messages:
  - [ ] Valid: `feat(api): add health endpoint`
  - [ ] Invalid: `wip stuff` (should fail)
- [ ] Run test: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #2"`
- [ ] ✅ All AC #2 tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### ✅ Task 8: Configure Branch Protection Rules (AC #8)

**Manual configuration (no automated tests):**

- [ ] Navigate to GitHub repository settings
- [ ] Go to Branches → Add rule for `main` branch
- [ ] Configure protection settings:
  - [ ] Require pull request reviews before merging (1 approval minimum)
  - [ ] Require status checks to pass before merging
  - [ ] Add required status checks:
    - [ ] `lint` (from CI workflow)
    - [ ] `test` (from CI workflow)
    - [ ] `mutation-test` (from CI workflow)
    - [ ] `build` (from CI workflow)
  - [ ] Require branches to be up to date before merging
  - [ ] Do not allow bypassing the above settings
- [ ] Test protection by creating a test PR:
  - [ ] Push branch with failing tests
  - [ ] Verify merge button is blocked
  - [ ] Fix tests and push again
  - [ ] Verify merge button becomes available

**Estimated Effort:** 15 minutes

---

### ✅ Task 9: Validate Complete CI/CD Pipeline (All ACs)

**Final integration test:**

- [ ] Create test feature branch
- [ ] Make small change (e.g., add comment to code)
- [ ] Commit with conventional commit format:
  - [ ] `feat(test): validate CI/CD pipeline`
- [ ] Push branch to remote
- [ ] Create pull request
- [ ] Verify all CI jobs run and pass:
  - [ ] ✅ lint job passes
  - [ ] ✅ test job passes
  - [ ] ✅ mutation-test job passes
  - [ ] ✅ build job passes
- [ ] Verify coverage report uploaded to Codecov
- [ ] Verify mutation score meets 80% threshold
- [ ] Verify branch protection blocks merge if CI fails
- [ ] Merge PR to staging branch
- [ ] Verify deployment workflow triggers
- [ ] Verify staging Cloud Run service updates
- [ ] Verify smoke test passes (health endpoint returns 200)
- [ ] Run full test suite: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts`
- [ ] ✅ All 29 tests pass (green phase complete)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all CI infrastructure tests
bun run test:e2e tests/e2e/ci-infrastructure.spec.ts

# Run tests for specific acceptance criterion
bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #1"
bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="AC #3"
bun run test:e2e tests/e2e/ci-infrastructure.spec.ts --grep="mutation"

# Run in headed mode (see browser - not applicable for API tests)
bun run test:e2e:headed tests/e2e/ci-infrastructure.spec.ts

# Debug specific test
bun run test:e2e:debug tests/e2e/ci-infrastructure.spec.ts:20

# View test report
bun run test:e2e:report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 29 tests written and failing
- ✅ Tests verify infrastructure configuration (not user behavior)
- ✅ Fixtures and factories not needed (infrastructure tests)
- ✅ Implementation checklist created with granular tasks

**Verification:**

- All tests run and fail as expected
- Failure messages are clear (missing files, wrong configuration)
- Tests fail due to missing implementation, not test bugs

**Test execution output:**

```
29 tests total
26 failing (RED - expected)
3 passing (existing dependencies: Stryker, test:coverage script, stryker.config.json)
```

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one task** from implementation checklist (start with Task 1 or 7)
2. **Read the tests** for that task to understand expected configuration
3. **Implement minimal configuration** to make those tests pass
4. **Run the tests** to verify they now pass (green)
5. **Check off the task** in implementation checklist
6. **Move to next task** and repeat

**Key Principles:**

- One task at a time (don't try to implement everything at once)
- Minimal implementation (follow test expectations exactly)
- Run tests frequently (immediate feedback after each change)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Update `docs/bmm-workflow-status.md` to IN PROGRESS status

**Recommended Order:**

1. Task 7 (Commitlint) - Quick win, useful immediately
2. Task 1 (GitHub Actions CI) - Core infrastructure
3. Task 3 (Stryker thresholds) - Quick fix
4. Task 2 (Coverage reporting) - Build on CI
5. Task 5 (Docker build) - Required for deployment
6. Task 6 (Deployment workflow) - Final piece
7. Task 8 (Branch protection) - Manual configuration
8. Task 9 (Integration validation) - Final verification

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (29/29 green - green phase complete)
2. **Review CI workflow for quality**:
   - Are jobs running in parallel where possible?
   - Are timeouts configured appropriately?
   - Is caching used to speed up builds?
3. **Review configuration files**:
   - Are thresholds documented with rationale?
   - Are comments explaining non-obvious configuration?
   - Is configuration DRY (not duplicated)?
4. **Optimize workflow execution time**:
   - Parallelize independent jobs
   - Use GitHub Actions cache for node_modules
   - Use build caching for Docker images
5. **Ensure tests still pass** after each refactor
6. **Update documentation** if workflow changes

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test expectations (only implementation)

**Completion:**

- All 29 tests pass
- CI/CD pipeline executes efficiently (<5 minutes)
- Configuration files are well-documented
- No duplicated configuration
- Ready for production use

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts`
3. **Begin implementation** using implementation checklist as guide (Tasks 1-9)
4. **Work one task at a time** (red → green for each task)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor configuration for quality
7. **When refactoring complete**, update `docs/bmm-workflow-status.md` to DONE

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun run test:e2e tests/e2e/ci-infrastructure.spec.ts`

**Results Summary:**

```
Running 29 tests using 6 workers

✓  12 [e2e] › Story 1.2 › AC #3 › should have test:coverage script in package.json (6ms)
✓  16 [e2e] › Story 1.2 › AC #4 › should have Stryker installed (3ms)
✓  15 [e2e] › Story 1.2 › AC #4 › should have stryker.config.json configuration (6ms)
✘  [All other 26 tests failed as expected]

26 failed
  [e2e] › ci-infrastructure.spec.ts:20 › should have ci.yml workflow file
  [e2e] › ci-infrastructure.spec.ts:31 › should have valid YAML syntax in ci.yml
  [e2e] › ci-infrastructure.spec.ts:43 › should configure pull_request trigger
  ... [23 more failures]
3 passed (10.5s)
```

**Expected Failure Reasons:**

1. `.github/workflows/ci.yml` - ENOENT (file does not exist)
2. `.github/workflows/deploy.yml` - ENOENT (file does not exist)
3. `c8` package - Not installed
4. `.c8rc.json` - ENOENT (file does not exist)
5. `stryker.config.json` - Threshold 50%, expected 80%
6. `Dockerfile.api` - ENOENT (file does not exist)
7. `@commitlint/cli` - Not installed
8. `commitlint.config.js` - ENOENT (file does not exist)
9. `.husky/commit-msg` - ENOENT (file does not exist)

**Status:** ✅ RED phase verified - Tests fail for correct reasons (missing implementation)

---

## Notes

### Infrastructure as Code Testing

This story uses ATDD for **Infrastructure as Code** (IaC), not traditional user features. Tests validate:

- Configuration file existence and structure
- YAML syntax correctness
- Required packages installed
- Thresholds and settings configured correctly

This is a different pattern from typical E2E tests that validate user workflows.

### No Data Factories or Fixtures Needed

Because these are infrastructure validation tests (file system checks, YAML parsing), we don't need:

- Data factories (no dynamic test data needed)
- Test fixtures (no database or API setup needed)
- Mock services (testing configuration, not runtime behavior)

### Critical: Mutation Testing Threshold

Per `~/.claude/CLAUDE.md`:

- **NEVER reduce mutation testing thresholds**
- If mutation score is below 80%, **improve tests** instead
- Lowering thresholds masks quality issues and creates technical debt
- Only exception: Document with clear justification (e.g., stub code awaiting implementation)

Current state: `stryker.config.json` has `"break": 50` → **MUST change to 80**

### Codecov Integration (Optional)

Coverage upload to Codecov is optional for local development:

- Required in CI for visibility and tracking
- Can be skipped locally (coverage reports still generated)
- Requires `CODECOV_TOKEN` secret in GitHub repository settings

---

## Knowledge Base References Applied

This ATDD workflow consulted the following patterns:

- **fixture-architecture.md** - Not applicable (no dynamic fixtures needed for IaC tests)
- **data-factories.md** - Not applicable (no test data generation for file validation)
- **test-quality.md** - Test design principles (explicit assertions, determinism)
- **network-first.md** - Not applicable (no network requests in infrastructure tests)
- **playwright-config.md** - Timeout standards (used playwright.config.ts settings)

Infrastructure testing uses a simplified ATDD approach focused on configuration validation rather than behavioral testing.

---

**Generated by BMad TEA Agent** - 2025-10-18
