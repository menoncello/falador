# ATDD Implementation Checklist - Story 1.3

**Story**: Docker Containerization & Local Development
**Primary Test Level**: E2E Tests
**Status**: RED Phase (Tests Written, Failing)

---

## Story Summary

As a developer, I want containerized development and deployment environments, so that the application runs consistently across all environments.

**Acceptance Criteria**:

1. Dockerfile created for application with multi-stage build
2. Docker-compose.yml configured for local development (app + PostgreSQL)
3. Development database initialization scripts included
4. Environment variable configuration documented and templated (.env.example)
5. Docker container builds successfully and runs application
6. Hot reload configured for local development
7. Docker images optimized for size and build speed
8. Documentation updated with Docker setup instructions

---

## Test Files Created

### E2E Tests (Primary)

- **File**: `tests/e2e/docker-containerization.spec.ts`
- **Tests**: 11 E2E tests covering all acceptance criteria
- **Focus**: Container operations, build processes, compose orchestration

### Supporting Infrastructure

- **Docker Fixture**: `tests/support/fixtures/docker.fixture.ts`
- **Docker Factory**: `tests/support/fixtures/factories/docker-factory.ts`

---

## Failing Tests Created

### Core Docker Infrastructure Tests

| Test ID        | Test                                                 | Coverage | Expected Failure                              |
| -------------- | ---------------------------------------------------- | -------- | --------------------------------------------- |
| 1.3-DOCKER-001 | should have Dockerfile with multi-stage build        | AC #1    | Dockerfile missing or lacks multi-stage build |
| 1.3-DOCKER-002 | should have docker-compose.yml for local development | AC #2    | docker-compose.yml missing                    |
| 1.3-DOCKER-003 | should configure PostgreSQL in docker-compose        | AC #2    | PostgreSQL service missing                    |
| 1.3-DOCKER-004 | should have .env.example template                    | AC #4    | .env.example missing                          |

### Build and Runtime Tests

| Test ID        | Test                                        | Coverage | Expected Failure                            |
| -------------- | ------------------------------------------- | -------- | ------------------------------------------- |
| 1.3-DOCKER-005 | Docker container should build successfully  | AC #5    | Docker build fails (implementation missing) |
| 1.3-DOCKER-006 | Docker container should run application     | AC #5    | Container fails to start or run             |
| 1.3-DOCKER-007 | should configure hot reload for development | AC #6    | Hot reload not configured                   |

### Optimization and Documentation Tests

| Test ID        | Test                                        | Coverage | Expected Failure                |
| -------------- | ------------------------------------------- | -------- | ------------------------------- |
| 1.3-DOCKER-008 | should optimize Docker images for size      | AC #7    | No optimization implemented     |
| 1.3-DOCKER-009 | docker-compose should start all services    | AC #2    | Services fail to start together |
| 1.3-DOCKER-010 | should have database initialization scripts | AC #3    | Init scripts missing            |
| 1.3-DOCKER-011 | should document Docker setup in README      | AC #8    | Documentation missing           |

---

## Implementation Checklist

### Task 1: Create Dockerfile (AC: 1, 5, 7)

#### Test: 1.3-DOCKER-001 - Multi-stage Build Dockerfile

- [ ] Create `Dockerfile` in project root
- [ ] Implement multi-stage build (builder → runtime)
- [ ] Use `oven/bun:slim` or `oven/bun:alpine` as base image
- [ ] Add build stage with TypeScript compilation
- [ ] Add runtime stage with minimal dependencies
- [ ] Add `data-testid="dockerfile-build-stage"` for build validation
- [ ] Run test: `npm run test:e2e -- docker-containerization.spec.ts`
- [ ] ✅ Test passes (green phase)

#### Test: 1.3-DOCKER-005 - Container Builds Successfully

- [ ] Ensure Dockerfile syntax is valid
- [ ] Add all necessary dependencies in build stage
- [ ] Include package.json, tsconfig.json, source files
- [ ] Add proper working directory (`WORKDIR /app`)
- [ ] Add exposed port (EXPOSE 3000)
- [ ] Add proper CMD instruction for startup
- [ ] Run test: `docker build -t falador-test .`
- [ ] ✅ Test passes (green phase)

#### Test: 1.3-DOCKER-006 - Container Runs Application

