/**
 * Uptime and Error Monitoring System
 * Tracks application uptime, downtime events, and error patterns
 */

export interface UptimeEvent {
  timestamp: number;
  type: 'uptime' | 'downtime' | 'degraded' | 'error' | 'recovery';
  message: string;
  details?: any;
  duration?: number; // for downtime/recovery events
}

export interface ErrorEvent {
  timestamp: number;
  error: Error | string;
  stack?: string;
  url?: string;
  method?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category:
    | 'system'
    | 'network'
    | 'database'
    | 'authentication'
    | 'business'
    | 'external';
}

export interface UptimeMetrics {
  startTime: number;
  totalUptime: number;
  totalDowntime: number;
  currentUptime: number;
  availability: number; // percentage
  lastEvent?: UptimeEvent;
  events: UptimeEvent[];
  errorEvents: ErrorEvent[];
  performanceScore: number; // 0-100
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: UptimeMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // seconds between alerts
  lastTriggered?: number;
  enabled: boolean;
}

/**
 *
 */
export class UptimeMonitor {
  private metrics: UptimeMetrics;
  private isHealthy = true;
  private lastHealthCheck: number = Date.now();
  private alertRules: AlertRule[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupDefaultAlertRules();
    this.startMonitoring();
  }

  private initializeMetrics(): UptimeMetrics {
    const startTime = Date.now();
    return {
      startTime,
      totalUptime: 0,
      totalDowntime: 0,
      currentUptime: 0,
      availability: 100,
      events: [
        {
          timestamp: startTime,
          type: 'uptime',
          message: 'Application started',
        },
      ],
      errorEvents: [],
      performanceScore: 100,
    };
  }

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate Alert',
        condition: (metrics) => {
          const recentErrors = metrics.errorEvents.filter(
            (e) => Date.now() - e.timestamp < 300000 // Last 5 minutes
          );
          return recentErrors.length > 10;
        },
        severity: 'high',
        cooldown: 300,
        enabled: true,
      },
      {
        id: 'downtime-detected',
        name: 'Downtime Detected',
        condition: (metrics) => metrics.availability < 95,
        severity: 'critical',
        cooldown: 60,
        enabled: true,
      },
      {
        id: 'critical-errors',
        name: 'Critical Error Pattern',
        condition: (metrics) => {
          const recentCritical = metrics.errorEvents.filter(
            (e) =>
              Date.now() - e.timestamp < 600000 && e.severity === 'critical' // Last 10 minutes
          );
          return recentCritical.length > 0;
        },
        severity: 'critical',
        cooldown: 120,
        enabled: true,
      },
      {
        id: 'performance-degradation',
        name: 'Performance Degradation',
        condition: (metrics) => metrics.performanceScore < 70,
        severity: 'medium',
        cooldown: 180,
        enabled: true,
      },
    ];
  }

  private startMonitoring(): void {
    // Update metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, 30000);
  }

  private updateMetrics(): void {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastHealthCheck;

    if (this.isHealthy) {
      this.metrics.totalUptime += timeSinceLastCheck;
      this.metrics.currentUptime += timeSinceLastCheck;
    } else {
      this.metrics.totalDowntime += timeSinceLastCheck;
    }

    // Calculate availability
    const totalTime = this.metrics.totalUptime + this.metrics.totalDowntime;
    this.metrics.availability =
      totalTime > 0 ? (this.metrics.totalUptime / totalTime) * 100 : 100;

    // Calculate performance score
    this.metrics.performanceScore = this.calculatePerformanceScore();

    this.lastHealthCheck = now;
  }

  private calculatePerformanceScore(): number {
    let score = 100;

    // Deduct points for recent errors
    const recentErrors = this.metrics.errorEvents.filter(
      (e) => Date.now() - e.timestamp < 3600000 // Last hour
    );

    for (const error of recentErrors) {
      switch (error.severity) {
        case 'critical':
          score -= 10;
          break;
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 2;
          break;
        case 'low':
          score -= 1;
          break;
      }
    }

    // Deduct points for downtime
    if (this.metrics.availability < 100) {
      score -= (100 - this.metrics.availability) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  private checkAlerts(): void {
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (
        rule.lastTriggered &&
        now - rule.lastTriggered < rule.cooldown * 1000
      ) {
        continue;
      }

      // Check condition
      if (rule.condition(this.metrics)) {
        this.triggerAlert(rule);
        rule.lastTriggered = now;
      }
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const alert: UptimeEvent = {
      timestamp: Date.now(),
      type: 'error',
      message: `Alert: ${rule.name}`,
      details: {
        ruleId: rule.id,
        severity: rule.severity,
        availability: this.metrics.availability,
        performanceScore: this.metrics.performanceScore,
        recentErrors: this.metrics.errorEvents.filter(
          (e) => Date.now() - e.timestamp < 300000
        ).length,
      },
    };

    this.metrics.events.push(alert);
    this.logAlert(rule, alert);
  }

  private logAlert(rule: AlertRule, event: UptimeEvent): void {
    console.warn(
      `🚨 Uptime Alert [${rule.severity.toUpperCase()}]: ${rule.name}`
    );
    console.warn(`   Availability: ${this.metrics.availability.toFixed(2)}%`);
    console.warn(`   Performance Score: ${this.metrics.performanceScore}`);
    console.warn(`   Timestamp: ${new Date(event.timestamp).toISOString()}`);

    if (event.details) {
      console.warn(`   Details:`, event.details);
    }
  }

  /**
   * Record a health check result
   */
  public recordHealthCheck(isHealthy: boolean, details?: any): void {
    const wasHealthy = this.isHealthy;
    this.isHealthy = isHealthy;

    if (!wasHealthy && isHealthy) {
      // Recovery event
      const event: UptimeEvent = {
        timestamp: Date.now(),
        type: 'recovery',
        message: 'Service recovered',
        details,
      };
      this.metrics.events.push(event);
    } else if (wasHealthy && !isHealthy) {
      // Downtime event
      const event: UptimeEvent = {
        timestamp: Date.now(),
        type: 'downtime',
        message: 'Service degraded or down',
        details,
      };
      this.metrics.events.push(event);
    }

    this.updateMetrics();
  }

  /**
   * Record an error event
   */
  public recordError(
    error: Error | string,
    context?: {
      url?: string;
      method?: string;
      userId?: string;
      userAgent?: string;
      ip?: string;
      severity?: ErrorEvent['severity'];
      category?: ErrorEvent['category'];
    }
  ): void {
    const errorEvent: ErrorEvent = {
      timestamp: Date.now(),
      error,
      stack: error instanceof Error ? error.stack : undefined,
      url: context?.url,
      method: context?.method,
      userId: context?.userId,
      userAgent: context?.userAgent,
      ip: context?.ip,
      severity: context?.severity || this.determineErrorSeverity(error),
      category:
        context?.category || this.determineErrorCategory(error, context),
    };

    this.metrics.errorEvents.push(errorEvent);

    // Limit error history to last 1000 events
    if (this.metrics.errorEvents.length > 1000) {
      this.metrics.errorEvents = this.metrics.errorEvents.slice(-1000);
    }

    // Log critical errors immediately
    if (errorEvent.severity === 'critical') {
      console.error('🔥 Critical Error Recorded:', {
        error: errorEvent.error,
        category: errorEvent.category,
        timestamp: new Date(errorEvent.timestamp).toISOString(),
      });
    }
  }

  private determineErrorSeverity(
    error: Error | string
  ): ErrorEvent['severity'] {
    const errorMessage = error instanceof Error ? error.message : error;

    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection')
    ) {
      return 'high';
    }

    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403')
    ) {
      return 'medium';
    }

    if (
      errorMessage.includes('internal') ||
      errorMessage.includes('crash') ||
      errorMessage.includes('500')
    ) {
      return 'critical';
    }

    return 'low';
  }

  private determineErrorCategory(
    error: Error | string,
    context?: { url?: string; method?: string }
  ): ErrorEvent['category'] {
    const errorMessage = error instanceof Error ? error.message : error;

    // Database errors
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('connection pool')
    ) {
      return 'database';
    }

    // Network errors
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('ECONNREFUSED')
    ) {
      return 'network';
    }

    // Authentication errors
    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('jwt') ||
      errorMessage.includes('token')
    ) {
      return 'authentication';
    }

    // External service errors
    if (
      errorMessage.includes('external') ||
      errorMessage.includes('api') ||
      context?.url?.includes('/api/external/')
    ) {
      return 'external';
    }

    return 'system';
  }

  /**
   * Get current uptime metrics
   */
  public getMetrics(): UptimeMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get recent events
   */
  public getRecentEvents(limit = 50): UptimeEvent[] {
    return this.metrics.events.slice(-limit).reverse();
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit = 50): ErrorEvent[] {
    return this.metrics.errorEvents.slice(-limit).reverse();
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    recentHour: number;
    recentDay: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    const stats = {
      total: this.metrics.errorEvents.length,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recentHour: 0,
      recentDay: 0,
    };

    for (const error of this.metrics.errorEvents) {
      // Count by severity
      stats.bySeverity[error.severity] =
        (stats.bySeverity[error.severity] || 0) + 1;

      // Count by category
      stats.byCategory[error.category] =
        (stats.byCategory[error.category] || 0) + 1;

      // Count recent errors
      if (error.timestamp > oneHourAgo) {
        stats.recentHour++;
      }
      if (error.timestamp > oneDayAgo) {
        stats.recentDay++;
      }
    }

    return stats;
  }

  /**
   * Get uptime summary for dashboard
   */
  public getUptimeSummary(): {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    availability: number;
    performanceScore: number;
    currentUptime: string;
    totalEvents: number;
    recentErrors: number;
    lastEvent?: UptimeEvent;
  } {
    const metrics = this.getMetrics();
    const errorStats = this.getErrorStatistics();

    let status: 'healthy' | 'degraded' | 'down';
    if (metrics.availability >= 99.9 && metrics.performanceScore >= 90) {
      status = 'healthy';
    } else if (metrics.availability >= 95 && metrics.performanceScore >= 70) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      status,
      uptime: metrics.totalUptime,
      availability: metrics.availability,
      performanceScore: metrics.performanceScore,
      currentUptime: this.formatDuration(metrics.currentUptime),
      totalEvents: metrics.events.length,
      recentErrors: errorStats.recentHour,
      lastEvent: metrics.events[metrics.events.length - 1],
    };
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Add custom alert rule
   */
  public addAlertRule(rule: Omit<AlertRule, 'lastTriggered'>): void {
    this.alertRules.push({ ...rule, lastTriggered: undefined });
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex((rule) => rule.id === ruleId);
    if (index !== -1) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules
   */
  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Export metrics for external monitoring systems
   */
  public exportMetrics(): string {
    const summary = this.getUptimeSummary();
    const errorStats = this.getErrorStatistics();

    return JSON.stringify(
      {
        timestamp: Date.now(),
        uptime: {
          status: summary.status,
          availability: summary.availability,
          currentUptime: summary.currentUptime,
          totalUptime: this.metrics.totalUptime,
          totalDowntime: this.metrics.totalDowntime,
        },
        performance: {
          score: this.metrics.performanceScore,
        },
        errors: {
          total: errorStats.total,
          recentHour: errorStats.recentHour,
          recentDay: errorStats.recentDay,
          bySeverity: errorStats.bySeverity,
          byCategory: errorStats.byCategory,
        },
        events: {
          total: this.metrics.events.length,
          recent: this.getRecentEvents(10),
        },
      },
      null,
      2
    );
  }

  /**
   * Stop monitoring (cleanup)
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }
}

// Singleton instance for application-wide monitoring
export const uptimeMonitor = new UptimeMonitor();
