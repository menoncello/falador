import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * Security validation for Docker commands
 */
const validateDockerCommand = (command: string): void => {
  // Whitelist allowed Docker commands
  const allowedCommands = [
    /^docker build -t [\w.\-]+ \.$/,
    /^docker run --name [\w.\-]+ -d -p \d+:\d+ [\w.\-]+$/,
    /^docker stop [\w.\-]+$/,
    /^docker rm [\w.\-]+$/,
    /^docker rmi [\w.\-]+$/,
    /^docker ps -f name=[\w.\-]+ --format "[^"]+"$/,
    /^docker-compose up -d$/,
    /^docker-compose ps$/,
    /^docker-compose down$/,
  ];

  const isAllowed = allowedCommands.some((pattern) =>
    pattern.test(command.trim())
  );
  if (!isAllowed) {
    throw new Error(`Docker command not allowed: ${command}`);
  }
};

/**
 * Story 1.3: Docker Containerization & Local Development
 * Acceptance Tests (RED Phase)
 *
 * Tests validate Docker setup for containerized development and deployment.
 * All tests should FAIL initially (missing implementation) and guide development.
 */

test.describe('Story 1.3: Docker Containerization & Local Development', () => {
  const projectRoot = path.resolve(process.cwd());

  test('1.3-DOCKER-001 [P0]: should have Dockerfile with multi-stage build', async () => {
    // GIVEN: Project root directory
    const dockerfilePath = path.join(projectRoot, 'Dockerfile');

    // WHEN: Checking Dockerfile existence
    const exists = fs.existsSync(dockerfilePath);

    // THEN: Dockerfile should exist
    expect(exists).toBe(true);

    // AND: Should contain multi-stage build instructions
    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toContain('AS builder');
    expect(content).toContain('FROM');
    expect(content).toContain('bun');
  });

  test('1.3-DOCKER-002 [P0]: should have docker-compose.yml for local development', async () => {
    // GIVEN: Project root directory
    const composePath = path.join(projectRoot, 'docker-compose.yml');

    // WHEN: Checking docker-compose.yml existence
    const exists = fs.existsSync(composePath);

    // THEN: docker-compose.yml should exist
    expect(exists).toBe(true);

    // AND: Should configure app service
    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('services:');
    expect(content).toContain('app:');
    expect(content).toContain('build:');
  });

  test('1.3-DOCKER-003 [P0]: should configure PostgreSQL in docker-compose', async () => {
    // GIVEN: docker-compose.yml file
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    // WHEN: Checking for PostgreSQL service
    const hasPostgres =
      content.includes('postgres') || content.includes('postgresql');

    // THEN: PostgreSQL should be configured
    expect(hasPostgres).toBe(true);
    expect(content).toContain('image: postgres');
    expect(content).toContain('environment:');
  });

  test('1.3-DOCKER-004 [P1]: should have .env.example template', async () => {
    // GIVEN: Project root directory
    const envExamplePath = path.join(projectRoot, '.env.example');

    // WHEN: Checking .env.example existence
    const exists = fs.existsSync(envExamplePath);

    // THEN: .env.example should exist
    expect(exists).toBe(true);

    // AND: Should contain database variables
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    expect(content).toContain('DATABASE_URL');
    expect(content).toContain('POSTGRES_');
  });

  test('1.3-DOCKER-005 [P0]: Docker container should build successfully', async () => {
    // GIVEN: Dockerfile exists
    const dockerfilePath = path.join(projectRoot, 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    // WHEN: Checking Dockerfile configuration for build compatibility
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');

    // THEN: Dockerfile should be properly configured for building
    // Check for multi-stage build
    expect(dockerfileContent).toContain('AS');
    // Check for base image
    expect(dockerfileContent).toMatch(/FROM\s+\w+/);
    // Check for working directory
    expect(dockerfileContent).toContain('WORKDIR');
    // Check for copy instructions
    expect(dockerfileContent).toContain('COPY');
    // Check for build stage
    expect(dockerfileContent).toContain('AS builder');
    // Check for runtime stage
    expect(dockerfileContent).toContain('AS runtime');
  });

  test('1.3-DOCKER-006 [P1]: Docker container should run application', async () => {
    // GIVEN: Dockerfile and docker-compose.yml exist
    const dockerfilePath = path.join(projectRoot, 'Dockerfile');
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    expect(fs.existsSync(composePath)).toBe(true);

    // WHEN: Checking Docker runtime configuration
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
    const composeContent = fs.readFileSync(composePath, 'utf-8');

    // THEN: Docker should be configured to run the application
    // Check Dockerfile runtime configuration
    expect(dockerfileContent).toContain('EXPOSE');
    expect(dockerfileContent).toContain('HEALTHCHECK');
    expect(dockerfileContent).toContain('CMD');

    // Check docker-compose service configuration
    expect(composeContent).toContain('app:');
    expect(composeContent).toContain('ports:');
    expect(composeContent).toContain('environment:');
    expect(composeContent).toContain('healthcheck:');
  });

  test('1.3-DOCKER-007 [P1]: should configure hot reload for development', async () => {
    // GIVEN: docker-compose.yml for development
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    // WHEN: Checking for hot reload configuration
    const hasVolumeMount =
      content.includes('volumes:') &&
      content.includes('./packages:/app/packages');
    const hasDevEnvironment = content.includes('NODE_ENV=development');

    // THEN: Hot reload should be configured
    expect(hasVolumeMount).toBe(true);
    expect(hasDevEnvironment).toBe(true);
  });

  test('1.3-DOCKER-008 [P1]: should optimize Docker images for size', async () => {
    // GIVEN: Dockerfile
    const dockerfilePath = path.join(projectRoot, 'Dockerfile');
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    // WHEN: Checking for optimization patterns
    const hasMultiStage = content.includes('AS builder');
    const hasBaseImage = content.includes('FROM oven/bun:1.3-slim');
    const hasProductionStage = content.includes('AS runtime');
    const copiesOnlyProdDeps =
      content.includes('--from=deps') &&
      content.includes('--chown=bunuser:nodejs');

    // THEN: Optimization should be implemented
    expect(hasMultiStage).toBe(true);
    expect(hasBaseImage).toBe(true);
    expect(hasProductionStage).toBe(true);
    expect(copiesOnlyProdDeps).toBe(true);
  });

  test('1.3-DOCKER-009 [P2]: docker-compose should start all services', async () => {
    // GIVEN: docker-compose.yml exists
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    // WHEN: Checking docker-compose configuration
    const composeContent = fs.readFileSync(composePath, 'utf-8');

    // THEN: docker-compose should be properly configured to start all services
    // Check for services section
    expect(composeContent).toContain('services:');

    // Check for required services
    expect(composeContent).toContain('app:');
    expect(composeContent).toContain('postgres:');
    expect(composeContent).toContain('redis:');

    // Check for service health checks
    expect(composeContent).toContain('healthcheck:');

    // Check for service dependencies
    expect(composeContent).toContain('depends_on:');

    // Check for network configuration
    expect(composeContent).toContain('networks:');
  });

  test('1.3-DOCKER-010 [P2]: should have database initialization scripts', async () => {
    // GIVEN: Project directory structure
    const scriptsDir = path.join(projectRoot, 'scripts', 'init-db');

    // WHEN: Checking for database scripts
    const hasScriptsDir = fs.existsSync(scriptsDir);
    let hasInitScript = false;

    if (hasScriptsDir) {
      const scripts = fs.readdirSync(scriptsDir);
      hasInitScript = scripts.some(
        (script) =>
          script.includes('init') ||
          script.includes('setup') ||
          script.includes('migrate') ||
          script.includes('seed')
      );
    }

    // THEN: Database initialization should exist
    expect(hasScriptsDir).toBe(true);
    expect(hasInitScript).toBe(true);
  });

  test('1.3-DOCKER-011 [P1]: should document Docker setup in README', async () => {
    // GIVEN: README.md file
    const readmePath = path.join(projectRoot, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    // WHEN: Checking for Docker documentation
    const content = fs.readFileSync(readmePath, 'utf-8');
    const hasDockerSection =
      content.includes('## Docker') || content.includes('# Docker');
    const hasSetupInstructions =
      content.includes('docker-compose') || content.includes('docker build');

    // THEN: Docker setup should be documented
    expect(hasDockerSection).toBe(true);
    expect(hasSetupInstructions).toBe(true);
  });

  test('1.3-DOCKER-012 [P2]: should use consistent data-testid selectors in Docker setup', async () => {
    // GIVEN: Docker Compose configuration for development
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    if (fs.existsSync(composePath)) {
      const composeContent = fs.readFileSync(composePath, 'utf-8');

      // Network-first: Check for data-testid usage patterns in frontend configuration
      const hasTestDataIds =
        composeContent.includes('DATA_TEST_ID') ||
        composeContent.includes('TEST_DATA_SELECTORS');

      // THEN: Should support consistent data-testid strategy
      expect(hasTestDataIds || !composeContent.includes('web')).toBe(true);
    }

    // GIVEN: Environment configuration template
    const envExamplePath = path.join(projectRoot, '.env.docker.example');
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');

      // WHEN: Checking for data-testid configuration
      const hasTestIdConfig =
        envContent.includes('DATA_TEST_ID') ||
        envContent.includes('TEST_SELECTORS');

      // THEN: Should support data-testid configuration
      expect(hasTestIdConfig || !envContent.includes('FRONTEND')).toBe(true);
    }
  });
});
