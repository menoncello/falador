# TypeScript Strict Mode Testing Patterns

## Overview

This project enforces **TypeScript strict mode** for ALL code, including test code. No exceptions.

## Strict Mode Requirements

### 1. No 'any' Types

```typescript
// ❌ BAD - Uses 'any'
const mockData: any = { id: 1, name: 'Test' };

// ✅ GOOD - Proper types
interface User {
  id: number;
  name: string;
}
const mockData: User = { id: 1, name: 'Test' };
```

### 2. Proper Async Handling

```typescript
// ❌ BAD - Floating promise (ESLint error)
it('should fetch data', () => {
  fetchData(); // Promise not awaited
});

// ✅ GOOD - Proper async
it('should fetch data', async () => {
  await fetchData();
});
```

### 3. Type-Safe Mocks

```typescript
// ❌ BAD - Mock doesn't match interface
const mockService = {
  getData: () => 'string', // Real method returns Promise<Data>
};

// ✅ GOOD - Type-safe mock
const mockService: DataService = {
  getData: mock(() => Promise.resolve({ id: 1, value: 'test' })),
};
```

### 4. Strict Null Checks

```typescript
// ❌ BAD - Assumes value exists
const user = users.find((u) => u.id === 1);
expect(user.name).toBe('Alice'); // TypeScript error: user might be undefined

// ✅ GOOD - Handle null case
const user = users.find((u) => u.id === 1);
expect(user).toBeDefined();
expect(user!.name).toBe('Alice'); // Non-null assertion after check
```

## Test Data Factories

Use factories for type-safe test data:

```typescript
// factories/user-factory.ts
import { User } from '../types';

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides,
  };
}

// usage in tests
const user = createMockUser({ name: 'Alice' });
expect(user.name).toBe('Alice');
expect(user.id).toBe(1); // Default value
```

## ESLint Rules for Tests

Test code must comply with all ESLint rules:

- `@typescript-eslint/no-floating-promises`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/no-non-null-assertion` (use after proper checks)

## Quality Gates for Test Code

1. **TypeScript**: `tsc --noEmit` must pass with 0 errors
2. **ESLint**: `eslint` must pass with 0 errors
3. **Formatting**: `prettier --check` must pass
4. **Mutation**: Tests must achieve 80%+ mutation score

NO exceptions. NO `eslint-disable`. NO `@ts-ignore`.
