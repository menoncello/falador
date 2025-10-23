import { promises as fs } from 'fs';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { LocalStorage } from './local-storage';

describe('LocalStorage', () => {
  const testBasePath = './test-storage';
  let storage: LocalStorage;

  beforeEach(async () => {
    storage = new LocalStorage(testBasePath);
    await storage.clear();
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('constructor', () => {
    it('should create instance with default path', () => {
      const defaultStorage = new LocalStorage();

      expect(defaultStorage).toBeInstanceOf(LocalStorage);
    });

    it('should create instance with custom path', () => {
      const customStorage = new LocalStorage('./custom-path');

      expect(customStorage).toBeInstanceOf(LocalStorage);
    });

    it('should create base directory on construction', async () => {
      const newStorage = new LocalStorage('./new-test-storage');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const exists = await fs
        .access('./new-test-storage')
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      // Cleanup
      await fs.rm('./new-test-storage', { recursive: true, force: true });
    });
  });

  describe('save', () => {
    it('should save string data', async () => {
      const key = 'test-file.txt';
      const data = 'Hello, World!';

      const result = await storage.save(key, data);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(key.replace(/[^\w.-]/g, '_'));
    });

    it('should save Buffer data', async () => {
      const key = 'test-buffer';
      const data = Buffer.from('Binary data');

      const result = await storage.save(key, data);

      expect(result).toBeDefined();
      expect(result).toContain('test-buffer');
    });

    it('should return file path after save', async () => {
      const key = 'return-path';
      const data = 'test';

      const result = await storage.save(key, data);

      expect(result).toMatch(/test-storage/);
      expect(result).toMatch(/return-path/);
    });

    it('should overwrite existing file', async () => {
      const key = 'overwrite';
      await storage.save(key, 'first');

      await storage.save(key, 'second');
      const loaded = await storage.load(key);

      expect(loaded?.toString()).toBe('second');
    });

    it('should sanitize key with special characters', async () => {
      const key = 'file/with\\special:chars';
      const data = 'test';

      const result = await storage.save(key, data);

      // Check that the filename part (not the path) is sanitized
      const filename = result.split('/').pop() || '';
      expect(filename).toBe('file_with_special_chars');
    });
  });

  describe('load', () => {
    it('should load saved data', async () => {
      const key = 'load-test';
      const data = 'Test data';
      await storage.save(key, data);

      const result = await storage.load(key);

      expect(result).toBeDefined();
      expect(result?.toString()).toBe(data);
    });

    it('should return null for non-existent file', async () => {
      const result = await storage.load('non-existent');

      expect(result).toBeNull();
    });

    it('should load Buffer data correctly', async () => {
      const key = 'buffer-load';
      const data = Buffer.from([1, 2, 3, 4]);
      await storage.save(key, data);

      const result = await storage.load(key);

      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(data);
    });

    it('should handle empty file', async () => {
      const key = 'empty';
      await storage.save(key, '');

      const result = await storage.load(key);

      expect(result).toBeDefined();
      expect(result?.toString()).toBe('');
    });
  });

  describe('delete', () => {
    it('should delete existing file', async () => {
      const key = 'delete-me';
      await storage.save(key, 'data');

      const result = await storage.delete(key);

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await storage.delete('does-not-exist');

      expect(result).toBe(false);
    });

    it('should verify file is deleted', async () => {
      const key = 'verify-delete';
      await storage.save(key, 'data');
      await storage.delete(key);

      const exists = await storage.exists(key);

      expect(exists).toBe(false);
    });

    it('should handle multiple delete calls', async () => {
      const key = 'multiple-delete';
      await storage.save(key, 'data');

      const result1 = await storage.delete(key);
      const result2 = await storage.delete(key);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const key = 'exists-test';
      await storage.save(key, 'data');

      const result = await storage.exists(key);

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await storage.exists('not-there');

      expect(result).toBe(false);
    });

    it('should return false after deletion', async () => {
      const key = 'deleted';
      await storage.save(key, 'data');
      await storage.delete(key);

      const result = await storage.exists(key);

      expect(result).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return file URL', async () => {
      const key = 'url-test';

      const result = await storage.getUrl(key);

      expect(result).toBeDefined();
      expect(result).toMatch(/^file:\/\//);
    });

    it('should include sanitized key in URL', async () => {
      const key = 'my-file.txt';

      const result = await storage.getUrl(key);

      expect(result).toContain('my-file.txt');
    });

    it('should sanitize special characters in URL', async () => {
      const key = 'file/with:special\\chars';

      const result = await storage.getUrl(key);

      expect(result).not.toContain('/with');
      expect(result).not.toContain(':special');
    });
  });

  describe('list', () => {
    it('should list files in storage', async () => {
      await storage.save('file1.txt', 'data1');
      await storage.save('file2.txt', 'data2');
      await storage.save('file3.txt', 'data3');

      const result = await storage.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for empty storage', async () => {
      const result = await storage.list();

      expect(result).toEqual([]);
    });

    it('should list with prefix', async () => {
      await storage.save('prefix1-file', 'data');
      await storage.save('prefix2-file', 'data');

      const result = await storage.list('prefix1');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle non-existent prefix', async () => {
      const result = await storage.list('non-existent-prefix');

      expect(result).toEqual([]);
    });

    it('should filter string files only', async () => {
      await storage.save('valid-file', 'data');

      const result = await storage.list();

      expect(result.every((file) => typeof file === 'string')).toBe(true);
    });

    it('should remove path prefix from results', async () => {
      await storage.save('file.txt', 'data');

      const result = await storage.list();

      expect(result.some((file) => !file.includes('/'))).toBe(true);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for existing file', async () => {
      const key = 'metadata-test';
      await storage.save(key, 'data');

      const result = await storage.getMetadata(key);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('lastModified');
      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('isDirectory');
      expect(result).toHaveProperty('isFile');
    });

    it('should return null for non-existent file', async () => {
      const result = await storage.getMetadata('not-there');

      expect(result).toBeNull();
    });

    it('should return correct file size', async () => {
      const key = 'size-test';
      const data = 'Hello, World!';
      await storage.save(key, data);

      const result = await storage.getMetadata(key);

      expect(result?.size).toBe(data.length);
    });

    it('should indicate file type correctly', async () => {
      const key = 'type-test';
      await storage.save(key, 'data');

      const result = await storage.getMetadata(key);

      expect(result?.isFile).toBe(true);
      expect(result?.isDirectory).toBe(false);
    });

    it('should have valid timestamps', async () => {
      const key = 'timestamp-test';
      await storage.save(key, 'data');

      const result = await storage.getMetadata(key);

      expect(result?.lastModified).toBeInstanceOf(Date);
      expect(result?.created).toBeInstanceOf(Date);
    });
  });

  describe('copy', () => {
    it('should copy file successfully', async () => {
      const source = 'source';
      const destination = 'destination';
      await storage.save(source, 'original data');

      const result = await storage.copy(source, destination);

      expect(result).toBe(true);
    });

    it('should verify copied file exists', async () => {
      const source = 'copy-source';
      const destination = 'copy-dest';
      await storage.save(source, 'data');
      await storage.copy(source, destination);

      const exists = await storage.exists(destination);

      expect(exists).toBe(true);
    });

    it('should preserve file content during copy', async () => {
      const source = 'preserve-source';
      const destination = 'preserve-dest';
      const data = 'Preserved content';
      await storage.save(source, data);
      await storage.copy(source, destination);

      const loaded = await storage.load(destination);

      expect(loaded?.toString()).toBe(data);
    });

    it('should return false for non-existent source', async () => {
      const result = await storage.copy('not-there', 'destination');

      expect(result).toBe(false);
    });

    it('should keep original file after copy', async () => {
      const source = 'keep-original';
      const destination = 'new-copy';
      await storage.save(source, 'data');
      await storage.copy(source, destination);

      const sourceExists = await storage.exists(source);

      expect(sourceExists).toBe(true);
    });
  });

  describe('move', () => {
    it('should move file successfully', async () => {
      const source = 'move-source';
      const destination = 'move-dest';
      await storage.save(source, 'move data');

      const result = await storage.move(source, destination);

      expect(result).toBe(true);
    });

    it('should verify moved file exists at destination', async () => {
      const source = 'verify-source';
      const destination = 'verify-dest';
      await storage.save(source, 'data');
      await storage.move(source, destination);

      const destExists = await storage.exists(destination);

      expect(destExists).toBe(true);
    });

    it('should remove original file after move', async () => {
      const source = 'remove-source';
      const destination = 'remove-dest';
      await storage.save(source, 'data');
      await storage.move(source, destination);

      const sourceExists = await storage.exists(source);

      expect(sourceExists).toBe(false);
    });

    it('should preserve content during move', async () => {
      const source = 'content-source';
      const destination = 'content-dest';
      const data = 'Move this content';
      await storage.save(source, data);
      await storage.move(source, destination);

      const loaded = await storage.load(destination);

      expect(loaded?.toString()).toBe(data);
    });

    it('should return false for non-existent source', async () => {
      const result = await storage.move('not-there', 'destination');

      expect(result).toBe(false);
    });

    it('should return false if copy fails', async () => {
      // Move will call copy which will fail for non-existent file
      const result = await storage.move('non-existent', 'dest');

      expect(result).toBe(false);
    });
  });

  describe('getFilePath (sanitization)', () => {
    it('should sanitize slashes', async () => {
      const key = 'path/with/slashes';
      await storage.save(key, 'data');

      const exists = await storage.exists(key);

      expect(exists).toBe(true);
    });

    it('should sanitize backslashes', async () => {
      const key = 'path\\with\\backslashes';
      await storage.save(key, 'data');

      const exists = await storage.exists(key);

      expect(exists).toBe(true);
    });

    it('should sanitize colons', async () => {
      const key = 'file:with:colons';
      await storage.save(key, 'data');

      const exists = await storage.exists(key);

      expect(exists).toBe(true);
    });

    it('should preserve valid characters', async () => {
      const key = 'valid-file_name.txt';
      await storage.save(key, 'data');

      const exists = await storage.exists(key);

      expect(exists).toBe(true);
    });

    it('should handle multiple special characters', async () => {
      const key = 'file/with\\many:special*chars?';
      await storage.save(key, 'data');

      const exists = await storage.exists(key);

      expect(exists).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all files', async () => {
      await storage.save('file1', 'data1');
      await storage.save('file2', 'data2');
      await storage.save('file3', 'data3');

      await storage.clear();
      const files = await storage.list();

      expect(files.length).toBe(0);
    });

    it('should recreate directory after clear', async () => {
      await storage.clear();
      await storage.save('after-clear', 'data');

      const exists = await storage.exists('after-clear');

      expect(exists).toBe(true);
    });

    it('should handle clear on empty storage', async () => {
      await storage.clear();
      await storage.clear(); // Clear again

      const files = await storage.list();

      expect(files).toEqual([]);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if not exists', async () => {
      const newPath = './ensure-test-dir';
      const newStorage = new LocalStorage(newPath);
      await newStorage.save('test', 'data');

      const exists = await fs
        .access(newPath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      // Cleanup
      await fs.rm(newPath, { recursive: true, force: true });
    });

    it('should not fail if directory already exists', async () => {
      await storage.save('test1', 'data');
      await storage.save('test2', 'data'); // Should not throw

      const exists = await storage.exists('test2');

      expect(exists).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete file lifecycle', async () => {
      const key = 'lifecycle';

      // Create
      await storage.save(key, 'initial');
      expect(await storage.exists(key)).toBe(true);

      // Read
      let content = await storage.load(key);
      expect(content?.toString()).toBe('initial');

      // Update
      await storage.save(key, 'updated');
      content = await storage.load(key);
      expect(content?.toString()).toBe('updated');

      // Delete
      await storage.delete(key);
      expect(await storage.exists(key)).toBe(false);
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        storage.save(`concurrent-${i}`, `data-${i}`)
      );

      await Promise.all(operations);
      const files = await storage.list();

      expect(files.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle large file content', async () => {
      const key = 'large-file';
      const largeData = 'x'.repeat(100000); // 100KB

      await storage.save(key, largeData);
      const loaded = await storage.load(key);

      expect(loaded?.toString()).toBe(largeData);
    });
  });
});
