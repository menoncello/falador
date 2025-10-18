import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { parse } from 'yaml';

/**
 * Deployment Workflow Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #7: Staging Deployment Workflow
 *
 * Tests validate that deployment workflow is configured for
 * GCP Cloud Run with proper authentication and smoke tests.
 */

test.describe('Story 1.2: Deployment Workflow (AC #7)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-022 [P0]: should have deploy.yml workflow', async () => {
    // GIVEN: Project root directory
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'deploy.yml'
    );

    // WHEN: Checking if deploy.yml exists
    const exists = fs.existsSync(workflowPath);

    // THEN: Deployment workflow should exist
    expect(exists).toBe(true);
  });

  test('1.2-CI-023 [P0]: should have valid YAML in deploy.yml', async () => {
    // GIVEN: deploy.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'deploy.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Parsing YAML content
    const parseYaml = (): unknown => parse(content);

    // THEN: YAML should parse without errors
    expect(parseYaml).not.toThrow();
  });

  test('1.2-CI-024 [P1]: should configure GCP authentication', async () => {
    // GIVEN: deploy.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'deploy.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Checking for GCP auth setup
    const hasGCPAuth =
      content.includes('google-github-actions/auth') ||
      content.includes('gcloud auth');

    // THEN: GCP authentication should be configured
    expect(hasGCPAuth).toBe(true);
  });

  test('1.2-CI-025 [P1]: should deploy to Cloud Run', async () => {
    // GIVEN: deploy.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'deploy.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Checking for Cloud Run deployment
    const hasCloudRunDeploy =
      content.includes('cloud run deploy') ||
      content.includes('google-github-actions/deploy-cloudrun');

    // THEN: Cloud Run deployment should be configured
    expect(hasCloudRunDeploy).toBe(true);
  });
});
