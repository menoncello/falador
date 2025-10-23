import { describe, it, expect } from 'bun:test';
import { HTTP_STATUS } from './constants/http-status';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ServiceUnavailableError,
  ErrorFactory,
} from './errors';

describe('ValidationError', () => {
  it('should create error with field', () => {
    const error = new ValidationError('Invalid email', 'email');

    expect(error.message).toBe('Invalid email');
    expect(error.field).toBe('email');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(error.name).toBe('ValidationError');
  });

  it('should create error without field', () => {
    const error = new ValidationError('Invalid input');

    expect(error.message).toBe('Invalid input');
    expect(error.field).toBeUndefined();
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should serialize to JSON with field', () => {
    const error = new ValidationError('Invalid email', 'email');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'ValidationError',
      code: 'VALIDATION_ERROR',
      message: 'Invalid email',
      statusCode: HTTP_STATUS.BAD_REQUEST,
      field: 'email',
    });
  });

  it('should serialize to JSON without field when undefined', () => {
    const error = new ValidationError('Invalid input');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'ValidationError',
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
    expect(json).not.toHaveProperty('field');
  });

  it('should handle empty string field', () => {
    const error = new ValidationError('Error', '');
    const json = error.toJSON();

    expect(json.field).toBe('');
  });
});

describe('AuthenticationError', () => {
  it('should use default message when not provided', () => {
    const error = new AuthenticationError();

    expect(error.message).toBe('Authentication failed');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(error.name).toBe('AuthenticationError');
  });

  it('should use custom message when provided', () => {
    const error = new AuthenticationError('Invalid credentials');

    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should serialize to JSON correctly', () => {
    const error = new AuthenticationError('Token expired');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'AuthenticationError',
      code: 'AUTHENTICATION_ERROR',
      message: 'Token expired',
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  });
});

describe('AuthorizationError', () => {
  it('should use default message when not provided', () => {
    const error = new AuthorizationError();

    expect(error.message).toBe('Access denied');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect(error.name).toBe('AuthorizationError');
  });

  it('should use custom message when provided', () => {
    const error = new AuthorizationError('Insufficient permissions');

    expect(error.message).toBe('Insufficient permissions');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('should serialize to JSON correctly', () => {
    const error = new AuthorizationError('Admin only');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'AuthorizationError',
      code: 'AUTHORIZATION_ERROR',
      message: 'Admin only',
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  });
});

describe('NotFoundError', () => {
  it('should format message without identifier', () => {
    const error = new NotFoundError('User');

    expect(error.message).toBe('User not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    expect(error.name).toBe('NotFoundError');
  });

  it('should format message with identifier', () => {
    const error = new NotFoundError('User', '123');

    expect(error.message).toBe("User with identifier '123' not found");
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should extract resource from message in toJSON without identifier', () => {
    const error = new NotFoundError('Project');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'NotFoundError',
      code: 'NOT_FOUND',
      message: 'Project not found',
      statusCode: HTTP_STATUS.NOT_FOUND,
      resource: 'Project not found',
    });
  });

  it('should extract resource from message in toJSON with identifier', () => {
    const error = new NotFoundError('Project', 'abc-123');
    const json = error.toJSON();

    expect(json.resource).toBe('Project');
    expect(json.message).toBe("Project with identifier 'abc-123' not found");
  });

  it('should handle complex resource names', () => {
    const error = new NotFoundError('API Key', 'key-456');
    const json = error.toJSON();

    expect(json.resource).toBe('API Key');
    expect(json.message).toBe("API Key with identifier 'key-456' not found");
  });

  it('should handle resource extraction when no with clause exists', () => {
    const error = new NotFoundError('Resource');
    const json = error.toJSON();

    expect(json.resource).toBe('Resource not found');
  });
});

describe('ConflictError', () => {
  it('should create error with message', () => {
    const error = new ConflictError('Email already exists');

    expect(error.message).toBe('Email already exists');
    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
    expect(error.name).toBe('ConflictError');
  });

  it('should serialize to JSON correctly', () => {
    const error = new ConflictError('Duplicate entry');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'ConflictError',
      code: 'CONFLICT',
      message: 'Duplicate entry',
      statusCode: HTTP_STATUS.CONFLICT,
    });
  });
});

describe('RateLimitError', () => {
  it('should use default message when not provided', () => {
    const error = new RateLimitError();

    expect(error.message).toBe('Rate limit exceeded');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfter).toBeUndefined();
  });

  it('should include retryAfter when provided', () => {
    const error = new RateLimitError('Too many requests', 60);

    expect(error.message).toBe('Too many requests');
    expect(error.retryAfter).toBe(60);
  });

  it('should serialize to JSON without retryAfter when undefined', () => {
    const error = new RateLimitError();
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'RateLimitError',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    });
    expect(json).not.toHaveProperty('retryAfter');
  });

  it('should serialize to JSON with retryAfter when provided', () => {
    const error = new RateLimitError('Limit reached', 120);
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'RateLimitError',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Limit reached',
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      retryAfter: 120,
    });
  });

  it('should handle retryAfter value of 0', () => {
    const error = new RateLimitError('Rate limited', 0);
    const json = error.toJSON();

    expect(json.retryAfter).toBe(0);
  });
});

