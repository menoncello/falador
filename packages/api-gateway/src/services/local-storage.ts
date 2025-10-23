import { promises as fs } from 'fs';
import { join } from 'path';
import type { Storage } from '../../../core-domain/src/index.js';

/**
 * Local File Storage Implementation
 *
 * This is a simple local file system implementation for development.
 * In production, this would use cloud storage like AWS S3 or similar.
 */
export class LocalStorage implements Storage {
  private readonly basePath: string;

  /**
   *
   * @param basePath
   */
  constructor(basePath = './storage') {
    this.basePath = basePath;
    this.ensureDirectoryExists();
  }

  /**
   *
   * @param key
   * @param data
   */
  async save(key: string, data: Buffer | string): Promise<string> {
    const filePath = this.getFilePath(key);
    await this.ensureDirectoryExists();
    await fs.writeFile(filePath, data);
    return filePath;
  }

  /**
   *
   * @param key
   */
  async load(key: string): Promise<Buffer | null> {
    try {
      const filePath = this.getFilePath(key);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  /**
   *
   * @param key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   *
   * @param key
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   *
   * @param key
   */
  async getUrl(key: string): Promise<string> {
    // Mock implementation - return file path as URL
    return `file://${this.getFilePath(key)}`;
  }

  /**
   *
   * @param prefix
   */
  async list(prefix?: string): Promise<string[]> {
    const dirPath = prefix ? join(this.basePath, prefix) : this.basePath;
    try {
      const files = await fs.readdir(dirPath, { recursive: true });
      return files
        .filter((file) => typeof file === 'string')
        .map((file) => file.replace(/^.*\//, '')); // Remove path prefix
    } catch {
      return [];
    }
  }

  /**
   *
   * @param key
   */
  async getMetadata(key: string): Promise<Record<string, unknown> | null> {
    try {
      const filePath = this.getFilePath(key);
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch {
      return null;
    }
  }

  /**
   *
   * @param sourceKey
   * @param destinationKey
   */
  async copy(sourceKey: string, destinationKey: string): Promise<boolean> {
    try {
      const sourcePath = this.getFilePath(sourceKey);
      const destinationPath = this.getFilePath(destinationKey);
      await this.ensureDirectoryExists();
      await fs.copyFile(sourcePath, destinationPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   *
   * @param sourceKey
   * @param destinationKey
   */
  async move(sourceKey: string, destinationKey: string): Promise<boolean> {
    if (await this.copy(sourceKey, destinationKey)) {
      return this.delete(sourceKey);
    }
    return false;
  }

  /**
   *
   * @param key
   */
  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/[^\w.-]/g, '_');
    return join(this.basePath, sanitizedKey);
  }

  /**
   *
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch {
      // Directory already exists or permission error
    }
  }

  // Clear all storage (useful for testing)
  /**
   *
   */
  async clear(): Promise<void> {
    try {
      await fs.rm(this.basePath, { recursive: true, force: true });
      await this.ensureDirectoryExists();
    } catch {
      // Ignore errors during cleanup
    }
  }
}
