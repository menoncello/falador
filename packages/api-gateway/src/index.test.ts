/**
 * API Gateway Tests
 */

import { Elysia } from 'elysia';
import { app, API_PORT } from './index';

describe('API Gateway', () => {
  it('should create Elysia app', () => {
    expect(app).toBeDefined();
    expect(app).toBeInstanceOf(Elysia);
  });

  it('should have correct route configuration', async () => {
    // Test that the route handler returns the expected structure
    const handler = app.routes.find(route => route.path === '/');
    expect(handler).toBeDefined();

    // Mock request to test the handler
    const mockRequest = new Request('http://localhost:3000/');
    const response = await app.handle(mockRequest);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('Falador API Gateway - Audio Book Generator');
  });

  it('should use correct port', () => {
    // Test that the API_PORT constant is used correctly
    expect(API_PORT).toBe(3000);
  });
});