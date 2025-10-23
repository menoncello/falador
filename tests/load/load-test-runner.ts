/**
 * Simple Load Testing Runner
 * Basic load testing implementation without external dependencies
 */

import {
  LoadTestConfig,
  LoadTestResult,
  performanceThresholds,
} from './load-test-config';

interface RequestResult {
  success: boolean;
  responseTime: number;
  status?: number;
  error?: string;
}

interface WorkerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: number[];
  errors: string[];
}

class LoadTestWorker {
  private config: LoadTestConfig;
  private baseUrl: string;
  private stats: WorkerStats;

  constructor(config: LoadTestConfig, baseUrl: string) {
    this.config = config;
    this.baseUrl = baseUrl;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
    };
  }

  async makeRequest(): Promise<RequestResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${this.config.target}`;

    try {
      const options: RequestInit = {
        method: this.config.method,
        headers: this.config.headers || {},
        signal: AbortSignal.timeout(this.config.timeout),
      };

      if (
        this.config.body &&
        (this.config.method === 'POST' || this.config.method === 'PUT')
      ) {
        options.body = JSON.stringify(this.config.body);
      }

      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      const success = response.status === this.config.expectedStatus;

      if (!success) {
        return {
          success: false,
          responseTime,
          status: response.status,
          error: `Unexpected status: ${response.status}`,
        };
      }

      return {
        success: true,
        responseTime,
        status: response.status,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  updateStats(result: RequestResult): void {
    this.stats.totalRequests++;
    this.stats.responseTimes.push(result.responseTime);

    if (result.success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
      if (result.error) {
        this.stats.errors.push(result.error);
      }
    }
  }

  getStats(): WorkerStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
    };
  }
}

class LoadTestRunner {
  private baseUrl: string;
  private results: LoadTestResult[] = [];

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private async runSingleTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`🚀 Starting load test: ${config.name}`);
    console.log(
      `   Duration: ${config.duration}s, Users: ${config.users}, Ramp-up: ${config.rampUp}s`
    );

    const startTime = new Date();
    const worker = new LoadTestWorker(config, this.baseUrl);

    // Calculate user spawn interval
    const userSpawnInterval = (config.rampUp * 1000) / config.users;
    const endTime = startTime.getTime() + config.duration * 1000;

    // Spawn users gradually
    const userPromises: Array<Promise<void>> = [];
    for (let i = 0; i < config.users; i++) {
      const delay = i * userSpawnInterval;
      const userPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          this.runUserWorker(worker, endTime);
          resolve();
        }, delay);
      });
      userPromises.push(userPromise);
    }

    // Wait for all users to finish
    await Promise.all(userPromises);

    // Wait for the test duration to complete
    await new Promise((resolve) => {
      const remainingTime = endTime - Date.now();
      if (remainingTime > 0) {
        setTimeout(resolve, remainingTime);
      } else {
        resolve();
      }
    });

    const endTimeDate = new Date();
    const stats = worker.getStats();

    const result: LoadTestResult = {
      config,
      startTime,
      endTime: endTimeDate,
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      averageResponseTime:
        stats.responseTimes.length > 0
          ? stats.responseTimes.reduce((sum, time) => sum + time, 0) /
            stats.responseTimes.length
          : 0,
      minResponseTime:
        stats.responseTimes.length > 0 ? Math.min(...stats.responseTimes) : 0,
      maxResponseTime:
        stats.responseTimes.length > 0 ? Math.max(...stats.responseTimes) : 0,
      p95ResponseTime: this.calculatePercentile(stats.responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(stats.responseTimes, 99),
      requestsPerSecond:
        stats.totalRequests /
        ((endTimeDate.getTime() - startTime.getTime()) / 1000),
      errors: stats.errors,
    };

    this.results.push(result);
    return result;
  }

  private async runUserWorker(
    worker: LoadTestWorker,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime) {
      const result = await worker.makeRequest();
      worker.updateStats(result);

      // Small delay between requests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private evaluateResult(
    result: LoadTestResult,
    thresholds = performanceThresholds
  ): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check response time thresholds
    if (result.p95ResponseTime > thresholds.responseTime.p95) {
      issues.push(
        `P95 response time (${result.p95ResponseTime}ms) exceeds threshold (${thresholds.responseTime.p95}ms)`
      );
    }

    if (result.p99ResponseTime > thresholds.responseTime.p99) {
      issues.push(
        `P99 response time (${result.p99ResponseTime}ms) exceeds threshold (${thresholds.responseTime.p99}ms)`
      );
    }

    if (result.maxResponseTime > thresholds.responseTime.max) {
      issues.push(
        `Max response time (${result.maxResponseTime}ms) exceeds threshold (${thresholds.responseTime.max}ms)`
      );
    }

    // Check throughput
    if (result.requestsPerSecond < thresholds.throughput.min) {
      issues.push(
        `Throughput (${result.requestsPerSecond.toFixed(2)} RPS) below minimum (${thresholds.throughput.min} RPS)`
      );
    }

    // Check error rate
    const errorRate =
      result.totalRequests > 0
        ? (result.failedRequests / result.totalRequests) * 100
        : 0;
    if (errorRate > thresholds.errorRate.max) {
      issues.push(
        `Error rate (${errorRate.toFixed(2)}%) exceeds threshold (${thresholds.errorRate.max}%)`
      );
    }

    // Check availability
    const availability =
      result.totalRequests > 0
        ? (result.successfulRequests / result.totalRequests) * 100
        : 0;
    if (availability < thresholds.availability.min) {
      issues.push(
        `Availability (${availability.toFixed(2)}%) below minimum (${thresholds.availability.min}%)`
      );
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  async runTest(config: LoadTestConfig): Promise<LoadTestResult> {
    return this.runSingleTest(config);
  }

  async runTestSuite(configs: LoadTestConfig[]): Promise<LoadTestResult[]> {
    console.log(`🎯 Running load test suite with ${configs.length} tests`);
    console.log('='.repeat(50));

    const results: LoadTestResult[] = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      console.log(`\n[${i + 1}/${configs.length}] ${config.name}`);

      try {
        const result = await this.runSingleTest(config);
        results.push(result);

        // Evaluate result against thresholds
        const evaluation = this.evaluateResult(result);

        if (evaluation.passed) {
          console.log(
            `✅ Test passed - ${result.totalRequests} requests, ${result.requestsPerSecond.toFixed(2)} RPS`
          );
        } else {
          console.log(`❌ Test failed - ${result.totalRequests} requests`);
          for (const issue of evaluation.issues) console.log(`   ⚠️  ${issue}`);
        }

        // Display summary
        console.log(
          `   📊 Response times: avg=${result.averageResponseTime.toFixed(0)}ms, p95=${result.p95ResponseTime.toFixed(0)}ms, p99=${result.p99ResponseTime.toFixed(0)}ms`
        );
        console.log(
          `   📈 Success rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
        );
      } catch (error) {
        console.error(`❌ Test failed with error:`, error);
        // Add a failed result
        results.push({
          config,
          startTime: new Date(),
          endTime: new Date(),
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          requestsPerSecond: 0,
          errors: [error instanceof Error ? error.message : String(error)],
        });
      }

      // Small delay between tests
      if (i < configs.length - 1) {
        console.log('   ⏳ Waiting 5 seconds before next test...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('🏁 Load test suite completed');

    this.results.push(...results);
    return results;
  }

  generateReport(results: LoadTestResult[]): string {
    const report = [
      '# Load Testing Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Test Results Summary',
      '',
    ];

    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    for (const [index, result] of results.entries()) {
      totalRequests += result.totalRequests;
      totalSuccessful += result.successfulRequests;
      totalFailed += result.failedRequests;

      const evaluation = this.evaluateResult(result);
      const status = evaluation.passed ? '✅ PASSED' : '❌ FAILED';

      report.push(`### ${index + 1}. ${result.config.name} ${status}`);
      report.push(
        `**Duration:** ${result.config.duration}s | **Users:** ${result.config.users}`
      );
      report.push(
        `**Total Requests:** ${result.totalRequests} | **Success Rate:** ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`
      );
      report.push(`**Throughput:** ${result.requestsPerSecond.toFixed(2)} RPS`);
      report.push(
        `**Response Times:** Avg=${result.averageResponseTime.toFixed(0)}ms | P95=${result.p95ResponseTime.toFixed(0)}ms | P99=${result.p99ResponseTime.toFixed(0)}ms`
      );

      if (!evaluation.passed) {
        report.push('**Issues:**');
        for (const issue of evaluation.issues) report.push(`- ${issue}`);
      }

      if (result.errors.length > 0) {
        report.push('**Errors:**');
        for (const error of result.errors.slice(0, 5))
          report.push(`- ${error}`);
        if (result.errors.length > 5) {
          report.push(`- ... and ${result.errors.length - 5} more errors`);
        }
      }

      report.push('');
    }

    // Overall summary
    report.push('## Overall Summary');
    report.push(`**Total Tests:** ${results.length}`);
    report.push(`**Total Requests:** ${totalRequests}`);
    report.push(
      `**Overall Success Rate:** ${((totalSuccessful / totalRequests) * 100).toFixed(1)}%`
    );
    report.push(
      `**Overall Average Throughput:** ${(totalRequests / results.reduce((sum, r) => sum + r.config.duration, 0)).toFixed(2)} RPS`
    );

    return report.join('\n');
  }

  getResults(): LoadTestResult[] {
    return this.results;
  }
}

export { LoadTestRunner };

// CLI interface for running tests
if (import.meta.main) {
  const runner = new LoadTestRunner();

  console.log('🎯 Falador Load Testing Tool');
  console.log('Usage: bun run tests/load/load-test-runner.ts [test-name]');
  console.log('');
  console.log('Available tests:');
  console.log('- all: Run all tests');
  console.log('- health: Health check load test');
  console.log('- auth: Authentication load test');
  console.log('- projects: Projects load test');
  console.log('- mixed: Mixed workload test');

  process.exit(0);
}
