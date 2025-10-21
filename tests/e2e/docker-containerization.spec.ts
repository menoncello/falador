import { execSync } from 'node:child_process';
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

    // WHEN: Building Docker container
    // NOTE: This will fail initially until Dockerfile is properly implemented
    const buildCommand = 'docker build -t falador-test .';

    // THEN: Build should succeed
    expect(() => {
      validateDockerCommand(buildCommand);
      execSync(buildCommand, { stdio: 'pipe', cwd: projectRoot });
    }).not.toThrow();
  });

  test('1.3-DOCKER-006 [P1]: Docker container should run application', async () => {
    // GIVEN: Docker image is built
    const runCommand =
      'docker run --name falador-test-container -d -p 3000:3000 falador-test';

    // Network-first: Prepare health check monitoring
    let healthCheckPromise: Promise<boolean> | null = null;

    // WHEN: Starting container
    try {
      validateDockerCommand(runCommand);
      execSync(runCommand, { stdio: 'pipe', cwd: projectRoot });

      // Network-first: Start health check immediately after container start
      healthCheckPromise = new Promise((resolve) => {
        const startTime = Date.now();
        const maxWaitTime = 30000; // 30 seconds

        const checkHealth = () => {
          try {
            const healthCommand =
              "docker inspect --format='{{.State.Health.Status}}' falador-test-container";
            const statusCommand =
              "docker inspect --format='{{.State.Running}}' falador-test-container";

            let isHealthy = false;
            let isRunning = false;

            try {
              const healthStatus = execSync(healthCommand, { stdio: 'pipe' })
                .toString()
                .trim();
              isHealthy = healthStatus === 'healthy';
            } catch {
              // No health check configured
            }

            try {
              const runningStatus = execSync(statusCommand, { stdio: 'pipe' })
                .toString()
                .trim();
              isRunning = runningStatus === 'true';
            } catch {
              // Container not accessible
            }

            if (isHealthy || isRunning) {
              resolve(true);
              return;
            }

            if (Date.now() - startTime > maxWaitTime) {
              resolve(false);
              return;
            }

            setTimeout(checkHealth, 1000);
          } catch {
            setTimeout(checkHealth, 1000);
          }
        };

        checkHealth();
      });

      // THEN: Container should be running and healthy
      const statusCommand =
        'docker ps -f name=falador-test-container --format "{{.Status}}"';
      validateDockerCommand(statusCommand);
      const containerStatus = execSync(statusCommand, {
        stdio: 'pipe',
        cwd: projectRoot,
      }).toString();

      expect(containerStatus).toContain('Up');

      // Network-first: Wait for deterministic health check
      if (healthCheckPromise) {
        const isHealthy = await healthCheckPromise;
        expect(isHealthy).toBe(true);
      }
    } finally {
      // Cleanup: Stop and remove container
      try {
        validateDockerCommand('docker stop falador-test-container');
        execSync('docker stop falador-test-container', { stdio: 'pipe' });
        validateDockerCommand('docker rm falador-test-container');
        execSync('docker rm falador-test-container', { stdio: 'pipe' });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('1.3-DOCKER-007 [P1]: should configure hot reload for development', async () => {
    // GIVEN: docker-compose.yml for development
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf-8');

    // WHEN: Checking for hot reload configuration
    const hasVolumeMount =
      content.includes('volumes:') &&
      (content.includes('./packages:/app/packages') || content.includes('.:/app'));
    const hasWatchCommand =
      content.includes('watch') ||
      content.includes('--watch') ||
      content.includes('NODE_ENV=development');

    // THEN: Hot reload should be configured
    expect(hasVolumeMount).toBe(true);
    expect(hasWatchCommand).toBe(true);
  });

  test('1.3-DOCKER-008 [P1]: should optimize Docker images for size', async () => {
    // GIVEN: Dockerfile
    const dockerfilePath = path.join(projectRoot, 'Dockerfile');
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    // WHEN: Checking for optimization patterns
    const hasMultiStage = content.includes('AS builder');
    const hasBaseImage =
      content.includes('FROM oven/bun:slim') ||
      content.includes('FROM oven/bun:alpine') ||
      content.includes('FROM oven/bun:1.3-slim');
    const cleansNodeModules =
      content.includes('rm -rf node_modules') ||
      content.includes('--only=production') ||
      content.includes('--ignore-scripts') ||
      content.includes('COPY --from=deps');

    // THEN: Optimization should be implemented
    expect(hasMultiStage).toBe(true);
    expect(hasBaseImage).toBe(true);
    expect(cleansNodeModules).toBe(true);
  });

  test('1.3-DOCKER-009 [P2]: docker-compose should start all services', async () => {
    // GIVEN: docker-compose.yml exists
    const composePath = path.join(projectRoot, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    // WHEN: Starting all services
    // NOTE: This will fail until docker-compose is properly configured
    expect(() => {
      validateDockerCommand('docker-compose up -d');
      execSync('docker-compose up -d', { stdio: 'pipe', cwd: projectRoot });
    }).not.toThrow();

    // THEN: Services should be healthy
    try {
      validateDockerCommand('docker-compose ps');
      const status = execSync('docker-compose ps', {
        stdio: 'pipe',
        cwd: projectRoot,
      }).toString();
      expect(status).toContain('Up');

      // Cleanup: Stop services
      validateDockerCommand('docker-compose down');
      execSync('docker-compose down', { stdio: 'pipe', cwd: projectRoot });
    } catch {
      // Cleanup on error
      try {
        validateDockerCommand('docker-compose down');
        execSync('docker-compose down', { stdio: 'pipe', cwd: projectRoot });
      } catch {
        // Ignore cleanup errors
      }
      throw new Error('Services failed to start properly');
    }
  });

  test('1.3-DOCKER-010 [P2]: should have database initialization scripts', async () => {
    // GIVEN: Project directory structure
    const scriptsDir = path.join(projectRoot, 'scripts', 'docker');
    const altScriptsDir = path.join(projectRoot, 'scripts', 'init-db');

    // WHEN: Checking for database scripts
    const hasScriptsDir = fs.existsSync(scriptsDir) || fs.existsSync(altScriptsDir);
    let hasInitScript = false;

    const checkDir = (dir: string) => {
      if (fs.existsSync(dir)) {
        const scripts = fs.readdirSync(dir);
        hasInitScript = hasInitScript || scripts.some(
          (script) =>
            script.includes('init') ||
            script.includes('setup') ||
            script.includes('migrate')
        );
      }
    };

    checkDir(scriptsDir);
    checkDir(altScriptsDir);

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
