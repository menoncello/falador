/**
 * Error Monitoring Middleware
 * Integrates error tracking and uptime monitoring into Elysia routes
 */

import { Elysia, t } from 'elysia';
import { uptimeMonitor } from '../monitoring/uptime-monitor';
import { HTTP_STATUS_CODES } from './error-monitoring-constants';
import type {
  ErrorHandlerParams,
  ErrorResponse,
  MonitoringDerive,
  ErrorMonitoringContext
} from './error-monitoring-types';
import {
  determineErrorSeverity,
  determineErrorCategory,
  extractClientIp,
  extractUserAgent,
  createErrorResponse,
  checkUptimeThresholds,
  formatUptimeEvent,
  formatError
} from './error-monitoring-utils';

/**
 * Creates error recording function with request context
 */
function createErrorRecorder(request: Request): (
  error: Error | string,
  context?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'system' | 'network' | 'database' | 'authentication' | 'business' | 'external';
  }
) => void {
  return (error, context) => {
    uptimeMonitor.recordError(error, {
      url: request.url,
      method: request.method,
      userAgent: extractUserAgent(request),
      ip: extractClientIp(request),
      ...context,
    });
  };
}

/**
 * Creates monitoring context derive function
 */
function _createMonitoringContext(): {
  recordError: ReturnType<typeof createErrorRecorder>;
  getUptimeMetrics: () => unknown;
  getUptimeSummary: () => unknown;
} {
  return {
    recordError: {} as ReturnType<typeof createErrorRecorder>, // Will be set in derive
    getUptimeMetrics: () => uptimeMonitor.getMetrics(),
    getUptimeSummary: () => uptimeMonitor.getUptimeSummary(),
  };
}

/**
 * Handles error recording and logging
 */
function handleError(
  error: Error,
  code: string,
  request: Request,
  recordError?: (error: Error | string, context?: Record<string, unknown>) => void
): void {
  if (recordError) {
    const severity = determineErrorSeverity(code);
    const category = determineErrorCategory(code);
    recordError(error, { severity, category });
  }

  console.error('🔴 Application Error:', {
    code,
    message: error instanceof Error ? error.message : error,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Error monitoring plugin for Elysia
 */
export const errorMonitoringPlugin = (app: Elysia): Elysia =>
  app
    .derive(({ request }): MonitoringDerive => {
      const errorRecorder = createErrorRecorder(request);

      return {
        recordError: errorRecorder,
        getUptimeMetrics: () => uptimeMonitor.getMetrics(),
        getUptimeSummary: () => uptimeMonitor.getUptimeSummary(),
      };
    })
    .onError((errorContext: ErrorMonitoringContext): void => {
      const { error, code, request, recordError } = errorContext;
      handleError(error, code, request, recordError);
    });

/**
 * Global error handler with monitoring
 */
export const globalErrorHandler = {
  error({
    error,
    request,
    set,
  }: ErrorHandlerParams): ErrorResponse {
    uptimeMonitor.recordError(error, {
      url: request.url,
      method: request.method,
      severity: 'high',
    });

    set.status = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

    return createErrorResponse(
      'An unexpected error occurred',
      crypto.randomUUID()
    );
  },
};

/**
 * Health check with uptime integration
 */
export const healthCheckWithUptime = (app: Elysia): Elysia =>
  app.get('/api/health/uptime', ({ getUptimeSummary }) => {
    const summary = getUptimeSummary();

    return {
      status: summary.status,
      timestamp: new Date().toISOString(),
      uptime: {
        current: summary.currentUptime,
        availability: summary.availability,
        performanceScore: summary.performanceScore,
      },
      health: {
        healthy: summary.status === 'healthy',
        degraded: summary.status === 'degraded',
        down: summary.status === 'down',
      },
      lastEvent: summary.lastEvent,
      monitoring: {
        totalEvents: summary.totalEvents,
        recentErrors: summary.recentErrors,
      },
    };
  });

/**
 * Error statistics endpoint
 */
export const errorStatsEndpoint = (app: Elysia): Elysia =>
  app.get('/api/monitoring/errors', ({ getUptimeMetrics }) => {
    const metrics = getUptimeMetrics();
    const errorStats = uptimeMonitor.getErrorStatistics();
    const recentErrors = uptimeMonitor.getRecentErrors(20);

    return {
      summary: errorStats,
      recentErrors: recentErrors.map(formatError),
      trends: {
        lastHour: errorStats.recentHour,
        lastDay: errorStats.recentDay,
        bySeverity: errorStats.bySeverity,
        byCategory: errorStats.byCategory,
      },
      alerts: {
        critical: errorStats.bySeverity.critical || 0,
        high: errorStats.bySeverity.high || 0,
        medium: errorStats.bySeverity.medium || 0,
        low: errorStats.bySeverity.low || 0,
      },
    };
  });

/**
 * Uptime monitoring dashboard endpoint
 */
export const uptimeDashboardEndpoint = (app: Elysia): Elysia =>
  app.get('/api/monitoring/uptime', ({ getUptimeSummary }) => {
    const summary = getUptimeSummary();
    const metrics = uptimeMonitor.getMetrics();
    const alertRules = uptimeMonitor.getAlertRules();

    const issues = checkUptimeThresholds(summary.availability, summary.performanceScore);

    return {
      overview: {
        status: summary.status,
        uptime: summary.currentUptime,
        availability: summary.availability,
        performanceScore: summary.performanceScore,
        healthScore: summary.performanceScore,
      },
      uptime: {
        totalUptime: metrics.totalUptime,
        totalDowntime: metrics.totalDowntime,
        currentUptime: metrics.currentUptime,
        startTime: new Date(metrics.startTime).toISOString(),
      },
      events: {
        total: summary.totalEvents,
        recent: uptimeMonitor.getRecentEvents(10).map(formatUptimeEvent),
      },
      alerts: {
        enabled: alertRules.filter((rule) => rule.enabled).length,
        rules: alertRules.map((rule) => ({
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          enabled: rule.enabled,
        })),
      },
      status: {
        healthy: summary.status === 'healthy',
        degraded: summary.status === 'degraded',
        issues,
      },
    };
  });

/**
 * Export uptime metrics for external monitoring
 */
export const exportUptimeMetricsEndpoint = (app: Elysia): Elysia =>
  app.get('/api/monitoring/uptime/export', ({ set }) => {
    set.headers['Content-Type'] = 'application/json';
    return uptimeMonitor.exportMetrics();
  });

/**
 * Manual error recording endpoint (for testing/manual reporting)
 */
export const recordErrorEndpoint = (app: Elysia): Elysia =>
  app.post(
    '/api/monitoring/errors/record',
    ({ body, recordError }) => {
      if (!recordError) {
        return { success: false, message: 'Error recording not available' };
      }

      try {
        recordError(body.error, {
          severity: body.severity,
          category: body.category,
        });

        return { success: true, message: 'Error recorded successfully' };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to record error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        error: t.String(),
        severity: t.Optional(
          t.Union([
            t.Literal('low'),
            t.Literal('medium'),
            t.Literal('high'),
            t.Literal('critical'),
          ])
        ),
        category: t.Optional(
          t.Union([
            t.Literal('system'),
            t.Literal('network'),
            t.Literal('database'),
            t.Literal('authentication'),
            t.Literal('business'),
            t.Literal('external'),
          ])
        ),
      }),
    }
  );