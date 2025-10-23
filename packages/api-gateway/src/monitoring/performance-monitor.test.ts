import { describe, it, expect, beforeEach } from 'bun:test';
import { PerformanceMonitor } from './performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('Basic functionality', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.requestCount).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.timestamp).toBeGreaterThan(0);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should record requests correctly', () => {
      const request = {
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        responseTime: 150,
        timestamp: Date.now(),
      };

      monitor.recordRequest(request);
      const metrics = monitor.getMetrics();

      expect(metrics.requestCount).toBe(1);
      expect(metrics.averageResponseTime).toBe(150);
      expect(metrics.errorRate).toBe(0);
    });

    it('should calculate error rate correctly', () => {
      const requests = [
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          responseTime: 100,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 404,
          responseTime: 50,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 500,
          responseTime: 200,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          responseTime: 75,
          timestamp: Date.now(),
        },
      ];

      for (const req of requests) monitor.recordRequest(req);
      const metrics = monitor.getMetrics();

      expect(metrics.requestCount).toBe(4);
      expect(metrics.errorRate).toBe(50); // 2 errors out of 4 requests
      expect(metrics.averageResponseTime).toBe(106.25); // (100 + 50 + 200 + 75) / 4
    });
  });

  describe('Request history', () => {
    it('should limit request history size', () => {
      const monitor = new PerformanceMonitor();

      // Add more requests than the max history size
      for (let i = 0; i < 1500; i++) {
        monitor.recordRequest({
          method: 'GET',
          url: `/api/test/${i}`,
          statusCode: 200,
          responseTime: 100,
          timestamp: Date.now() + i,
        });
      }

      const recentRequests = monitor.getRecentRequests();
      expect(recentRequests.length).toBeLessThanOrEqual(1000);
    });

    it('should filter requests by time window', () => {
      const now = Date.now();
      const requests = [
        {
          method: 'GET',
          url: '/api/old',
          statusCode: 200,
          responseTime: 100,
          timestamp: now - 400000,
        }, // 400s ago
        {
          method: 'GET',
          url: '/api/recent',
          statusCode: 200,
          responseTime: 150,
          timestamp: now - 10000,
        }, // 10s ago
        {
          method: 'GET',
          url: '/api/current',
          statusCode: 200,
          responseTime: 75,
          timestamp: now,
        }, // now
      ];

      for (const req of requests) monitor.recordRequest(req);

      const recentRequests = monitor.getRecentRequests(60000); // Last 60 seconds
      expect(recentRequests).toHaveLength(2);
      expect(recentRequests[0].url).toBe('/api/recent');
      expect(recentRequests[1].url).toBe('/api/current');
    });
  });

  describe('Status distribution', () => {
    it('should group status codes correctly', () => {
      const requests = [
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          responseTime: 100,
          timestamp: Date.now(),
        },
        {
          method: 'POST',
          url: '/api/test',
          statusCode: 201,
          responseTime: 150,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 301,
          responseTime: 50,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 404,
          responseTime: 75,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 500,
          responseTime: 200,
          timestamp: Date.now(),
        },
      ];

      for (const req of requests) monitor.recordRequest(req);
      const distribution = monitor.getStatusDistribution();

      expect(distribution['2xx_Success']).toBe(2);
      expect(distribution['3xx_Redirection']).toBe(1);
      expect(distribution['4xx_Client_Error']).toBe(1);
      expect(distribution['5xx_Server_Error']).toBe(1);
    });
  });

  describe('Endpoint performance', () => {
    it('should calculate endpoint metrics correctly', () => {
      const requests = [
        {
          method: 'GET',
          url: '/api/users',
          statusCode: 200,
          responseTime: 100,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/users',
          statusCode: 200,
          responseTime: 150,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/users',
          statusCode: 500,
          responseTime: 300,
          timestamp: Date.now(),
        },
        {
          method: 'POST',
          url: '/api/projects',
          statusCode: 201,
          responseTime: 200,
          timestamp: Date.now(),
        },
        {
          method: 'POST',
          url: '/api/projects',
          statusCode: 400,
          responseTime: 100,
          timestamp: Date.now(),
        },
      ];

      for (const req of requests) monitor.recordRequest(req);
      const endpointPerf = monitor.getEndpointPerformance();

      expect(endpointPerf['GET /api/users']).toEqual({
        count: 3,
        averageResponseTime: 183.33333333333334, // (100 + 150 + 300) / 3
        errorRate: 33.33333333333333, // 1 error out of 3 requests
      });

      expect(endpointPerf['POST /api/projects']).toEqual({
        count: 2,
        averageResponseTime: 150, // (200 + 100) / 2
        errorRate: 50, // 1 error out of 2 requests
      });
    });
  });

  describe('Performance thresholds', () => {
    it('should detect healthy performance', () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        responseTime: 100 + i * 10, // 100-190ms
        timestamp: Date.now() + i,
      }));

      for (const req of requests) monitor.recordRequest(req);
      const thresholds = monitor.checkPerformanceThresholds();

      expect(thresholds.isHealthy).toBe(true);
      expect(thresholds.warnings).toHaveLength(0);
      expect(thresholds.errors).toHaveLength(0);
    });

    it('should detect performance warnings', () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        method: 'GET',
        url: '/api/test',
        statusCode: 200,
        responseTime: 600 + i * 50, // 600-1050ms (warning threshold)
        timestamp: Date.now() + i,
      }));

      for (const req of requests) monitor.recordRequest(req);
      const thresholds = monitor.checkPerformanceThresholds();

      expect(thresholds.isHealthy).toBe(true);
      expect(thresholds.warnings.length).toBeGreaterThan(0);
      expect(thresholds.errors).toHaveLength(0);
    });

    it('should detect performance errors', () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        method: 'GET',
        url: '/api/test',
        statusCode: 500,
        responseTime: 2000, // 2s (error threshold)
        timestamp: Date.now() + i,
      }));

      for (const req of requests) monitor.recordRequest(req);
      const thresholds = monitor.checkPerformanceThresholds();

      expect(thresholds.isHealthy).toBe(false);
      expect(thresholds.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Memory monitoring', () => {
    it('should track memory usage', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.memoryUsage).toBeDefined();
      expect(typeof metrics.memoryUsage.heapUsed).toBe('number');
      expect(typeof metrics.memoryUsage.heapTotal).toBe('number');
      expect(typeof metrics.memoryUsage.external).toBe('number');
      expect(typeof metrics.memoryUsage.rss).toBe('number');
    });
  });

  describe('Metrics export', () => {
    it('should export metrics as JSON', () => {
      const requests = [
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          responseTime: 150,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 404,
          responseTime: 50,
          timestamp: Date.now(),
        },
      ];

      for (const req of requests) monitor.recordRequest(req);
      const exported = monitor.exportMetrics();

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.timestamp).toBeGreaterThan(0);
      expect(parsed.requestCount).toBe(2);
      expect(parsed.averageResponseTime).toBe(100); // (150 + 50) / 2
      expect(parsed.errorRate).toBe(50); // 1 error out of 2 requests
      // Health might be false depending on thresholds, so check structure
      expect(parsed.status).toHaveProperty('healthy');
      expect(typeof parsed.status.healthy).toBe('boolean');
    });
  });

  describe('Reset functionality', () => {
    it('should reset all metrics', () => {
      const requests = [
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          responseTime: 150,
          timestamp: Date.now(),
        },
        {
          method: 'GET',
          url: '/api/test',
          statusCode: 404,
          responseTime: 50,
          timestamp: Date.now(),
        },
      ];

      for (const req of requests) monitor.recordRequest(req);
      expect(monitor.getMetrics().requestCount).toBe(2);

      monitor.reset();
      const resetMetrics = monitor.getMetrics();

      expect(resetMetrics.requestCount).toBe(0);
      expect(resetMetrics.averageResponseTime).toBe(0);
      expect(resetMetrics.errorRate).toBe(0);
      expect(resetMetrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
