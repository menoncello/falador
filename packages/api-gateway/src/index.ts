/**
 * API Gateway
 * Main application entry point
 */

import { Elysia } from 'elysia';

const API_PORT = 3000;

const app = new Elysia()
  .get('/', () => ({ message: 'Falador API Gateway - Audio Book Generator' }));

// Function to start the server when needed
export const startServer = (): unknown => app.listen(API_PORT);

export { app, API_PORT };