# Test Framework Standards Guide

## Overview

This document defines the standardized testing patterns and conventions used throughout the Falador audiobook platform project. All tests should follow these patterns to ensure consistency, maintainability, and reliability.

## 🏗️ Architecture Principles

### Clean Architecture Testing
- **Unit Tests**: Test individual components in isolation with mocked dependencies
- **Integration Tests**: Test interactions between layers with real dependencies
- **API Tests**: Test REST endpoints with network-first patterns
- **E2E Tests**: Test complete user workflows through the application

### Test Organization
```
tests/
├── api/                    # API endpoint tests
│   ├── auth.spec.ts
│   ├── projects.spec.ts
│   └── ...
├── e2e/                   # End-to-end tests
│   ├── example.spec.ts
│   └── workflow.spec.ts
├── support/               # Test utilities and fixtures
│   ├── fixtures.ts
│   └── helpers.ts
└── unit/                  # Unit tests (if needed)
```

## 🧪 Test Standards

### Test Naming Convention
Use the format: `{Story-ID}-{Test-Type}-{Component}-{Sequence} [Priority]`

**Examples:**
- `1.4-API-001 [P0]: Authentication login success`
- `1.4-API-002 [P1]: User registration validation`
- `1.5-ARCH-003 [P0]: Domain entity validation`

**Priority Levels:**
- `P0` - Critical path, must pass for deployment
- `P1` - Important functionality, should pass
- `P2` - Edge cases, nice to have passing

### Given-When-Then Structure
Every test should follow the Given-When-Then pattern:

```typescript
test('should authenticate user with valid credentials', async ({ request }) => {
  // GIVEN: User exists with known credentials
  const user = await userFactory.createUser();

  // WHEN: Logging in with valid credentials
  const response = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password }
  });

  // THEN: Login succeeds with proper response
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);
});
```

### Network-First Pattern
API tests must use network-first patterns for reliable testing:

```typescript
test('should create user successfully', async ({ request }) => {
  // GIVEN: Valid user data
  const userData = createTestUser();

  // Network-first: Set up response monitoring BEFORE request
  const responsePromise = request.waitForResponse('**/api/auth/register');

  // WHEN: Creating user
  const response = await request.post('/api/auth/register', {
    data: userData
  });

  // Network-first: Wait for actual response
  const actualResponse = await responsePromise;

  // THEN: Both responses succeed
  expect(response.status()).toBe(201);
  expect(actualResponse.status()).toBe(201);
});
```

## 📝 Test Data Management

### Use Factories, Not Hardcoded Values
```typescript
// ❌ BAD - Hardcoded values
const user = {
  email: 'test@example.com',
  password: 'password123'
};

// ✅ GOOD - Factory generated
const user = createTestUser({
  tier: 'pro' // Override only when needed
});
```

### Password Constants
Always use `TEST_PASSWORDS` constants:
```typescript
import { TEST_PASSWORDS } from '../../packages/api-gateway/src/test-factories';

// ✅ GOOD
password: TEST_PASSWORDS.VALID,
password: TEST_PASSWORDS.WRONG,
password: TEST_PASSWORDS.INVALID,
```

### Unique Data Generation
Factories should generate unique data for each test run:
```typescript
// ✅ GOOD - Includes timestamp and crypto suffix
const uniqueId = `${timestamp}-${randomSuffix}-${cryptoSuffix}`;
return {
  email: `test-${uniqueId}@example.com`,
  password: `${TEST_PASSWORDS.VALID}${uniqueId}`
};
```

## 🔧 Fixtures and Composition

### Basic Fixtures
```typescript
test.use({ cleanupDatabase: true, testDuration: true });
```

### Composite Fixtures
Use the `testScenarios` fixture for common patterns:

```typescript
test('should handle multi-user scenario', async ({ testScenarios }) => {
  // GIVEN: Users with different roles
  const users = await testScenarios.createUsersWithRoles(['free', 'pro', 'enterprise']);

  // WHEN: Performing operations
  const freeUserToken = await users[0].token();
  const proUserToken = await users[1].token();

  // THEN: Verify behavior
});
```

### Available Fixtures

1. **cleanupDatabase** - Ensures clean test isolation
2. **testDuration** - Monitors test performance
3. **userFactory** - Creates and manages users with auth
4. **projectFactory** - Creates projects with user association
5. **apiRequest** - Network-first API request wrapper
6. **apiKey** - Mock API key generation
7. **authenticatedUser** - Pre-authenticated user fixture
8. **testScenarios** - Common composite test setups

## 🚨 Error Handling

### Proper Error Validation
```typescript
test('should handle authentication errors', async ({ request }) => {
  // WHEN: Making request with invalid credentials
  const response = await request.post('/api/auth/login', {
    data: { email: 'invalid@test.com', password: TEST_PASSWORDS.WRONG }
  });

  // THEN: Proper error response
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error).toBeTruthy();
  expect(body).toMatchObject({
    error: expect.any(String)
  });
});
```

### Error Message Testing
Test specific error messages to kill string literal mutants:

```typescript
test('should return specific unauthorized message', async ({ request }) => {
  // WHEN: Making unauthorized request
  const response = await request.get('/api/auth/me');

  // THEN: Specific error message
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error).toBe('Unauthorized');
});
```

## 📊 Test Coverage Requirements

### Coverage Targets
- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: 85%+ line coverage
- **API Tests**: Cover all endpoints and error cases
- **E2E Tests**: Cover critical user journeys

### Mutation Testing
- **Threshold**: 80%+ mutation score
- **Survivor Analysis**: Review and fix surviving mutants
- **Critical Paths**: Ensure 100% coverage

## 🔍 Test Quality Gates

### Performance Requirements
- **API Tests**: Complete in <500ms
- **Unit Tests**: Complete in <100ms per test
- **E2E Tests**: Complete in <5s per workflow

### Security Testing
- **Authentication**: All auth endpoints tested
- **Authorization**: Role-based access verified
- **Input Validation**: All inputs tested for malicious content
- **Error Messages**: No sensitive information leaked

## 📋 Test Checklist

Before submitting tests, ensure:

- [ ] Test follows Given-When-Then structure
- [ ] Uses factory-generated data, no hardcoded values
- [ ] Implements network-first patterns for API tests
- [ ] Has proper error handling and validation
- [ ] Uses appropriate test ID format
- [ ] Includes cleanup and isolation
- [ ] Tests both success and failure scenarios
- [ ] No race conditions or timing dependencies
- [ ] All assertions are atomic and specific

## 🛠️ Best Practices

### Test Isolation
- Each test should be independent
- Use proper cleanup fixtures
- Avoid shared state between tests
- Generate unique data per test

### Readability
- Use descriptive test names
- Add comments for complex scenarios
- Keep tests focused and single-purpose
- Use consistent formatting

### Maintainability
- Use reusable fixtures and helpers
- Avoid brittle selectors and assertions
- Keep test data in factories
- Document complex test scenarios

### Reliability
- Use network-first patterns for API tests
- Add proper waits and retries where needed
- Handle async operations correctly
- Test both happy and error paths

---

**Last Updated:** 2025-10-20
**Maintainer:** Development Team
**Review Required:** Every major change