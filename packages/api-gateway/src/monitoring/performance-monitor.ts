/**
 * Performance Monitoring Module
 * Provides performance tracking and metrics collection
 */

import {
  MONITORING_LIMITS,
  TIME_WINDOW_DEFAULT_MS,
  ONE_HOUR_MS,
  PERFORMANCE_THRESHOLDS,
  type PerformanceMetrics,
  type RequestMetrics
} from './performance-constants';
import {
  getStatusGroup,
  groupRequestsByEndpoint,
  calculateEndpointPerformance,
  updatePerformanceMetrics,
  validatePerformanceThresholds,
  formatMetricsForExport,
  bytesToMegabytes
} from './performance-utils';

/**
 * Performance Monitor Class
 * Tracks request metrics and provides performance insights
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private requestHistory: RequestMetrics[] = [];
  private readonly maxHistorySize: number;
  private startTime: number;
  private memoryUpdateInterval: NodeJS.Timeout | null = null;

  constructor(maxHistorySize: number = MONITORING_LIMITS.MAX_HISTORY_SIZE) {
    this.maxHistorySize = maxHistorySize;
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.setupMemoryMonitoring();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage(),
      uptime: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Setup periodic memory monitoring
   */
  private setupMemoryMonitoring(): void {
    this.memoryUpdateInterval = setInterval(() => {
      this.metrics.memoryUsage = process.memoryUsage();
      this.metrics.uptime = Date.now() - this.startTime;
    }, MONITORING_LIMITS.MEMORY_UPDATE_INTERVAL_MS);
  }

  /**
   * Record a request and update performance metrics
   */
  public recordRequest(request: RequestMetrics): void {
    this.requestHistory.push(request);
    this.limitHistorySize();
    this.updateMetrics();
  }

  /**
   * Limit request history size to prevent memory leaks
   */
  private limitHistorySize(): void {
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update performance metrics from recent requests
   */
  private updateMetrics(): void {
    const recentRequests = this.getRecentRequests(MONITORING_LIMITS.RECENT_REQUESTS_LIMIT);

    if (recentRequests.length === 0) {
      return;
    }

    this.metrics = updatePerformanceMetrics(this.metrics, recentRequests, this.startTime);
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    this.updateMetrics(); // Ensure metrics are up-to-date
    return { ...this.metrics };
  }

  /**
   * Get recent requests within time window
   */
  public getRecentRequests(timeWindowMs: number = TIME_WINDOW_DEFAULT_MS): RequestMetrics[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.requestHistory.filter((request) => request.timestamp > cutoff);
  }

  /**
   * Get requests by status code distribution
   */
  public getStatusDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    const recentRequests = this.getRecentRequests();

    for (const request of recentRequests) {
      const statusGroup = getStatusGroup(request.statusCode);
      distribution[statusGroup] = (distribution[statusGroup] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get endpoint performance summary
   */
  public getEndpointPerformance(): Record<
    string,
    {
      count: number;
      averageResponseTime: number;
      errorRate: number;
    }
  > {
    const recentRequests = this.getRecentRequests();
    const endpoints = groupRequestsByEndpoint(recentRequests);
    const performance: Record<string, {
      count: number;
      averageResponseTime: number;
      errorRate: number;
    }> = {};

    for (const [endpoint, requests] of Object.entries(endpoints)) {
      performance[endpoint] = calculateEndpointPerformance(requests);
    }

    return performance;
  }

  /**
   * Get memory usage trends
   */
  public getMemoryTrends(): {
    current: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    average: NodeJS.MemoryUsage;
  } {
    const recentRequests = this.getRecentRequests(ONE_HOUR_MS);

    if (recentRequests.length === 0) {
      const currentMemory = this.metrics.memoryUsage;
      return {
        current: currentMemory,
        peak: currentMemory,
        average: currentMemory,
      };
    }

    // For now, return current metrics as all three
    // In a real implementation, you'd store historical memory data
    const currentMemory = this.metrics.memoryUsage;
    return {
      current: currentMemory,
      peak: currentMemory,
      average: currentMemory,
    };
  }

  /**
   * Check if performance thresholds are exceeded
   */
  public checkPerformanceThresholds(): {
    isHealthy: boolean;
    warnings: string[];
    errors: string[];
  } {
    return validatePerformanceThresholds(this.metrics);
  }

  /**
   * Reset all metrics (useful for testing or manual resets)
   */
  public reset(): void {
    this.requestHistory = [];
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
  }

  /**
   * Export metrics for external monitoring systems
   */
  public exportMetrics(): string {
    const metrics = this.getMetrics();
    const status = this.checkPerformanceThresholds();
    return formatMetricsForExport(metrics, status);
  }

  /**
   * Cleanup resources (call when shutting down)
   */
  public cleanup(): void {
    if (this.memoryUpdateInterval) {
      clearInterval(this.memoryUpdateInterval);
      this.memoryUpdateInterval = null;
    }
  }

  /**
   * Get memory usage in megabytes
   */
  public getMemoryUsageMB(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    const memory = this.metrics.memoryUsage;
    return {
      heapUsed: bytesToMegabytes(memory.heapUsed),
      heapTotal: bytesToMegabytes(memory.heapTotal),
      external: bytesToMegabytes(memory.external),
      rss: bytesToMegabytes(memory.rss),
    };
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
    memoryUsage: NodeJS.MemoryUsage;
    timestamp: number;
  } {
    const recentRequests = this.getRecentRequests();
    const slowRequests = recentRequests.filter(req => req.responseTime > PERFORMANCE_THRESHOLDS.SLOW_REQUEST_PERFORMANCE_MS).length;

    return {
      totalRequests: this.metrics.requestCount,
      averageResponseTime: this.metrics.averageResponseTime,
      errorRate: this.metrics.errorRate,
      slowRequests,
      memoryUsage: this.metrics.memoryUsage,
      timestamp: this.metrics.timestamp,
    };
  }
}

// Singleton instance for application-wide monitoring
export const performanceMonitor = new PerformanceMonitor();