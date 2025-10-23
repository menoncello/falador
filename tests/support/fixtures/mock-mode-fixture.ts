import { test as base, type Page } from '@playwright/test';
import { setupMockApi, shouldUseMockMode } from '../mock-api-server';

interface MockModeFixture {
  enableMockMode: () => Promise<void>;
  isMockMode: boolean;
}

export const test = base.extend<MockModeFixture>({
  isMockMode: [async ({}, use) => {
    await use(shouldUseMockMode());
  }, { scope: 'worker' }],

  enableMockMode: [async ({ page }, use) => {
    await use(async () => {
      if (shouldUseMockMode()) {
        await setupMockApi(page);
      }
    });
  }, { scope: 'test' }],
});

export { expect } from '@playwright/test';