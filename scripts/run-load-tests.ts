#!/usr/bin/env bun

/**
 * Load Testing Script
 * Simple script to run load tests against the Falador API
 */

import {
  LoadTestRunner,
  loadTestConfigs,
} from '../tests/load/load-test-config';

async function main() {
  const args = process.argv.slice(2);
  const testToRun = args[0] || 'health';

  console.log('🚀 Starting Falador Load Testing');
  console.log('='.repeat(50));

  const runner = new LoadTestRunner('http://localhost:3000');

  try {
    // Wait a moment for the server to be ready
    console.log('⏳ Checking if server is ready...');
    await checkServerReady();

    let configs;

    switch (testToRun.toLowerCase()) {
      case 'health':
        configs = [loadTestConfigs[0]]; // Health check test
        break;
      case 'auth':
        configs = [loadTestConfigs[1]]; // Authentication test
        break;
      case 'projects':
        configs = [loadTestConfigs[2]]; // Projects list test
        break;
      case 'create':
        configs = [loadTestConfigs[3]]; // Project creation test
        break;
      case 'mixed':
        configs = [loadTestConfigs[4]]; // Mixed workload test
        break;
      case 'all':
        configs = loadTestConfigs.slice(0, 4); // All tests except mixed
        break;
      default:
        console.error(`❌ Unknown test: ${testToRun}`);
        console.log(
          'Available tests: health, auth, projects, create, mixed, all'
        );
        process.exit(1);
    }

    console.log(`🎯 Running test: ${testToRun}`);
    console.log('');

    // Run the tests
    const results = await runner.runTestSuite(configs);

    // Generate and save report
    const report = runner.generateReport(results);
    const reportPath = `docs/load-test-report-${new Date().toISOString().split('T')[0]}.md`;

    await Bun.write(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Evaluate overall results
    const failedTests = results.filter((r) => r.failedRequests > 0);
    if (failedTests.length === 0) {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    } else {
      console.log(`\n❌ ${failedTests.length} test(s) failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  }
}

async function checkServerReady(): Promise<void> {
  const maxRetries = 30;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:3000/health', {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log('✅ Server is ready');
        return;
      }
    } catch {
      // Server not ready yet
    }

    if (i < maxRetries - 1) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(
    'Server is not ready after 30 attempts. Please ensure the API server is running on http://localhost:3000'
  );
}

// Run the main function
main().catch(console.error);
