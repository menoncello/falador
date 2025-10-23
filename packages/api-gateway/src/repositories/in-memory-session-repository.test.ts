import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { Session } from '../../../core-domain/src/index';
import type { Database } from '../database';
import { InMemorySessionRepository } from './in-memory-session-repository';

describe('InMemorySessionRepository', () => {
  let repository: InMemorySessionRepository;
  let mockDatabase: Database;

  beforeEach(() => {
    let sessionCounter = 0;
    mockDatabase = {
      createSession: mock(async (userId: string): Promise<string> => {
        sessionCounter++;
        return `session_token_${userId}_${Date.now()}_${sessionCounter}`;
      }),
      getSession: mock(async (token: string): Promise<Session | null> => {
        if (token === 'valid_token') {
          return {
            userId: 'user-123',
            token: token,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          };
        }
        return null;
      }),
      deleteSession: mock(async (token: string): Promise<boolean> => {
        return token === 'valid_token';
      }),
    } as unknown as Database;

    repository = new InMemorySessionRepository(mockDatabase);
  });

  describe('create', () => {
    it('should create session for user', async () => {
      const userId = 'user-123';

      const result = await repository.create(userId);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('session_token_');
      expect(mockDatabase.createSession).toHaveBeenCalledWith(userId);
      expect(mockDatabase.createSession).toHaveBeenCalledTimes(1);
    });

    it('should create unique session tokens', async () => {
      const userId = 'user-123';

      const token1 = await repository.create(userId);
      const token2 = await repository.create(userId);

      expect(token1).not.toBe(token2);
    });

    it('should create session for different users', async () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';

      const token1 = await repository.create(userId1);
      const token2 = await repository.create(userId2);

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
    });
  });

  describe('findByToken', () => {
    it('should find session by valid token', async () => {
      const token = 'valid_token';

      const result = await repository.findByToken(token);

      expect(result).toBeDefined();
      expect(result?.token).toBe(token);
      expect(result?.userId).toBe('user-123');
      expect(mockDatabase.getSession).toHaveBeenCalledWith(token);
      expect(mockDatabase.getSession).toHaveBeenCalledTimes(1);
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid_token';

      const result = await repository.findByToken(token);

      expect(result).toBeNull();
      expect(mockDatabase.getSession).toHaveBeenCalledWith(token);
    });

    it('should return null for empty token', async () => {
      mockDatabase.getSession = mock(async () => null);

      const result = await repository.findByToken('');

      expect(result).toBeNull();
    });

    it('should handle session with expiration date', async () => {
      const token = 'valid_token';

      const result = await repository.findByToken(token);

      expect(result).toBeDefined();
      expect(result?.expiresAt).toBeDefined();
      expect(typeof result?.expiresAt).toBe('string');
    });
  });

  describe('delete', () => {
    it('should delete session by token', async () => {
      const token = 'valid_token';

      const result = await repository.delete(token);

      expect(result).toBe(true);
      expect(mockDatabase.deleteSession).toHaveBeenCalledWith(token);
      expect(mockDatabase.deleteSession).toHaveBeenCalledTimes(1);
    });

    it('should return false for non-existent token', async () => {
      const token = 'non_existent_token';

      const result = await repository.delete(token);

      expect(result).toBe(false);
      expect(mockDatabase.deleteSession).toHaveBeenCalledWith(token);
    });

    it('should handle multiple delete calls', async () => {
      const token1 = 'valid_token';
      const token2 = 'invalid_token';

      const result1 = await repository.delete(token1);
      const result2 = await repository.delete(token2);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(mockDatabase.deleteSession).toHaveBeenCalledTimes(2);
    });
  });
});