- [ ] Ensure application starts properly in container
- [ ] Add health check endpoint to application
- [ ] Verify application binds to correct port (3000)
- [ ] Test container execution with `docker run`
- [ ] ✅ Test passes (green phase)

#### Test: 1.3-DOCKER-008 - Docker Image Optimization

- [ ] Remove build dependencies from final image
- [ ] Use `.dockerignore` to exclude unnecessary files
- [ ] Minimize layers (combine RUN commands)
- [ ] Use specific image tags (not `latest`)
- [ ] Leverage Docker layer caching
- [ ] ✅ Test passes (green phase)

### Task 2: Configure Docker Compose (AC: 2, 3, 6)

#### Test: 1.3-DOCKER-002 - Docker Compose Configuration

- [ ] Create `docker-compose.yml` in project root
- [ ] Define `app` service with build context
- [ ] Configure service networking
- [ ] Add proper environment variable handling
- [ ] Run test: Verify file exists and structure
- [ ] ✅ Test passes (green phase)

#### Test: 1.3-DOCKER-003 - PostgreSQL Service Configuration

- [ ] Add `postgres` service to docker-compose.yml
- [ ] Use `postgres:17.4` image
- [ ] Configure database environment variables:
  - `POSTGRES_USER=falador`
  - `POSTGRES_PASSWORD=falador_dev`
  - `POSTGRES_DB=falador`
- [ ] Add persistent volume for database data
- [ ] Add health check for PostgreSQL
- [ ] ✅ Test passes (green phase)

#### Test: 1.3-DOCKER-009 - All Services Start Together

- [ ] Ensure service dependencies are correctly defined
- [ ] Add proper depends_on relationships
- [ ] Configure network connectivity between services
- [ ] Add health checks for service readiness
- [ ] Run test: `docker-compose up -d`
- [ ] ✅ Test passes (green phase)

#### Test: 1.3-DOCKER-007 - Hot Reload Configuration

- [ ] Add volume mounts for source code:
  - `.:/app` - Source code
  - `/app/node_modules` - Node modules (isolated)
- [ ] Configure application to watch for file changes
- [ ] Add development command with `--watch` flag
- [ ] Test file changes trigger rebuild/restart
- [ ] ✅ Test passes (green phase)

### Task 3: Environment Configuration (AC: 4)

#### Test: 1.3-DOCKER-004 - Environment Variable Template

- [ ] Create `.env.example` file in project root
- [ ] Include database connection variables:
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/falador`
  - `POSTGRES_USER=falador`
  - `POSTGRES_PASSWORD=falador_dev`
  - `POSTGRES_DB=falador`
- [ ] Add Redis connection variables:
  - `REDIS_URL=redis://localhost:6379`
- [ ] Add application configuration:
  - `NODE_ENV=development`
  - `LOG_LEVEL=debug`
  - `PORT=3000`
- [ ] Add Docker-specific variables:
  - `BUILDKIT_INLINE_CACHE=1`
  - `DOCKER_BUILDKIT=1`
- [ ] Document variable usage in comments
- [ ] ✅ Test passes (green phase)

### Task 4: Database Initialization (AC: 3)

#### Test: 1.3-DOCKER-010 - Database Initialization Scripts

- [ ] Create `scripts/docker/` directory
- [ ] Add database initialization script:
  - `01-init-database.sql` - Create initial schema
  - `02-migrate.sql` - Run migrations
  - `03-seed.sql` - Add seed data
- [ ] Mount scripts directory to PostgreSQL init directory
  - `./scripts/docker:/docker-entrypoint-initdb.d`
- [ ] Test database initialization on container startup
- [ ] ✅ Test passes (green phase)

### Task 5: Documentation (AC: 8)

#### Test: 1.3-DOCKER-011 - Docker Documentation

- [ ] Add "Docker Setup" section to README.md
- [ ] Include prerequisites (Docker, Docker Compose)
- [ ] Provide step-by-step setup instructions:
  1. Clone repository
  2. Copy `.env.example` to `.env`
  3. Configure environment variables
  4. Run `docker-compose up -d`
  5. Access application at `http://localhost:3000`
- [ ] Add development workflow:
  - Hot reload instructions
  - Viewing logs: `docker-compose logs -f`
  - Stopping services: `docker-compose down`
