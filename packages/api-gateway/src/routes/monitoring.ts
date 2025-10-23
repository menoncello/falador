/**
 * Performance Monitoring Routes
 * Provides API endpoints for checking application performance and health
 */

import { Elysia } from 'elysia';
import {
  healthCheckWithUptime,
  errorStatsEndpoint,
  uptimeDashboardEndpoint,
  exportUptimeMetricsEndpoint,
  recordErrorEndpoint,
} from '../middleware/error-monitoring-middleware';
import { performanceMonitor } from '../monitoring/performance-monitor';
import { encryptionValidator } from '../security/encryption-validator';

/**
 * Helper function to calculate health score
 */
function calculateHealthScore(thresholds: { isHealthy: boolean; warnings: string[]; errors: string[] }): number {
  if (!thresholds.isHealthy) return 0;
  if (thresholds.errors.length > 0) return 0;
  if (thresholds.warnings.length === 0) return 100;
  if (thresholds.warnings.length <= 2) return 80;
  return 60;
}

// Helper functions for encryption validation
function getSecurityGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 65) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

function isWeakSecret(secret?: string): boolean {
  if (!secret) return true;

  const weakPatterns = [
    /password/i,
    /secret/i,
    /test/i,
    /dev/i,
    /demo/i,
    /123/i,
    /abc/i,
    /^(.)\1+$/, // Repeated characters
    /^[A-Za-z]+$/, // Only letters
    /^\d+$/, // Only numbers
  ];

  return weakPatterns.some(pattern => pattern.test(secret));
}

function containsDefaultSecrets(): boolean {
  const jwtSecret = process.env['JWT_SECRET'];
  return isWeakSecret(jwtSecret);
}

