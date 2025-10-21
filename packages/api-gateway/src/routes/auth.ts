import { Elysia, t } from 'elysia';
import { CONFIG } from '../config';
import { HTTP_STATUS } from '../constants';
import { db } from '../database';
import type { RegisterBody, LoginBody, CreateApiKeyBody } from '../types';
import { extractAuthUser } from '../utils/auth';

/**
 * Validate password length requirements
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
function validatePasswordLength(password: string): string | null {
  const { PASSWORD_REQUIREMENTS } = CONFIG;

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`;
  }

  if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
    return `Password must be less than ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters long`;
  }

  return null;
}

/**
 * Validate password character requirements
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
function validatePasswordCharacters(password: string): string | null {
  const { PASSWORD_REQUIREMENTS } = CONFIG;

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (
    PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHARS &&
    !PASSWORD_REQUIREMENTS.SPECIAL_CHARS_REGEX.test(password)
  ) {
    return 'Password must contain at least one special character';
  }

  return null;
}

/**
 * Validate password strength requirements
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
function validatePasswordStrength(password: string): string | null {
  const lengthError = validatePasswordLength(password);
  if (lengthError) {
    return lengthError;
  }

  const characterError = validatePasswordCharacters(password);
  if (characterError) {
    return characterError;
  }

  return null;
}

/**
 * Validate string input length
 * @param value - The string to validate
 * @param fieldName - The name of the field for error messages
 * @param minLength - Minimum allowed length
 * @param maxLength - Maximum allowed length
 * @returns Error message if invalid, null if valid
 */
function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): string | null {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }

  if (value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters long`;
  }

  return null;
}

/**
 * Validate registration input data
 * @param body - The registration request body
 * @returns Error message if invalid, null if valid
 */
function validateRegistrationInput(body: RegisterBody): string | null {
  // Validate required fields
  if (!body.email || !body.name || !body.password) {
    return 'Missing required fields: email, name, password';
  }

  // Validate input lengths
  const nameError = validateStringLength(
    body.name,
    'Name',
    CONFIG.NAME_MIN_LENGTH,
    CONFIG.NAME_MAX_LENGTH
  );
  if (nameError) {
    return nameError;
  }

  const emailError = validateStringLength(
    body.email,
    'Email',
    CONFIG.EMAIL_MIN_LENGTH,
    CONFIG.EMAIL_MAX_LENGTH
  );
  if (emailError) {
    return emailError;
  }

  // Validate password strength
  const passwordError = validatePasswordStrength(body.password);
  if (passwordError) {
    return passwordError;
  }

  return null;
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  // POST /api/auth/register
  .post(
    '/register',
    ({
      body,
      set,
    }: {
      body: RegisterBody;
      set: { status: (code: number) => void };
    }) => {
      const validationError = validateRegistrationInput(body);
      if (validationError) {
        set.status = HTTP_STATUS.BAD_REQUEST;
        return { error: validationError };
      }

      const existingUser = db.getUserByEmail(body.email);
      if (existingUser) {
        set.status = HTTP_STATUS.CONFLICT;
        return { error: 'User with this email already exists' };
      }

      const user = db.createUser({
        email: body.email,
        name: body.name,
        password: body.password,
        ...(body.tier && { tier: body.tier }),
      });

      set.status = HTTP_STATUS.CREATED;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        name: t.String(),
        password: t.String(),
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
    ({
      body,
      set,
    }: {
      body: LoginBody;
      set: { status: (code: number) => void };
    }) => {
      // Find user
      const user = db.getUserByEmail(body.email);
      if (!user) {
        set.status = HTTP_STATUS.UNAUTHORIZED;
        return { error: 'Invalid credentials' };
      }

      // Verify password
      const isValid = db.verifyPassword(body.password, user.passwordHash);
      if (!isValid) {
        set.status = HTTP_STATUS.UNAUTHORIZED;
        return { error: 'Invalid credentials' };
      }

      // Create session
      const token = db.createSession(user.id);

      set.status = HTTP_STATUS.OK;
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
  .get(
    '/me',
    ({
      headers,
      set,
    }: {
      headers: { authorization?: string };
      set: { status: (code: number) => void };
    }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = HTTP_STATUS.UNAUTHORIZED;
        return { error: 'Unauthorized' };
      }

      set.status = HTTP_STATUS.OK;
      return authUser;
    }
  )

  // POST /api/auth/api-keys
  .post(
    '/api-keys',
    ({
      body,
      headers,
      set,
    }: {
      body: CreateApiKeyBody;
      headers: { authorization?: string };
      set: { status: (code: number) => void };
    }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = HTTP_STATUS.UNAUTHORIZED;
        return { error: 'Unauthorized' };
      }

      const apiKey = db.createApiKey({
        userId: authUser.id,
        name: body.name,
        scopes: body.scopes,
      });

      set.status = HTTP_STATUS.CREATED;
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
  .delete(
    '/api-keys/:id',
    ({
      params,
      _headers,
      set,
    }: {
      params: { id: string };
      _headers: { authorization?: string };
      set: { status: (code: number) => void };
    }) => {
      const deleted = db.deleteApiKey(params.id);
      if (!deleted) {
        set.status = HTTP_STATUS.NOT_FOUND;
        return { error: 'API key not found' };
      }
      set.status = HTTP_STATUS.NO_CONTENT;
      return null;
    }
  );

// Test cleanup endpoint (only available in test environment)
if (process.env.NODE_ENV === 'test') {
  authRoutes.post('/test/cleanup', () => {
    db.clear();
    return { message: 'Database cleared' };
  });
}
