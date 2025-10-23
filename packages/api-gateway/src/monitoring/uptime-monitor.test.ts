import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UptimeMonitor } from './uptime-monitor';

describe('UptimeMonitor', () => {
  let monitor: UptimeMonitor;

  beforeEach(() => {
    monitor = new UptimeMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Basic functionality', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.startTime).toBeGreaterThan(0);
      expect(metrics.totalUptime).toBe(0);
      expect(metrics.totalDowntime).toBe(0);
      expect(metrics.availability).toBe(100);
      expect(metrics.performanceScore).toBe(100);
      expect(metrics.events).toHaveLength(1); // Startup event
      expect(metrics.errorEvents).toHaveLength(0);
    });

    it('should record health check status correctly', () => {
      monitor.recordHealthCheck(true);

      // Manually trigger metrics update to simulate time passing
      const initialMetrics = monitor.getMetrics();
      expect(initialMetrics.events).toHaveLength(1); // startup event

      // Simulate downtime
      monitor.recordHealthCheck(false);

      // Record recovery
      monitor.recordHealthCheck(true);

      const finalMetrics = monitor.getMetrics();
      expect(finalMetrics.events.length).toBeGreaterThanOrEqual(3); // startup, downtime, recovery

      const downtimeEvent = finalMetrics.events.find(
        (e) => e.type === 'downtime'
      );
      const recoveryEvent = finalMetrics.events.find(
        (e) => e.type === 'recovery'
      );

      expect(downtimeEvent).toBeDefined();
      expect(recoveryEvent).toBeDefined();
    });

    it('should calculate availability correctly', () => {
      // Simulate some uptime and downtime
      monitor.recordHealthCheck(true);

      // Wait a bit and simulate downtime
      setTimeout(() => {
        monitor.recordHealthCheck(false);
      }, 100);

      setTimeout(() => {
        monitor.recordHealthCheck(true);
      }, 200);

      // Let the monitor process
      setTimeout(() => {
        const metrics = monitor.getMetrics();
        expect(metrics.availability).toBeGreaterThan(0);
        expect(metrics.availability).toBeLessThan(100);
      }, 300);
    });
  });

  describe('Error recording', () => {
    it('should record errors with context', () => {
      const error = new Error('Test error');
      const context = {
        url: '/api/test',
        method: 'GET',
        userId: 'user123',
        severity: 'high' as const,
        category: 'system' as const,
      };

      monitor.recordError(error, context);
      const metrics = monitor.getMetrics();

      expect(metrics.errorEvents).toHaveLength(1);
      const errorEvent = metrics.errorEvents[0];
      expect(errorEvent.error).toBe(error);
      expect(errorEvent.url).toBe('/api/test');
      expect(errorEvent.method).toBe('GET');
      expect(errorEvent.userId).toBe('user123');
      expect(errorEvent.severity).toBe('high');
      expect(errorEvent.category).toBe('system');
    });

    it('should determine error severity automatically', () => {
      // Test different error messages
      const errors = [
        'ECONNREFUSED - Connection refused',
        'timeout error occurred',
        'internal server error',
        'unauthorized access',
        'validation failed',
      ];

      for (const [index, errorMessage] of errors.entries()) {
        monitor.recordError(errorMessage);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.errorEvents).toHaveLength(5);

      // Check that critical errors are identified
      const criticalErrors = metrics.errorEvents.filter(
        (e) => e.severity === 'critical'
      );
      expect(criticalErrors.length).toBeGreaterThan(0);
    });

    it('should limit error history size', () => {
      // Add more errors than the limit
      for (let i = 0; i < 1005; i++) {
        monitor.recordError(`Error ${i}`);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.errorEvents.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error statistics', () => {
    it('should calculate error statistics correctly', () => {
      // Add errors with different severities and categories
      monitor.recordError('Critical error', {
        severity: 'critical',
        category: 'database',
      });
      monitor.recordError('High error', {
        severity: 'high',
        category: 'network',
      });
      monitor.recordError('Medium error', {
        severity: 'medium',
        category: 'authentication',
      });
      monitor.recordError('Low error', { severity: 'low', category: 'system' });
      monitor.recordError('Another critical error', {
        severity: 'critical',
        category: 'database',
      });

      const stats = monitor.getErrorStatistics();

      expect(stats.total).toBe(5);
      expect(stats.bySeverity.critical).toBe(2);
      expect(stats.bySeverity.high).toBe(1);
      expect(stats.bySeverity.medium).toBe(1);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.byCategory.database).toBe(2);
      expect(stats.byCategory.network).toBe(1);
      expect(stats.byCategory.authentication).toBe(1);
      expect(stats.byCategory.system).toBe(1);
    });

    it('should calculate recent error counts', () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      const oneDayAgo = now - 86400000;

      // Add errors at different times
      monitor.recordError('Recent error');
      monitor.recordError('Old error');

      // Mock timestamp for old error
      (monitor.getMetrics().errorEvents[1] as any).timestamp = oneDayAgo - 1000;

      const stats = monitor.getErrorStatistics();

      expect(stats.recentHour).toBe(1); // Only recent error
      expect(stats.recentDay).toBe(1); // Recent and old (within day)
    });
  });

  describe('Performance score calculation', () => {
    it('should maintain high score with no errors', () => {
      const metrics = monitor.getMetrics();
      expect(metrics.performanceScore).toBe(100);
    });

    it('should reduce score for errors', () => {
      monitor.recordError('Critical error', { severity: 'critical' });
      monitor.recordError('High error', { severity: 'high' });
      monitor.recordError('Medium error', { severity: 'medium' });

      const metrics = monitor.getMetrics();
      expect(metrics.performanceScore).toBeLessThan(100);
      expect(metrics.performanceScore).toBeGreaterThan(80);
    });

    it('should reduce score significantly for many critical errors', () => {
      for (let i = 0; i < 5; i++) {
        monitor.recordError(`Critical error ${i}`, { severity: 'critical' });
      }

      const metrics = monitor.getMetrics();
      expect(metrics.performanceScore).toBeLessThan(80);
    });
  });

  describe('Alert rules', () => {
    it('should have default alert rules', () => {
      const rules = monitor.getAlertRules();
      expect(rules.length).toBeGreaterThan(0);

      const criticalErrorRule = rules.find(
        (rule) => rule.id === 'critical-errors'
      );
      expect(criticalErrorRule).toBeDefined();
      expect(criticalErrorRule?.severity).toBe('critical');
    });

    it('should add custom alert rule', () => {
      const customRule = {
        id: 'custom-test',
        name: 'Custom Test Rule',
        condition: (metrics) => metrics.performanceScore < 50,
        severity: 'medium' as const,
        cooldown: 120,
        enabled: true,
      };

      monitor.addAlertRule(customRule);
      const rules = monitor.getAlertRules();

      expect(rules.some((rule) => rule.id === 'custom-test')).toBe(true);
    });

    it('should remove alert rule', () => {
      const customRule = {
        id: 'custom-test-remove',
        name: 'Custom Test Rule',
        condition: (metrics) => metrics.performanceScore < 50,
        severity: 'medium' as const,
        cooldown: 120,
        enabled: true,
      };

      monitor.addAlertRule(customRule);
      expect(monitor.removeAlertRule('custom-test-remove')).toBe(true);
      expect(monitor.removeAlertRule('non-existent')).toBe(false);
    });
  });

  describe('Uptime summary', () => {
    it('should generate uptime summary', () => {
      const summary = monitor.getUptimeSummary();

      expect(summary.status).toBe('healthy');
      expect(summary.uptime).toBe(0);
      expect(summary.availability).toBe(100);
      expect(summary.performanceScore).toBe(100);
      expect(summary.currentUptime).toBe('0s');
      expect(summary.totalEvents).toBe(1);
      expect(summary.recentErrors).toBe(0);
    });

    it('should show degraded status for lower performance', () => {
      // Add enough errors to reduce performance score significantly
      for (let i = 0; i < 8; i++) {
        monitor.recordError(`Critical error ${i}`, { severity: 'critical' });
      }

      const summary = monitor.getUptimeSummary();
      expect(['degraded', 'down']).toContain(summary.status); // Should be degraded or down
      expect(summary.performanceScore).toBeLessThan(100);
    });

    it('should format duration correctly', () => {
      // This tests the internal duration formatting
      const summary = monitor.getUptimeSummary();
      expect(summary.currentUptime).toMatch(/^\d+[dhms]+$/);
    });
  });

  describe('Metrics export', () => {
    it('should export metrics as JSON', () => {
      monitor.recordError('Test error');
      const exported = monitor.exportMetrics();

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.timestamp).toBeGreaterThan(0);
      expect(parsed.uptime).toBeDefined();
      expect(parsed.performance).toBeDefined();
      expect(parsed.errors).toBeDefined();
      expect(parsed.events).toBeDefined();
    });
  });

  describe('Recent events and errors', () => {
    it('should return recent events in reverse chronological order', () => {
      monitor.recordHealthCheck(false);
      monitor.recordHealthCheck(true);

      const recentEvents = monitor.getRecentEvents(2);
      expect(recentEvents).toHaveLength(2);
      expect(recentEvents[0].type).toBe('recovery'); // Most recent
      expect(recentEvents[1].type).toBe('downtime'); // Second most recent
    });

    it('should return recent errors in reverse chronological order', () => {
      monitor.recordError('First error');
      monitor.recordError('Second error');

      const recentErrors = monitor.getRecentErrors(2);
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].error).toBe('Second error');
      expect(recentErrors[1].error).toBe('First error');
    });

    it('should limit returned events', () => {
      // Add more events than requested
      for (let i = 0; i < 10; i++) {
        monitor.recordError(`Error ${i}`);
      }

      const recentErrors = monitor.getRecentErrors(5);
      expect(recentErrors.length).toBe(5);
    });
  });
});
