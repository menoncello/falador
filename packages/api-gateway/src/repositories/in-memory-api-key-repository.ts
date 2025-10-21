/**
 * In-Memory API Key Repository Implementation
 *
 * Implements the ApiKeyRepository interface using the in-memory Database
 */

import { ApiKeyRepository, ApiKeyGenerator } from '@falador/core-domain';
import { inject, injectable } from 'tsyringe';
import { Database } from '../database.js';

/**
 *
 */
@injectable()
export class InMemoryApiKeyRepository implements ApiKeyRepository {
  /**
   *
   * @param database
   * @param apiKeyGenerator
   */
  constructor(
    @inject('Database') private database: Database,
    @inject('ApiKeyGenerator') private apiKeyGenerator: ApiKeyGenerator
  ) {}

  /**
   *
   * @param data
   * @param data.userId
   * @param data.name
   * @param data.scopes
   */
  async create(data: { userId: string; name: string; scopes: string[] }) {
    const key = this.apiKeyGenerator.generate();
    return this.database.createApiKey({
      ...data,
      key,
    });
  }

  /**
   *
   * @param id
   */
  async findById(id: string) {
    return this.database.getApiKeyById(id) || null;
  }

  /**
   *
   * @param key
   */
  async findByKey(key: string) {
    return this.database.getApiKeyByKey(key) || null;
  }

  /**
   *
   * @param id
   */
  async delete(id: string) {
    return this.database.deleteApiKey(id);
  }
}
