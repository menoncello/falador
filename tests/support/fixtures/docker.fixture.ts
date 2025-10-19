import { test as base, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security validation for Docker commands in test fixtures
 */
const validateDockerCommand = (command: string): void => {
  // Simplified validation for Docker commands in test fixtures
  const allowedPatterns = [
    /^docker build -t [\w.\-]+/,
    /^docker run/,
    /^docker stop/,
    /^docker rm/,
    /^docker rmi/,
    /^docker ps/,
    /^docker inspect/,
    /^docker logs/,
    /^docker exec/,
    /^docker-compose up/,
    /^docker-compose down/,
    /^docker-compose ps/,
    /^docker images/,
  ];

  const commandStart = command.trim();
  const isAllowed = allowedPatterns.some((pattern) =>
    pattern.test(commandStart)
  );

  if (!isAllowed) {
    throw new Error(`Docker command not allowed: ${command}`);
  }
};

/**
 * Helper function to build Docker run command with options
 */
const buildDockerRunCommand = (
  imageName: string,
  options: ContainerOptions
): string => {
  const {
    name = '',
    ports = [],
    environment = {},
    volumes = [],
    detached = true,
    remove = false,
  } = options;

  const flags = [];
  if (detached) flags.push('-d');
  if (remove) flags.push('--rm');
  if (name) flags.push(`--name ${name}`);

  const portFlags = ports.map((port) => `-p ${port}`);
  const envFlags = Object.entries(environment).map(
    ([key, value]) => `-e ${key}="${value}"`
  );
  const volumeFlags = volumes.map((volume) => `-v ${volume}`);

  const allFlags = [...flags, ...portFlags, ...envFlags, ...volumeFlags];
  return `docker run ${allFlags.join(' ')} ${imageName}`;
};

/**
 * Docker test fixture with auto-cleanup
 *
 * Provides Docker-specific testing utilities:
 * - Container management (start, stop, cleanup)
 * - Image operations (build, remove)
 * - Compose orchestration
 * - Health checks
 *
 * Auto-cleanup ensures no containers or images leak between tests
 */

interface DockerTestFixtures {
  dockerContainer: {
    build: (imageName: string, dockerfilePath?: string) => void;
    run: (imageName: string, options?: ContainerOptions) => string;
    stop: (containerId: string) => void;
    remove: (containerId: string) => void;
    exec: (containerId: string, command: string) => string;
    logs: (containerId: string) => string;
    healthCheck: (containerId: string, timeout?: number) => Promise<boolean>;
  };
  dockerCompose: {
    up: (services?: string[]) => void;
    down: () => void;
    ps: () => string;
    logs: (service?: string) => string;
    exec: (service: string, command: string) => string;
  };
  dockerImage: {
    remove: (imageName: string) => void;
    exists: (imageName: string) => boolean;
    size: (imageName: string) => string;
  };
}

interface ContainerOptions {
  name?: string;
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  detached?: boolean;
  remove?: boolean;
}

export const test = base.extend<DockerTestFixtures>({
  /**
   * Docker container management fixture
   * Provides container lifecycle operations with automatic cleanup
   */
  dockerContainer: async ({}, use) => {
    const createdContainers: string[] = [];
    const createdImages: string[] = [];

    const container = {
      /**
       * Build Docker image
       */
      build: (imageName: string, dockerfilePath = 'Dockerfile') => {
        const projectRoot = path.resolve(process.cwd());
        const dockerfileFullPath = path.join(projectRoot, dockerfilePath);

        if (!fs.existsSync(dockerfileFullPath)) {
          throw new Error(`Dockerfile not found: ${dockerfileFullPath}`);
        }

        try {
          const buildCommand = `docker build -t ${imageName} -f ${dockerfilePath} .`;
          validateDockerCommand(buildCommand);
          execSync(buildCommand, {
            stdio: 'pipe',
            cwd: projectRoot,
          });
          createdImages.push(imageName);
        } catch (error) {
          throw new Error(
            `Failed to build Docker image ${imageName}: ${error}`
          );
        }
      },

      /**
       * Run Docker container
       */
      run: (imageName: string, options: ContainerOptions = {}) => {
        try {
          const command = buildDockerRunCommand(imageName, options);
          validateDockerCommand(command);

          const containerId = execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
          }).trim();

          createdContainers.push(containerId);
          return containerId;
        } catch (error) {
          throw new Error(`Failed to run container ${imageName}: ${error}`);
        }
      },

      /**
       * Stop container
       */
      stop: (containerId: string) => {
        try {
          const stopCommand = `docker stop ${containerId}`;
          validateDockerCommand(stopCommand);
          execSync(stopCommand, { stdio: 'pipe' });
        } catch (error) {
          throw new Error(`Failed to stop container ${containerId}: ${error}`);
        }
      },

      /**
       * Remove container
       */
      remove: (containerId: string) => {
        try {
          const removeCommand = `docker rm ${containerId}`;
          validateDockerCommand(removeCommand);
          execSync(removeCommand, { stdio: 'pipe' });
          const index = createdContainers.indexOf(containerId);
          if (index > -1) {
            createdContainers.splice(index, 1);
          }
        } catch (error) {
          throw new Error(
            `Failed to remove container ${containerId}: ${error}`
          );
        }
      },

      /**
       * Execute command in container
       */
      exec: (containerId: string, command: string) => {
        try {
          return execSync(`docker exec ${containerId} ${command}`, {
            stdio: 'pipe',
            encoding: 'utf8',
          }).trim();
        } catch (error) {
          throw new Error(
            `Failed to execute command in container ${containerId}: ${error}`
          );
        }
      },

      /**
       * Get container logs
       */
      logs: (containerId: string) => {
        try {
          return execSync(`docker logs ${containerId}`, {
            stdio: 'pipe',
            encoding: 'utf8',
          });
        } catch (error) {
          throw new Error(
            `Failed to get logs for container ${containerId}: ${error}`
          );
        }
      },

      /**
       * Check container health
       */
      healthCheck: async (containerId: string, timeout = 30000) => {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          try {
            const status = execSync(
              `docker inspect --format='{{.State.Health.Status}}' ${containerId}`,
              {
                stdio: 'pipe',
                encoding: 'utf8',
              }
            ).trim();

            if (status === 'healthy') {
              return true;
            }

            if (status === 'unhealthy') {
              return false;
            }

            // If no health check, check if container is running
            const isRunning = execSync(
              `docker inspect --format='{{.State.Running}}' ${containerId}`,
              {
                stdio: 'pipe',
                encoding: 'utf8',
              }
            ).trim();

            if (isRunning === 'true') {
              return true;
            }
          } catch {
            // Container might not be ready yet
          }

          // Wait 1 second before next check
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return false;
      },
    };

    await use(container);

    // Auto-cleanup: Stop and remove all containers
    for (const containerId of createdContainers) {
      try {
        container.stop(containerId);
        container.remove(containerId);
      } catch (error) {
        console.warn(`Failed to cleanup container ${containerId}:`, error);
      }
    }

    // Auto-cleanup: Remove created images
    for (const imageName of createdImages) {
      try {
        execSync(`docker rmi ${imageName}`, { stdio: 'pipe' });
      } catch (error) {
        console.warn(`Failed to cleanup image ${imageName}:`, error);
      }
    }
  },

  /**
   * Docker Compose fixture
   * Provides compose orchestration with automatic cleanup
   */
  dockerCompose: async ({}, use) => {
    const projectRoot = path.resolve(process.cwd());
    const composeFile = path.join(projectRoot, 'docker-compose.yml');

    let isRunning = false;

    const compose = {
      /**
       * Start services
       */
      up: (services: string[] = []) => {
        if (!fs.existsSync(composeFile)) {
          throw new Error(`docker-compose.yml not found: ${composeFile}`);
        }

        try {
          let command = 'docker-compose up -d';
          if (services.length > 0) {
            command += ` ${services.join(' ')}`;
          }

          execSync(command, { stdio: 'pipe', cwd: projectRoot });
          isRunning = true;
        } catch (error) {
          throw new Error(`Failed to start docker-compose: ${error}`);
        }
      },

      /**
       * Stop and remove services
       */
      down: () => {
        if (!isRunning) return;

        try {
          execSync('docker-compose down', { stdio: 'pipe', cwd: projectRoot });
          isRunning = false;
        } catch (error) {
          throw new Error(`Failed to stop docker-compose: ${error}`);
        }
      },

      /**
       * List services status
       */
      ps: () => {
        try {
          return execSync('docker-compose ps', {
            stdio: 'pipe',
            encoding: 'utf8',
            cwd: projectRoot,
          });
        } catch (error) {
          throw new Error(`Failed to get docker-compose status: ${error}`);
        }
      },

      /**
       * Get service logs
       */
      logs: (service?: string) => {
        try {
          let command = 'docker-compose logs';
          if (service) {
            command += ` ${service}`;
          }

          return execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
            cwd: projectRoot,
          });
        } catch (error) {
          throw new Error(`Failed to get docker-compose logs: ${error}`);
        }
      },

      /**
       * Execute command in service
       */
      exec: (service: string, command: string) => {
        try {
          return execSync(`docker-compose exec ${service} ${command}`, {
            stdio: 'pipe',
            encoding: 'utf8',
            cwd: projectRoot,
          });
        } catch (error) {
          throw new Error(
            `Failed to execute command in service ${service}: ${error}`
          );
        }
      },
    };

    await use(compose);

    // Auto-cleanup: Stop services if running
    if (isRunning) {
      try {
        compose.down();
      } catch (error) {
        console.warn('Failed to cleanup docker-compose:', error);
      }
    }
  },

  /**
   * Docker image management fixture
   */
  dockerImage: async ({}, use) => {
    const image = {
      /**
       * Remove Docker image
       */
      remove: (imageName: string) => {
        try {
          execSync(`docker rmi ${imageName}`, { stdio: 'pipe' });
        } catch (error) {
          throw new Error(`Failed to remove image ${imageName}: ${error}`);
        }
      },

      /**
       * Check if image exists
       */
      exists: (imageName: string) => {
        try {
          execSync(`docker inspect --type=image ${imageName}`, {
            stdio: 'pipe',
          });
          return true;
        } catch {
          return false;
        }
      },

      /**
       * Get image size
       */
      size: (imageName: string) => {
        try {
          return execSync(`docker images --format "{{.Size}}" ${imageName}`, {
            stdio: 'pipe',
            encoding: 'utf8',
          }).trim();
        } catch (error) {
          throw new Error(
            `Failed to get image size for ${imageName}: ${error}`
          );
        }
      },
    };

    await use(image);
  },
});

export { expect } from '@playwright/test';
