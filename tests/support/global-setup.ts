import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 *
 * This function runs once before all tests and:
 * 1. Ensures the test server is running
 * 2. Resets the database to ensure clean state
 */

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🔧 Setting up test environment...');

  const baseURL = config.webServer?.url || 'http://localhost:3000';

  try {
    // Reset database to ensure clean state
    console.log('🗑️  Resetting database...');
    const response = await fetch(`${baseURL}/api/test/reset`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to reset database: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }

  console.log('✅ Test environment setup complete');
}

export default globalSetup;