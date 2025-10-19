# Bun Test Patterns and Best Practices

## Overview

This project uses **Bun Test** (built-in test runner) instead of Jest/Vitest. Bun Test provides a Jest-compatible API with better performance.

## API Reference

### Basic Test Structure

```typescript
import { describe, it, expect } from 'bun:test';

describe('MyComponent', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Async Tests

```typescript
import { describe, it, expect } from 'bun:test';

describe('AsyncService', () => {
  it('should handle async operations', async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });
});
```

### Mocking

```typescript
import { mock, spyOn } from 'bun:test';

const mockFn = mock(() => 'mocked value');
expect(mockFn()).toBe('mocked value');

const spy = spyOn(obj, 'method');
expect(spy).toHaveBeenCalled();
```

## Best Practices for Falador

1. **TypeScript Strict Mode**: All test code must compile with strict mode
2. **No 'any' Types**: Use proper types for test data and assertions
3. **Mutation Testing**: Structure tests to kill mutants (80%+ score required)
4. **ESLint Compliance**: Test code must pass linting without exceptions

## Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific file
bun test path/to/test.test.ts

# Watch mode
bun test --watch
```

## Integration with Stryker

Bun Test integrates with Stryker via command runner:

```json
{
  "testRunner": "command",
  "commandRunner": {
    "command": "bun test"
  }
}
```
