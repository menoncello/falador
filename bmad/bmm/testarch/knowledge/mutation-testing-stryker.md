# Mutation Testing with Stryker

## Overview

This project uses **Stryker 8.8.0** for mutation testing with an **80%+ high threshold** requirement.

## What is Mutation Testing?

Mutation testing validates test quality by introducing small changes (mutations) to your code and checking if your tests catch them.

**Example**:

```typescript
// Original code
if (x > 0) {
  return true;
}

// Mutant 1: > becomes >=
if (x >= 0) {
  return true;
}

// Mutant 2: > becomes <
if (x < 0) {
  return true;
}
```

Your tests must **kill** these mutants (detect the changes).

## Configuration

File: `stryker.config.json`

**Critical Thresholds**:

- **High**: 80% (BUILD PASSES)
- **Low**: 60% (WARNING)
- **Break**: 50% (BUILD FAILS)

## Running Mutation Tests

```bash
# Run mutation tests
bun run test:mutate

# Generate HTML report
bun run test:mutate:report

# View report
open reports/mutation/mutation-report.html
```

## Mutation Score Requirements

**80%+ mutation score is MANDATORY** per CLAUDE.md quality standards.

### ❌ NEVER lower thresholds

```json
// BAD - Do not do this
{
  "thresholds": {
    "high": 60 // ❌ Lowered from 80
  }
}
```

### ✅ ALWAYS add more tests

```typescript
// GOOD - Kill mutants with better tests
describe('calculateTotal', () => {
  it('should return 0 for empty cart', () => {
    expect(calculateTotal([])).toBe(0); // Kills mutant: 0 -> 1
  });

  it('should handle negative prices', () => {
    expect(() => calculateTotal([{ price: -5 }])).toThrow(); // Kills mutant: price > 0 -> price >= 0
  });

  it('should handle null items', () => {
    expect(() => calculateTotal([null])).toThrow(); // Kills mutant: item.price -> item?.price
  });
});
```

## Writing Mutation-Resistant Tests

### 1. Test Boundary Conditions

```typescript
// Kills mutants: >, >=, <, <=, ==, !=
it('should handle boundary values', () => {
  expect(isPositive(0)).toBe(false); // x > 0
  expect(isPositive(1)).toBe(true); // x > 0
  expect(isPositive(-1)).toBe(false); // x > 0
});
```

### 2. Test Error Paths

```typescript
// Kills mutants in error handling
it('should throw on invalid input', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero');
});
```

### 3. Test Null/Undefined Cases

```typescript
// Kills mutants: ??, ||, &&
it('should handle null values', () => {
  expect(getName(null)).toBe('Unknown');
  expect(getName(undefined)).toBe('Unknown');
  expect(getName({ name: 'Alice' })).toBe('Alice');
});
```

### 4. Test Exact Values (not just truthiness)

```typescript
// BAD - Doesn't kill mutants
expect(result).toBeTruthy(); // Mutant: return 1 -> return 2 (both truthy)

// GOOD - Kills mutants
expect(result).toBe(1); // Mutant: return 1 -> return 2 (CAUGHT)
```

## CI/CD Integration

Mutation testing runs in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Mutation Testing
  run: bun run test:mutate

- name: Check Mutation Score
  run: |
    SCORE=$(cat reports/mutation/mutation-score.txt)
    if (( $(echo "$SCORE < 80" | bc -l) )); then
      echo "❌ Mutation score $SCORE% is below 80% threshold"
      exit 1
    fi
```
