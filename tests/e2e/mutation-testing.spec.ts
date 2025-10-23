import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { parse } from 'yaml';

/**
 * Mutation Testing Configuration Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #4: Mutation Testing with Stryker
 *
 * Tests validate that Stryker mutation testing is configured with
 * 80% thresholds per CLAUDE.md requirements.
 */

test.describe('Story 1.2: Mutation Testing with Stryker (AC #4)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-013 [P0]: should have Stryker installed', async () => {
    // GIVEN: package.json dependencies
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // WHEN: Checking for Stryker dependency
    const hasStryker =
      packageJson.devDependencies?.['@stryker-mutator/core'] !== undefined;

    // THEN: Stryker should be installed
    expect(hasStryker).toBe(true);
  });

  test('1.2-CI-014 [P0]: should have stryker.config.json', async () => {
    // GIVEN: Project root directory
    const strykerConfigPath = path.join(projectRoot, 'stryker.config.json');

    // WHEN: Checking if stryker.config.json exists
    const exists = fs.existsSync(strykerConfigPath);

    // THEN: Configuration file should exist
    expect(exists).toBe(true);
  });

  test('1.2-CI-015 [P0]: should configure 80% mutation threshold (CLAUDE.md)', async () => {
    // GIVEN: stryker.config.json configuration
    const strykerConfigPath = path.join(projectRoot, 'stryker.config.json');
    const config = JSON.parse(fs.readFileSync(strykerConfigPath, 'utf-8'));

    // WHEN: Checking mutation thresholds
    const breakThreshold = config.thresholds?.break;

    // THEN: Break threshold should be 80% (per CLAUDE.md)
    expect(breakThreshold).toBe(80);
  });

  test('1.2-CI-016 [P0]: should have mutation-test job in CI', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking for mutation-test job
    const hasMutationJob =
      workflow.jobs?.['mutation-test'] !== undefined ||
      workflow.jobs?.['mutation'] !== undefined;

    // THEN: mutation-test job should exist
    expect(hasMutationJob).toBe(true);
  });
});
