import { Elysia, t } from 'elysia';
import { db } from '../database';
import { extractAuthUser } from '../utils/auth';

// HTTP status codes
const HTTP_STATUS_BAD_REQUEST = 400;

/**
 * Validate and authorize API key deletion
 * @param params - The route parameters containing the API key ID
 * @param params.id - The ID of the API key to delete
 * @param authUser - The authenticated user object
 * @param authUser.id - The ID of the authenticated user
 * @returns Validation result with error and status if validation fails
 */
function validateApiKeyDeletion(
  params: { id: string },
  authUser: { id: string } | null
): { error?: string; status?: number } {
  if (!authUser) {
    return { error: 'Unauthorized', status: 401 };
  }

  const apiKey = db.getApiKeyById(params.id);
  if (!apiKey) {
    return { error: 'API key not found', status: 404 };
  }

  // Check authorization - only owner can delete their API keys
  if (apiKey.userId !== authUser.id) {
    return { error: 'Forbidden', status: 403 };
  }

  return {};
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  // POST /api/auth/register
  .post(
    '/register',
    ({ body, set }) => {
      // Validate email format - simple validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!body.email || !emailRegex.test(body.email)) {
        set.status = 400;
        return { error: 'Valid email is required' };
      }

      // Validate required fields
      if (!body.name || !body.password) {
        set.status = 400;
        return { error: 'Missing required fields: name, password' };
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
  .delete('/api-keys/:id', ({ params, headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    const validation = validateApiKeyDeletion(params, authUser);

    if (validation.error) {
      set.status = validation.status || HTTP_STATUS_BAD_REQUEST;
      return { error: validation.error };
    }

    const deleted = db.deleteApiKey(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: 'API key not found' };
    }
    set.status = 204;
    return null;
  });
