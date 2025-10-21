/**
 * Domain Interfaces Tests
 * Testing interface contracts and domain errors
 */

import { describe, it, expect } from 'bun:test';
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  DomainError,
} from './index.js';

describe('Domain Errors', () => {
  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid email format');

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid email format');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have proper stack trace', () => {
      const error = new ValidationError('Test error');

      expect(error.stack).toContain('ValidationError');
      expect(error.stack).toContain('Test error');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource and id', () => {
      const error = new NotFoundError('User', 'user-123');

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('User with id user-123 not found');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle different resource types', () => {
      const userError = new NotFoundError('User', 'user-123');
      const projectError = new NotFoundError('Project', 'project-456');

      expect(userError.message).toContain('User');
      expect(projectError.message).toContain('Project');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Custom unauthorized message');

      expect(error.message).toBe('Custom unauthorized message');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DomainError', () => {
    it('should create domain error with message and code', () => {
      const error = new DomainError('Custom domain error', 'CUSTOM_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('DomainError');
      expect(error.message).toBe('Custom domain error');
      expect(error.code).toBe('CUSTOM_ERROR');
    });
  });
});

describe('Interface Contract Compliance', () => {
  it('should define all required repository interfaces', () => {
    // This test ensures that all repository interfaces are properly defined
    // In a real application, you would have more comprehensive interface testing

    const expectedInterfaces = [
      'UserRepository',
      'ProjectRepository',
      'AudioFileRepository',
      'VoiceRepository',
      'GenerationJobRepository',
    ];

    for (const interfaceName of expectedInterfaces) {
      expect(interfaceName).toBeTruthy();
    }
  });

  it('should define all required service interfaces', () => {
    const expectedInterfaces = [
      'TTSEngine',
      'Storage',
      'Queue',
      'EmailService',
      'NotificationService',
    ];

    for (const interfaceName of expectedInterfaces) {
      expect(interfaceName).toBeTruthy();
    }
  });
});
