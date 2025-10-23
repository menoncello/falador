import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { JWTTokenGenerator } from './jwt-token-generator';

describe('JWTTokenGenerator', () => {
  let tokenGenerator: JWTTokenGenerator;
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = process.env;
    process.env.JWT_SECRET = 'test-secret-key';
    tokenGenerator = new JWTTokenGenerator();
  });

  describe('generate', () => {
    it('should generate token with payload', () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };

      // Act
      const result = tokenGenerator.generate(payload);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate token with empty payload when none provided', () => {
      // Act
      const result = tokenGenerator.generate();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use custom JWT_SECRET from environment', () => {
      // Arrange
      process.env.JWT_SECRET = 'custom-secret-key';
      const customTokenGenerator = new JWTTokenGenerator();
      const payload = { userId: '123' };

      // Act
      const result = customTokenGenerator.generate(payload);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null payload gracefully', () => {
      // Act
      const result = tokenGenerator.generate(null as any);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle undefined payload gracefully', () => {
      // Act
      const result = tokenGenerator.generate();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('verify', () => {
    it('should verify valid token', () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };
      const token = tokenGenerator.generate(payload);

      // Act
      const result = tokenGenerator.verify(token);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      if (result) {
        expect(result.userId).toBe('123');
        expect(result.email).toBe('test@example.com');
      }
    });

    it('should return null for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act
      const result = tokenGenerator.verify(invalidToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should use custom JWT_SECRET from environment', () => {
      // Arrange
      process.env.JWT_SECRET = 'custom-secret-key';
      const customTokenGenerator = new JWTTokenGenerator();
      const payload = { userId: '123' };
      const token = customTokenGenerator.generate(payload);

      // Act
      const result = customTokenGenerator.verify(token);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle empty token', () => {
      // Act
      const result = tokenGenerator.verify('');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle null token', () => {
      // Act
      const result = tokenGenerator.verify(null as any);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle undefined token', () => {
      // Act
      const result = tokenGenerator.verify();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('decode', () => {
    it('should decode valid token without verification', () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };
      const token = tokenGenerator.generate(payload);

      // Act
      const result = tokenGenerator.decode(token);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      if (result) {
        expect(result.userId).toBe('123');
        expect(result.email).toBe('test@example.com');
      }
    });

    it('should return null for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act
      const result = tokenGenerator.decode(invalidToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle empty token', () => {
      // Act
      const result = tokenGenerator.decode('');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle null token', () => {
      // Act
      const result = tokenGenerator.decode(null as any);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle undefined token', () => {
      // Act
      const result = tokenGenerator.decode();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('integration behavior', () => {
    it('should generate and verify token consistently', () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };

      // Act
      const token = tokenGenerator.generate(payload);
      const verifiedPayload = tokenGenerator.verify(token);
      const decodedPayload = tokenGenerator.decode(token);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(verifiedPayload).toEqual(expect.objectContaining(payload));
      expect(decodedPayload).toEqual(expect.objectContaining(payload));
    });

    it('should fail verification with invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act
      const verifiedPayload = tokenGenerator.verify(invalidToken);

      // Assert
      expect(verifiedPayload).toBeNull();
    });
  });
});
