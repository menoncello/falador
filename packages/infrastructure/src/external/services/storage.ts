/**
 * Storage Implementation
 * In-memory implementation for development/testing
 */

import type { Storage } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryStorage implements Storage {
  private storage: Map<string, ArrayBuffer> = new Map();
  private basePath = '/tmp/audio';

  /**
   *
   * @param audioBuffer
   * @param filename
   */
  async save(audioBuffer: ArrayBuffer, filename: string): Promise<string> {
    const path = `${this.basePath}/${filename}`;
    this.storage.set(path, audioBuffer);
    return path;
  }

  /**
   *
   * @param path
   */
  async load(path: string): Promise<ArrayBuffer> {
    const audioBuffer = this.storage.get(path);
    if (!audioBuffer) {
      throw new Error(`File not found: ${path}`);
    }
    return audioBuffer;
  }

  /**
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    return this.storage.delete(path);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.storage.clear();
  }

  // Helper method for testing
  /**
   *
   * @param path
   */
  exists(path: string): boolean {
    return this.storage.has(path);
  }

  // Helper method for testing
  /**
   *
   */
  getAllPaths(): string[] {
    return Array.from(this.storage.keys());
  }
}
