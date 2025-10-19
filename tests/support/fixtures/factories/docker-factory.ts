import { faker } from '@faker-js/faker';

/**
 * Docker test data factory with faker-based data generation
 *
 * Creates Docker-specific test data with controlled values:
 * - Container names and configurations
 * - Environment variables
 * - Port mappings
 * - Volume mounts
 * - Network configurations
 *
 * Follows factory pattern: createDockerX(overrides) for parallel-safe tests
 */

// Docker container configuration
export interface DockerContainer {
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  networks: string[];
  command?: string;
  workingDir?: string;
  user?: string;
}

// Docker compose service configuration
export interface DockerComposeService {
  name: string;
  image?: string;
  build?: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  depends_on: string[];
  networks: string[];
  healthcheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
  };
}

// Environment variable configuration
export interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  redisUrl: string;
  logLevel: string;
  port: number;
  secretKey: string;
}

// Port mapping configuration
export interface PortMapping {
  host: number;
  container: number;
  protocol: 'tcp' | 'udp';
}

// Volume mount configuration
export interface VolumeMount {
  host: string;
  container: string;
  mode: 'ro' | 'rw';
}

/**
 * Create Docker container configuration
 */
export const createDockerContainer = (
  overrides: Partial<DockerContainer> = {}
): DockerContainer => ({
  name: `test-${faker.string.alphanumeric(8)}`,
  image: 'nginx:alpine',
  ports: ['8080:80'],
  environment: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'debug',
  },
  volumes: ['/app/node_modules:/app/node_modules'],
  networks: ['test-network'],
  command: 'npm start',
  workingDir: '/app',
  user: 'node',
  ...overrides,
});

/**
 * Create Docker Compose service configuration
 */
export const createDockerComposeService = (
  overrides: Partial<DockerComposeService> = {}
): DockerComposeService => ({
  name: `${faker.word.adjective()}-${faker.word.noun()}`,
  image: `${faker.word.adjective()}:${faker.system.semver()}`,
  ports: ['3000:3000'],
  environment: {
    NODE_ENV: 'development',
    PORT: '3000',
  },
  volumes: ['.:/app'],
  depends_on: ['postgres', 'redis'],
  networks: ['app-network'],
  healthcheck: {
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
    interval: '30s',
    timeout: '10s',
    retries: 3,
  },
  ...overrides,
});

/**
 * Create application Docker Compose service
 */
export const createAppService = (
  overrides: Partial<DockerComposeService> = {}
): DockerComposeService => ({
  name: 'app',
  build: '.',
  ports: ['3000:3000'],
  environment: {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://falador:password@postgres:5432/falador',
    REDIS_URL: 'redis://redis:6379',
    LOG_LEVEL: 'debug',
  },
  volumes: ['.:/app', '/app/node_modules'],
  depends_on: ['postgres', 'redis'],
  networks: ['app-network'],
  healthcheck: {
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
    interval: '30s',
    timeout: '10s',
    retries: 3,
  },
  ...overrides,
});

/**
 * Create PostgreSQL Docker Compose service
 */
export const createPostgresService = (
  overrides: Partial<DockerComposeService> = {}
): DockerComposeService => ({
  name: 'postgres',
  image: 'postgres:17.4',
  ports: ['5432:5432'],
  environment: {
    POSTGRES_USER: 'falador',
    POSTGRES_PASSWORD: faker.internet.password({ length: 12 }),
    POSTGRES_DB: 'falador',
    POSTGRES_INITDB_ARGS: '--encoding=UTF-8 --lc-collate=C --lc-ctype=C',
  },
  volumes: [
    'postgres_data:/var/lib/postgresql/data',
    './scripts/docker:/docker-entrypoint-initdb.d',
  ],
  depends_on: [],
  networks: ['app-network'],
  healthcheck: {
    test: ['CMD-SHELL', 'pg_isready -U falador'],
    interval: '10s',
    timeout: '5s',
    retries: 5,
  },
  ...overrides,
});

/**
 * Create Redis Docker Compose service
 */
export const createRedisService = (
  overrides: Partial<DockerComposeService> = {}
): DockerComposeService => ({
  name: 'redis',
  image: 'redis:7.0-alpine',
  ports: ['6379:6379'],
  environment: {},
  volumes: ['redis_data:/data'],
  depends_on: [],
  networks: ['app-network'],
  healthcheck: {
    test: ['CMD', 'redis-cli', 'ping'],
    interval: '10s',
    timeout: '3s',
    retries: 3,
  },
  ...overrides,
});

/**
 * Create environment configuration
 */
export const createEnvironmentConfig = (
  overrides: Partial<EnvironmentConfig> = {}
): EnvironmentConfig => ({
  nodeEnv: 'development',
  databaseUrl: 'postgresql://falador:password@localhost:5432/falador',
  redisUrl: 'redis://localhost:6379',
  logLevel: 'debug',
  port: 3000,
  secretKey: faker.string.alphanumeric(32),
  ...overrides,
});

/**
 * Create production environment configuration
 */