describe('InternalServerError', () => {
  it('should use default message when not provided', () => {
    const error = new InternalServerError();

    expect(error.message).toBe('Internal server error');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.name).toBe('InternalServerError');
  });

  it('should use custom message when provided', () => {
    const error = new InternalServerError('Database connection failed');

    expect(error.message).toBe('Database connection failed');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should store cause when provided', () => {
    const originalError = new Error('Original error');
    const error = new InternalServerError('Wrapped error', originalError);

    expect(error.cause).toBe(originalError);
    expect(error.message).toBe('Wrapped error');
  });

  it('should serialize to JSON correctly', () => {
    const error = new InternalServerError('System failure');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'InternalServerError',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'System failure',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  });
});

describe('DatabaseError', () => {
  it('should create error without operation', () => {
    const error = new DatabaseError('Connection timeout');

    expect(error.message).toBe('Connection timeout');
    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.name).toBe('DatabaseError');
    expect(error.operation).toBeUndefined();
  });

  it('should create error with operation', () => {
    const error = new DatabaseError('Query failed', 'SELECT');

    expect(error.message).toBe('Query failed');
    expect(error.operation).toBe('SELECT');
  });

  it('should store cause when provided', () => {
    const originalError = new Error('DB connection lost');
    const error = new DatabaseError('Failed', 'INSERT', originalError);

    expect(error.cause).toBe(originalError);
  });

  it('should serialize to JSON without operation when undefined', () => {
    const error = new DatabaseError('Error occurred');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'DatabaseError',
      code: 'DATABASE_ERROR',
      message: 'Error occurred',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
    expect(json).not.toHaveProperty('operation');
  });

  it('should serialize to JSON with operation when provided', () => {
    const error = new DatabaseError('Constraint violation', 'UPDATE');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'DatabaseError',
      code: 'DATABASE_ERROR',
      message: 'Constraint violation',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      operation: 'UPDATE',
    });
  });

  it('should handle empty string operation', () => {
    const error = new DatabaseError('Error', '');
    const json = error.toJSON();

    expect(json.operation).toBe('');
  });
});

describe('ServiceUnavailableError', () => {
  it('should use default message when not provided', () => {
    const error = new ServiceUnavailableError();

    expect(error.message).toBe('Service temporarily unavailable');
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(error.name).toBe('ServiceUnavailableError');
  });

  it('should use custom message when provided', () => {
    const error = new ServiceUnavailableError('Maintenance in progress');

    expect(error.message).toBe('Maintenance in progress');
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('should serialize to JSON correctly', () => {
    const error = new ServiceUnavailableError('System upgrade');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'ServiceUnavailableError',
      code: 'SERVICE_UNAVAILABLE',
      message: 'System upgrade',
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    });
  });
});

