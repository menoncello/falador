/**
 * Infrastructure Layer
 * Contains external services and repositories
 */

export interface StorageService {
  save(key: string, data: unknown): Promise<void>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<void>;
}

export class LocalStorageService implements StorageService {
  private storage = new Map<string, unknown>();

  async save(key: string, data: unknown): Promise<void> {
    this.storage.set(key, data);
  }

  async get(key: string): Promise<unknown> {
    return this.storage.get(key);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}