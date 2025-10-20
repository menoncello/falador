/**
 * Main fixtures export file for Playwright tests
 *
 * This file provides a clean import path for test files to access
 * extended Playwright test fixtures with auto-cleanup functionality.
 *
 * The actual fixture implementation is in the ./fixtures/index.ts file
 * which includes userFactory, projectFactory, apiKey, and apiUser fixtures.
 */

export { test, expect } from './fixtures/index';