describe('ErrorFactory fromError', () => {
  it('should return AppError instances as-is', () => {
    const originalError = new ValidationError('Test error');
    const result = ErrorFactory.fromError(originalError);

    expect(result).toBe(originalError);
    expect(result).toBeInstanceOf(ValidationError);
  });

  it('should convert Error with not found message', () => {
    const error = new Error('User not found');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(NotFoundError);
    expect(result.message).toBe(
      "Resource with identifier 'User not found' not found"
    );
  });

  it('should convert Error with does not exist message', () => {
    const error = new Error('Record does not exist');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(NotFoundError);
    expect(result.message).toBe(
      "Resource with identifier 'Record does not exist' not found"
    );
  });

  it('should convert Error with unauthorized message', () => {
    const error = new Error('Unauthorized access');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(AuthenticationError);
    expect(result.message).toBe('Unauthorized access');
  });

  it('should convert Error with authentication message', () => {
    const error = new Error('Authentication required');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(AuthenticationError);
    expect(result.message).toBe('Authentication required');
  });

  it('should convert Error with forbidden message', () => {
    const error = new Error('Forbidden resource');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(AuthorizationError);
    expect(result.message).toBe('Forbidden resource');
  });

  it('should convert Error with access denied message', () => {
    const error = new Error('Access denied to resource');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(AuthorizationError);
    expect(result.message).toBe('Access denied to resource');
  });

  it('should convert Error with validation message', () => {
    const error = new Error('Validation failed');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.message).toBe('Validation failed');
  });

  it('should convert Error with invalid message', () => {
    const error = new Error('Invalid input data');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.message).toBe('Invalid input data');
  });

  it('should convert Error with conflict message', () => {
    const error = new Error('Conflict detected');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(ConflictError);
    expect(result.message).toBe('Conflict detected');
  });

  it('should convert Error with already exists message', () => {
    const error = new Error('Email already exists');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(ConflictError);
    expect(result.message).toBe('Email already exists');
  });

  it('should handle mixed case messages', () => {
    const error = new Error('User NOT FOUND');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(NotFoundError);
  });

  it('should handle multiple keyword matches by priority', () => {
    const error = new Error('not found validation error');
    const result = ErrorFactory.fromError(error);

    // Should match first check (not found)
    expect(result).toBeInstanceOf(NotFoundError);
  });

  it('should default to InternalServerError for unknown Error messages', () => {
    const error = new Error('Something went wrong');
    const result = ErrorFactory.fromError(error);

    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.cause).toBe(error);
  });

  it('should handle unknown errors', () => {
    const result = ErrorFactory.fromError('string error');

    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('should handle null errors', () => {
    const result = ErrorFactory.fromError(null);

    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('should handle undefined errors', () => {
    const result = ErrorFactory.fromError();

    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('should handle number errors', () => {
    const result = ErrorFactory.fromError(404);

    expect(result).toBeInstanceOf(InternalServerError);
  });

  it('should handle object errors', () => {
    const result = ErrorFactory.fromError({ code: 'ERR' });

    expect(result).toBeInstanceOf(InternalServerError);
  });
});

describe('ErrorFactory Factory Methods', () => {
  it('validation() should create ValidationError', () => {
    const error = ErrorFactory.validation('Invalid email', 'email');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid email');
    expect(error.field).toBe('email');
  });

  it('validation() should work without field', () => {
    const error = ErrorFactory.validation('Invalid data');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.field).toBeUndefined();
  });

  it('notFound() should create NotFoundError', () => {
    const error = ErrorFactory.notFound('User', '123');

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe("User with identifier '123' not found");
  });

  it('notFound() should work without identifier', () => {
    const error = ErrorFactory.notFound('Resource');

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Resource not found');
  });

  it('authentication() should create AuthenticationError with default message', () => {
    const error = ErrorFactory.authentication();

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Authentication failed');
  });

  it('authentication() should create AuthenticationError with custom message', () => {
    const error = ErrorFactory.authentication('Token expired');

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Token expired');
  });

  it('authorization() should create AuthorizationError with default message', () => {
    const error = ErrorFactory.authorization();

    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.message).toBe('Access denied');
  });

  it('authorization() should create AuthorizationError with custom message', () => {
    const error = ErrorFactory.authorization('Admin required');

    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.message).toBe('Admin required');
  });

  it('conflict() should create ConflictError', () => {
    const error = ErrorFactory.conflict('Duplicate key');

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe('Duplicate key');
  });

  it('database() should create DatabaseError without operation', () => {
    const error = ErrorFactory.database('Query failed');

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe('Query failed');
    expect(error.operation).toBeUndefined();
  });

  it('database() should create DatabaseError with operation', () => {
    const error = ErrorFactory.database('Insert failed', 'INSERT');

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe('Insert failed');
    expect(error.operation).toBe('INSERT');
  });

  it('database() should create DatabaseError with cause', () => {
    const cause = new Error('Connection lost');
    const error = ErrorFactory.database('Failed', 'SELECT', cause);

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.cause).toBe(cause);
  });

  it('internal() should create InternalServerError with default message', () => {
    const error = ErrorFactory.internal();

    expect(error).toBeInstanceOf(InternalServerError);
    expect(error.message).toBe('Internal server error');
  });

  it('internal() should create InternalServerError with custom message', () => {
    const error = ErrorFactory.internal('Custom error');

    expect(error).toBeInstanceOf(InternalServerError);
    expect(error.message).toBe('Custom error');
  });

  it('internal() should create InternalServerError with cause', () => {
    const cause = new Error('Root cause');
    const error = ErrorFactory.internal('Wrapped', cause);

    expect(error).toBeInstanceOf(InternalServerError);
    expect(error.cause).toBe(cause);
  });
});

describe('AppError base class', () => {
  class TestError extends AppError {
    readonly code = 'TEST_ERROR';
    readonly statusCode = 500;

    constructor(message: string, cause?: Error) {
      super(message, cause);
      this.name = 'TestError';
    }
  }

  it('should store message correctly', () => {
    const error = new TestError('Test message');

    expect(error.message).toBe('Test message');
  });

  it('should store cause when provided', () => {
    const originalError = new Error('Original');
    const error = new TestError('Wrapped', originalError);

    expect(error.cause).toBe(originalError);
  });

  it('should have correct prototype chain', () => {
    const error = new TestError('Test');

    expect(error).toBeInstanceOf(TestError);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should have name property set', () => {
    const error = new TestError('Test');

    expect(error.name).toBe('TestError');
  });

  it('should include stack trace', () => {
    const error = new TestError('Test');

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('toJSON should return correct structure', () => {
    const error = new TestError('Test message');
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'TestError',
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 500,
    });
  });
});
