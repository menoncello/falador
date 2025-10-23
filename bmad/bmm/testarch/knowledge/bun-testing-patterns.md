# Bun Testing Patterns - Falador Project

## Test Structure

```typescript
import { describe, test, expect, mock } from 'bun:test';

describe('Component/Feature Name', () => {
  test('should [behavior] [ID] [Priority]', () => {
    // Test implementation
  });
});
```

## Quality Requirements

- **TypeScript**: Strict mode, 0 compilation errors
- **ESLint**: 0 errors, no eslint-disable comments
- **Formatting**: Prettier compliance
- **Mutation Testing**: Structure tests to achieve 80%+ Stryker score

## Best Practices

1. **Use proper TypeScript types** - no 'any', infer types
2. **Handle async/await correctly** - no floating promises
3. **Follow ESLint rules** - no-unused-vars, consistent returns
4. **Test boundaries** - null checks, error paths, edge cases
5. **Descriptive test IDs** - format: STORY-ID-CATEGORY-XXX [P0/P1/P2]

## Test ID Format

- **Format**: STORY-ID-CATEGORY-XXX [Priority]
- **Example**: 1.5-ARCH-001 [P1], 1.2-CI-003 [P0]
- **Categories**: ARCH (architecture), CI (CI/CD), API (API), DB (database), etc.
- **Priorities**: P0 (critical), P1 (important), P2 (nice-to-have)

## Mutation Testing Strategy

- **Target**: 80%+ Stryker mutation score
- **Focus**: Business logic, error handling, boundary conditions
- **Patterns**: Test null/undefined values, empty collections, error paths
- **Avoid**: Testing trivial getters/setters, simple data passing

## Example Test

```typescript
describe('CreateProjectUseCase', () => {
  test('should create project with valid data - 1.5-USE-001 [P1]', async () => {
    // Arrange
    const mockRepo = {
      create: mock(() => Promise.resolve(mockProject)),
      findByUserId: mock(() => Promise.resolve([]))
    };
    const useCase = new CreateProjectUseCase(mockRepo, mockUserRepo);

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      title: 'Test Project'
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.project).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-123',
      title: 'Test Project'
    }));
  });
});
```