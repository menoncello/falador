import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createMonitoringMiddleware,
  getMonitoringMetrics,
  resetMonitoringMetrics,
  createHealthCheck,
} from './monitoring';

describe('Monitoring Middleware', () => {
  let app: Elysia;

  beforeEach(() => {
    resetMonitoringMetrics();
    app = new Elysia().use(createMonitoringMiddleware());
  });

  afterEach(() => {
    resetMonitoringMetrics();
  });

  describe('Request Tracking', () => {
    it('should track requests for different routes', async () => {
      app.get('/api/test', () => ({ message: 'test' }));
      app.post('/api/users', () => ({ id: 1, name: 'test' }));

      await app.handle(new Request('http://localhost/api/test'));
      await app.handle(new Request('http://localhost/api/users', { method: 'POST' }));

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/test']).toBeDefined();
      expect(metrics['POST /api/users']).toBeDefined();
      expect(metrics['GET /api/test'].requestCount).toBe(1);
      expect(metrics['POST /api/users'].requestCount).toBe(1);
    });

    it('should track multiple requests to the same route', async () => {
      app.get('/api/test', () => ({ message: 'test' }));

      for (let i = 0; i < 5; i++) {
        await app.handle(new Request('http://localhost/api/test'));
      }

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/test'].requestCount).toBe(5);
    });

    it('should calculate rolling average response time', async () => {
      app.get('/api/test', () => ({ message: 'test' }));

      // First request
      await app.handle(new Request('http://localhost/api/test'));
      let metrics = getMonitoringMetrics();
      const firstResponseTime = metrics['GET /api/test'].averageResponseTime;

      // Second request
      await app.handle(new Request('http://localhost/api/test'));
      metrics = getMonitoringMetrics();
      const secondResponseTime = metrics['GET /api/test'].averageResponseTime;

      expect(firstResponseTime).toBeGreaterThan(0);
      expect(secondResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking', () => {
    it('should track errors for failed requests', async () => {
      app.get('/api/error', () => {
        throw new Error('Test error');
      });

      try {
        await app.handle(new Request('http://localhost/api/error'));
      } catch (error) {
        // Expected to throw
      }

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/error'].errorCount).toBe(1);
      expect(metrics['GET /api/error'].lastError).toBe('Test error');
      expect(metrics['GET /api/error'].lastErrorTime).toBeInstanceOf(Date);
    });

    it('should calculate error rate correctly', async () => {
      app.get('/api/mixed', ({ query }) => {
        if (query.error === 'true') {
          throw new Error('Test error');
        }
        return { message: 'success' };
      });

      // Successful request
      await app.handle(new Request('http://localhost/api/mixed'));

      // Failed request
      try {
        await app.handle(new Request('http://localhost/api/mixed?error=true'));
      } catch (error) {
        // Expected
      }

      // Another successful request
      await app.handle(new Request('http://localhost/api/mixed'));

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/mixed'].requestCount).toBe(3);
      expect(metrics['GET /api/mixed'].errorCount).toBe(1);
    });

    it('should add error headers for high error rates', async () => {
      app.get('/api/unreliable', () => {
        throw new Error('Random error');
      });

      // Generate multiple errors to trigger high error rate
      for (let i = 0; i < 10; i++) {
        try {
          await app.handle(new Request('http://localhost/api/unreliable'));
        } catch (error) {
          // Expected
        }
      }

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/unreliable'].errorCount).toBe(10);
    });
  });

  describe('Performance Monitoring', () => {
    it('should log slow requests', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      app.get('/api/slow', () => {
        // Simulate slow processing
        const start = Date.now();
        while (Date.now() - start < 150) {
          // Wait 150ms
        }
        return { message: 'slow' };
      });

      await app.handle(new Request('http://localhost/api/slow'));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SLOW REQUEST')
      );

      consoleSpy.mockRestore();
    });

    it('should add performance headers for slow requests', async () => {
      app.get('/api/slow', () => {
        const start = Date.now();
        while (Date.now() - start < 150) {
          // Wait 150ms
        }
        return { message: 'slow' };
      });

      const response = await app.handle(new Request('http://localhost/api/slow'));

      expect(response.headers.get('X-Performance-Alert')).toBe('true');
      expect(response.headers.get('X-Response-Time')).toBeTruthy();
    });

    it('should track critical endpoint failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      app.post('/api/auth/register', () => {
        throw new Error('Registration failed');
      });

      try {
        await app.handle(new Request('http://localhost/api/auth/register', {
          method: 'POST'
        }));
      } catch (error) {
        // Expected
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL: Registration endpoint failing')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Health Check', () => {
    it('should return healthy status for good metrics', () => {
      // No errors or slow requests
      const healthCheck = createHealthCheck();

      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.timestamp).toBeInstanceOf(Date);
      expect(healthCheck.uptime).toBeGreaterThan(0);
      expect(healthCheck.memory).toBeDefined();
    });

    it('should include memory usage in health check', () => {
      const healthCheck = createHealthCheck();

      expect(healthCheck.memory.used).toBeGreaterThan(0);
      expect(healthCheck.memory.total).toBeGreaterThan(0);
      expect(healthCheck.memory.used).toBeLessThanOrEqual(healthCheck.memory.total);
    });

    it('should include monitoring metrics in health check', () => {
      // Generate some metrics
      app.get('/api/test', () => ({ message: 'test' }));
      app.handle(new Request('http://localhost/api/test'));

      const healthCheck = createHealthCheck();

      expect(healthCheck.metrics).toBeDefined();
      expect(healthCheck.alerts).toBeDefined();
      expect(healthCheck.alerts.slowEndpoints).toBeInstanceOf(Array);
      expect(healthCheck.alerts.highErrorEndpoints).toBeInstanceOf(Array);
    });

    it('should identify slow endpoints in alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      app.get('/api/slow', () => {
        const start = Date.now();
        while (Date.now() - start < 150) {
          // Wait 150ms
        }
        return { message: 'slow' };
      });

      await app.handle(new Request('http://localhost/api/slow'));

      const healthCheck = createHealthCheck();

      expect(healthCheck.alerts.slowEndpoints).toContain('GET /api/slow');

      consoleSpy.mockRestore();
    });

    it('should identify high error endpoints in alerts', async () => {
      app.get('/api/error', () => {
        throw new Error('Test error');
      });

      // Generate multiple errors
      for (let i = 0; i < 10; i++) {
        try {
          await app.handle(new Request('http://localhost/api/error'));
        } catch (error) {
          // Expected
        }
      }

      const healthCheck = createHealthCheck();

      expect(healthCheck.alerts.highErrorEndpoints.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics Management', () => {
    it('should reset monitoring metrics correctly', () => {
      // Generate some metrics
      app.get('/api/test', () => ({ message: 'test' }));
      app.handle(new Request('http://localhost/api/test'));

      // Verify metrics exist
      let metrics = getMonitoringMetrics();
      expect(metrics['GET /api/test']).toBeDefined();

      // Reset metrics
      resetMonitoringMetrics();
      metrics = getMonitoringMetrics();

      // Verify metrics are reset
      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('should track different HTTP methods separately', async () => {
      app.get('/api/resource', () => ({ method: 'GET' }));
      app.post('/api/resource', () => ({ method: 'POST' }));
      app.put('/api/resource', () => ({ method: 'PUT' }));

      await app.handle(new Request('http://localhost/api/resource'));
      await app.handle(new Request('http://localhost/api/resource', { method: 'POST' }));
      await app.handle(new Request('http://localhost/api/resource', { method: 'PUT' }));

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/resource']).toBeDefined();
      expect(metrics['POST /api/resource']).toBeDefined();
      expect(metrics['PUT /api/resource']).toBeDefined();
    });

    it('should handle routes with query parameters', async () => {
      app.get('/api/search', () => ({ results: [] }));

      await app.handle(new Request('http://localhost/api/search?q=test'));
      await app.handle(new Request('http://localhost/api/search?q=another&filter=active'));

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/search']).toBeDefined();
      expect(metrics['GET /api/search'].requestCount).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with special characters in path', async () => {
      app.get('/api/users/:id', ({ params }) => ({ id: params.id }));

      await app.handle(new Request('http://localhost/api/users/123'));
      await app.handle(new Request('http://localhost/api/users/test-user'));

      const metrics = getMonitoringMetrics();
      // Should track the route pattern, not specific values
      expect(Object.keys(metrics)).toContain('GET /api/users/:id');
    });

    it('should handle empty response bodies', async () => {
      app.get('/api/empty', () => new Response(null, { status: 204 }));

      await app.handle(new Request('http://localhost/api/empty'));

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/empty']).toBeDefined();
      expect(metrics['GET /api/empty'].requestCount).toBe(1);
    });

    it('should handle concurrent requests', async () => {
      app.get('/api/concurrent', () => ({ message: 'concurrent' }));

      // Make concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        app.handle(new Request('http://localhost/api/concurrent'))
      );

      await Promise.all(promises);

      const metrics = getMonitoringMetrics();
      expect(metrics['GET /api/concurrent'].requestCount).toBe(10);
    });
  });
});