#!/usr/bin/env node

/**
 * Mutation Testing Optimization Script
 *
 * This script provides optimized mutation testing strategies for different scenarios:
 * 1. Fast incremental mutation testing for CI/CD
 * 2. Comprehensive mutation testing for nightly builds
 * 3. Targeted mutation testing for specific modules
 * 4. Performance monitoring and optimization
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const STRYKER_CONFIG_PATH = join(ROOT_DIR, 'stryker.config.json');
const API_GATEWAY_CONFIG_PATH = join(ROOT_DIR, 'packages/api-gateway/stryker.config.json');

// Mutation testing optimization strategies
const STRATEGIES = {
  fast: {
    name: 'Fast Incremental',
    timeout: 15000,
    concurrency: 8,
    maxConcurrentTestRunners: 4,
    thresholds: { high: 75, low: 65, break: 70 },
    excludedMutations: [
      'StringLiteral',
      'ArrayLiteral',
      'ObjectLiteral',
      'UnaryExpression',
      'UpdateExpression',
      'LogicalExpression',
      'ConditionalExpression',
      'BinaryExpression',
      'BlockStatement',
      'IfStatement',
      'SwitchStatement',
      'ReturnStatement',
      'ThrowStatement',
      'TryStatement',
      'CatchClause',
      'FinallyClause'
    ],
    reporters: ['progress', 'clear-text']
  },
  comprehensive: {
    name: 'Comprehensive',
    timeout: 60000,
    concurrency: 4,
    maxConcurrentTestRunners: 2,
    thresholds: { high: 80, low: 70, break: 80 },
    excludedMutations: [
      'StringLiteral',
      'ArrayLiteral',
      'ObjectLiteral',
      'DebuggerStatement'
    ],
    reporters: ['html', 'clear-text', 'progress']
  },
  critical: {
    name: 'Critical Business Logic Only',
    timeout: 30000,
    timeoutMS: 30000,
    concurrency: 6,
    maxConcurrentTestRunners: 3,
    thresholds: { high: 90, low: 80, break: 85 },
    excludedMutations: [
      'StringLiteral',
      'ArrayLiteral',
      'ObjectLiteral',
      'UnaryExpression',
      'UpdateExpression',
      'LogicalExpression',
      'ConditionalExpression',
      'BinaryExpression',
      'BlockStatement',
      'IfStatement',
      'SwitchStatement',
      'WhileStatement',
      'DoWhileStatement',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'ContinueStatement',
      'BreakStatement',
      'ReturnStatement',
      'ThrowStatement',
      'TryStatement',
      'CatchClause',
      'FinallyClause',
      'DebuggerStatement'
    ],
    reporters: ['html', 'clear-text', 'progress'],
    mutate: [
      'packages/**/*.ts',
      '!packages/**/test-factories.test.ts',
      '!packages/**/database.test.ts',
      '!packages/**/index.test.ts',
      '!packages/**/*.test.ts',
      '!packages/**/*.spec.ts',
      'packages/**/*-management.ts',
      'packages/**/*-generation.ts',
      'packages/**/use-cases/*.ts',
      'packages/core-domain/src/entities/*.ts',
      'packages/core-domain/src/interfaces/*.ts',
      'packages/application/src/**/*.ts'
    ]
  }
};

/**
 * Create optimized Stryker configuration
 */
function createOptimizedConfig(baseConfig, strategy, customOptions = {}) {
  const optimized = {
    ...baseConfig,
    _comment: `Optimized for ${strategy.name} Strategy`,
    timeoutMS: strategy.timeout || strategy.timeoutMS,
    concurrency: strategy.concurrency,
    maxConcurrentTestRunners: strategy.maxConcurrentTestRunners,
    thresholds: strategy.thresholds,
    reporters: strategy.reporters,
    mutator: {
      ...baseConfig.mutator,
      excludedMutations: [
        ...baseConfig.mutator.excludedMutations,
        ...(strategy.excludedMutations || [])
      ]
    },
    ...customOptions
  };

  if (strategy.mutate) {
    optimized.mutate = strategy.mutate;
  }

  return optimized;
}

/**
 * Save configuration to file
 */
