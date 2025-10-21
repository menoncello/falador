import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createPerformanceMiddleware,
  getPerformanceMetrics,
  resetPerformanceMetrics,
  getPerformanceHealthCheck,
} from './performance';

describe('Performance Middleware', () => {
  let app: Elysia;

  beforeEach(() => {
    resetPerformanceMetrics();
    app = new Elysia().use(createPerformanceMiddleware());
  });

  afterEach(() => {
    resetPerformanceMetrics();
  });

  describe('Middleware Integration', () => {
    it('should add performance headers to responses', async () => {
      app.get('/test', () => ({ message: 'test' }));

      const response = await app.handle(new Request('http://localhost/test'));

      expect(response.headers.get('X-Response-Time')).toBeTruthy();
      expect(response.headers.get('X-Performance-Status')).toBeTruthy();
      expect(response.headers.get('X-Performance-Threshold')).toBe('100ms');
    });

    it('should track response times correctly', async () => {
      app.get('/test', () => {
        // Simulate some processing time
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Wait 10ms
        }
        return { message: 'test' };
      });

      await app.handle(new Request('http://localhost/test'));

      const metrics = getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThan(5);
    });

    it('should track slow requests', async () => {
      app.get('/slow', () => {
        // Simulate slow processing
        const start = Date.now();
        while (Date.now() - start < 150) {
          // Wait 150ms
        }
        return { message: 'slow' };
      });

      await app.handle(new Request('http://localhost/slow'));

      const metrics = getPerformanceMetrics();
      expect(metrics.slowRequests).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThan(100);
    });

    it('should handle errors and update metrics', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      try {
        await app.handle(new Request('http://localhost/error'));
      } catch (error) {
        // Expected to throw
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate P95 response time correctly', async () => {
      const responseTimes = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140];

      // Simulate multiple requests with different response times
      for (const time of responseTimes) {
        app.get(`/test-${time}`, () => {
          const start = Date.now();
          while (Date.now() - start < time) {
            // Wait specified time
          }
          return { message: 'test' };
        });

        await app.handle(new Request(`http://localhost/test-${time}`));
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.p95ResponseTime).toBeGreaterThan(100);
      expect(metrics.p95ResponseTime).toBeLessThan(150);
    });

    it('should calculate average response time correctly', async () => {
      // Simulate requests with known response times
      for (let i = 0; i < 5; i++) {
        app.get(`/test-${i}`, () => ({ message: `test-${i}` }));
        await app.handle(new Request(`http://localhost/test-${i}`));
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.totalRequests).toBe(5);
    });

    it('should limit response time history size', async () => {
      // Generate more than 100 requests
      for (let i = 0; i < 150; i++) {
        app.get(`/test-${i}`, () => ({ message: `test-${i}` }));
        await app.handle(new Request(`http://localhost/test-${i}`));
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(150);
      // Should not cause memory issues
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status for good metrics', () => {
      // Simulate good performance
      const metrics = getPerformanceMetrics();
      metrics.averageResponseTime = 30;
      metrics.p95ResponseTime = 80;
      metrics.errorRate = 2;

      const healthCheck = getPerformanceHealthCheck();
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.nfrCompliance.responseTime).toBe(true);
      expect(healthCheck.nfrCompliance.errorRate).toBe(true);
      expect(healthCheck.nfrCompliance.overall).toBe(true);
    });

    it('should return degraded status for poor metrics', () => {
      // Simulate poor performance
      const metrics = getPerformanceMetrics();
      metrics.averageResponseTime = 80;
      metrics.p95ResponseTime = 150;
      metrics.errorRate = 8;

      const healthCheck = getPerformanceHealthCheck();
      expect(healthCheck.status).toBe('degraded');
      expect(healthCheck.nfrCompliance.responseTime).toBe(false);
      expect(healthCheck.nfrCompliance.errorRate).toBe(false);
      expect(healthCheck.nfrCompliance.overall).toBe(false);
    });

    it('should provide performance recommendations', () => {
      // Simulate metrics that need improvement
      const metrics = getPerformanceMetrics();
      metrics.averageResponseTime = 80;
      metrics.p95ResponseTime = 150;
      metrics.errorRate = 8;
      metrics.slowRequests = 15;
      metrics.totalRequests = 100;

      const healthCheck = getPerformanceHealthCheck();
      expect(healthCheck.recommendations).toContain('P95 response time');
      expect(healthCheck.recommendations).toContain('Error rate');
      expect(healthCheck.recommendations.length).toBeGreaterThan(2);
    });
  });

  describe('Metrics Management', () => {
    it('should reset metrics correctly', () => {
      // Generate some metrics
      app.get('/test', () => ({ message: 'test' }));
      await app.handle(new Request('http://localhost/test'));

      // Verify metrics exist
      let metrics = getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(1);

      // Reset metrics
      resetPerformanceMetrics();
      metrics = getPerformanceMetrics();

      // Verify metrics are reset
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.p95ResponseTime).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.slowRequests).toBe(0);
    });

    it('should maintain metrics accuracy across multiple requests', async () => {
      app.get('/test', () => ({ message: 'test' }));

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        await app.handle(new Request('http://localhost/test'));
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(10);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.errorRate).toBe(0); // All successful requests
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero response time gracefully', async () => {
      app.get('/instant', () => ({ message: 'instant' }));

      await app.handle(new Request('http://localhost/instant'));

      const metrics = getPerformanceMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle very slow requests', async () => {
      app.get('/very-slow', () => {
        // Simulate very slow processing
        const start = Date.now();
        while (Date.now() - start < 500) {
          // Wait 500ms
        }
        return { message: 'very slow' });
      });

      await app.handle(new Request('http://localhost/very-slow'));

      const metrics = getPerformanceMetrics();
      expect(metrics.slowRequests).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThan(400);
    });

    it('should calculate error rate correctly with mixed requests', async () => {
      app.get('/success', () => ({ message: 'success' }));
      app.get('/error', () => {
        throw new Error('Test error');
      });

      // Make successful requests
      await app.handle(new Request('http://localhost/success'));
      await app.handle(new Request('http://localhost/success'));

      // Make error requests
      try {
        await app.handle(new Request('http://localhost/error'));
      } catch (error) {
        // Expected
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });
});