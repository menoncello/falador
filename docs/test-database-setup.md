# Test Database Setup Guide

This guide explains how to set up a dedicated test database environment for the Falador audiobook platform test suite.

## Overview

The test suite requires an isolated database environment to prevent interference with development/production data and enable reliable parallel test execution.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Bun (package manager)

## Quick Setup

### 1. Environment Configuration

Create a `.env.test` file in the project root:

```bash
# Test Database Configuration
TEST_DATABASE_URL="postgresql://test_user:test_password@localhost:5433/falador_test"
TEST_DATABASE_NAME="falador_test"
TEST_DATABASE_USER="test_user"
TEST_DATABASE_PASSWORD="test_password"

# Test API Configuration
TEST_API_URL="http://localhost:3001"
TEST_RUN_ID="test-local-$(date +%s)"

# Node Environment
NODE_ENV="test"
```

### 2. Docker Test Database

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  test-db:
    image: postgres:15-alpine
    container_name: falador-test-db
    environment:
      POSTGRES_DB: falador_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - test-db-data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user -d falador_test"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  test-db-data:
```

### 3. Test Database Scripts

Create `scripts/setup-test-db.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Setting up test database..."

# Load test environment
export NODE_ENV=test
source .env.test

# Start test database
echo "📦 Starting test database container..."
docker-compose -f docker-compose.test.yml up -d test-db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.test.yml exec -T test-db pg_isready -U test_user -d falador_test; do
  echo "Waiting for postgres..."
  sleep 2
done

echo "✅ Test database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
export DATABASE_URL="$TEST_DATABASE_URL"
bun run migrate:test

echo "🎉 Test database setup complete!"
```

Create `scripts/teardown-test-db.sh`:

```bash
#!/bin/bash
set -e

echo "🧹 Tearing down test database..."

# Stop and remove test database container
docker-compose -f docker-compose.test.yml down -v

echo "✅ Test database teardown complete!"
```

### 4. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:setup": "chmod +x scripts/setup-test-db.sh && ./scripts/setup-test-db.sh",
    "test:teardown": "chmod +x scripts/teardown-test-db.sh && ./scripts/teardown-test-db.sh",
    "test:api": "bunx playwright test --project=api",
    "test:e2e": "bunx playwright test --project=e2e",
    "test:all": "bunx playwright test",
    "migrate:test": "bun prisma migrate deploy --schema=./prisma/schema.prisma",
    "migrate:test:reset": "bun prisma migrate reset --force --schema=./prisma/schema.prisma"
  }
}
```

## Usage

### Running Tests with Test Database

```bash
# Setup test database
npm run test:setup

# Run API tests
npm run test:api

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Cleanup test database
npm run test:teardown
```

### CI/CD Integration

For GitHub Actions, create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      test-db:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: falador_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Setup test environment
        run: |
          echo "TEST_DATABASE_URL=postgresql://test_user:test_password@localhost:5433/falador_test" >> $GITHUB_ENV
          echo "TEST_API_URL=http://localhost:3001" >> $GITHUB_ENV
          echo "NODE_ENV=test" >> $GITHUB_ENV

      - name: Run database migrations
        run: bun run migrate:test
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}

      - name: Run tests
        run: bun run test:all
        env:
          TEST_DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
          TEST_API_URL: ${{ env.TEST_API_URL }}
          NODE_ENV: test
```

## Test Database Best Practices

### 1. Data Isolation

Each test should use unique data to prevent collisions:

```typescript
// ✅ Good: Use factories with faker for unique data
const user = await userFactory.createUser({
  email: faker.internet.email(),
  name: faker.person.fullName(),
});

// ❌ Bad: Hardcoded test data
const user = await userFactory.createUser({
  email: 'test@example.com', // Collides in parallel runs
});
```

### 2. Cleanup Strategy

The test fixtures automatically clean up created data:

```typescript
// tests/support/fixtures/factories/user-factory.ts
async cleanup(): Promise<void> {
  // Delete all created users
  for (const userId of this.createdUserIds) {
    try {
      await this.request.delete(`/api/users/${userId}`);
    } catch (error) {
      console.warn(`Failed to cleanup user ${userId}:`, error);
    }
  }
  this.createdUserIds = [];
}
```

### 3. Parallel Execution

Tests are configured to run in parallel:

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
});
```

### 4. Transaction Rollback (Optional)

For faster test execution, consider using transaction rollback:

```typescript
// tests/support/fixtures/transaction-fixture.ts
export const test = base.extend({
  transaction: async ({ database }, use) => {
    await database.query('BEGIN');
    await use(database);
    await database.query('ROLLBACK');
  },
});
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if test database is running
docker-compose -f docker-compose.test.yml ps

# Check database logs
docker-compose -f docker-compose.test.yml logs test-db

# Reset test database
docker-compose -f docker-compose.test.yml down -v
npm run test:setup
```

### Port Conflicts

If port 5433 is in use, update `docker-compose.test.yml`:

```yaml
services:
  test-db:
    ports:
      - "5434:5432"  # Use different host port
```

### Migration Issues

```bash
# Reset and re-run migrations
bun run migrate:test:reset
bun run migrate:test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_DATABASE_URL` | PostgreSQL connection string | `postgresql://test_user:test_password@localhost:5433/falador_test` |
| `TEST_API_URL` | Base URL for test API | `http://localhost:3001` |
| `TEST_RUN_ID` | Unique identifier for test run | Auto-generated |
| `NODE_ENV` | Node environment | `test` |

## Performance Considerations

- Use in-memory database for faster test execution (if applicable)
- Parallel test execution reduces total runtime
- Database migrations are run once per test suite
- Fixture cleanup happens automatically after each test

## Security Notes

- Test database uses separate credentials from production
- Test database should never contain production data
- Test environment headers prevent accidental API calls to production
- Database is isolated in Docker container

---

For more information on test patterns and best practices, see:
- [Test Quality Guidelines](./test-review-2025-10-22.md)
- [Network-First Patterns](../bmad/bmm/testarch/knowledge/network-first.md)
- [Fixture Architecture](../bmad/bmm/testarch/knowledge/fixture-architecture.md)