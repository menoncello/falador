# Falador Test Suite

Comprehensive testing infrastructure for the Falador audiobook platform using Playwright and Bun Test.

## Table of Contents

- [Overview](#overview)
- [Test Architecture](#test-architecture)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI Integration](#ci-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

Falador uses a multi-layered testing approach:

- **Unit Tests**: Business logic tests using Bun Test (in `src/` directories)
- **API Tests**: REST API endpoint validation using Playwright's request context
- **E2E Tests**: Complete workflow testing (CLI, full user journeys)
- **Mutation Tests**: Code quality validation using Stryker

### Test Framework: Playwright

**Why Playwright?**

- ✅ Native API testing support (no browser needed)
- ✅ Worker parallelism for fast execution
- ✅ Powerful debugging with trace viewer
- ✅ Auto-cleanup fixtures for test isolation
- ✅ Bun-compatible

---

## Test Architecture

### Directory Structure

```
tests/
├── api/                      # API endpoint tests
│   ├── auth.spec.ts         # Authentication tests
│   └── projects.spec.ts     # Project management tests
├── e2e/                      # End-to-end tests
│   └── example.spec.ts      # E2E workflow tests
├── support/                  # Test infrastructure
│   ├── fixtures/            # Test fixtures with auto-cleanup
│   │   ├── index.ts        # Main fixture exports
│   │   └── factories/      # Data factories
│   │       ├── user-factory.ts
│   │       └── project-factory.ts
│   ├── helpers/             # Utility functions
│   └── page-objects/        # Page object models (if needed)
└── README.md                 # This file
```

### Fixture Architecture

Falador uses **Playwright's fixture system** for automatic setup/teardown:

```typescript
import { test, expect } from '../support/fixtures';

test('should create user', async ({ userFactory }) => {
  const user = await userFactory.createUser();
  expect(user.email).toBeDefined();
  // ✅ Auto-cleanup: user is deleted after test completes
});
```

**Key Principles:**

- Pure function → fixture → `mergeTests` composition
- Auto-cleanup (all created data deleted after test)
- Type-safe fixtures
- Composable (fixtures can depend on other fixtures)

### Data Factories

All test data is generated using **faker** (no hardcoded values):

```typescript
// ❌ WRONG: Hardcoded data (collisions, maintenance burden)
const user = { email: 'test@example.com', name: 'Test User' };

// ✅ CORRECT: Faker-generated data (unique, realistic)
const user = await userFactory.createUser();
// email: faker.internet.email() → "john.doe_123@example.com"
// name: faker.person.fullName() → "Sarah Johnson"
```

**Factory Features:**

- Random, realistic test data
- Override support for specific scenarios
- Auto-cleanup tracking
- Bulk creation helpers

---

## Setup

### 1. Install Dependencies

```bash
bun install
```

This installs:

- `@playwright/test` - Test framework
- `@faker-js/faker` - Test data generation

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```bash
# Required for API tests
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api

# Required for integration tests
DATABASE_URL=postgresql://falador:dev_password@localhost:5432/falador_test
REDIS_URL=redis://localhost:6379

# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### 3. Start Local Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Start API server (in separate terminal)
bun run dev
```

### 4. Run Initial Test

```bash
# Run all tests
bun run test:e2e

# Or run specific test file
bun run test:e2e tests/api/auth.spec.ts
```

---

## Running Tests

### Command Reference

```bash
# Run all E2E tests
bun run test:e2e

# Run tests in headed mode (see browser)
bun run test:e2e:headed

# Run tests with UI mode (interactive)
bun run test:e2e:ui

# Debug specific test
bun run test:e2e:debug

# Run API tests only
bun run test:api

# Run specific test file
bun run test:e2e tests/api/auth.spec.ts

# Run tests matching pattern
bun run test:e2e -g "should create user"

# Show test report
bun run test:e2e:report
```

### CI Mode

On CI, tests run with:

- 2 retries (handle flakiness)
- 2 workers (parallel execution)
- Video/trace on failure only

```bash
CI=1 bun run test:e2e
```

---

## Writing Tests

### Test Structure: Given-When-Then

All tests follow **Given-When-Then** structure:

```typescript
test('should create user with valid data', async ({ request }) => {
  // GIVEN: Valid user registration data
  const userData = {
    email: 'newuser@example.com',
    name: 'New User',
    password: 'SecurePassword123!',
  };

  // WHEN: Creating user via API
  const response = await request.post('/api/auth/register', {
    data: userData,
  });

  // THEN: User is created successfully
  expect(response.status()).toBe(201);
});
```

### One Assertion Per Test (Atomic Tests)

```typescript
// ✅ CORRECT: One assertion (atomic)
test('should return 201 status', async ({ request }) => {
  const response = await request.post('/api/users', { data: userData });
  expect(response.status()).toBe(201);
});

test('should return user object', async ({ request }) => {
  const response = await request.post('/api/users', { data: userData });
  const body = await response.json();
  expect(body.email).toBe(userData.email);
});

// ❌ WRONG: Multiple assertions (not atomic)
test('should create user', async ({ request }) => {
  const response = await request.post('/api/users', { data: userData });
  expect(response.status()).toBe(201); // If this fails...
  expect(body.email).toBe(userData.email); // ...we never know if this works
});
```

**Why?** If the second assertion fails, you don't know if the first is still valid.

### Using Fixtures

```typescript
// User factory fixture
test('should authenticate user', async ({ userFactory, request }) => {
  const password = 'TestPassword123!';
  const user = await userFactory.createUser({ password });

  const response = await request.post('/api/auth/login', {
    data: { email: user.email, password },
  });

  expect(response.status()).toBe(200);
});

// API key fixture (auto-creates user and API key)
test('should access protected endpoint', async ({ apiKey, request }) => {
  const response = await request.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  expect(response.status()).toBe(200);
});

// Project factory fixture (auto-creates user and project)
test('should update project', async ({ projectFactory, request }) => {
  const project = await projectFactory.createProject();

  const response = await request.patch(`/api/projects/${project.id}`, {
    data: { title: 'Updated Title' },
  });

  expect(response.status()).toBe(200);
});
```

### API Testing Patterns

```typescript
// GET request
const response = await request.get('/api/projects');
expect(response.status()).toBe(200);
const projects = await response.json();
expect(projects).toHaveLength(3);

// POST request with JSON body
const response = await request.post('/api/projects', {
  data: { title: 'New Project', language: 'pt-BR' },
});
expect(response.status()).toBe(201);

// Authenticated request
const response = await request.get('/api/auth/me', {
  headers: { Authorization: `Bearer ${apiKey}` },
});
expect(response.status()).toBe(200);

// File upload (when needed)
const response = await request.post('/api/upload', {
  multipart: {
    file: fs.readFileSync('test-file.txt'),
  },
});
```

---

## Best Practices

### 1. Use Fixtures for Setup/Cleanup

```typescript
// ✅ CORRECT: Fixture handles cleanup automatically
test('should create user', async ({ userFactory }) => {
  const user = await userFactory.createUser();
  // Test logic...
  // ✅ User deleted automatically after test
});

// ❌ WRONG: Manual cleanup (error-prone, verbose)
test('should create user', async ({ request }) => {
  const user = await createUser(request);
  try {
    // Test logic...
  } finally {
    await deleteUser(request, user.id); // Easy to forget!
  }
});
```

### 2. Use Faker for All Test Data

```typescript
// ✅ CORRECT: Random data via faker
const user = await userFactory.createUser();

// ❌ WRONG: Hardcoded data (collisions in parallel tests)
const user = await createUser({ email: 'test@example.com' });
```

### 3. Test Isolation

Each test should be **completely independent**:

```typescript
// ✅ CORRECT: Each test creates its own data
test('test A', async ({ userFactory }) => {
  const user = await userFactory.createUser();
  // Test with this user
});

test('test B', async ({ userFactory }) => {
  const user = await userFactory.createUser(); // New user
  // Test with this user
});

// ❌ WRONG: Shared test data (tests depend on each other)
let sharedUser;

test.beforeAll(async () => {
  sharedUser = await createUser(); // BAD: shared state
});

test('test A', async () => {
  // Uses sharedUser
});

test('test B', async () => {
  // Uses same sharedUser - tests coupled!
});
```

### 4. Explicit Assertions

```typescript
// ✅ CORRECT: Explicit assertion with clear message
expect(response.status()).toBe(201);

// ❌ WRONG: Implicit checks (unclear failure messages)
if (response.status() !== 201) {
  throw new Error('Failed');
}
```

### 5. Avoid Hard Waits

```typescript
// ✅ CORRECT: Wait for specific condition
await expect(page.locator('[data-testid="success"]')).toBeVisible();

// ❌ WRONG: Hard wait (slow, flaky)
await page.waitForTimeout(5000);
```

---

## CI Integration

### GitHub Actions

Tests run automatically on:

- Pull requests
- Push to `main` branch

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:e2e
```

### Test Reports

- **HTML Report**: `test-results/html/index.html`
- **JUnit XML**: `test-results/junit.xml` (for CI integration)
- **Trace Files**: `test-results/artifacts/` (on failure only)

View reports locally:

```bash
bun run test:e2e:report
```

---

## Troubleshooting

### Tests Failing Locally

**Check services are running:**

```bash
docker-compose ps
# Should show postgres and redis as "Up"
```

**Check API server is running:**

```bash
curl http://localhost:3000/health
# Should return 200 OK
```

**Check environment variables:**

```bash
cat .env
# Verify BASE_URL, DATABASE_URL, etc.
```

### Flaky Tests

If tests pass sometimes but fail randomly:

1. **Check for race conditions**
   - Are you waiting for async operations?
   - Use `await expect().toBeVisible()` instead of hard waits

2. **Check for test isolation issues**
   - Does test depend on order of execution?
   - Are you using shared state between tests?

3. **Enable retries locally**
   ```bash
   CI=1 bun run test:e2e
   # Runs with 2 retries like CI
   ```

### Debugging Tests

```bash
# Run test in debug mode
bun run test:e2e:debug tests/api/auth.spec.ts

# Run test in UI mode (interactive)
bun run test:e2e:ui

# View trace for failed test
npx playwright show-trace test-results/artifacts/trace.zip
```

---

## Knowledge Base References

This test infrastructure follows best practices from TEA (Test Architect) knowledge base:

- **fixture-architecture.md** - Pure function → fixture → mergeTests composition
- **data-factories.md** - Faker-based factories with overrides and auto-cleanup
- **test-quality.md** - Deterministic tests, isolation, explicit assertions
- **playwright-config.md** - Timeout standards, artifact capture, parallelization

---

## Next Steps

1. **Copy `.env.example` to `.env`** and configure environment
2. **Install dependencies**: `bun install`
3. **Start services**: `docker-compose up -d`
4. **Run tests**: `bun run test:e2e`
5. **Review test reports**: `bun run test:e2e:report`

---

**Questions or Issues?**

- Check `bmad/bmm/testarch/README.md` for workflow documentation
- Consult `bmad/bmm/testarch/knowledge/` for testing patterns
- Ask in team standup or Slack

---

**Generated by BMad TEA Agent** - 2025-10-17
