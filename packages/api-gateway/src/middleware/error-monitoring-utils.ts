/**
 * Utility functions for Error Monitoring Middleware
 */

import {
  SEVERITY_LEVELS,
  ERROR_CATEGORIES,
  MONITORING_THRESHOLDS,
  type SeverityLevel,
  type ErrorCategory
} from './error-monitoring-constants';

/**
 * Determines error severity based on error code
 */
export function determineErrorSeverity(errorCode: string): SeverityLevel {
  switch (errorCode) {
    case 'INTERNAL_SERVER_ERROR':
      return SEVERITY_LEVELS.CRITICAL;
    case 'NOT_FOUND':
    case 'VALIDATION':
      return SEVERITY_LEVELS.LOW;
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return SEVERITY_LEVELS.MEDIUM;
    case 'TIMEOUT':
      return SEVERITY_LEVELS.HIGH;
    default:
      return SEVERITY_LEVELS.MEDIUM;
  }
}

/**
 * Determines error category based on error code
 */
export function determineErrorCategory(errorCode: string): ErrorCategory {
  switch (errorCode) {
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      return ERROR_CATEGORIES.AUTHENTICATION;
    case 'TIMEOUT':
      return ERROR_CATEGORIES.NETWORK;
    default:
      return ERROR_CATEGORIES.SYSTEM;
  }
}

/**
 * Extracts client IP address from request headers
 */
export function extractClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Extracts user agent from request headers
 */
export function extractUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  requestId: string
): {
  error: string;
  message: string;
  timestamp: string;
  requestId: string;
} {
  return {
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Checks if uptime meets minimum thresholds
 */
export function checkUptimeThresholds(
  availability: number,
  performanceScore: number
): string[] {
  const issues: string[] = [];

  if (availability < MONITORING_THRESHOLDS.AVAILABILITY_MINIMUM) {
    issues.push(`Availability below ${MONITORING_THRESHOLDS.AVAILABILITY_MINIMUM}%`);
  }

  if (performanceScore < MONITORING_THRESHOLDS.PERFORMANCE_MINIMUM) {
    issues.push(`Performance score below ${MONITORING_THRESHOLDS.PERFORMANCE_MINIMUM}`);
  }

  return issues;
}

/**
 * Uptime event interface
 */
interface UptimeEvent {
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Error event interface
 */
interface ErrorEvent {
  timestamp: number;
  error: Error | string;
  severity: SeverityLevel;
  category: ErrorCategory;
  url: string;
  method: string;
  [key: string]: unknown;
}

/**
 * Formats uptime event for response
 */
export function formatUptimeEvent(event: UptimeEvent): UptimeEvent & { timestamp: string } {
  return {
    ...event,
    timestamp: new Date(event.timestamp).toISOString(),
  };
}

/**
 * Formats error for response
 */
export function formatError(error: ErrorEvent): {
  timestamp: string;
  message: string;
  severity: SeverityLevel;
  category: ErrorCategory;
  url: string;
  method: string;
} {
  return {
    timestamp: new Date(error.timestamp).toISOString(),
    message: error.error instanceof Error ? error.error.message : String(error.error),
    severity: error.severity,
    category: error.category,
    url: error.url,
    method: error.method,
  };
}