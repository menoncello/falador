/**
 * Custom Error Types
 *
 * Domain-specific error classes for better error handling
 */

import { HTTP_STATUS } from './constants/http-status.js';

/**
 * Base application error
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  /**
   * Creates a new application error
   * @param message - Error message
   * @param cause - Original error that caused this error
   */
  constructor(
    message: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON format
   * @returns JSON representation of the error
   */
  public toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  /**
   * Creates a new validation error
   * @param message - Error message
   * @param field - Field that failed validation
   */
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Converts error to JSON format
   * @returns JSON representation of the error
   */
  public override toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
    field?: string;
  } {
    const base = super.toJSON();
    return this.field === undefined ? base : { ...base, field: this.field };
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;

  /**
   * Creates a new authentication error
   * @param message - Error message
   */
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = HTTP_STATUS.FORBIDDEN;

  /**
   * Creates a new authorization error
   * @param message - Error message
   */
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = HTTP_STATUS.NOT_FOUND;

  /**
   * Creates a new not found error
   * @param resource - Resource type
   * @param identifier - Resource identifier
   */
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
  }

  /**
   * Converts error to JSON format
   * @returns JSON representation of the error
   */
  public override toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
    resource: string;
  } {
    return {
      ...super.toJSON(),
      resource: this.message.split(' with')[0] || this.message,
    };
  }
}

/**
 * Conflict errors
 */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly statusCode = HTTP_STATUS.CONFLICT;

  /**
   * Creates a new conflict error
   * @param message - Error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;

  /**
   * Creates a new rate limit error
   * @param message - Error message
   * @param retryAfter - Seconds to wait before retrying
   */
  constructor(
    message = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }

  /**
   * Converts error to JSON format
   * @returns JSON representation of the error
   */
  public override toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
    retryAfter?: number;
  } {
    const base = super.toJSON();
    return this.retryAfter === undefined
      ? base
      : { ...base, retryAfter: this.retryAfter };
  }
}

/**
 * Internal server errors
 */
export class InternalServerError extends AppError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  /**
   * Creates a new internal server error
   * @param message - Error message
   * @param cause - Original error
   */
  constructor(message = 'Internal server error', cause?: Error) {
    super(message, cause);
    this.name = 'InternalServerError';
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  /**
   * Creates a new database error
   * @param message - Error message
   * @param operation - Database operation that failed
   * @param cause - Original error
   */
  constructor(
    message: string,
    public readonly operation?: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'DatabaseError';
  }

  /**
   * Converts error to JSON format
   * @returns JSON representation of the error
   */
  public override toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
    operation?: string;
  } {
    const base = super.toJSON();
    return this.operation === undefined
      ? base
      : { ...base, operation: this.operation };
  }
}

/**
 * Service unavailable errors
 */
export class ServiceUnavailableError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;

  /**
   * Creates a new service unavailable error
   * @param message - Error message
   */
  constructor(message = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error factory for creating appropriate error instances
 */
export class ErrorFactory {
  /**
   * Creates an appropriate error from unknown error
   * @param error - Unknown error
   * @returns AppError instance
   */
  static fromError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return ErrorFactory.createErrorFromMessage(error.message, error);
    }

    return new InternalServerError('An unexpected error occurred');
  }

  /**
   * Creates an error based on error message analysis
   * @param message - Error message to analyze
   * @param originalError - Original error for context
   * @returns AppError instance
   */
  private static createErrorFromMessage(
    message: string,
    originalError: Error
  ): AppError {
    const messageLower = message.toLowerCase();

    if (ErrorFactory.isNotFoundError(messageLower)) {
      return new NotFoundError('Resource', message);
    }

    if (ErrorFactory.isAuthenticationError(messageLower)) {
      return new AuthenticationError(message);
    }

    if (ErrorFactory.isAuthorizationError(messageLower)) {
      return new AuthorizationError(message);
    }

    if (ErrorFactory.isValidationError(messageLower)) {
      return new ValidationError(message);
    }

    if (ErrorFactory.isConflictError(messageLower)) {
      return new ConflictError(message);
    }

    return new InternalServerError(
      'An unexpected error occurred',
      originalError
    );
  }

  /**
   * Checks if message indicates a not found error
   * @param message - Lowercase message to check
   * @returns True if message indicates not found
   */
  private static isNotFoundError(message: string): boolean {
    return message.includes('not found') || message.includes('does not exist');
  }

  /**
   * Checks if message indicates an authentication error
   * @param message - Lowercase message to check
   * @returns True if message indicates authentication error
   */
  private static isAuthenticationError(message: string): boolean {
    return (
      message.includes('unauthorized') || message.includes('authentication')
    );
  }

  /**
   * Checks if message indicates an authorization error
   * @param message - Lowercase message to check
   * @returns True if message indicates authorization error
   */
  private static isAuthorizationError(message: string): boolean {
    return message.includes('forbidden') || message.includes('access denied');
  }

  /**
   * Checks if message indicates a validation error
   * @param message - Lowercase message to check
   * @returns True if message indicates validation error
   */
  private static isValidationError(message: string): boolean {
    return message.includes('validation') || message.includes('invalid');
  }

  /**
   * Checks if message indicates a conflict error
   * @param message - Lowercase message to check
   * @returns True if message indicates conflict error
   */
  private static isConflictError(message: string): boolean {
    return message.includes('conflict') || message.includes('already exists');
  }

  /**
   * Creates a validation error
   * @param message - Error message
   * @param field - Field that failed validation
   * @returns ValidationError instance
   */
  static validation(message: string, field?: string): ValidationError {
    return new ValidationError(message, field);
  }

  /**
   * Creates a not found error
   * @param resource - Resource type
   * @param identifier - Resource identifier
   * @returns NotFoundError instance
   */
  static notFound(resource: string, identifier?: string): NotFoundError {
    return new NotFoundError(resource, identifier);
  }

  /**
   * Creates an authentication error
   * @param message - Error message
   * @returns AuthenticationError instance
   */
  static authentication(message?: string): AuthenticationError {
    return new AuthenticationError(message);
  }

  /**
   * Creates an authorization error
   * @param message - Error message
   * @returns AuthorizationError instance
   */
  static authorization(message?: string): AuthorizationError {
    return new AuthorizationError(message);
  }

  /**
   * Creates a conflict error
   * @param message - Error message
   * @returns ConflictError instance
   */
  static conflict(message: string): ConflictError {
    return new ConflictError(message);
  }

  /**
   * Creates a database error
   * @param message - Error message
   * @param operation - Database operation that failed
   * @param cause - Original error
   * @returns DatabaseError instance
   */
  static database(
    message: string,
    operation?: string,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError(message, operation, cause);
  }

  /**
   * Creates an internal server error
   * @param message - Error message
   * @param cause - Original error
   * @returns InternalServerError instance
   */
  static internal(message?: string, cause?: Error): InternalServerError {
    return new InternalServerError(message, cause);
  }
}
