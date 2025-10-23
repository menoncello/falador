import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type {
  ApiKey,
  CreateApiKeyRequest,
} from '../../../core-domain/src/index';
import type { Database } from '../database';
import { InMemoryApiKeyRepository } from './in-memory-api-key-repository';

describe('InMemoryApiKeyRepository', () => {
  let repository: InMemoryApiKeyRepository;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      createApiKey: mock(
        async (data: CreateApiKeyRequest): Promise<ApiKey> => ({
          id: 'apikey-123',
          userId: data.userId,
          key: `fk_${'a'.repeat(64)}`,
          name: data.name,
          scopes: data.scopes,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        })
      ),
      getApiKeyById: mock(async (id: string): Promise<ApiKey | null> => {
        if (id === 'apikey-123') {
          return {
            id,
            userId: 'user-123',
            key: `fk_${'a'.repeat(64)}`,
            name: 'Test API Key',
            scopes: ['read', 'write'],
            createdAt: new Date().toISOString(),
            lastUsedAt: null,
          };
        }
        return null;
      }),
      getApiKeyByKey: mock(async (key: string): Promise<ApiKey | null> => {
        if (key.startsWith('fk_')) {
          return {
            id: 'apikey-123',
            userId: 'user-123',
            key,
            name: 'Test API Key',
            scopes: ['read', 'write'],
            createdAt: new Date().toISOString(),
            lastUsedAt: null,
          };
        }
        return null;
      }),
      deleteApiKey: mock(async (id: string): Promise<boolean> => {
        return id === 'apikey-123';
      }),
    } as unknown as Database;

    repository = new InMemoryApiKeyRepository(mockDatabase);
  });

  describe('create', () => {
    it('should create API key via database', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        userId: 'user-123',
        name: 'Production API Key',
        scopes: ['read', 'write'],
      };

      const result = await repository.create(apiKeyData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(apiKeyData.userId);
      expect(result.name).toBe(apiKeyData.name);
      expect(result.scopes).toEqual(apiKeyData.scopes);
      expect(result.key).toBeDefined();
      expect(mockDatabase.createApiKey).toHaveBeenCalledWith(apiKeyData);
      expect(mockDatabase.createApiKey).toHaveBeenCalledTimes(1);
    });

    it('should create API key with proper format', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        userId: 'user-123',
        name: 'Test Key',
        scopes: ['read'],
      };

      const result = await repository.create(apiKeyData);

      expect(result.key).toMatch(/^fk_[\da-f]+$/);
      expect(result.lastUsedAt).toBeNull();
    });

    it('should create API key with multiple scopes', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        userId: 'user-123',
        name: 'Multi-scope Key',
        scopes: ['read', 'write', 'delete', 'admin'],
      };

      const result = await repository.create(apiKeyData);

      expect(result.scopes).toHaveLength(4);
      expect(result.scopes).toContain('admin');
    });

    it('should create API key with empty scopes', async () => {
      const apiKeyData: CreateApiKeyRequest = {
        userId: 'user-123',
        name: 'No Scope Key',
        scopes: [],
      };

      const result = await repository.create(apiKeyData);

      expect(result.scopes).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find API key by id', async () => {
      const apiKeyId = 'apikey-123';

      const result = await repository.findById(apiKeyId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(apiKeyId);
      expect(result?.userId).toBe('user-123');
      expect(mockDatabase.getApiKeyById).toHaveBeenCalledWith(apiKeyId);
    });

    it('should return null for non-existent API key', async () => {
      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should find API key with correct scopes', async () => {
      const result = await repository.findById('apikey-123');

      expect(result?.scopes).toBeDefined();
      expect(Array.isArray(result?.scopes)).toBe(true);
      expect(result?.scopes).toContain('read');
      expect(result?.scopes).toContain('write');
    });
  });

  describe('findByKey', () => {
    it('should find API key by key value', async () => {
      const keyValue = `fk_${'a'.repeat(64)}`;

      const result = await repository.findByKey(keyValue);

      expect(result).toBeDefined();
      expect(result?.key).toBe(keyValue);
      expect(result?.id).toBe('apikey-123');
      expect(mockDatabase.getApiKeyByKey).toHaveBeenCalledWith(keyValue);
    });

    it('should return null for invalid key format', async () => {
      const result = await repository.findByKey('invalid_key');

      expect(result).toBeNull();
    });

    it('should return null for empty key', async () => {
      mockDatabase.getApiKeyByKey = mock(async () => null);

      const result = await repository.findByKey('');

      expect(result).toBeNull();
    });

    it('should find API key with lastUsedAt null', async () => {
      const keyValue = `fk_${'b'.repeat(64)}`;

      const result = await repository.findByKey(keyValue);

      expect(result?.lastUsedAt).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete API key by id', async () => {
      const apiKeyId = 'apikey-123';

      const result = await repository.delete(apiKeyId);

      expect(result).toBe(true);
      expect(mockDatabase.deleteApiKey).toHaveBeenCalledWith(apiKeyId);
      expect(mockDatabase.deleteApiKey).toHaveBeenCalledTimes(1);
    });

    it('should return false for non-existent API key', async () => {
      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should handle multiple delete operations', async () => {
      const result1 = await repository.delete('apikey-123');
      const result2 = await repository.delete('non-existent');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(mockDatabase.deleteApiKey).toHaveBeenCalledTimes(2);
    });
  });
});
