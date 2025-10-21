/**
 * Application configuration constants
 * Centralized configuration for better maintainability
 */

// Constants for magic numbers
const BYTES_IN_KB = 1024;
const MB_IN_BYTES = BYTES_IN_KB * BYTES_IN_KB;
const MAX_FILE_SIZE_MB = 100;

export const CONFIG = {
  // Server configuration
  PORT: Number.parseInt(process.env['PORT'] || '3000', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',

  // Token configuration
  TOKEN_EXPIRY_MS: Number.parseInt(
    process.env['TOKEN_EXPIRY_MS'] || '86400000',
    10
  ), // 24 hours
  TOKEN_REFRESH_THRESHOLD_MS: Number.parseInt(
    process.env['TOKEN_REFRESH_THRESHOLD_MS'] || '3600000',
    10
  ), // 1 hour

  // Cryptographic configuration
  SALT_BYTES: 16,
  HASH_LENGTH: 64,
  PASSWORD_HASH_PARTS: 2,
  ID_BYTES: 16,
  API_KEY_BYTES: 32,
  SIGNATURE_BYTES: 32,
  MIN_JWT_SECRET_LENGTH: 32,

  // Password policy
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,

  // Input validation limits
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MIN_LENGTH: 5,
  EMAIL_MAX_LENGTH: 254,
  PROJECT_TITLE_MIN_LENGTH: 1,
  PROJECT_TITLE_MAX_LENGTH: 200,
  PROJECT_AUTHOR_MAX_LENGTH: 100,
  PROJECT_GENRE_MAX_LENGTH: 50,

  // API key configuration
  API_KEY_NAME_MIN_LENGTH: 1,
  API_KEY_NAME_MAX_LENGTH: 100,
  API_KEY_MAX_SCOPES: 10,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Rate limiting (if implemented)
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  AUTH_RATE_LIMIT_MAX_REQUESTS: 5, // For auth endpoints

  // File upload limits (if implemented)
  MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_MB * MB_IN_BYTES, // 100MB
  ALLOWED_AUDIO_FORMATS: ['.mp3', '.wav', '.m4a', '.flac'],
  MAX_AUDIO_DURATION_MINUTES: 480, // 8 hours

  // Security
  HTTP_BAD_REQUEST: 400,
  HTTP_UNAUTHORIZED: 401,
  HTTP_FORBIDDEN: 403,
  HTTP_NOT_FOUND: 404,
  HTTP_CONFLICT: 409,
  HTTP_UNPROCESSABLE_ENTITY: 422,
  HTTP_INTERNAL_SERVER_ERROR: 500,

  // Error messages
  ERROR_MESSAGES: {
    MISSING_REQUIRED_FIELDS: 'Missing required fields',
    INVALID_CREDENTIALS: 'Invalid credentials',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    PROJECT_NOT_FOUND: 'Project not found',
    USER_NOT_FOUND: 'User not found',
    API_KEY_NOT_FOUND: 'API key not found',
    USER_ALREADY_EXISTS: 'User with this email already exists',
    INVALID_EMAIL: 'Valid email is required',
    INVALID_PASSWORD: `Password does not meet requirements`,
    INVALID_TOKEN: 'Invalid or expired token',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
    INVALID_FILE_FORMAT: 'Invalid file format',
  } as const,

  // Application metadata
  APP_NAME: 'Falador',
  APP_VERSION: process.env['npm_package_version'] || '0.0.1',
  APP_DESCRIPTION: 'Audiobook generation platform',

  // Supported languages
  SUPPORTED_LANGUAGES: ['pt-BR', 'en'] as const,
  DEFAULT_LANGUAGE: 'pt-BR',

  // User tiers
  USER_TIERS: ['free', 'pro', 'enterprise'] as const,
  DEFAULT_USER_TIER: 'free',

  // Project statuses
  PROJECT_STATUSES: [
    'draft',
    'queued',
    'processing',
    'completed',
    'failed',
  ] as const,
  DEFAULT_PROJECT_STATUS: 'draft',

  // API key scopes
  API_KEY_SCOPES: ['read', 'write', 'admin'] as const,
  DEFAULT_API_KEY_SCOPES: ['read'] as const,

  // Email validation pattern (simple validation to avoid ReDoS)
  EMAIL_REGEX: {
    test: (email: string): boolean => {
      const atIndex = email.indexOf('@');
      if (atIndex <= 0 || atIndex >= email.length - 1) return false;
      const domainIndex = email.lastIndexOf('.');
      return domainIndex > atIndex + 1 && domainIndex < email.length - 1;
    },
  },

  // Password complexity requirements
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 12,
    MAX_LENGTH: 128,
    REQUIRE_LOWERCASE: true,
    REQUIRE_UPPERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS_REGEX: /[!"#$%&'()*+,./:;<=>?@[\\\]^_{|}\-]/,
  } as const,
} as const;
