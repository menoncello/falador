import { describe, it, expect, beforeEach } from 'bun:test';
import { RandomApiKeyGenerator } from './random-api-key-generator';

describe('RandomApiKeyGenerator', () => {
  let apiKeyGenerator: RandomApiKeyGenerator;

  beforeEach(() => {
    apiKeyGenerator = new RandomApiKeyGenerator();
  });

  describe('generate', () => {
    it('should generate API key with correct prefix and format', () => {
      // Act
      const result = apiKeyGenerator.generate();

      // Assert
      expect(result).toBeDefined();
      expect(result).toMatch(/^fk_[\da-f]{64}$/);
      expect(result).toHaveLength(67);
      expect(result.startsWith('fk_')).toBe(true);
    });

    it('should generate different keys on multiple calls', () => {
      // Act
      const result1 = apiKeyGenerator.generate();
      const result2 = apiKeyGenerator.generate();

      // Assert
      expect(result1).not.toBe(result2);
      expect(result1).toMatch(/^fk_[\da-f]{64}$/);
      expect(result2).toMatch(/^fk_[\da-f]{64}$/);
    });

    it('should generate keys with correct length', () => {
      // Act
      const result = apiKeyGenerator.generate();

      // Assert
      expect(result).toHaveLength(67);
    });

    it('should generate unique keys', () => {
      // Arrange
      const keys = new Set<string>();

      // Act
      for (let i = 0; i < 100; i++) {
        keys.add(apiKeyGenerator.generate());
      }

      // Assert
      expect(keys.size).toBe(100); // All keys should be unique
    });
  });

  describe('validate', () => {
    it('should reject API key with wrong prefix', () => {
      // Arrange
      const invalidApiKey = `sk_${'a'.repeat(64)}`;

      // Act
      const result = apiKeyGenerator.validate(invalidApiKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      // Act
      const result = apiKeyGenerator.validate('');

      // Assert
      expect(result).toBe(false);
    });

    it('should reject API key without prefix', () => {
      // Arrange
      const apiKeyWithoutPrefix = 'a'.repeat(64);

      // Act
      const result = apiKeyGenerator.validate(apiKeyWithoutPrefix);

      // Assert
      expect(result).toBe(false);
    });

    it('should not throw on various inputs', () => {
      // Act & Assert - Test that method doesn't throw
      expect(() => apiKeyGenerator.validate('fk_test')).not.toThrow();
      expect(() => apiKeyGenerator.validate('test')).not.toThrow();
      expect(() => apiKeyGenerator.validate('FK_test')).not.toThrow();
    });
  });
});
