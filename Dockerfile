# Multi-stage Dockerfile for Falador Audiobook Platform
# Optimized for Bun runtime and monorepo structure with Turborepo

# Stage 1: Dependencies
# Install all dependencies (including dev dependencies for building)
FROM oven/bun:1.3 AS deps
WORKDIR /app

# Copy package files for the entire workspace
COPY package.json bun.lock ./

# Install all dependencies for building
# Ignore prepare scripts (husky) as they're only needed for local development
RUN bun install --no-cache --ignore-scripts

# Copy individual package files to ensure workspace dependencies are resolved
COPY packages/api-gateway/package.json ./packages/api-gateway/
COPY packages/application/package.json ./packages/application/
COPY packages/cli/package.json ./packages/cli/
COPY packages/core-domain/package.json ./packages/core-domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/job-worker/package.json ./packages/job-worker/

# Stage 2: Builder
# Build TypeScript code for all packages using Turborepo
FROM oven/bun:1.3 AS builder
WORKDIR /app

# Set build environment
ENV NODE_ENV=production
ENV BUILDKIT_INLINE_CACHE=1

# Copy all dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules

# Copy source code
COPY . .

# Run type checking and build all packages
RUN bun run typecheck
RUN bun run build

# Stage 3: Production runtime
# Minimal runtime image with only production dependencies
FROM oven/bun:1.3-slim AS runtime
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser

# Copy package files
COPY package.json bun.lock ./
COPY packages/api-gateway/package.json ./packages/api-gateway/
COPY packages/application/package.json ./packages/application/
COPY packages/cli/package.json ./packages/cli/
COPY packages/core-domain/package.json ./packages/core-domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/job-worker/package.json ./packages/job-worker/

# Copy only production dependencies from deps stage
COPY --from=deps --chown=bunuser:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=bunuser:nodejs /app/packages/*/node_modules ./packages/*/

# Copy built artifacts from builder stage
COPY --from=builder --chown=bunuser:nodejs /app/packages/*/dist ./packages/*/

# Switch to non-root user
USER bunuser

# Expose ports for API Gateway and other services
EXPOSE 3000

# Health check for API Gateway
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run --bun -e "import('./packages/api-gateway/src/index.js').then(m => m.startServer())" || exit 1

# Default command starts API Gateway (can be overridden for different services)
CMD ["bun", "run", "--bun", "-e", "import('./packages/api-gateway/src/index.js').then(m => m.startServer())"]