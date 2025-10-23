/**
 * Constants for Error Monitoring Middleware
 */

export const HTTP_STATUS_CODES = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const ERROR_CATEGORIES = {
  SYSTEM: 'system',
  NETWORK: 'network',
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  BUSINESS: 'business',
  EXTERNAL: 'external',
} as const;

export const MONITORING_THRESHOLDS = {
  AVAILABILITY_MINIMUM: 99.9,
  PERFORMANCE_MINIMUM: 90,
  RECENT_ERRORS_LIMIT: 20,
  RECENT_EVENTS_LIMIT: 10,
  RECENT_REQUESTS_LIMIT: 1000,
  ONE_HOUR_MS: 3600000,
  ONE_MINUTE_MS: 60000,
  FIVE_MINUTES_MS: 300000,
} as const;

export const UPTIME_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  DOWN: 'down',
} as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[keyof typeof SEVERITY_LEVELS];
export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES];
export type UptimeStatus = typeof UPTIME_STATUS[keyof typeof UPTIME_STATUS];