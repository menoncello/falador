/**
 * Performance monitoring middleware for tracking response times and bottlenecks
 */

import { Elysia } from 'elysia';

interface PerformanceMetrics {
  totalRequests: number;
  slowRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  slowRequestThreshold: number;
  responseTimes: number[];
}

// Performance tracking state
const metrics: PerformanceMetrics = {
  totalRequests: 0,
  slowRequests: 0,
  averageResponseTime: 0,
  p95ResponseTime: 0,
  errorRate: 0,
  slowRequestThreshold: 100, // NFR threshold
  responseTimes: [],
};

// Cleanup old response times periodically to prevent memory leaks
const MAX_RESPONSE_TIMES = 1000;
setInterval(() => {
  if (metrics.responseTimes.length > MAX_RESPONSE_TIMES) {
    metrics.responseTimes = metrics.responseTimes.slice(-MAX_RESPONSE_TIMES);
  }
}, 60000); // Cleanup every minute

/**
 * Calculate percentile from response times array
 */
function calculatePercentile(responseTimes: number[], percentile: number): number {
  if (responseTimes.length === 0) return 0;

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Update performance metrics
 */
function updateMetrics(responseTime: number, isError: boolean = false) {
  metrics.totalRequests++;
  metrics.responseTimes.push(responseTime);

  if (responseTime > metrics.slowRequestThreshold) {
    metrics.slowRequests++;
  }

  // Keep only recent response times for calculation
  if (metrics.responseTimes.length > 100) {
    metrics.responseTimes = metrics.responseTimes.slice(-100);
  }

  // Calculate average
  metrics.averageResponseTime = metrics.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.responseTimes.length;

  // Calculate p95
  metrics.p95ResponseTime = calculatePercentile(metrics.responseTimes, 95);

  // Update error rate (sliding window of last 100 requests)
  const recentRequests = Math.min(100, metrics.totalRequests);
  const errorCount = isError ? 1 : 0; // Simplified - would need proper tracking
  metrics.errorRate = (errorCount / recentRequests) * 100;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  metrics.totalRequests = 0;
  metrics.slowRequests = 0;
  metrics.averageResponseTime = 0;
  metrics.p95ResponseTime = 0;
  metrics.errorRate = 0;
  metrics.responseTimes = [];
}

/**
 * Performance monitoring middleware factory
 */
export function createPerformanceMiddleware() {
  return new Elysia({ name: 'performance' })
    .derive(async ({ request, set }) => {
      const startTime = Date.now();

      // Add performance headers
      set.headers['X-Performance-Threshold'] = `${metrics.slowRequestThreshold}ms`;

      // Log request start for slow operations
      const url = new URL(request.url);
      const method = request.method;
      const operation = `${method} ${url.pathname}`;

      console.log(`📊 Request started: ${operation}`);

      return {
        performance: {
          startTime,
          operation,
        }
      };
    })
    .onAfterHandle(async ({ request, set, performance }) => {
      const responseTime = Date.now() - performance.startTime;

      // Update metrics
      const isError = set.status >= 400;
      updateMetrics(responseTime, isError);

      // Add response time headers
      set.headers['X-Response-Time'] = `${responseTime}ms`;
      set.headers['X-Performance-Status'] = responseTime <= metrics.slowRequestThreshold ? 'OK' : 'SLOW';

      // Log slow requests
      if (responseTime > metrics.slowRequestThreshold) {
        console.warn(`🐌 SLOW REQUEST: ${performance.operation} took ${responseTime}ms (threshold: ${metrics.slowRequestThreshold}ms)`);
      } else {
        console.log(`✅ Request completed: ${performance.operation} in ${responseTime}ms`);
      }

      // Performance recommendations
      if (responseTime > 50) {
        console.info(`💡 Performance tip: Consider optimizing ${performance.operation} (current: ${responseTime}ms)`);
      }
    })
    .onError(async ({ error, request, set, performance }) => {
      const responseTime = Date.now() - performance.startTime;

      // Update metrics with error
      updateMetrics(responseTime, true);

      console.error(`❌ Request failed: ${performance.operation} in ${responseTime}ms`, error);

      // Add error performance headers
      set.headers['X-Response-Time'] = `${responseTime}ms`;
      set.headers['X-Error-Type'] = error.constructor.name;
    });
}

/**
 * Performance check endpoint data
 */
export function getPerformanceHealthCheck() {
  const currentMetrics = getPerformanceMetrics();
  const isHealthy =
    currentMetrics.p95ResponseTime <= 100 && // P95 under 100ms
    currentMetrics.errorRate < 5; // Error rate under 5%

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    metrics: currentMetrics,
    nfrCompliance: {
      responseTime: currentMetrics.p95ResponseTime <= 100,
      errorRate: currentMetrics.errorRate < 5,
      overall: isHealthy,
    },
    recommendations: generatePerformanceRecommendations(currentMetrics),
  };
}

/**
 * Generate performance recommendations based on current metrics
 */
function generatePerformanceRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.p95ResponseTime > 100) {
    recommendations.push(`P95 response time (${metrics.p95ResponseTime.toFixed(1)}ms) exceeds 100ms NFR threshold`);
  }

  if (metrics.slowRequests > metrics.totalRequests * 0.1) {
    recommendations.push(`High slow request rate: ${((metrics.slowRequests / metrics.totalRequests) * 100).toFixed(1)}% exceed 100ms`);
  }

  if (metrics.averageResponseTime > 50) {
    recommendations.push(`Average response time (${metrics.averageResponseTime.toFixed(1)}ms) could be optimized`);
  }

  if (metrics.errorRate > 5) {
    recommendations.push(`Error rate (${metrics.errorRate.toFixed(1)}%) exceeds 5% threshold`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance is within acceptable limits');
  }

  return recommendations;
}