import { Elysia } from 'elysia';
import { getPerformanceMetrics, getPerformanceHealthCheck } from '../middleware/performance.js';
import { getMonitoringMetrics, createHealthCheck } from '../middleware/monitoring.js';

/**
 * Metrics and monitoring routes
 */
export const metricsRoutes = new Elysia({ prefix: '/metrics' })
  .get('/', () => {
    const performanceMetrics = getPerformanceMetrics();
    const monitoringMetrics = getMonitoringMetrics();
    const healthCheck = createHealthCheck();

    return {
      timestamp: new Date().toISOString(),
      performance: performanceMetrics,
      monitoring: monitoringMetrics,
      health: healthCheck,
    };
  })

  .get('/performance', () => {
    const metrics = getPerformanceMetrics();
    const healthCheck = getPerformanceHealthCheck();

    return {
      timestamp: new Date().toISOString(),
      metrics,
      healthCheck,
      thresholds: {
        responseTimeTarget: '<100ms',
        errorRateTarget: '<5%',
        slowRequestThreshold: 100,
      },
    };
  })

  .get('/monitoring', () => {
    const monitoringMetrics = getMonitoringMetrics();
    const healthCheck = createHealthCheck();

    return {
      timestamp: new Date().toISOString(),
      metrics: monitoringMetrics,
      health: healthCheck,
    };
  })

  .get('/health', () => {
    const performanceHealth = getPerformanceHealthCheck();
    const healthCheck = createHealthCheck();

    return {
      status: healthCheck.status === 'healthy' && performanceHealth.status === 'healthy'
        ? 'healthy'
        : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        basic: healthCheck,
        performance: performanceHealth,
      },
      nfr: {
        responseTimeTarget: '<100ms',
        errorRateTarget: '<5%',
        status: performanceHealth.nfrCompliance.overall ? 'COMPLIANT' : 'NON_COMPLIANT',
      },
    };
  })

  .get('/baseline', () => {
    const performanceMetrics = getPerformanceMetrics();

    return {
      timestamp: new Date().toISOString(),
      baseline: {
        targetResponseTime: 100, // NFR target in ms
        targetErrorRate: 5, // NFR target in percentage
        currentAverageResponseTime: performanceMetrics.averageResponseTime,
        currentP95ResponseTime: performanceMetrics.p95ResponseTime,
        currentErrorRate: performanceMetrics.errorRate,
        complianceStatus: {
          responseTime: performanceMetrics.p95ResponseTime <= 100,
          errorRate: performanceMetrics.errorRate < 5,
        },
      },
      recommendations: performanceHealth.nfrCompliance.overall
        ? []
        : ['Consider optimizing performance to meet NFR targets'],
    };
  })

  .get('/reset', ({ set }) => {
    // Reset metrics (should be protected in production)
    if (process.env.NODE_ENV === 'production') {
      set.status = 403;
      return { error: 'Cannot reset metrics in production' };
    }

    // Import reset functions
    const { resetPerformanceMetrics } = require('../middleware/performance.js');
    const { resetMonitoringMetrics } = require('../middleware/monitoring.js');

    resetPerformanceMetrics();
    resetMonitoringMetrics();

    return {
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    };
  });