/**
 * Performance Monitoring Middleware
 * Integrates performance monitoring into Elysia routes
 */

import { Elysia } from 'elysia';
import {
  performanceMonitor,
  RequestMetrics,
} from '../monitoring/performance-monitor';
import {
  HTTP_STATUS,
  type PerformanceStats
} from './performance-constants';

/**
 * Extracts client IP address from request headers
 */
function extractClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Extracts user agent from request headers
 */
function extractUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Creates request metrics object
 */
function createRequestMetrics(
  request: Request,
  statusCode: number,
  responseTime: number,
  startTime: number
): RequestMetrics {
  return {
    method: request.method,
    url: request.url,
    statusCode,
    responseTime,
    timestamp: startTime,
    userAgent: extractUserAgent(request),
    ip: extractClientIp(request),
  };
}

/**
 * Creates performance record function with start time
 */
function createPerformanceRecorder(request: Request, startTime: number): () => void {
  return (): void => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const metrics = createRequestMetrics(request, HTTP_STATUS.OK, responseTime, startTime);
    performanceMonitor.recordRequest(metrics);
  };
}

/**
 * Creates performance derive context
 */
function createPerformanceContext(request: Request): {
  recordPerformance: () => void;
  getPerformanceMetrics: () => PerformanceStats;
} {
  const startTime = Date.now();
  const recordPerformance = createPerformanceRecorder(request, startTime);

  return {
    recordPerformance,
    getPerformanceMetrics: () => performanceMonitor.getMetrics(),
  };
}

/**
 * Performance monitoring plugin for Elysia
 */
export const performancePlugin = (app: Elysia): Elysia =>
  app
    .derive(({ request }) => createPerformanceContext(request))
    .onAfterHandle(({ recordPerformance }): void => {
      // Record metrics after successful request handling
      recordPerformance();
    })
    .onError(({ error, code, recordPerformance }): void => {
      // Record metrics even when errors occur
      recordPerformance();

      // Log performance-related errors
      if (code === 'INTERNAL_SERVER_ERROR') {
        console.error('Performance monitoring error:', error);
      }
    });

/**
 * Enhanced request store interface for performance timing
 */
interface PerformanceStore {
  startTime: number;
}

/**
 * Performance monitoring middleware function
 */
export const performanceMiddleware = {
  beforeHandle({ store }: { store: PerformanceStore }): void {
    store.startTime = Date.now();
  },

  afterHandle({
    request,
    set,
    store,
  }: {
    request: Request;
    set: { status?: number };
    store: PerformanceStore;
  }): void {
    const endTime = Date.now();
    const responseTime = endTime - store.startTime;

    const metrics = createRequestMetrics(
      request,
      set.status || HTTP_STATUS.OK,
      responseTime,
      store.startTime
    );

    performanceMonitor.recordRequest(metrics);
  },

  onError({
    request,
    set,
    store,
  }: {
    request: Request;
    set: { status?: number };
    store: PerformanceStore;
  }): void {
    const endTime = Date.now();
    const responseTime = endTime - store.startTime;

    const metrics = createRequestMetrics(
      request,
      set.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      responseTime,
      store.startTime
    );

    performanceMonitor.recordRequest(metrics);
  },
};