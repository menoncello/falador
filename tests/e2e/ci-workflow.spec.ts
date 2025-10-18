import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { parse } from 'yaml';

/**
 * CI Workflow Configuration Tests
 *
 * Story 1.2: CI/CD Pipeline & Testing Infrastructure
 * Acceptance Criteria #1: GitHub Actions CI Workflow Configured
 *
 * Tests validate that GitHub Actions CI workflow is properly configured
 * with all required jobs (lint, test, build).
 */

test.describe('Story 1.2: GitHub Actions CI Workflow (AC #1)', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.2-CI-001 [P0]: should have ci.yml workflow file', async () => {
    // GIVEN: Project root directory
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );

    // WHEN: Checking if ci.yml exists
    const exists = fs.existsSync(workflowPath);

    // THEN: Workflow file should exist
    expect(exists).toBe(true);
  });

  test('1.2-CI-002 [P0]: should have valid YAML syntax in ci.yml', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // WHEN: Parsing YAML content
    const parseYaml = (): unknown => parse(content);

    // THEN: YAML should parse without errors
    expect(parseYaml).not.toThrow();
  });

  test('1.2-CI-003 [P0]: should configure pull_request trigger', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking workflow triggers
    const hasPullRequestTrigger =
      workflow.on?.pull_request !== undefined ||
      (Array.isArray(workflow.on) && workflow.on.includes('pull_request'));

    // THEN: pull_request trigger should be configured
    expect(hasPullRequestTrigger).toBe(true);
  });

  test('1.2-CI-004 [P0]: should have lint job', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking for lint job
    const hasLintJob = workflow.jobs?.lint !== undefined;

    // THEN: lint job should exist
    expect(hasLintJob).toBe(true);
  });

  test('1.2-CI-005 [P0]: should have test job', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking for test job
    const hasTestJob = workflow.jobs?.test !== undefined;

    // THEN: test job should exist
    expect(hasTestJob).toBe(true);
  });

  test('1.2-CI-006 [P1]: should configure PostgreSQL service', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking test job services
    const hasPostgresService =
      workflow.jobs?.test?.services?.postgres !== undefined;

    // THEN: PostgreSQL service should be configured
    expect(hasPostgresService).toBe(true);
  });

  test('1.2-CI-007 [P1]: should configure Redis service', async () => {
    // GIVEN: ci.yml workflow file
    const workflowPath = path.join(
      projectRoot,
      '.github',
      'workflows',
      'ci.yml'
    );
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = parse(content);

    // WHEN: Checking test job services
    const hasRedisService = workflow.jobs?.test?.services?.redis !== undefined;

    // THEN: Redis service should be configured
    expect(hasRedisService).toBe(true);
  });
});
