/**
 * Infrastructure Layer
 * Contains external services and repositories
 */

export interface StorageService {
  save: (key: string, data: unknown) => Promise<void>;
  get: (key: string) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
}

/**
 * Local implementation of storage service using Map
 */
export class LocalStorageService implements StorageService {
  private storage = new Map<string, unknown>();

  save = async (key: string, data: unknown): Promise<void> => {
    this.storage.set(key, data);
  };

  get = async (key: string): Promise<unknown> => {
    return this.storage.get(key);
  };

  delete = async (key: string): Promise<void> => {
    this.storage.delete(key);
  };
}