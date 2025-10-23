/**
 * Constants for Performance Monitoring
 */

export const MONITORING_LIMITS = {
  MAX_HISTORY_SIZE: 1000,
  MEMORY_UPDATE_INTERVAL_MS: 30000,
  RECENT_REQUESTS_LIMIT: 1000,
  TIME_WINDOW_DEFAULT_MS: 300000,
  ONE_HOUR_MS: 3600000,
} as const;

// Export individual constants for direct import
export const TIME_WINDOW_DEFAULT_MS = MONITORING_LIMITS.TIME_WINDOW_DEFAULT_MS;
export const ONE_HOUR_MS = MONITORING_LIMITS.ONE_HOUR_MS;

export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME_HIGH_MS: 1000,
  RESPONSE_TIME_WARNING_MS: 500,
  ERROR_RATE_HIGH_PERCENT: 10,
  ERROR_RATE_WARNING_PERCENT: 5,
  MEMORY_HIGH_MB: 500,
  MEMORY_WARNING_MB: 300,
  HTTP_ERROR_THRESHOLD: 400,
  SLOW_REQUEST_THRESHOLD_MS: 1000,
  SLOW_REQUEST_PERFORMANCE_MS: 1000,
} as const;

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: number;
}

export interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export const MEMORY_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
} as const;

export const MEMORY_UNITS = {
  BYTES_PER_KB: MEMORY_SIZES.KB,
  BYTES_PER_MB: MEMORY_SIZES.MB,
  ROUNDING_PRECISION: 100,
} as const;

export const HTTP_STATUS_GROUPS = {
  INFORMATIONAL: '1xx_Informational',
  SUCCESS: '2xx_Success',
  REDIRECTION: '3xx_Redirection',
  CLIENT_ERROR: '4xx_Client_Error',
  SERVER_ERROR: '5xx_Server_Error',
} as const;

export const STATUS_CODE_RANGES = {
  INFORMATIONAL_MIN: 100,
  INFORMATIONAL_MAX: 199,
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 299,
  REDIRECTION_MIN: 300,
  REDIRECTION_MAX: 399,
  CLIENT_ERROR_MIN: 400,
  CLIENT_ERROR_MAX: 499,
} as const;