export const monitoringRoutes = new Elysia({ prefix: '/api/monitoring' })
  /**
   * Get basic health status (performance only)
   */
  .get('/health', ({ set }) => {
    const metrics = performanceMonitor.getMetrics();
    const thresholds = performanceMonitor.checkPerformanceThresholds();

    set.status = thresholds.isHealthy ? 200 : 503;
    return {
      status: thresholds.isHealthy ? 'healthy' : 'degraded',
      timestamp: metrics.timestamp,
      uptime: metrics.uptime,
      checks: {
        performance: thresholds.isHealthy,
        memory: metrics.memoryUsage.heapUsed < 500 * 1024 * 1024, // < 500MB
        responseTime: metrics.averageResponseTime < 1000, // < 1s
        errorRate: metrics.errorRate < 5, // < 5%
      },
      issues: [...thresholds.errors, ...thresholds.warnings],
    };
  })

  /**
   * Get comprehensive health status with uptime monitoring
   */
  .use(healthCheckWithUptime)

  /**
   * Get detailed performance metrics
   */
  .get('/metrics', () => {
    const metrics = performanceMonitor.getMetrics();
    const thresholds = performanceMonitor.checkPerformanceThresholds();

    return {
      application: {
        uptime: metrics.uptime,
        timestamp: metrics.timestamp,
        healthy: thresholds.isHealthy,
      },
      performance: {
        requestCount: metrics.requestCount,
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.errorRate,
      },
      memory: {
        heapUsed: metrics.memoryUsage.heapUsed,
        heapTotal: metrics.memoryUsage.heapTotal,
        external: metrics.memoryUsage.external,
        rss: metrics.memoryUsage.rss,
      },
      thresholds: {
        responseTime: {
          current: metrics.averageResponseTime,
          warning: 500,
          critical: 1000,
        },
        errorRate: {
          current: metrics.errorRate,
          warning: 5,
          critical: 10,
        },
        memory: {
          current: metrics.memoryUsage.heapUsed,
          warning: 300 * 1024 * 1024, // 300MB
          critical: 500 * 1024 * 1024, // 500MB
        },
      },
    };
  })

  /**
   * Get endpoint performance breakdown
   */
  .get('/endpoints', () => {
    const endpointPerformance = performanceMonitor.getEndpointPerformance();
    const statusDistribution = performanceMonitor.getStatusDistribution();

    return {
      endpoints: endpointPerformance,
      statusDistribution,
      summary: {
        totalEndpoints: Object.keys(endpointPerformance).length,
        healthyEndpoints: Object.values(endpointPerformance).filter(
          (ep) => ep.errorRate < 5 && ep.averageResponseTime < 1000
        ).length,
      },
    };
  })

  /**
   * Get recent request history
   */
  .get('/requests', ({ query }) => {
    const limit = Math.min(Number(query['limit']) || 100, 1000);
    const recentRequests = performanceMonitor.getRecentRequests(3600000); // Last hour

    return {
      requests: recentRequests.slice(-limit).reverse(), // Most recent first
      total: recentRequests.length,
      limit,
    };
  })

  /**
   * Get performance trends
   */
  .get('/trends', () => {
    const recentRequests = performanceMonitor.getRecentRequests(300000); // Last 5 minutes

    // Calculate trends
    const oneMinuteRequests = recentRequests.filter(
      (req) => req.timestamp > Date.now() - 60000
    ).length;

    const fiveMinuteRequests = recentRequests.filter(
      (req) => req.timestamp > Date.now() - 300000
    ).length;

    return {
      current: {
        requestsPerMinute: oneMinuteRequests,
        requestsPerFiveMinutes: fiveMinuteRequests,
      },
      memory: performanceMonitor.getMemoryTrends(),
      health: performanceMonitor.checkPerformanceThresholds(),
    };
  })

  /**
   * Export metrics for external monitoring systems
   */
  .get('/export', ({ set }) => {
    set.headers['Content-Type'] = 'application/json';
    return performanceMonitor.exportMetrics();
  })

  /**
   * Get error statistics and recent errors
   */
  .use(errorStatsEndpoint)

  /**
   * Get uptime monitoring dashboard data
   */
  .use(uptimeDashboardEndpoint)

  /**
   * Export uptime metrics for external monitoring
   */
  .use(exportUptimeMetricsEndpoint)

  /**
   * Manual error recording endpoint
   */
  .use(recordErrorEndpoint)

  /**
   * Get encryption configuration validation
   */
  .get('/encryption/validation', () => {
    const validation = encryptionValidator.validate();
    const metrics = encryptionValidator.getMetrics();
    const isProductionReady = encryptionValidator.isProductionReady();

    return {
      validation: {
        isValid: validation.isValid,
        score: validation.score,
        issuesCount: validation.issues.length,
        criticalIssues: validation.issues.filter(i => i.severity === 'critical').length,
        highIssues: validation.issues.filter(i => i.severity === 'high').length,
        mediumIssues: validation.issues.filter(i => i.severity === 'medium').length,
        lowIssues: validation.issues.filter(i => i.severity === 'low').length,
      },
      metrics,
      configuration: {
        environment: process.env['NODE_ENV'] || 'development',
        productionReady: isProductionReady,
      },
      issues: validation.issues.map(issue => ({
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        recommendation: issue.recommendation,
        current: issue.current,
        expected: issue.expected,
      })),
      recommendations: validation.recommendations,
    };
  })

  /**
   * Get encryption security score
   */
  .get('/encryption/score', () => {
    const validation = encryptionValidator.validate();
    const metrics = encryptionValidator.getMetrics();

    return {
      score: validation.score,
      grade: getSecurityGrade(validation.score),
      isValid: validation.isValid,
      isProductionReady: encryptionValidator.isProductionReady(),
      lastChecked: new Date().toISOString(),
      breakdown: {
        jwtSecret: {
          configured: !!process.env['JWT_SECRET'],
          length: metrics.jwtSecretLength,
          secure: metrics.jwtSecretLength >= 32 && !isWeakSecret(process.env['JWT_SECRET']),
        },
        passwordHashing: {
          rounds: metrics.passwordHashRounds,
          recommended: metrics.passwordHashRounds >= 12,
        },
        sessionManagement: {
          duration: metrics.sessionDuration,
          withinLimit: metrics.sessionDuration <= 24 * 60 * 60 * 1000, // 24 hours
        },
        randomGeneration: {
          entropy: metrics.apiKeyEntropy,
          secure: metrics.apiKeyEntropy >= 256, // 32 bytes * 8 bits
        },
      },
    };
  })

  /**
   * Export encryption validation data
   */
  .get('/encryption/export', ({ set }) => {
    set.headers['Content-Type'] = 'application/json';
    return encryptionValidator.exportValidation();
  })

  /**
   * Check production readiness
   */
  .get('/encryption/production-ready', () => {
    const validation = encryptionValidator.validate();
    const isProductionReady = encryptionValidator.isProductionReady();
    const metrics = encryptionValidator.getMetrics();

    return {
      ready: isProductionReady,
      environment: process.env['NODE_ENV'] || 'development',
      score: validation.score,
      checklist: {
        jwtSecretConfigured: !!process.env['JWT_SECRET'],
        jwtSecretSecure: metrics.jwtSecretLength >= 32,
        passwordHashingStrong: metrics.passwordHashRounds >= 12,
        sessionDurationReasonable: metrics.sessionDuration <= 24 * 60 * 60 * 1000,
        randomGenerationSecure: metrics.apiKeyEntropy >= 256,
        noDefaultSecrets: !containsDefaultSecrets(),
      },
      blockingIssues: validation.issues.filter(i => i.severity === 'critical'),
      recommendations: validation.recommendations,
    };
  })

  // Temporarily commented to fix build issue
  /**
   * Reset performance metrics (useful for testing)
   */
  // .post('/reset', ({ body, set }) => {
  //   // In production, you'd want to add authentication here
  //   const { confirm } = body;

  //   if (confirm === 'reset-performance-metrics') {
  //     performanceMonitor.reset();
  //     return { success: true, message: 'Performance metrics reset' };
  //   }

  //   set.status = 400;
  //   return { success: false, message: 'Invalid confirmation' };
  // })

  /**
   * Get dashboard summary data
   */
  .get('/dashboard', () => {
    const metrics = performanceMonitor.getMetrics();
    const thresholds = performanceMonitor.checkPerformanceThresholds();
    const endpointPerf = performanceMonitor.getEndpointPerformance();
    const statusDistribution = performanceMonitor.getStatusDistribution();

    return {
      overview: {
        status: thresholds.isHealthy ? 'healthy' : 'degraded',
        uptime: metrics.uptime,
        requestCount: metrics.requestCount,
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.errorRate,
        healthScore: calculateHealthScore(thresholds),
      },
      alerts: thresholds.errors.map(error => ({
        type: 'error',
        message: error,
        timestamp: Date.now(),
      })),
      topEndpoints: Object.entries(endpointPerf)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([endpoint, perf]) => ({
          endpoint,
          requests: perf.count,
          avgResponseTime: perf.averageResponseTime,
          errorRate: perf.errorRate,
        })),
      statusDistribution,
      memoryUsage: {
        current: metrics.memoryUsage.heapUsed,
        peak: metrics.memoryUsage.heapTotal,
        trend: 'stable', // Would calculate from historical data
      },
    };
  });

export default monitoringRoutes;