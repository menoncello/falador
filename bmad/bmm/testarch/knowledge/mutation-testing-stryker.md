# Mutation Testing with Stryker - Falador Project

## Configuration

Project uses Stryker with 80%+ high threshold requirement:

```json
{
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 80
  }
}
```

## Quality Requirements

- **High Threshold**: 80% mutation score required
- **Break Threshold**: 80% - build fails if below this
- **Coverage Analysis**: perTest mode for precise reporting

## Test Strategies for Mutation Testing

### 1. Business Logic Tests
- Test business rules and validation logic
- Cover edge cases and boundary conditions
- Test error handling and exception paths

### 2. Data Validation Tests
- Test input validation functions
- Cover null/undefined checks
- Test type guards and validation schemas

### 3. Error Path Testing
- Test error conditions and error messages
- Cover failure scenarios in use cases
- Test rollback and cleanup logic

### 4. Integration Tests
- Test component interactions
- Cover database operations and external service calls
- Test API endpoints with various inputs

## Common Mutation Patterns

### 1. Arithmetic Operators
```typescript
// Original
total = price * quantity;

// Mutations
total = price / quantity;  // / mutation
total = price + quantity;  // + mutation
total = price - quantity;  // - mutation
```

### 2. Conditional Statements
```typescript
// Original
if (user.tier === 'pro') {
  return 25;
}

// Mutations
if (user.tier !== 'pro') {  // !== mutation
  return 25;
}
if (false) {                // true/false mutation
  return 25;
}
```

### 3. Logical Operators
```typescript
// Original
if (isValid && hasPermission) {
  // action
}

// Mutations
if (isValid || hasPermission) {  // || mutation
  // action
}
if (!isValid && hasPermission) { // ! mutation
  // action
}
```

## Best Practices

1. **Write tests that kill mutants**
   - Test boundary conditions (0, 1, max values)
   - Test error paths and exceptions
   - Test null/undefined inputs

2. **Avoid meaningless tests**
   - Don't test simple getters/setters
   - Don't test trivial data passing
   - Focus on business logic

3. **Use meaningful assertions**
   - Check specific values, not just truthiness
   - Test both success and failure paths
   - Verify side effects

## Example: Mutation-Killing Test

```typescript
describe('Project validation', () => {
  test('should enforce project limits by tier - 1.5-VAL-001 [P1]', async () => {
    // Arrange
    const freeUser = { id: 'user-1', tier: 'free' };
    const proUser = { id: 'user-2', tier: 'pro' };

    const existingProjects = Array(3).fill(null).map((_, i) => ({
      id: `proj-${i}`,
      userId: 'user-1',
      title: `Project ${i}`
    }));

    mockProjectRepo.findByUserId
      .mockResolvedValueOnce(existingProjects) // Free user at limit
      .mockResolvedValueOnce([]);                // Pro user under limit

    // Act & Assert - Free user at limit
    const freeResult = await useCase.execute({
      userId: freeUser.id,
      title: 'New Project'
    });
    expect(freeResult.success).toBe(false);
    expect(freeResult.error).toContain('limit exceeded');

    // Act & Assert - Pro user under limit
    const proResult = await useCase.execute({
      userId: proUser.id,
      title: 'New Project'
    });
    expect(proResult.success).toBe(true);
  });
});
```

## Running Mutation Tests

```bash
# Run full mutation test
bun run test:mutate

# Run with HTML report
bun run test:mutate:report

# Run specific package
cd packages/api-gateway && bun run test:mutate
```

## Analyzing Results

1. **Review surviving mutants** - Identify test gaps
2. **Check test quality** - Ensure tests aren't too generic
3. **Add targeted tests** - Kill specific mutants
4. **Never lower thresholds** - Add tests instead

## Troubleshooting

### Low Mutation Score
1. **Review test coverage** - Add missing test cases
2. **Check test quality** - Tests may be too generic
3. **Examine surviving mutants** - Understand what's not tested
4. **Add boundary tests** - Test edge cases and error conditions

### Performance Issues
1. **Limit mutation scope** - Exclude non-critical files
2. **Adjust concurrency** - Reduce parallel mutations
3. **Use增量 testing** - Test individual packages
4. **Exclude test files** - Don't mutate test code