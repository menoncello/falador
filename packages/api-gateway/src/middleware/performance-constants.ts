/**
 * Constants for Performance Middleware
 */

export const HTTP_STATUS = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const MEMORY_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
} as const;

export const PERFORMANCE_THRESHOLDS = {
  MAX_RESPONSE_TIME_MS: 1000,
  CLEANUP_INTERVAL_MS: 30000,
  MAX_REQUEST_HISTORY: 1000,
  SLOW_RESPONSE_MS: 400,
  VERY_SLOW_RESPONSE_MS: 1000,
  MAX_MEMORY_MB: 500,
  MAX_MEMORY_BYTES: 500 * MEMORY_SIZES.MB,
} as const;

export const COMPUTED_VALUES = {
  KB_SQUARED: MEMORY_SIZES.KB * MEMORY_SIZES.KB,
  KB_CUBED: MEMORY_SIZES.KB * MEMORY_SIZES.KB * MEMORY_SIZES.KB,
  MB_SQUARED: MEMORY_SIZES.MB * MEMORY_SIZES.MB,
} as const;

export const PERFORMANCE_HEADERS = {
  RESPONSE_TIME: 'x-response-time',
  MEMORY_USAGE: 'x-memory-usage',
} as const;

export interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  ip: string;
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowRequests: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: number;
}