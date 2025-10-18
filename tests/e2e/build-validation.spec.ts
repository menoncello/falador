import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { parse } from 'yaml';

/**
 * Build Process Validation Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #6: Build Process Validation
 *
 * Tests validate that Docker build process is configured
 * and validated in the CI environment.
 */

test.describe('Story 1.2: Build Process Validation (AC #6)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-019 [P0]: should have build job in CI', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking for build job
    const hasBuildJob = workflow.jobs?.build !== undefined;

    // THEN: build job should exist
    expect(hasBuildJob).toBe(true);
  });

  test('1.2-CI-020 [P1]: should build Docker image', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Checking for Docker build command
    const hasDockerBuild = content.includes('docker build');

    // THEN: Docker build should run in CI
    expect(hasDockerBuild).toBe(true);
  });

  test('1.2-CI-021 [P0]: should have Dockerfile.api', async () => {
    // GIVEN: Project root directory
    const dockerfilePath = path.join(projectRoot, 'Dockerfile.api');

    // WHEN: Checking if Dockerfile exists
    const exists = fs.existsSync(dockerfilePath);

    // THEN: Dockerfile should exist
    expect(exists).toBe(true);
  });
});
