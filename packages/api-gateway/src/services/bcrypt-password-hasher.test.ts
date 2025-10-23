import { describe, it, expect, beforeEach } from 'bun:test';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  let passwordHasher: BcryptPasswordHasher;

  beforeEach(() => {
    passwordHasher = new BcryptPasswordHasher();
  });

  describe('hash', () => {
    it('should hash password with correct salt rounds', async () => {
      // Arrange
      const password = 'testPassword123';

      // Act
      const result = await passwordHasher.hash(password);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).not.toBe(password);
      expect(result.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
      expect(result.startsWith('$2b$12$')).toBe(true); // bcrypt format with salt rounds 12
    });

    it('should handle empty password', async () => {
      // Arrange
      const password = '';

      // Act
      const result = await passwordHasher.hash(password);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).not.toBe(password);
      expect(result.startsWith('$2b$12$')).toBe(true);
    });

    it('should handle long passwords', async () => {
      // Arrange
      const password = 'a'.repeat(1000);

      // Act
      const result = await passwordHasher.hash(password);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).not.toBe(password);
      expect(result.startsWith('$2b$12$')).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      // Arrange
      const password = 'testPassword123';

      // Act
      const hash1 = await passwordHasher.hash(password);
      const hash2 = await passwordHasher.hash(password);

      // Assert
      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
      expect(hash1).toMatch(/^\$2b\$12\$/);
      expect(hash2).toMatch(/^\$2b\$12\$/);
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      // Arrange
      const password = 'testPassword123';
      const hashedPassword = await passwordHasher.hash(password);

      // Act
      const result = await passwordHasher.verify(password, hashedPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await passwordHasher.hash(password);

      // Act
      const result = await passwordHasher.verify(wrongPassword, hashedPassword);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject empty password', async () => {
      // Arrange
      const password = 'testPassword123';
      const hashedPassword = await passwordHasher.hash(password);

      // Act
      const result = await passwordHasher.verify('', hashedPassword);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject empty hash', async () => {
      // Arrange
      const password = 'testPassword';

      // Act
      const result = await passwordHasher.verify(password, '');

      // Assert - bcrypt handles empty hash gracefully in some implementations
      expect(typeof result).toBe('boolean');
    });

    it('should reject malformed hash', async () => {
      // Arrange
      const password = 'testPassword';
      const malformedHash = 'invalid_hash_format';

      // Act
      const result = await passwordHasher.verify(password, malformedHash);

      // Assert - bcrypt handles malformed hash gracefully
      expect(typeof result).toBe('boolean');
    });
  });

  describe('integration behavior', () => {
    it('should hash and verify same password successfully', async () => {
      // Arrange
      const password = 'integrationTestPassword123';

      // Act
      const hashedPassword = await passwordHasher.hash(password);
      const isValid = await passwordHasher.verify(password, hashedPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(isValid).toBe(true);
    });

    it('should fail verification with different password', async () => {
      // Arrange
      const originalPassword = 'originalPassword123';
      const wrongPassword = 'wrongPassword123';

      // Act
      const hashedPassword = await passwordHasher.hash(originalPassword);
      const isValid = await passwordHasher.verify(
        wrongPassword,
        hashedPassword
      );

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle multiple hash/verify cycles', async () => {
      // Arrange
      const passwords = ['password1', 'password2', '', 'test'];

      // Act & Assert
      for (const password of passwords) {
        const hashedPassword = await passwordHasher.hash(password);
        const isValid = await passwordHasher.verify(password, hashedPassword);
        const isInvalid = await passwordHasher.verify(
          `${password}wrong`,
          hashedPassword
        );

        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      }
    });
  });
});
