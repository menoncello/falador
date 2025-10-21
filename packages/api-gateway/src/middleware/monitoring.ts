/**
 * Monitoring Middleware for Enhanced Observability
 *
 * Provides request tracking, performance monitoring, and alerting
 * for critical endpoints like user registration.
 */

import type { MiddlewareHandler } from 'elysia';

interface MonitoringMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastError?: string;
  lastErrorTime?: Date;
}

const metrics = new Map<string, MonitoringMetrics>();

// Alert thresholds
const ALERT_THRESHOLDS = {
  ERROR_RATE: 0.05, // 5% error rate triggers alert
  RESPONSE_TIME: 1000, // 1 second response time triggers alert
  ERROR_COUNT_5MIN: 10, // 10 errors in 5 minutes triggers alert
} as const;

/**
 * Create monitoring middleware for enhanced endpoint observability
 */
export function createMonitoringMiddleware(): MiddlewareHandler {
  return async ({ request, set, path, method }, next) => {
    const startTime = Date.now();
    const routeKey = `${method} ${path}`;

    // Initialize metrics if not exists
    if (!metrics.has(routeKey)) {
      metrics.set(routeKey, {
        requestCount: 0,
        averageResponseTime: 0,
        errorCount: 0,
      });
    }

    const routeMetrics = metrics.get(routeKey)!;
    routeMetrics.requestCount++;

    try {
      // Execute the request
      const response = await next();

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Update rolling average response time
      routeMetrics.averageResponseTime =
        (routeMetrics.averageResponseTime * (routeMetrics.requestCount - 1) +
          responseTime) /
        routeMetrics.requestCount;

      // Check for performance issues
      if (responseTime > ALERT_THRESHOLDS.RESPONSE_TIME) {
        console.warn(
          `🐌 SLOW REQUEST: ${routeKey} took ${responseTime}ms (threshold: ${ALERT_THRESHOLDS.RESPONSE_TIME}ms)`
        );

        // Add performance header for monitoring systems
        if (response && typeof response === 'object') {
          (response as any).headers = {
            ...(response as any).headers,
            'X-Response-Time': responseTime.toString(),
            'X-Performance-Alert':
              responseTime > ALERT_THRESHOLDS.RESPONSE_TIME ? 'true' : 'false',
          };
        }
      }

      // Log successful requests for critical endpoints
      if (path.includes('/auth/register') || path.includes('/auth/login')) {
        console.log(
          `✅ AUTH_SUCCESS: ${routeKey} - ${responseTime}ms - IP: ${request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown'}`
        );
      }

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Update error metrics
      routeMetrics.errorCount++;
      routeMetrics.lastError =
        error instanceof Error ? error.message : 'Unknown error';
      routeMetrics.lastErrorTime = new Date();

      // Calculate error rate
      const errorRate = routeMetrics.errorCount / routeMetrics.requestCount;

      // Log errors with context
      console.error(
        `❌ REQUEST_ERROR: ${routeKey} - ${responseTime}ms - Error: ${routeMetrics.lastError}`
      );

      // Alert on high error rates
      if (errorRate > ALERT_THRESHOLDS.ERROR_RATE) {
        console.error(
          `🚨 HIGH_ERROR_RATE: ${routeKey} - ${(errorRate * 100).toFixed(1)}% error rate (threshold: ${(ALERT_THRESHOLDS.ERROR_RATE * 100).toFixed(1)}%)`
        );

        // Add error headers for monitoring systems
        set.headers['X-Error-Rate'] = (errorRate * 100).toFixed(1);
        set.headers['X-Error-Alert'] = 'true';
      }

      // Critical endpoint failures need immediate attention
      if (path.includes('/auth/register')) {
        console.error(
          `🚨 CRITICAL: Registration endpoint failing - ${routeMetrics.lastError}`
        );
        set.headers['X-Critical-Error'] = 'true';
      }

      throw error;
    }
  };
}

/**
 * Get monitoring metrics for health checks
 */
export function getMonitoringMetrics(): Record<string, MonitoringMetrics> {
  const metricsObj: Record<string, MonitoringMetrics> = {};

  for (const [key, value] of metrics.entries()) {
    metricsObj[key] = { ...value };
  }

  return metricsObj;
}

/**
 * Reset monitoring metrics (useful for testing)
 */
export function resetMonitoringMetrics(): void {
  metrics.clear();
}

/**
 * Health check endpoint for monitoring systems
 */
export function createHealthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    metrics: getMonitoringMetrics(),
    alerts: {
      slowEndpoints: Array.from(metrics.entries())
        .filter(
          ([_, m]) => m.averageResponseTime > ALERT_THRESHOLDS.RESPONSE_TIME
        )
        .map(([route, _]) => route),
      highErrorEndpoints: Array.from(metrics.entries())
        .filter(
          ([_, m]) =>
            m.errorCount / m.requestCount > ALERT_THRESHOLDS.ERROR_RATE
        )
        .map(([route, _]) => route),
    },
  };
}