- [ ] Add troubleshooting section:
  - Common issues and solutions
  - Port conflicts
  - Permission issues
- [ ] ✅ Test passes (green phase)

---

## Red-Green-Refactor Workflow

### RED Phase (Complete - TEA Responsibility)

- ✅ All tests written and failing
- ✅ Test infrastructure created (fixtures, factories)
- ✅ Acceptance criteria mapped to tests
- ✅ Tests validate Docker containerization requirements

### GREEN Phase (DEV Responsibility)

**Priority 1 - Core Infrastructure**:

1. Implement `Dockerfile` with multi-stage build
2. Create `docker-compose.yml` with app and PostgreSQL
3. Add `.env.example` template
4. Verify container builds and runs

**Priority 2 - Development Experience**: 5. Configure hot reload with volume mounts 6. Add database initialization scripts 7. Optimize Docker image size

**Priority 3 - Documentation**: 8. Update README with Docker setup instructions

**Implementation Process**:

1. Pick one failing test
2. Implement minimal code to make it pass
3. Run test to verify green
4. Move to next test
5. Repeat until all tests pass

### REFACTOR Phase (DEV Responsibility)

1. All tests passing (green)
2. Optimize Docker build performance
3. Improve developer experience
4. Add additional Docker utilities
5. Ensure tests still pass

---

## Running Tests

```bash
# Run all Docker containerization tests
npm run test:e2e -- docker-containerization.spec.ts

# Run specific test
npm run test:e2e -- docker-containerization.spec.ts -g "1.3-DOCKER-001"

# Run tests in headed mode (see browser/debugging)
npm run test:e2e -- docker-containerization.spec.ts --headed

# Debug specific test
npm run test:e2e -- docker-containerization.spec.ts --debug

# Run tests with trace on failure
npm run test:e2e -- docker-containerization.spec.ts --trace on
```

---

## Required data-testid Attributes

**None Required**: This story focuses on infrastructure testing rather than UI components. Tests validate file existence, container operations, and system state.

---

## Mock Requirements for DEV Team

**Docker Commands**:

- `docker build` - Build container images
- `docker run` - Run containers
- `docker-compose up/down` - Orchestrate services
- `docker ps/inspect` - Check container status

**System Requirements**:

- Docker Desktop installed locally
- Docker Compose available
- Sufficient disk space for images
- Network access to Docker Hub

---

## Expected Failure Messages

**Before Implementation**:

- `ENOENT: no such file or directory, open 'Dockerfile'`
- `ENOENT: no such file or directory, open 'docker-compose.yml'`
- `ENOENT: no such file or directory, open '.env.example'`
- `Command failed: docker build`
- `ENOENT: no such file or directory, open 'scripts/docker'`

**After Implementation (Green Phase)**:

- All tests should pass with success messages
- Container builds successfully
- Services start correctly
- Files exist and contain expected content

---

## Next Steps for DEV Team

1. **Setup Prerequisites**: Ensure Docker and Docker Compose installed
2. **Run Failing Tests**: Execute test suite to see current failures
3. **Implementation**: Follow checklist to make tests pass
4. **Validation**: Verify Docker workflow works end-to-end
5. **Documentation**: Update README with Docker setup instructions
6. **Share Progress**: Report completion in daily standup

---

## Quality Gates

**Definition of Done**:

- [ ] All 11 tests pass (GREEN phase)
- [ ] Docker container builds successfully
- [ ] docker-compose starts all services
- [ ] Hot reload works in development
- [ ] Documentation is complete and accurate
- [ ] No manual testing required - automated tests validate everything

**Acceptance Criteria Validation**:

- [ ] AC1: Dockerfile with multi-stage build ✅
- [ ] AC2: docker-compose.yml with app + PostgreSQL ✅
- [ ] AC3: Database initialization scripts ✅
- [ ] AC4: .env.example template ✅
- [ ] AC5: Container builds and runs ✅
- [ ] AC6: Hot reload configured ✅
- [ ] AC7: Docker images optimized ✅
- [ ] AC8: Documentation updated ✅

---

**Knowledge Base References Applied**:

- Fixture architecture patterns with auto-cleanup
- Data factory patterns with faker for Docker configurations
- Network-first approach for container orchestration
- Test quality principles (deterministic, isolated, explicit)
- E2E testing strategies for infrastructure validation
