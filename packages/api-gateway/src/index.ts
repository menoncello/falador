import { Elysia } from 'elysia';
import { db } from './database';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';

const PORT = 3000;

const app = new Elysia()
  // Health check endpoint
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'falador-api-gateway',
  }))

  // Mount route modules
  .use(authRoutes)
  .use(projectRoutes)

  // User cleanup endpoint (for testing)
  .delete('/api/users/:id', ({ params, set }) => {
    const deleted = db.deleteUser(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: 'User not found' };
    }
    set.status = 204;
    return null;
  })

  // Database reset endpoint (for testing only)
  .delete('/api/test/reset', ({ set }) => {
    if (process.env.NODE_ENV !== 'test') {
      set.status = 403;
      return { error: 'Database reset only available in test environment' };
    }
    db.clear();
    set.status = 204;
    return null;
  })

  .listen(PORT);

// Only log in development/non-test environments
if (process.env.NODE_ENV !== 'test') {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

export type App = typeof app;
export { app };
