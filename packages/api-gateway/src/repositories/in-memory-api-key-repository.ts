/**
 * In-Memory API Key Repository Implementation
 *
 * Implements the ApiKeyRepository interface using the in-memory Database
 */

import { inject, injectable } from 'tsyringe';
import {
  ApiKeyRepository,
  ApiKey,
  CreateApiKeyRequest,
} from '../../../core-domain/src/index.js';
import { Database } from '../database.js';

/**
 * In-memory implementation of the API key repository
 */
@injectable()
export class InMemoryApiKeyRepository implements ApiKeyRepository {
  /**
   * Creates a new instance of InMemoryApiKeyRepository
   * @param database - The in-memory database instance
   */
  constructor(@inject('Database') private database: Database) {}

  /**
   * Creates a new API key
   * @param data - The API key creation data
   * @returns Promise<ApiKey> - The created API key
   */
  async create(data: CreateApiKeyRequest): Promise<ApiKey> {
    return this.database.createApiKey(data);
  }

  /**
   * Finds an API key by ID
   * @param id - The API key ID to search for
   * @returns Promise<ApiKey | null> - The found API key or null
   */
  async findById(id: string): Promise<ApiKey | null> {
    return this.database.getApiKeyById(id) || null;
  }

  /**
   * Finds an API key by its key value
   * @param key - The API key value to search for
   * @returns Promise<ApiKey | null> - The found API key or null
   */
  async findByKey(key: string): Promise<ApiKey | null> {
    return this.database.getApiKeyByKey(key) || null;
  }

  /**
   * Deletes an API key by ID
   * @param id - The API key ID to delete
   * @returns Promise<boolean> - True if deleted successfully
   */
  async delete(id: string): Promise<boolean> {
    return this.database.deleteApiKey(id);
  }
}