export const createProductionEnvironmentConfig = (
  overrides: Partial<EnvironmentConfig> = {}
): EnvironmentConfig => ({
  nodeEnv: 'production',
  databaseUrl: 'postgresql://falador:${DB_PASSWORD}@postgres:5432/falador',
  redisUrl: 'redis://redis:6379',
  logLevel: 'info',
  port: 3000,
  secretKey: faker.string.alphanumeric(64),
  ...overrides,
});

/**
 * Create port mapping
 */
export const createPortMapping = (
  overrides: Partial<PortMapping> = {}
): PortMapping => ({
  host: faker.number.int({ min: 8000, max: 9999 }),
  container: faker.number.int({ min: 3000, max: 5000 }),
  protocol: 'tcp',
  ...overrides,
});

/**
 * Create volume mount
 */
export const createVolumeMount = (
  overrides: Partial<VolumeMount> = {}
): VolumeMount => ({
  host: faker.system.filePath(),
  container: '/app',
  mode: 'rw',
  ...overrides,
});

/**
 * Create complete Docker Compose configuration
 */
export const createDockerComposeConfig = (
  services: Partial<DockerComposeService>[] = []
) => {
  const defaultServices = [
    createAppService(),
    createPostgresService(),
    createRedisService(),
  ];

  const allServices =
    services.length > 0
      ? services.map((service) => createDockerComposeService(service))
      : defaultServices;

  const servicesObject = allServices.reduce(
    (acc, service) => {
      acc[service.name] = {
        ...(service.image && { image: service.image }),
        ...(service.build && { build: service.build }),
        ports: service.ports,
        environment: service.environment,
        volumes: service.volumes,
        ...(service.depends_on.length > 0 && {
          depends_on: service.depends_on,
        }),
        ...(service.networks.length > 0 && { networks: service.networks }),
        ...(service.healthcheck && {
          healthcheck: {
            test: service.healthcheck.test,
            interval: service.healthcheck.interval,
            timeout: service.healthcheck.timeout,
            retries: service.healthcheck.retries,
          },
        }),
      };
      return acc;
    },
    {} as Record<string, any>
  );

  return {
    version: '3.8',
    services: servicesObject,
    networks: {
      'app-network': {
        driver: 'bridge',
      },
    },
    volumes: {
      postgres_data: {
        driver: 'local',
      },
      redis_data: {
        driver: 'local',
      },
    },
  };
};

/**
 * Create Dockerfile content
 */
export const createDockerfileContent = (
  options: {
    baseImage?: string;
    nodeVersion?: string;
    workdir?: string;
    packageManager?: string;
    buildCommand?: string;
    startCommand?: string;
    ports?: number[];
    optimizations?: boolean;
  } = {}
) => {
  const {
    baseImage = 'oven/bun:slim',
    nodeVersion = '18',
    workdir = '/app',
    packageManager = 'bun',
    buildCommand = 'npm run build',
    startCommand = 'npm start',
    ports = [3000],
    optimizations = true,
  } = options;

  let content = `# Multi-stage build for optimized production image
FROM ${baseImage} AS base
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR ${workdir}

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ${workdir}/
RUN ${
    packageManager === 'bun'
      ? 'bun install --frozen-lockfile'
      : packageManager === 'pnpm'
        ? 'pnpm i --frozen-lockfile'
        : packageManager === 'yarn'
          ? 'yarn install --frozen-lockfile'
          : 'npm ci'
  }

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR ${workdir}
COPY --from=deps ${workdir}/node_modules ./node_modules
COPY . .

# Build the application
RUN ${buildCommand}`;

  if (optimizations) {
    content += `

# Production image, copy all the files and run the application
FROM base AS runner
WORKDIR ${workdir}

ENV NODE_ENV production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder ${workdir}/public ./public
COPY --from=builder --chown=nextjs:nodejs ${workdir}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs ${workpath}/.next/static ./.next/static

USER nextjs

EXPOSE ${ports.join(', ')}

ENV PORT ${ports[0]}

CMD ["node", "server.js"]`;
  } else {
    content += `

# Simple runtime image
FROM base AS runner
WORKDIR ${workdir}

ENV NODE_ENV production

COPY --from=deps ${workdir}/node_modules ./node_modules
COPY --from=builder ${workdir} ./

USER node

EXPOSE ${ports.join(', ')}

ENV PORT ${ports[0]}

CMD ["${startCommand}"]`;
  }

  return content;
};

/**
 * Create .env.example content
 */
export const createEnvExampleContent = (
  config?: Partial<EnvironmentConfig>
) => {
  const envConfig = createEnvironmentConfig(config);

  return `# Application Configuration
NODE_ENV=${envConfig.nodeEnv}
PORT=${envConfig.port}
LOG_LEVEL=${envConfig.logLevel}

# Database Configuration
DATABASE_URL=${envConfig.databaseUrl}
POSTGRES_USER=falador
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=falador

# Redis Configuration
REDIS_URL=${envConfig.redisUrl}

# Security
SECRET_KEY=${envConfig.secretKey}
JWT_SECRET=your_jwt_secret_here

# Docker Configuration
BUILDKIT_INLINE_CACHE=1
DOCKER_BUILDKIT=1

# Development Configuration
CHOKIDAR_USEPOLLING=true
FAST_REFRESH=true
`;
};
