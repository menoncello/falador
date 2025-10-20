/**
 * Error message constants
 * Centralized to prevent magic strings and ensure consistency
 */

export const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: 'Unauthorized',
  INVALID_CREDENTIALS: 'Invalid credentials',
  API_KEY_NOT_FOUND: 'API key not found',

  // Validation errors
  MISSING_REQUIRED_FIELDS: (fields: string) =>
    `Missing required fields: ${fields}`,
  MISSING_REQUIRED_FIELD: (field: string) => `Missing required field: ${field}`,

  // Resource errors
  USER_ALREADY_EXISTS: 'User with this email already exists',
  PROJECT_NOT_FOUND: 'Project not found',
  FORBIDDEN: 'Forbidden',

  // Generic errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;