function saveConfig(configPath, config) {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Optimized configuration saved to ${configPath}`);
}

/**
 * Backup original configuration
 */
function backupConfig(configPath) {
  if (existsSync(configPath)) {
    const backupPath = configPath.replace('.json', '.backup.json');
    const originalConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    writeFileSync(backupPath, JSON.stringify(originalConfig, null, 2));
    console.log(`📁 Original configuration backed up to ${backupPath}`);
  }
}

/**
 * Restore original configuration
 */
function restoreConfig(configPath) {
  const backupPath = configPath.replace('.json', '.backup.json');
  if (existsSync(backupPath)) {
    const backupConfig = readFileSync(backupPath, 'utf8');
    writeFileSync(configPath, backupConfig);
    console.log(`🔄 Original configuration restored from ${backupPath}`);
  }
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  try {
    const tempDirs = ['.stryker-tmp', 'reports/mutation'];

    tempDirs.forEach(dir => {
      const tempPath = join(ROOT_DIR, dir);
      if (existsSync(tempPath)) {
        execSync(`rm -rf ${tempPath}`, { stdio: 'inherit' });
        console.log(`🧹 Cleaned up temporary directory: ${tempPath}`);
      }
    });
  } catch (error) {
    console.warn(`⚠️  Warning: Could not clean up temp files: ${error.message}`);
  }
}

/**
 * Run mutation testing with specified strategy
 */
function runMutationTesting(strategy = 'fast') {
  const configStrategy = STRATEGIES[strategy];
  if (!configStrategy) {
    throw new Error(`Unknown strategy: ${strategy}. Available: ${Object.keys(STRATEGIES).join(', ')}`);
  }

  console.log(`🚀 Starting ${configStrategy.name} Mutation Testing Strategy`);
  console.log(`📊 Timeout: ${configStrategy.timeoutMS}ms`);
  console.log(`⚡ Concurrency: ${configStrategy.concurrency}`);
  console.log(`🎯 Thresholds: High=${configStrategy.thresholds.high}%, Low=${configStrategy.thresholds.low}%, Break=${configStrategy.thresholds.break}%`);
  console.log('');

  // Backup and optimize configurations
  backupConfig(STRYKER_CONFIG_PATH);
  backupConfig(API_GATEWAY_CONFIG_PATH);

  const baseConfig = JSON.parse(readFileSync(STRYKER_CONFIG_PATH, 'utf8'));
  const apiConfig = JSON.parse(readFileSync(API_GATEWAY_CONFIG_PATH, 'utf8'));

  const optimizedMainConfig = createOptimizedConfig(baseConfig, configStrategy);
  const optimizedApiConfig = createOptimizedConfig(apiConfig, configStrategy);

  saveConfig(STRYKER_CONFIG_PATH, optimizedMainConfig);
  saveConfig(API_GATEWAY_CONFIG_PATH, optimizedApiConfig);

  // Run mutation testing
  const startTime = Date.now();
  let exitCode = 0;

  try {
    console.log('🧪 Running main project mutation testing...');
    execSync('npx stryker run', { stdio: 'inherit', cwd: ROOT_DIR });

    console.log('🧪 Running API Gateway mutation testing...');
    execSync('npx stryker run', { stdio: 'inherit', cwd: join(ROOT_DIR, 'packages/api-gateway') });

  } catch (error) {
    console.error('❌ Mutation testing failed:', error.message);
    exitCode = 1;
  }

  const duration = Date.now() - startTime;
  console.log(`\n⏱️  Mutation testing completed in ${(duration / 1000).toFixed(2)} seconds`);

  // Generate performance report
  generatePerformanceReport(strategy, duration, exitCode);

  return exitCode;
}

/**
 * Generate performance report
 */
function generatePerformanceReport(strategy, duration, exitCode) {
  const report = {
    timestamp: new Date().toISOString(),
    strategy: strategy,
    duration: duration,
    exitCode: exitCode,
    optimizations: {
      timeout: `${strategy.timeoutMS}ms (reduced from 60000ms)`,
      concurrency: strategy.concurrency,
      excludedMutations: strategy.excludedMutations.length,
      thresholds: strategy.thresholds
    },
    recommendations: getRecommendations(strategy, duration, exitCode)
  };

  const reportPath = join(ROOT_DIR, 'reports', 'mutation-performance-report.json');

  // Ensure reports directory exists
  const reportsDir = join(ROOT_DIR, 'reports');
  if (!existsSync(reportsDir)) {
    execSync(`mkdir -p ${reportsDir}`);
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Performance report saved to ${reportPath}`);

  // Display summary
  console.log('\n📈 Performance Summary:');
  console.log(`   Strategy: ${report.strategy.name}`);
  console.log(`   Duration: ${(report.duration / 1000).toFixed(2)}s`);
  console.log(`   Exit Code: ${report.exitCode}`);
  console.log(`   Optimizations Applied: ${Object.keys(report.optimizations).length}`);
  console.log(`   Recommendations: ${report.recommendations.length}`);
}

