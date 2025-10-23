/**
 * API Gateway Tests
 */

import { app } from './index';

describe('API Gateway', () => {
  it('should create Elysia app', () => {
    expect(app).toBeDefined();
  });
});