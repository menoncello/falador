/**
 * API Gateway
 * Main application entry point
 */

import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => ({ message: 'Falador API Gateway - Audio Book Generator' }))
  .listen(3000);

export default app;