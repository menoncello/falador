# Mutation Testing Coverage Examples

## Current Status

- **Mutation Score**: 82.28% (above 80% threshold)
- **Total Mutants**: 395
- **Killed**: 325
- **Survived**: 70
- **No Coverage**: 0

## Priority Surviving Mutants to Address

Based on the mutation testing output, here are the most critical surviving mutants that need additional tests:

### 1. Database Authentication Mutants

**File**: `packages/api-gateway/src/database.ts`

**Surviving Mutants**:

- JWT header manipulation (lines 110-111)
- Token expiration time arithmetic (line 113)
- Password hash validation logic (line 86)
- Session expiration comparison (line 358)

**Additional Tests Needed**:

```typescript
// packages/api-gateway/src/database.test.ts

describe('Database - JWT Security', () => {
  test('should reject JWT with invalid header', async () => {
    const database = new Database();

    // Create token with manipulated header
    const manipulatedToken = database.createApiKey({
      userId: 'test-user',
      name: 'test-key',
      scopes: ['read'],
    });

    // Manually corrupt the JWT header
    const parts = manipulatedToken.split('.');
    const corruptedHeader = Buffer.from(
      JSON.stringify({ alg: 'none', typ: 'JWT' })
    ).toString('base64');
    const corruptedToken = `${corruptedHeader}.${parts[1]}.${parts[2]}`;

    // Should reject manipulated token
    expect(database.getApiKeyByApiKey(corruptedToken)).toBeUndefined();
  });

  test('should reject expired JWT tokens', async () => {
    const database = new Database();

    // Create token with negative expiration (already expired)
    const expiredToken = database.createApiKey({
      userId: 'test-user',
      name: 'test-key',
      scopes: ['read'],
    });

    // Mock Date.now to return time after expiration
    const originalNow = Date.now;
    Date.now = jest.fn(() => originalNow() + 25 * 60 * 60 * 1000); // 25 hours later

    try {
      // Should reject expired token
      expect(database.getApiKeyByApiKey(expiredToken)).toBeUndefined();
    } finally {
      Date.now = originalNow;
    }
  });

  test('should validate password hash format correctly', async () => {
    const database = new Database();

    // Test invalid hash formats
    const invalidHashes = [
      '', // Empty string
      'singlepart', // Only one part
      'part1.part2', // Two parts instead of three
      '.part2.part3', // Empty first part
      'part1..part3', // Empty second part
      'part1.part2.', // Empty third part
    ];

    for (const hash of invalidHashes) {
      expect(database.verifyPassword('password', hash)).toBe(false);
    }
  });

  test('should validate session expiration correctly', async () => {
    const database = new Database();

    // Create session
    const session = database.createSession('test-user', 'test-session');

    // Mock time to be exactly at expiration
    const originalNow = Date.now;
    const expirationTime = new Date(session.expiresAt).getTime();
    Date.now = jest.fn(() => expirationTime);

    try {
      // Should treat session as expired exactly at expiration time
      expect(database.getSessionByToken(session.token)).toBeUndefined();
    } finally {
      Date.now = originalNow;
    }
  });
});
```

### 2. API Route Authorization Mutants

**File**: `packages/api-gateway/src/routes/projects.ts`

**Surviving Mutants**:

- Unauthorized response objects (lines 13, 75, 101)
- Language literal values (line 54)
- Project status literals (lines 58, 128-132)
- Project validation schema (line 120)

**Additional Tests Needed**:

```typescript
// packages/api-gateway/src/routes/projects.test.ts

describe('Projects API - Authorization & Validation', () => {
  test('should return correct unauthorized error format', async ({
    request,
  }) => {
    // Test without authentication
    const response = await request.get('/api/projects');

    expect(response.status()).toBe(401);
    const body = await response.json();

    // Should match exact error format
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('Unauthorized');
    expect(Object.keys(body)).toHaveLength(1); // Only error property
  });

  test('should validate project language enum values', async ({
    request,
    apiKey,
  }) => {
    const validLanguages = ['pt-BR', 'en'];
    const invalidLanguages = ['es', 'fr', 'de', 'invalid'];

    for (const lang of validLanguages) {
      const response = await request.post('/api/projects', {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { title: 'Test', language: lang },
      });
      expect(response.status()).toBe(201);
    }

    for (const lang of invalidLanguages) {
      const response = await request.post('/api/projects', {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { title: 'Test', language: lang },
      });
      expect(response.status()).toBe(400);
    }
  });

  test('should validate project status enum values', async ({
    request,
    apiKey,
    projectFactory,
  }) => {
    const validStatuses = [
      'draft',
      'queued',
      'processing',
      'completed',
      'failed',
    ];
    const invalidStatuses = ['pending', 'active', 'inactive', 'invalid'];

    // Create a project first
    const project = await projectFactory.createProject();

    for (const status of validStatuses) {
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { status },
      });
      expect(response.status()).toBe(200);
    }

    for (const status of invalidStatuses) {
      const response = await request.patch(`/api/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        data: { status },
      });
      expect(response.status()).toBe(400);
    }
  });

  test('should validate complete project schema', async ({
    request,
    apiKey,
  }) => {
    // Test with complete valid project data
    const validProject = {
      title: 'Test Project',
      author: 'Test Author',
      language: 'pt-BR',
      genre: 'Fiction',
      status: 'draft',
      metadata: { description: 'Test description' },
    };

    const response = await request.post('/api/projects', {
      headers: { Authorization: `Bearer ${apiKey}` },
      data: validProject,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    // Verify all fields are preserved
    expect(body).toMatchObject(validProject);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('userId');
    expect(body).toHaveProperty('createdAt');
  });
});
```

### 3. Database Query Filter Mutants

**File**: `packages/api-gateway/src/database.ts`

**Surviving Mutants**:

- User lookup by email filter (line 173)
- Project filtering by userId (line 240-241)
- API key lookup filter (line 322)

**Additional Tests Needed**:

```typescript
// packages/api-gateway/src/database.test.ts

