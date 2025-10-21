/**
 * Demonstration Task
 * Shows the complete Clean Architecture flow in action
 */

import type { SimpleAudioGenerationExample } from '@falador/application/examples/simple-audio-generation';
import { configureContainer, resolve, clearContainer } from '../container.js';

/**
 * Run the complete Clean Architecture demonstration
 */
export async function runDemonstration(): Promise<void> {
  console.log('🏗️  Clean Architecture Demonstration');
  console.log('=====================================\n');

  try {
    // Configure the dependency injection container
    console.log('⚙️  Configuring dependency injection container...');
    configureContainer();
    console.log('✅ Container configured\n');

    // Resolve the demonstration use case
    const demonstration = resolve('SimpleAudioGenerationExample') as SimpleAudioGenerationExample;

    // Run the complete flow demonstration
    await demonstration.demonstrateCompleteFlow();

    // Run error handling demonstration
    await demonstration.demonstrateErrorHandling();

    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('\n📚 Clean Architecture Benefits Demonstrated:');
    console.log(
      '   ✅ Layer isolation (Domain has zero external dependencies)'
    );
    console.log(
      '   ✅ Dependency inversion (Depends on abstractions, not concretions)'
    );
    console.log(
      '   ✅ Single responsibility (Each class has one reason to change)'
    );
    console.log('   ✅ Constructor injection (All dependencies explicit)');
    console.log('   ✅ Error handling (Domain errors bubble up correctly)');
    console.log('   ✅ Testability (Easy to mock dependencies)');
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    throw error;
  } finally {
    // Clean up the container
    clearContainer();
    console.log('\n🧹 Container cleaned up');
  }
}

/**
 * Run demonstration with timing information
 */
export async function runDemonstrationWithTiming(): Promise<void> {
  const startTime = Date.now();

  try {
    await runDemonstration();

    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Total demonstration time: ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Demonstration failed after ${duration}ms:`, error);
    throw error;
  }
}

// Run demonstration if this file is executed directly
if (import.meta.main) {
  runDemonstrationWithTiming().catch(console.error);
}
