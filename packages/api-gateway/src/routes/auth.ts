import { Elysia, t } from 'elysia';
import { db } from '../database';
import { extractAuthUser } from '../utils/auth';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  // POST /api/auth/register
  .post(
    '/register',
    ({ body, set }) => {
      // Validate required fields
      if (!body.email || !body.name || !body.password) {
        set.status = 400;
        return { error: 'Missing required fields: email, name, password' };
      }

      // Check for duplicate email
      const existingUser = db.getUserByEmail(body.email);
      if (existingUser) {
        set.status = 409;
        return { error: 'User with this email already exists' };
      }

      // Create user
      const user = db.createUser({
        email: body.email,
        name: body.name,
        password: body.password,
        ...(body.tier && { tier: body.tier }),
      });

      set.status = 201;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      };
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
        password: t.Optional(t.String()),
        tier: t.Optional(
          t.Union([
            t.Literal('free'),
            t.Literal('pro'),
            t.Literal('enterprise'),
          ])
        ),
      }),
    }
  )

  // POST /api/auth/login
  .post(
    '/login',
    ({ body, set }) => {
      // Find user
      const user = db.getUserByEmail(body.email);
      if (!user) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      // Verify password
      const isValid = db.verifyPassword(body.password, user.passwordHash);
      if (!isValid) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      // Create session
      const token = db.createSession(user.id);

      set.status = 200;
      return { token };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  // GET /api/auth/me
  .get('/me', ({ headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    set.status = 200;
    return authUser;
  })

  // POST /api/auth/api-keys
  .post(
    '/api-keys',
    ({ body, headers, set }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const apiKey = db.createApiKey({
        userId: authUser.id,
        name: body.name,
        scopes: body.scopes,
      });

      set.status = 201;
      return {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        scopes: apiKey.scopes,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        scopes: t.Array(t.String()),
      }),
    }
  )

  // DELETE /api/auth/api-keys/:id
  .delete('/api-keys/:id', ({ params, set }) => {
    const deleted = db.deleteApiKey(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: 'API key not found' };
    }
    set.status = 204;
    return null;
  });
