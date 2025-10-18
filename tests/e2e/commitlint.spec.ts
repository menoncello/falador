import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * Commitlint Configuration Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #2: Commitlint Hook (Deferred from Story 1.1)
 *
 * Tests validate that commitlint is configured with Husky
 * to enforce conventional commits.
 */

test.describe('Story 1.2: Commitlint Hook (AC #2)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-026 [P1]: should have commitlint installed', async () => {
    // GIVEN: package.json dependencies
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // WHEN: Checking for commitlint dependencies
    const hasCommitlint =
      packageJson.devDependencies?.['@commitlint/cli'] !== undefined;

    // THEN: commitlint should be installed
    expect(hasCommitlint).toBe(true);
  });

  test('1.2-CI-027 [P1]: should have commitlint.config.js', async () => {
    // GIVEN: Project root directory
    const commitlintConfigPath = path.join(projectRoot, 'commitlint.config.js');
    const commitlintConfigCjsPath = path.join(
      projectRoot,
      'commitlint.config.cjs'
    );

    // WHEN: Checking if commitlint config exists
    const exists =
      fs.existsSync(commitlintConfigPath) ||
      fs.existsSync(commitlintConfigCjsPath);

    // THEN: Configuration file should exist
    expect(exists).toBe(true);
  });

  test('1.2-CI-028 [P0]: should have commit-msg hook', async () => {
    // GIVEN: .husky directory
    const hookPath = path.join(projectRoot, '.husky', 'commit-msg');

    // WHEN: Checking if commit-msg hook exists
    const exists = fs.existsSync(hookPath);

    // THEN: Hook file should exist
    expect(exists).toBe(true);
  });

  test('1.2-CI-029 [P0]: should run commitlint in hook', async () => {
    // GIVEN: commit-msg hook file
    const hookPath = path.join(projectRoot, '.husky', 'commit-msg');
    const content = fs.readFileSync(hookPath, 'utf-8');

    // WHEN: Checking hook content
    const runsCommitlint = content.includes('commitlint');

    // THEN: Hook should run commitlint
    expect(runsCommitlint).toBe(true);
  });
});
