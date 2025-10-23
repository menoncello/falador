/**
 * Utility functions for Performance Monitoring
 */

import {
  PERFORMANCE_THRESHOLDS,
  MEMORY_UNITS,
  HTTP_STATUS_GROUPS,
  STATUS_CODE_RANGES,
  type PerformanceMetrics,
  type RequestMetrics
} from './performance-constants';

/**
 * Determines HTTP status group based on status code
 */
export function getStatusGroup(statusCode: number): string {
  if (statusCode >= STATUS_CODE_RANGES.INFORMATIONAL_MIN && statusCode <= STATUS_CODE_RANGES.INFORMATIONAL_MAX) {
    return HTTP_STATUS_GROUPS.INFORMATIONAL;
  }
  if (statusCode >= STATUS_CODE_RANGES.SUCCESS_MIN && statusCode <= STATUS_CODE_RANGES.SUCCESS_MAX) {
    return HTTP_STATUS_GROUPS.SUCCESS;
  }
  if (statusCode >= STATUS_CODE_RANGES.REDIRECTION_MIN && statusCode <= STATUS_CODE_RANGES.REDIRECTION_MAX) {
    return HTTP_STATUS_GROUPS.REDIRECTION;
  }
  if (statusCode >= STATUS_CODE_RANGES.CLIENT_ERROR_MIN && statusCode <= STATUS_CODE_RANGES.CLIENT_ERROR_MAX) {
    return HTTP_STATUS_GROUPS.CLIENT_ERROR;
  }
  return HTTP_STATUS_GROUPS.SERVER_ERROR;
}

/**
 * Groups requests by endpoint
 */
export function groupRequestsByEndpoint(requests: RequestMetrics[]): Record<string, RequestMetrics[]> {
  const endpoints: Record<string, RequestMetrics[]> = {};

  for (const request of requests) {
    const endpoint = `${request.method} ${request.url.split('?')[0]}`;
    if (!endpoints[endpoint]) {
      endpoints[endpoint] = [];
    }
    endpoints[endpoint].push(request);
  }

  return endpoints;
}

/**
 * Calculates endpoint performance metrics
 */
export function calculateEndpointPerformance(requests: RequestMetrics[]): {
  count: number;
  averageResponseTime: number;
  errorRate: number;
} {
  if (requests.length === 0) {
    return {
      count: 0,
      averageResponseTime: 0,
      errorRate: 0,
    };
  }

  const totalTime = requests.reduce((sum, req) => sum + req.responseTime, 0);
  const errorCount = requests.filter((req) => req.statusCode >= PERFORMANCE_THRESHOLDS.HTTP_ERROR_THRESHOLD).length;

  return {
    count: requests.length,
    averageResponseTime: totalTime / requests.length,
    errorRate: (errorCount / requests.length) * 100,
  };
}

/**
 * Updates performance metrics from request data
 */
export function updatePerformanceMetrics(
  currentMetrics: PerformanceMetrics,
  requests: RequestMetrics[],
  startTime: number
): PerformanceMetrics {
  if (requests.length === 0) {
    return currentMetrics;
  }

  const totalResponseTime = requests.reduce((sum, req) => sum + req.responseTime, 0);
  const errorRequests = requests.filter((req) => req.statusCode >= PERFORMANCE_THRESHOLDS.HTTP_ERROR_THRESHOLD);

  return {
    requestCount: requests.length,
    averageResponseTime: totalResponseTime / requests.length,
    errorRate: (errorRequests.length / requests.length) * 100,
    memoryUsage: process.memoryUsage(),
    uptime: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

/**
 * Converts bytes to megabytes
 */
export function bytesToMegabytes(bytes: number): number {
  return bytes / MEMORY_UNITS.BYTES_PER_MB;
}

/**
 * Rounds memory usage for reporting
 */
export function roundMemoryUsage(memoryBytes: number): number {
  const memoryMB = bytesToMegabytes(memoryBytes);
  return Math.round(memoryMB * MEMORY_UNITS.ROUNDING_PRECISION) / MEMORY_UNITS.ROUNDING_PRECISION;
}

/**
 * Validates performance against thresholds
 */
export function validatePerformanceThresholds(metrics: PerformanceMetrics): {
  isHealthy: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check response time
  if (metrics.averageResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_HIGH_MS) {
    errors.push(`High average response time > ${PERFORMANCE_THRESHOLDS.RESPONSE_TIME_HIGH_MS}ms`);
  } else if (metrics.averageResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME_WARNING_MS) {
    warnings.push(`Elevated response time > ${PERFORMANCE_THRESHOLDS.RESPONSE_TIME_WARNING_MS}ms`);
  }

  // Check error rate
  if (metrics.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_HIGH_PERCENT) {
    errors.push(`High error rate > ${PERFORMANCE_THRESHOLDS.ERROR_RATE_HIGH_PERCENT}%`);
  } else if (metrics.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING_PERCENT) {
    warnings.push(`Elevated error rate > ${PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING_PERCENT}%`);
  }

  // Check memory usage
  const memoryUsageMB = bytesToMegabytes(metrics.memoryUsage.heapUsed);
  if (memoryUsageMB > PERFORMANCE_THRESHOLDS.MEMORY_HIGH_MB) {
    errors.push(`High memory usage > ${PERFORMANCE_THRESHOLDS.MEMORY_HIGH_MB}MB`);
  } else if (memoryUsageMB > PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB) {
    warnings.push(`Elevated memory usage > ${PERFORMANCE_THRESHOLDS.MEMORY_WARNING_MB}MB`);
  }

  return {
    isHealthy: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Formats metrics for export
 */
export function formatMetricsForExport(
  metrics: PerformanceMetrics,
  status: ReturnType<typeof validatePerformanceThresholds>
): string {
  return JSON.stringify(
    {
      timestamp: metrics.timestamp,
      uptime: metrics.uptime,
      requestCount: metrics.requestCount,
      averageResponseTime: Math.round(metrics.averageResponseTime * MEMORY_UNITS.ROUNDING_PRECISION) / MEMORY_UNITS.ROUNDING_PRECISION,
      errorRate: Math.round(metrics.errorRate * MEMORY_UNITS.ROUNDING_PRECISION) / MEMORY_UNITS.ROUNDING_PRECISION,
      memoryUsage: {
        heapUsed: roundMemoryUsage(metrics.memoryUsage.heapUsed),
        heapTotal: roundMemoryUsage(metrics.memoryUsage.heapTotal),
        external: roundMemoryUsage(metrics.memoryUsage.external),
      },
      status: {
        healthy: status.isHealthy,
        warnings: status.warnings,
        errors: status.errors,
      },
    },
    null,
    2
  );
}