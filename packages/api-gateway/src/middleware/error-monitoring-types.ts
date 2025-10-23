/**
 * Type definitions for Error Monitoring Middleware
 */

import type {
  SeverityLevel,
  ErrorCategory
} from './error-monitoring-constants';

export interface ErrorContext {
  severity?: SeverityLevel;
  category?: ErrorCategory;
  url?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

export interface ErrorHandlerParams {
  error: Error;
  request: Request;
  set: {
    status: number;
    headers?: Record<string, string>;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  requestId: string;
}

export interface ErrorRecordingBody {
  error: string;
  severity?: SeverityLevel;
  category?: ErrorCategory;
}

export interface MonitoringDerive {
  recordError: (
    error: Error | string,
    context?: Omit<ErrorContext, 'url' | 'method' | 'userAgent' | 'ip'>
  ) => void;
  getUptimeMetrics: () => unknown;
  getUptimeSummary: () => unknown;
}

export interface ErrorMonitoringContext {
  error: Error;
  code: string;
  request: Request;
  set: {
    status: number;
  };
  recordError?: (
    error: Error | string,
    context?: ErrorContext
  ) => void;
}