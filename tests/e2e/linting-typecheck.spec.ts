import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * Linting and Type Checking Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #5: Linting and Type Checking in CI
 *
 * Tests validate that ESLint and TypeScript type checking
 * are properly configured in the CI pipeline.
 */

test.describe('Story 1.2: Linting and Type Checking (AC #5)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-017 [P0]: should run ESLint in CI', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Checking lint job steps
    const hasLintCommand =
      content.includes('bun run lint') ||
      content.includes('npm run lint') ||
      content.includes('eslint');

    // THEN: ESLint should run in CI
    expect(hasLintCommand).toBe(true);
  });

  test('1.2-CI-018 [P0]: should run TypeScript type checking', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Checking for typecheck command
    const hasTypecheckCommand =
      content.includes('bun run typecheck') ||
      content.includes('npm run typecheck') ||
      content.includes('tsc --noEmit');

    // THEN: TypeScript checking should run in CI
    expect(hasTypecheckCommand).toBe(true);
  });
});