describe('Database - Query Filtering', () => {
  let database: Database;

  beforeEach(() => {
    database = new Database();
  });

  test('should only return projects belonging to specific user', async () => {
    // Create users
    const user1 = await database.createUser({
      email: 'user1@example.com',
      name: 'User 1',
      password: 'password123',
    });

    const user2 = await database.createUser({
      email: 'user2@example.com',
      name: 'User 2',
      password: 'password123',
    });

    // Create projects for both users
    await database.createProject({
      userId: user1.id,
      title: 'User 1 Project',
    });

    await database.createProject({
      userId: user2.id,
      title: 'User 2 Project',
    });

    // Query projects for user1
    const user1Projects = database.getProjectsByUserId(user1.id);

    // Should only return user1's projects
    expect(user1Projects).toHaveLength(1);
    expect(user1Projects[0].userId).toBe(user1.id);
    expect(user1Projects[0].title).toBe('User 1 Project');

    // Query projects for user2
    const user2Projects = database.getProjectsByUserId(user2.id);

    // Should only return user2's projects
    expect(user2Projects).toHaveLength(1);
    expect(user2Projects[0].userId).toBe(user2.id);
    expect(user2Projects[0].title).toBe('User 2 Project');
  });

  test('should find user by exact email match', async () => {
    // Create multiple users with similar emails
    const user1 = await database.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    await database.createUser({
      email: 'test2@example.com',
      name: 'Test User 2',
      password: 'password123',
    });

    await database.createUser({
      email: 'othertest@example.com',
      name: 'Other Test',
      password: 'password123',
    });

    // Find exact match
    const foundUser = database.getUserByEmail('test@example.com');

    expect(foundUser).toBeDefined();
    expect(foundUser?.id).toBe(user1.id);
    expect(foundUser?.email).toBe('test@example.com');

    // Should not find non-exact matches
    expect(database.getUserByEmail('test2@example.com')).not.toBe(foundUser);
    expect(database.getUserByEmail('othertest@example.com')).not.toBe(
      foundUser
    );
  });

  test('should find API key by exact key match', async () => {
    // Create multiple API keys
    const apiKey1 = await database.createApiKey({
      userId: 'user1',
      name: 'Key 1',
      scopes: ['read'],
    });

    const apiKey2 = await database.createApiKey({
      userId: 'user1',
      name: 'Key 2',
      scopes: ['write'],
    });

    // Find exact match
    const foundKey = database.getApiKeyByApiKey(apiKey1.key);

    expect(foundKey).toBeDefined();
    expect(foundKey?.id).toBe(apiKey1.id);
    expect(foundKey?.key).toBe(apiKey1.key);
    expect(foundKey?.name).toBe('Key 1');

    // Should not find other keys
    expect(database.getApiKeyByApiKey(apiKey2.key)).not.toBe(foundKey);
  });
});
```

### 4. Test Factory Mutants

**File**: `packages/api-gateway/src/test-factories.ts`

**Surviving Mutants**:

- Project factory return object (line 52)
- Default language value (line 56)
- Default genre array (line 57-61)
- Default status value (line 63)

**Additional Tests Needed**:

```typescript
// packages/api-gateway/src/test-factories.test.ts

