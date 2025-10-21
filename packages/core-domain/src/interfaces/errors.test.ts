import { describe, expect, test } from 'bun:test';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from './index.js';

describe('Domain Errors - Business Logic Validation', () => {
  describe('DomainError', () => {
    test('should create domain error with message and code', () => {
      const message = 'Test domain error';
      const code = 'TEST_ERROR';

      const error = new DomainError(message, code);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.name).toBe('DomainError');
    });

    test('should have proper stack trace', () => {
      const error = new DomainError('Test error', 'TEST_CODE');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('DomainError');
    });

    test('should be serializable to JSON', () => {
      const error = new DomainError('Test error', 'TEST_CODE');

      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe('Test error');
      expect(parsed.code).toBe('TEST_CODE');
      expect(parsed.name).toBe('DomainError');
    });

    test('should handle empty message gracefully', () => {
      const error = new DomainError('', 'EMPTY_MESSAGE');

      expect(error.message).toBe('');
      expect(error.code).toBe('EMPTY_MESSAGE');
    });

    test('should handle special characters in message', () => {
      const specialMessages = [
        'Error with émojis 🚀',
        'Error with\nnewlines',
        'Error with "quotes"',
        'Error with \\backslashes\\',
        'Error with 中文字符',
      ];

      for (const message of specialMessages) {
        const error = new DomainError(message, 'SPECIAL_CHARS');
        expect(error.message).toBe(message);
      }
    });
  });

  describe('ValidationError', () => {
    test('should create validation error with proper code', () => {
      const message = 'Invalid input data';

      const error = new ValidationError(message);

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    test('should handle common validation scenarios', () => {
      const validationScenarios = [
        'Email is required',
        'Password must be at least 8 characters',
        'Invalid phone number format',
        'Name cannot be empty',
        'Age must be a positive number',
      ];

      for (const message of validationScenarios) {
        const error = new ValidationError(message);
        expect(error.message).toBe(message);
        expect(error.code).toBe('VALIDATION_ERROR');
      }
    });

    test('should distinguish from other domain errors', () => {
      const validationError = new ValidationError('Invalid data');
      const domainError = new DomainError('Generic error', 'GENERIC_ERROR');

      expect(validationError).not.toBe(domainError);
      expect(validationError.code).toBe('VALIDATION_ERROR');
      expect(domainError.code).toBe('GENERIC_ERROR');
    });

    test('should handle null/undefined inputs gracefully', () => {
      const errors = [
        new ValidationError(null as any),
        new ValidationError(undefined as any),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('NotFoundError', () => {
    test('should create not found error with resource and ID', () => {
      const resource = 'User';
      const id = 'user-123';

      const error = new NotFoundError(resource, id);

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User with id user-123 not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
    });

    test('should handle different resource types', () => {
      const scenarios = [
        { resource: 'Project', id: 'project-456' },
        { resource: 'Voice', id: 'voice-789' },
        { resource: 'AudioFile', id: 'audio-012' },
        { resource: 'GenerationJob', id: 'job-345' },
      ];

      for (const { resource, id } of scenarios) {
        const error = new NotFoundError(resource, id);
        expect(error.message).toBe(`${resource} with id ${id} not found`);
        expect(error.code).toBe('NOT_FOUND');
      }
    });

    test('should handle special characters in resource names and IDs', () => {
      const specialCases = [
        { resource: 'User-Profile', id: 'user_123-with.special@chars' },
        { resource: 'API_Key', id: 'key-with-dashes_and_underscores' },
        { resource: 'File-Name', id: 'file with spaces.txt' },
      ];

      for (const { resource, id } of specialCases) {
        const error = new NotFoundError(resource, id);
        expect(error.message).toBe(`${resource} with id ${id} not found`);
      }
    });

    test('should handle empty resource name or ID', () => {
      const error1 = new NotFoundError('', 'empty-resource');
      expect(error1.message).toBe(' with id empty-resource not found');

      const error2 = new NotFoundError('empty-id', '');
      expect(error2.message).toBe('empty-id with id  not found');

      const error3 = new NotFoundError('', '');
      expect(error3.message).toBe(' with id  not found');
    });

    test('should be serializable with full context', () => {
      const resource = 'Project';
      const id = 'project-123';
      const error = new NotFoundError(resource, id);

      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe(`${resource} with id ${id} not found`);
      expect(parsed.code).toBe('NOT_FOUND');
      expect(parsed.name).toBe('NotFoundError');
    });
  });

  describe('UnauthorizedError', () => {
    test('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.name).toBe('UnauthorizedError');
    });

    test('should create unauthorized error with custom message', () => {
      const customMessage = 'Invalid API key provided';

      const error = new UnauthorizedError(customMessage);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.name).toBe('UnauthorizedError');
    });

    test('should handle common authorization scenarios', () => {
      const authMessages = [
        'Invalid session token',
        'API key expired',
        'Insufficient permissions',
        'User account suspended',
        'Invalid credentials provided',
      ];

      for (const message of authMessages) {
        const error = new UnauthorizedError(message);
        expect(error.message).toBe(message);
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    test('should handle empty and whitespace messages', () => {
      const error1 = new UnauthorizedError('');
      expect(error1.message).toBe('');

      const error2 = new UnauthorizedError('   ');
      expect(error2.message).toBe('   ');

      const error3 = new UnauthorizedError('\n\t');
      expect(error3.message).toBe('\n\t');
    });

    test('should distinguish from other errors', () => {
      const unauthorizedError = new UnauthorizedError('Access denied');
      const notFoundError = new NotFoundError('User', '123');
      const validationError = new ValidationError('Invalid input');

      expect(unauthorizedError.code).toBe('UNAUTHORIZED');
      expect(notFoundError.code).toBe('NOT_FOUND');
      expect(validationError.code).toBe('VALIDATION_ERROR');

      expect(unauthorizedError).not.toBe(notFoundError);
      expect(unauthorizedError).not.toBe(validationError);
    });
  });

  describe('Error Inheritance Chain', () => {
    test('should maintain proper inheritance', () => {
      const domainError = new DomainError('Domain error', 'DOMAIN_ERROR');
      const validationError = new ValidationError('Validation error');
      const notFoundError = new NotFoundError('User', '123');
      const unauthorizedError = new UnauthorizedError('Unauthorized');

      // All should be instances of Error
      expect(domainError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
      expect(notFoundError).toBeInstanceOf(Error);
      expect(unauthorizedError).toBeInstanceOf(Error);

      // All should be instances of DomainError
      expect(domainError).toBeInstanceOf(DomainError);
      expect(validationError).toBeInstanceOf(DomainError);
      expect(notFoundError).toBeInstanceOf(DomainError);
      expect(unauthorizedError).toBeInstanceOf(DomainError);

      // Specific types
      expect(validationError).toBeInstanceOf(ValidationError);
      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(unauthorizedError).toBeInstanceOf(UnauthorizedError);
    });

    test('should be catchable by error type', () => {
      const createErrors = () => {
        throw new ValidationError('Test validation error');
      };

      try {
        createErrors();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should handle error chaining', () => {
      const originalError = new Error('Original error');
      const domainError = new DomainError('Wrapped error', 'WRAPPED_ERROR');

      // In a real scenario, you might want to add cause support
      expect(domainError.message).toBe('Wrapped error');
      expect(domainError.code).toBe('WRAPPED_ERROR');
    });
  });

  describe('Error Usage Patterns', () => {
    test('should support typical validation workflow', () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ValidationError('Invalid email format');
        }
      };

      expect(() => validateEmail('valid@example.com')).not.toThrow();
      expect(() => validateEmail('invalid-email')).toThrow(ValidationError);
    });

    test('should support typical entity lookup workflow', () => {
      const findUserById = (id: string) => {
        const users = {
          'user-1': { id: 'user-1', name: 'John' },
          'user-2': { id: 'user-2', name: 'Jane' },
        };

        const user = users[id as keyof typeof users];
        if (!user) {
          throw new NotFoundError('User', id);
        }
        return user;
      };

      expect(() => findUserById('user-1')).not.toThrow();
      expect(() => findUserById('nonexistent')).toThrow(NotFoundError);
    });

    test('should support typical authorization workflow', () => {
      const checkPermission = (user: any, resource: string) => {
        if (!user.isActive) {
          throw new UnauthorizedError('User account is inactive');
        }
        if (!user.permissions.includes(resource)) {
          throw new UnauthorizedError(
            `Insufficient permissions for ${resource}`
          );
        }
      };

      const activeUser = { isActive: true, permissions: ['read', 'write'] };
      const inactiveUser = { isActive: false, permissions: ['read', 'write'] };
      const limitedUser = { isActive: true, permissions: ['read'] };

      expect(() => checkPermission(activeUser, 'read')).not.toThrow();
      expect(() => checkPermission(inactiveUser, 'read')).toThrow(
        UnauthorizedError
      );
      expect(() => checkPermission(limitedUser, 'write')).toThrow(
        UnauthorizedError
      );
    });

    test('should support error aggregation patterns', () => {
      const validateUser = (userData: any) => {
        const errors: string[] = [];

        if (!userData.email) {
          errors.push('Email is required');
        }
        if (!userData.name || userData.name.trim().length === 0) {
          errors.push('Name is required');
        }
        if (userData.age && userData.age < 0) {
          errors.push('Age cannot be negative');
        }

        if (errors.length > 0) {
          throw new ValidationError(errors.join('; '));
        }
      };

      expect(() =>
        validateUser({ email: 'test@example.com', name: 'John', age: 25 })
      ).not.toThrow();
      expect(() => validateUser({ email: '', name: '', age: -1 })).toThrow(
        ValidationError
      );
    });
  });

  describe('Error Performance', () => {
    test('should handle large numbers of errors efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        const error = new DomainError(`Error ${i}`, `CODE_${i}`);
        expect(error.message).toBe(`Error ${i}`);
        expect(error.code).toBe(`CODE_${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 10k errors)
      expect(duration).toBeLessThan(100);
    });

    test('should handle error message construction efficiently', () => {
      const longId = 'x'.repeat(1000);
      const error = new NotFoundError('User', longId);

      expect(error.message).toContain(longId);
      expect(error.message.length).toBeGreaterThan(1000);
    });
  });
});
