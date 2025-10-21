import { describe, expect, test } from 'bun:test';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  badRequestResponse,
} from './responses';

describe('Response Utilities', () => {
  test('unauthorizedResponse should return proper error object', () => {
    const mockHelpers = {
      set: { status: 401 },
    };

    const result = unauthorizedResponse(mockHelpers as any);

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockHelpers.set.status).toBe(401);
  });

  test('forbiddenResponse should return proper error object', () => {
    const mockHelpers = {
      set: { status: 403 },
    };

    const result = forbiddenResponse(mockHelpers as any);

    expect(result).toEqual({ error: 'Forbidden' });
    expect(mockHelpers.set.status).toBe(403);
  });

  test('notFoundResponse should return custom error message', () => {
    const mockHelpers = {
      set: { status: 404 },
    };

    const customMessage = 'Project not found';
    const result = notFoundResponse(mockHelpers as any, customMessage);

    expect(result).toEqual({ error: customMessage });
    expect(mockHelpers.set.status).toBe(404);
  });

  test('conflictResponse should return custom error message', () => {
    const mockHelpers = {
      set: { status: 409 },
    };

    const customMessage = 'Email already exists';
    const result = conflictResponse(mockHelpers as any, customMessage);

    expect(result).toEqual({ error: customMessage });
    expect(mockHelpers.set.status).toBe(409);
  });

  test('badRequestResponse should return custom error message', () => {
    const mockHelpers = {
      set: { status: 400 },
    };

    const customMessage = 'Invalid input data';
    const result = badRequestResponse(mockHelpers as any, customMessage);

    expect(result).toEqual({ error: customMessage });
    expect(mockHelpers.set.status).toBe(400);
  });

  test('should handle empty error messages gracefully', () => {
    const mockHelpers = {
      set: { status: 404 },
    };

    const result = notFoundResponse(mockHelpers as any, '');

    expect(result).toEqual({ error: '' });
    expect(mockHelpers.set.status).toBe(404);
  });

  test('should maintain error object structure', () => {
    const mockHelpers = {
      set: { status: 400 },
    };

    const result = badRequestResponse(mockHelpers as any, 'Test error');

    expect(result).toHaveProperty('error');
    expect(typeof result.error).toBe('string');
  });
});