describe('Test Factories - Default Values', () => {
  test('project factory should create valid default project', () => {
    const factory = new ProjectFactory();
    const project = factory.createProjectData();

    // Should have all required properties
    expect(project).toHaveProperty('userId');
    expect(project).toHaveProperty('title');
    expect(project).toHaveProperty('author');
    expect(project).toHaveProperty('language');
    expect(project).toHaveProperty('genre');
    expect(project).toHaveProperty('status');
    expect(project).toHaveProperty('metadata');

    // Should have valid default values
    expect(project.language).toBe('pt-BR');
    expect(project.status).toBe('draft');
    expect(['Fiction', 'Non-Fiction', 'Technical', 'Biography']).toContain(
      project.genre
    );
    expect(typeof project.title).toBe('string');
    expect(typeof project.author).toBe('string');
    expect(typeof project.userId).toBe('string');
    expect(typeof project.metadata).toBe('object');
  });

  test('project factory should use custom values when provided', () => {
    const factory = new ProjectFactory();
    const customData = {
      title: 'Custom Title',
      author: 'Custom Author',
      language: 'en' as const,
      genre: 'Science Fiction',
      status: 'completed' as const,
    };

    const project = factory.createProjectData(customData);

    // Should use custom values
    expect(project.title).toBe('Custom Title');
    expect(project.author).toBe('Custom Author');
    expect(project.language).toBe('en');
    expect(project.genre).toBe('Science Fiction');
    expect(project.status).toBe('completed');

    // Should still have defaults for unspecified fields
    expect(project).toHaveProperty('userId');
    expect(project).toHaveProperty('metadata');
  });

  test('project factory should generate different values on multiple calls', () => {
    const factory = new ProjectFactory();

    const project1 = factory.createProjectData();
    const project2 = factory.createProjectData();

    // Should generate different values
    expect(project1.userId).not.toBe(project2.userId);
    expect(project1.title).not.toBe(project2.title);
    expect(project1.author).not.toBe(project2.author);

    // But should have same defaults
    expect(project1.language).toBe(project2.language);
    expect(project1.status).toBe(project2.status);
  });
});
```

### 5. Environment-Specific Code Mutants

**File**: `packages/api-gateway/src/index.ts`

**Surviving Mutants**:

- Environment check logic (line 34)
- Console log message content (line 36)
- Optional chaining for hostname/port (line 36)

**Additional Tests Needed**:

```typescript
// packages/api-gateway/src/index.test.ts

describe('Application Bootstrap', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should not log server info in test environment', () => {
    process.env.NODE_ENV = 'test';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Import and run app
    delete require.cache[require.resolve('./index')];
    require('./index');

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should log server info in development environment', () => {
    process.env.NODE_ENV = 'development';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Import and run app
    delete require.cache[require.resolve('./index')];
    require('./index');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🦊 Elysia is running at')
    );

    consoleSpy.mockRestore();
  });

  test('should log server info in production environment', () => {
    process.env.NODE_ENV = 'production';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Import and run app
    delete require.cache[require.resolve('./index')];
    require('./index');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🦊 Elysia is running at')
    );

    consoleSpy.mockRestore();
  });
});
```

## Mutation Testing Strategy

### 1. Prioritize High-Impact Mutants

- **Security-critical**: Authentication, authorization, JWT handling
- **Data integrity**: Database queries, validation logic
- **API contracts**: Response formats, error handling
- **Environment-specific**: Production vs test behavior

### 2. Focus on Business Logic

Test mutants that affect:

- User authentication flows
- Project access control
- Data validation and sanitization
- Error handling and edge cases

### 3. Edge Case Testing

Add tests for:

- Boundary conditions (empty strings, null values)
- Invalid input formats
- Race conditions and timing
- Resource exhaustion scenarios

### 4. Property-Based Testing

Use property-based testing for:

- Input validation functions
- Data transformation logic
- Configuration parsing

```typescript
import fc from 'fast-check';

describe('Property-Based Tests', () => {
  test('should validate email format for various inputs', () => {
    fc.assert(
      fc.property(fc.string(), (email) => {
        const isValid = validateEmail(email);

        // If email contains @ and domain structure, should be valid
        if (email.includes('@') && email.split('@').length === 2) {
          const [local, domain] = email.split('@');
          if (local.length > 0 && domain.includes('.')) {
            return isValid;
          }
        }

        // Otherwise, validation logic should be consistent
        return typeof isValid === 'boolean';
      })
    );
  });
});
```

## Mutation Testing CI Integration

### GitHub Actions Workflow

```yaml
name: Mutation Testing
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run mutation tests
        run: bun run test:mutate

      - name: Check mutation score
        run: |
          SCORE=$(node -e "
            const report = require('./reports/mutation/mutation-report.json');
            console.log(report.mutationScore);
          ")
          if (( $(echo "$SCORE < 80" | bc -l) )); then
            echo "Mutation score $SCORE% is below threshold 80%"
            exit 1
          fi
          echo "Mutation score $SCORE% meets threshold"
```

## Best Practices Checklist

- [ ] Address all security-related surviving mutants
- [ ] Add tests for authorization and access control
- [ ] Test edge cases and error conditions
- [ ] Validate input sanitization and output encoding
- [ ] Test environment-specific behavior
- [ ] Use property-based testing for complex logic
- [ ] Set up automated mutation score checks in CI
- [ ] Review and update mutation testing configuration
- [ ] Document mutation testing strategy and thresholds
- [ ] Regular review of surviving mutants and test gaps

## Expected Impact

After implementing these additional tests:

- **Target mutation score**: 90%+
- **Critical mutants eliminated**: All security and data integrity issues
- **Test coverage**: More comprehensive edge case testing
- **Code quality**: Higher confidence in production readiness
- **Maintainability**: Clear test intent and documentation

This comprehensive approach ensures robust test coverage that catches real bugs and prevents regressions.