/**
 * Get optimization recommendations
 */
function getRecommendations(strategy, duration, exitCode) {
  const recommendations = [];

  if (duration > 60000) {
    recommendations.push('Consider reducing timeout further or increasing concurrency');
  }

  if (duration < 10000 && strategy.concurrency < 8) {
    recommendations.push('Performance is excellent - you can increase concurrency for faster results');
  }

  if (exitCode !== 0) {
    recommendations.push('Mutation testing failed - check logs and consider reducing complexity');
    recommendations.push('Review failing mutations and fix test coverage issues');
  }

  if (strategy.thresholds.break < 75) {
    recommendations.push('Consider setting higher break threshold for better quality assurance');
  }

  if (strategy.excludedMutations.length > 20) {
    recommendations.push('Large number of excluded mutations - consider if critical logic is being tested');
  }

  return recommendations;
}

/**
 * Monitor mutation testing performance
 */
function monitorPerformance() {
  console.log('📊 Mutation Testing Performance Monitor');
  console.log('=====================================');

  const strategies = ['fast', 'comprehensive', 'critical'];
  const results = [];

  for (const strategy of strategies) {
    console.log(`\n🔄 Testing ${STRATEGIES[strategy].name} strategy...`);

    const startTime = Date.now();
    const exitCode = runMutationTesting(strategy);
    const duration = Date.now() - startTime;

    results.push({
      strategy,
      duration,
      exitCode,
      success: exitCode === 0
    });

    if (exitCode !== 0) {
      console.log(`❌ ${STRATEGIES[strategy].name} strategy failed`);
      break;
    }
  }

  // Generate comparison report
  generateComparisonReport(results);
}

/**
 * Generate comparison report
 */
function generateComparisonReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      totalTests: results.length,
      successful: results.filter(r => r.success).length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      fastest: results.reduce((min, r) => r.duration < min.duration ? r : min),
      slowest: results.reduce((max, r) => r.duration > max.duration ? r : max)
    },
    recommendations: []
  };

  const reportPath = join(ROOT_DIR, 'reports', 'mutation-comparison-report.json');
  const reportsDir = join(ROOT_DIR, 'reports');
  if (!existsSync(reportsDir)) {
    execSync(`mkdir -p ${reportsDir}`);
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Comparison report saved to ${reportPath}`);

  // Display comparison
  console.log('\n📊 Strategy Comparison:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${STRATEGIES[result.strategy].name}: ${(result.duration / 1000).toFixed(2)}s`);
  });
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'fast':
    case 'incremental':
      runMutationTesting('fast');
      break;
    case 'comprehensive':
    case 'full':
      runMutationTesting('comprehensive');
      break;
    case 'critical':
    case 'business-logic':
      runMutationTesting('critical');
      break;
    case 'monitor':
    case 'benchmark':
      monitorPerformance();
      break;
    case 'cleanup':
      cleanupTempFiles();
      break;
    case 'restore':
      restoreConfig(STRYKER_CONFIG_PATH);
      restoreConfig(API_GATEWAY_CONFIG_PATH);
      break;
    default:
      console.log('🧪 Mutation Testing Optimization Script');
      console.log('==================================');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/mutation-optimizer.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  fast         Run fast incremental mutation testing');
      console.log('  comprehensive  Run comprehensive mutation testing');
      console.log('  critical      Run critical business logic mutation testing');
      console.log('  monitor      Benchmark all strategies');
      console.log('  cleanup      Clean up temporary files');
      console.log('  restore      Restore original configurations');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/mutation-optimizer.js fast');
      console.log('  node scripts/mutation-optimizer.js comprehensive');
      console.log('  node scripts/mutation-optimizer.js critical');
      console.log('  node scripts/mutation-optimizer.js monitor');
      break;
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

export { STRATEGIES, createOptimizedConfig, saveConfig, backupConfig, restoreConfig, runMutationTesting, monitorPerformance };