import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * Code Coverage Configuration Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #3: Code Coverage Reporting (80% minimum)
 *
 * Tests validate that code coverage reporting is configured with
 * appropriate thresholds and CI integration.
 */

test.describe('Story 1.2: Code Coverage Reporting (AC #3)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-008 [P0]: should have c8 coverage tool installed', async () => {
    // GIVEN: package.json dependencies
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // WHEN: Checking for c8 dependency
    const hasC8 = packageJson.devDependencies?.c8 !== undefined;

    // THEN: c8 should be installed
    expect(hasC8).toBe(true);
  });

  test('1.2-CI-009 [P0]: should have test:coverage script', async () => {
    // GIVEN: package.json scripts
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // WHEN: Checking for test:coverage script
    const hasCoverageScript =
      packageJson.scripts?.['test:coverage'] !== undefined;

    // THEN: test:coverage script should exist
    expect(hasCoverageScript).toBe(true);
  });

  test('1.2-CI-010 [P0]: should have .c8rc.json configuration', async () => {
    // GIVEN: Project root directory
    const c8ConfigPath = path.join(projectRoot, '.c8rc.json');

    // WHEN: Checking if .c8rc.json exists
    const exists = fs.existsSync(c8ConfigPath);

    // THEN: Configuration file should exist
    expect(exists).toBe(true);
  });

  test('1.2-CI-011 [P0]: should configure 80% coverage threshold', async () => {
    // GIVEN: .c8rc.json configuration
    const c8ConfigPath = path.join(projectRoot, '.c8rc.json');
    const config = JSON.parse(fs.readFileSync(c8ConfigPath, 'utf-8'));

    // WHEN: Checking coverage thresholds
    const lineThreshold = config.lines || config['check-coverage']?.lines;

    // THEN: Line coverage threshold should be 80%
    expect(lineThreshold).toBeGreaterThanOrEqual(80);
  });

  test('1.2-CI-012 [P1]: should upload coverage to Codecov', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Checking for Codecov upload step
    const hasCodecovUpload =
      content.includes('codecov/codecov-action') ||
      content.includes('codecov-action');

    // THEN: Codecov upload step should exist
    expect(hasCodecovUpload).toBe(true);
  });
});
