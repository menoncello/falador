import 'reflect-metadata';
import { registerDependencies } from '@falador/infrastructure/container';
import { Elysia } from 'elysia';
import { db } from './database.js';
import {
  errorMonitoringPlugin,
  globalErrorHandler,
} from './middleware/error-monitoring-middleware';
import { performancePlugin } from './middleware/performance-middleware';
import { InMemoryProjectRepository } from './repositories/in-memory-project-repository.js';
import { InMemoryUserRepository } from './repositories/in-memory-user-repository.js';
import { authRoutes } from './routes/auth';
import { monitoringRoutes } from './routes/monitoring';
import { projectRoutes } from './routes/projects';

// Initialize DI Container
registerDependencies({
  database: db,
  userRepository: InMemoryUserRepository,
  projectRepository: InMemoryProjectRepository,
});

const PORT = 3000;

const app = new Elysia()
  // Add monitoring plugins
  .use(performancePlugin)
  .use(errorMonitoringPlugin)

  // Enhanced health check endpoint
  .get('/health', ({ getPerformanceMetrics, getUptimeSummary }) => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'falador-api-gateway',
    performance: getPerformanceMetrics
      ? {
          uptime: getPerformanceMetrics().uptime,
          requestCount: getPerformanceMetrics().requestCount,
          averageResponseTime: getPerformanceMetrics().averageResponseTime,
          errorRate: getPerformanceMetrics().errorRate,
        }
      : undefined,
    uptime: getUptimeSummary
      ? {
          status: getUptimeSummary().status,
          availability: getUptimeSummary().availability,
          currentUptime: getUptimeSummary().currentUptime,
          performanceScore: getUptimeSummary().performanceScore,
        }
      : undefined,
  }))

  // Mount route modules
  .use(authRoutes)
  .use(projectRoutes)
  .use(monitoringRoutes)

  // Global error handling
  .onError(globalErrorHandler.error)

  .listen(PORT);

// Only log in development/non-test environments
if (process.env.NODE_ENV !== 'test') {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

export type App = typeof app;
export { app };
