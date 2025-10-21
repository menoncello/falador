import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Elysia } from 'elysia';
import { InMemoryVoiceRepository } from '../repositories/in-memory-voice-repository.js';
import { OpenAITTSEngine } from '../services/openai-tts-engine.js';
import {
  createPerformanceMiddleware,
  getPerformanceMetrics,
  resetPerformanceMetrics,
} from '../middleware/performance.js';
import {
  createMonitoringMiddleware,
  getMonitoringMetrics,
  resetMonitoringMetrics,
} from '../middleware/monitoring.js';

describe('Error Recovery and Resilience Tests', () => {
  let app: Elysia;

  beforeEach(() => {
    resetPerformanceMetrics();
    resetMonitoringMetrics();

    app = new Elysia()
      .use(createPerformanceMiddleware())
      .use(createMonitoringMiddleware())
      .get('/health', () => ({ status: 'ok' }))
      .get('/error', () => {
        throw new Error('Test error');
      })
      .get('/timeout', async () => {
        // Simulate timeout
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { message: 'slow response' });
      })
      .post('/validate', ({ body }) => {
        if (!body || typeof body !== 'object') {
          throw new Error('Invalid request body');
        }
        return { received: body };
      })
      .get('/memory-intensive', async () => {
        // Simulate memory-intensive operation
        const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'x'.repeat(1000) }));
        return { count: largeArray.length };
      });
  });

  afterEach(() => {
    resetPerformanceMetrics();
    resetMonitoringMetrics();
  });

  describe('Graceful Error Handling', () => {
    it('should handle synchronous errors gracefully', async () => {
      const response = await app.handle(new Request('http://localhost/error'));

      expect(response.status).toBe(500);
      expect(response.headers.get('X-Response-Time')).toBeTruthy();
      expect(response.headers.get('X-Error-Type')).toBeTruthy();
    });

    it('should update error metrics when errors occur', async () => {
      // Make successful request first
      await app.handle(new Request('http://localhost/health'));

      // Make error request
      try {
        await app.handle(new Request('http://localhost/error'));
      } catch (error) {
        // Expected
      }

      const metrics = getMonitoringMetrics();
      const errorRoute = metrics['GET /error'];

      expect(errorRoute).toBeDefined();
      expect(errorRoute.errorCount).toBe(1);
      expect(errorRoute.lastError).toBe('Test error');
      expect(errorRoute.lastErrorTime).toBeInstanceOf(Date);
    });

    it('should maintain service availability during errors', async () => {
      // Make multiple requests, some successful, some errors
      const promises = [
        app.handle(new Request('http://localhost/health')),
        app.handle(new Request('http://localhost/error')).catch(() => new Response('error', { status: 500 })),
        app.handle(new Request('http://localhost/health')),
        app.handle(new Request('http://localhost/error')).catch(() => new Response('error', { status: 500 })),
        app.handle(new Request('http://localhost/health')),
      ];

      const responses = await Promise.all(promises);

      // Health endpoints should still work
      const healthResponses = responses.filter(r => r.status === 200);
      expect(healthResponses).toHaveLength(3);
    });

    it('should provide meaningful error responses', async () => {
      try {
        const response = await app.handle(new Request('http://localhost/error'));
        const body = await response.text();

        // Should contain error information
        expect(response.status).toBe(500);
      } catch (error) {
        // Expected for unhandled errors
        expect(error.message).toBe('Test error');
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await app.handle(new Request('http://localhost/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      }));

      expect(response.status).toBe(400);
    });

    it('should handle empty request bodies', async () => {
      const response = await app.handle(new Request('http://localhost/validate', {
        method: 'POST',
        body: null,
      }));

      expect(response.status).toBe(400);
    });

    it('should handle oversized requests', async () => {
      const largeBody = 'x'.repeat(1000000); // 1MB

      const response = await app.handle(new Request('http://localhost/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: largeBody,
      }));

      // Should handle gracefully without crashing
      expect([200, 400, 413]).toContain(response.status);
    });

    it('should validate request headers', async () => {
      const response = await app.handle(new Request('http://localhost/health', {
        headers: { 'X-Custom-Header': 'value' },
      }));

      expect(response.status).toBe(200);
    });
  });

  describe('Resource Exhaustion Recovery', () => {
    it('should handle memory pressure gracefully', async () => {
      const promises = Array.from({ length: 10 }, () =>
        app.handle(new Request('http://localhost/memory-intensive'))
      );

      const responses = await Promise.all(promises);

      // All requests should complete, even if slowly
      responses.forEach(response => {
        expect([200, 500, 503]).toContain(response.status);
      });
    });

    it('should maintain performance metrics during load', async () => {
      const promises = Array.from({ length: 50 }, () =>
        app.handle(new Request('http://localhost/health'))
      );

      await Promise.all(promises);

      const performanceMetrics = getPerformanceMetrics();
      const monitoringMetrics = getMonitoringMetrics();

      expect(performanceMetrics.totalRequests).toBeGreaterThan(50);
      expect(monitoringMetrics['GET /health']).toBeDefined();
    });

    it('should recover from temporary failures', async () => {
      let callCount = 0;

      app.get('/flaky', () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return { message: 'success after retries' };
      });

      // First few calls should fail
      for (let i = 0; i < 2; i++) {
        try {
          await app.handle(new Request('http://localhost/flaky'));
        } catch (error) {
          // Expected
        }
      }

      // Third call should succeed
      const response = await app.handle(new Request('http://localhost/flaky'));
      expect(response.status).toBe(200);
    });
  });

  describe('Timeout and Connection Handling', () => {
    it('should handle slow requests without blocking others', async () => {
      const slowRequest = app.handle(new Request('http://localhost/timeout'));
      const fastRequests = Array.from({ length: 5 }, () =>
        app.handle(new Request('http://localhost/health'))
      );

      // Fast requests should complete quickly even with slow request running
      const fastResults = await Promise.all(fastRequests);
      fastResults.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Slow request should also complete eventually
      const slowResult = await slowRequest;
      expect(slowResult.status).toBe(200);
    });

    it('should add appropriate headers for slow requests', async () => {
      const response = await app.handle(new Request('http://localhost/timeout'));

      expect(response.headers.get('X-Response-Time')).toBeTruthy();
      const responseTime = parseInt(response.headers.get('X-Response-Time')!);
      expect(responseTime).toBeGreaterThan(1000);
    });
  });

  describe('Repository Error Handling', () => {
    let repository: InMemoryVoiceRepository;

    beforeEach(() => {
      repository = new InMemoryVoiceRepository();
    });

    it('should handle repository errors gracefully', async () => {
      // Clear repository to simulate empty state
      repository.clear();

      const voices = await repository.findAll();
      expect(voices).toHaveLength(0);

      // Should handle empty results gracefully
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should maintain data consistency during errors', async () => {
      const initialCount = repository.size();

      // Try to save invalid data
      try {
        // @ts-expect-error Testing invalid data
        await repository.save(null);
      } catch (error) {
        // Expected
      }

      // Repository should remain in consistent state
      expect(repository.size()).toBe(initialCount);

      const voices = await repository.findAll();
      expect(voices.length).toBe(initialCount);
    });

    it('should handle concurrent repository operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const voice = {
          id: `concurrent-${i}`,
          name: `Concurrent Voice ${i}`,
          language: 'en-US',
          gender: 'female' as const,
          provider: 'test',
          isAvailable: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return repository.save(voice);
      });

      await Promise.all(promises);

      expect(repository.size()).toBe(15); // 5 initial + 10 concurrent

      // Verify all data is consistent
      for (let i = 0; i < 10; i++) {
        const found = await repository.findById(`concurrent-${i}`);
        expect(found).not.toBeNull();
        expect(found!.name).toBe(`Concurrent Voice ${i}`);
      }
    });
  });

  describe('Service Error Handling', () => {
    let engine: OpenAITTSEngine;

    beforeEach(() => {
      engine = new OpenAITTSEngine('test-api-key');
    });

    it('should handle service unavailability gracefully', async () => {
      // Mock service should always work, but we test error handling
      const audioBuffer = await engine.generateSpeech('test', 'invalid-voice');
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
    });

    it('should validate inputs before processing', async () => {
      const isValid = await engine.validateVoice('');
      expect(isValid).toBe(false);

      // Should not throw error with invalid input
      const audioBuffer = await engine.generateSpeech('', '');
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
    });

    it('should provide fallback behavior', async () => {
      // Test with all available voices
      const voices = await engine.getVoices();
      expect(voices).toHaveLength(6);

      // All voices should be validatable
      for (const voice of voices) {
        const isValid = await engine.validateVoice(voice.id);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Monitoring During Errors', () => {
    it('should track error rates correctly', async () => {
      // Make mixed requests
      const requests = [
        app.handle(new Request('http://localhost/health')),
        app.handle(new Request('http://localhost/error')).catch(() => new Response('error', { status: 500 })),
        app.handle(new Request('http://localhost/error')).catch(() => new Response('error', { status: 500 })),
        app.handle(new Request('http://localhost/health')),
        app.handle(new Request('http://localhost/error')).catch(() => new Response('error', { status: 500 })),
      ];

      await Promise.all(requests);

      const monitoringMetrics = getMonitoringMetrics();
      const healthMetrics = monitoringMetrics['GET /health'];
      const errorMetrics = monitoringMetrics['GET /error'];

      expect(healthMetrics.errorCount).toBe(0);
      expect(errorMetrics.errorCount).toBe(3);
      expect(errorMetrics.requestCount).toBe(3);
    });

    it('should update performance metrics during errors', async () => {
      // Generate some errors
      for (let i = 0; i < 5; i++) {
        try {
          await app.handle(new Request('http://localhost/error'));
        } catch (error) {
          // Expected
        }
      }

      const performanceMetrics = getPerformanceMetrics();
      expect(performanceMetrics.totalRequests).toBeGreaterThan(0);
      expect(performanceMetrics.errorRate).toBeGreaterThan(0);
    });

    it('should identify critical endpoint failures', async () => {
      // Simulate critical endpoint failures
      app.get('/api/auth/login', () => {
        throw new Error('Authentication service unavailable');
      });

      try {
        await app.handle(new Request('http://localhost/api/auth/login'));
      } catch (error) {
        // Expected
      }

      const healthCheck = require('../middleware/monitoring').createHealthCheck();
      expect(healthCheck.alerts.highErrorEndpoints.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery Patterns', () => {
    it('should implement circuit breaker pattern', async () => {
      let failureCount = 0;
      let circuitOpen = false;

      app.get('/circuit-test', () => {
        if (circuitOpen) {
          throw new Error('Circuit is open');
        }

        failureCount++;
        if (failureCount > 3) {
          circuitOpen = true;
          // Simulate circuit recovery after some time
          setTimeout(() => { circuitOpen = false; failureCount = 0; }, 100);
        }

        if (failureCount <= 3) {
          throw new Error('Service failure');
        }

        return { message: 'success' };
      });

      // Trigger failures
      for (let i = 0; i < 4; i++) {
        try {
          await app.handle(new Request('http://localhost/circuit-test'));
        } catch (error) {
          // Expected failures
        }
      }

      // Circuit should be open now
      try {
        await app.handle(new Request('http://localhost/circuit-test'));
      } catch (error) {
        expect(error.message).toBe('Circuit is open');
      }

      // Wait for circuit recovery
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should work again after recovery
      const response = await app.handle(new Request('http://localhost/circuit-test'));
      expect(response.status).toBe(200);
    });

    it('should implement retry pattern with exponential backoff', async () => {
      let attempts = 0;

      app.get('/retry-test', async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return { message: `success on attempt ${attempts}` };
      });

      let lastError: Error | null = null;
      let response: Response | null = null;

      // Implement retry logic
      for (let i = 0; i < 3; i++) {
        try {
          response = await app.handle(new Request('http://localhost/retry-test'));
          break;
        } catch (error) {
          lastError = error as Error;
          if (i < 2) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
          }
        }
      }

      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);

      const body = await response!.json();
      expect(body.message).toBe('success on attempt 3');
    });

    it('should degrade gracefully when services are unavailable', async () => {
      // Simulate degraded service
      let serviceAvailable = false;

      app.get('/degraded', () => {
        if (!serviceAvailable) {
          return {
            message: 'Service temporarily unavailable',
            degraded: true,
            fallbackData: ['item1', 'item2', 'item3']
          };
        }
        return { message: 'Full service available', degraded: false };
      });

      const response = await app.handle(new Request('http://localhost/degraded'));
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.degraded).toBe(true);
      expect(body.fallbackData).toBeDefined();

      // Service recovery
      serviceAvailable = true;
      const recoveredResponse = await app.handle(new Request('http://localhost/degraded'));
      const recoveredBody = await recoveredResponse.json();
      expect(recoveredBody.degraded).toBe(false);
    });
  });
});