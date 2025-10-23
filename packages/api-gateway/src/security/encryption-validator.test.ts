import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { EncryptionValidator } from './encryption-validator';

describe('EncryptionValidator', () => {
  let validator: EncryptionValidator;
  const originalEnv = process.env;

  beforeEach(() => {
    validator = new EncryptionValidator();
    process.env = { ...originalEnv };
  });

  // Helper function to create a fresh validator with current environment
  function createFreshValidator(): EncryptionValidator {
    return new EncryptionValidator();
  }

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('JWT Secret Validation', () => {
    it('should fail validation when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      const freshValidator = createFreshValidator();
      const validation = freshValidator.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.score).toBeLessThan(60);

      const jwtIssues = validation.issues.filter((i) =>
        i.message.includes('JWT')
      );
      expect(jwtIssues.length).toBeGreaterThan(0);
      expect(jwtIssues.some((i) => i.severity === 'critical')).toBe(true);
    });

    it('should fail validation when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';
      const freshValidator = createFreshValidator();
      const validation = freshValidator.validate();

      expect(validation.isValid).toBe(false);
      expect(
        validation.issues.some(
          (i) => i.message.includes('too short') && i.severity === 'critical'
        )
      ).toBe(true);
    });

    it('should fail validation for default/weak JWT secrets', () => {
      const weakSecrets = [
        'test-secret-key',
        'development-secret-change-in-production-min-32-chars',
        'password123',
        'abc123',
      ];

      for (const secret of weakSecrets) {
        process.env.JWT_SECRET = secret;
        const validation = validator.validate();

        expect(
          validation.issues.some(
            (i) =>
              i.message.includes('weak JWT secret') && i.severity === 'critical'
          )
        ).toBe(true);
      }
    });

    it('should pass validation with strong JWT secret', () => {
      process.env.JWT_SECRET = 'Kx9vP2cR5nM8jQ4fT7wE1yU3iI6oP0zL'; // Valid length, random characters
      const freshValidator = createFreshValidator();
      const validation = freshValidator.validate();

      expect(
        validation.issues.some((i) => i.message.includes('JWT secret'))
      ).toBe(false);
    });

    it('should detect weak patterns in JWT secret', () => {
      process.env.JWT_SECRET = 'password123456789012345678901234567890';
      const freshValidator = createFreshValidator();
      const validation = freshValidator.validate();

      expect(
        validation.issues.some(
          (i) => i.message.includes('weak patterns') && i.severity === 'high'
        )
      ).toBe(true);
    });
  });

  describe('Bcrypt Rounds Validation', () => {
    it('should detect insufficient bcrypt rounds', () => {
      // Mock bcrypt rounds being too low
      const validation = validator.validate();
      const bcryptIssues = validation.issues.filter((i) =>
        i.message.includes('Bcrypt rounds')
      );

      expect(bcryptIssues.length).toBeGreaterThan(0);
      expect(bcryptIssues.some((i) => i.severity === 'medium')).toBe(true);
    });

    it('should warn about bcrypt rounds below recommendation', () => {
      const validation = validator.validate();
      const bcryptIssues = validation.issues.filter(
        (i) => i.message.includes('Bcrypt rounds') && i.severity === 'medium'
      );

      expect(bcryptIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Session Duration Validation', () => {
    it('should validate session duration limits', () => {
      const validation = validator.validate();
      const sessionIssues = validation.issues.filter((i) =>
        i.message.includes('Session duration')
      );

      // Should have at least one recommendation about session duration
      expect(sessionIssues.some((i) => i.severity === 'low')).toBe(true);
    });
  });

  describe('Random Bytes Validation', () => {
    it('should validate random bytes configuration', () => {
      const validation = validator.validate();
      const randomBytesIssues = validation.issues.filter((i) =>
        i.message.includes('Random bytes')
      );

      // Should not have issues with default configuration
      expect(
        randomBytesIssues.filter(
          (i) => i.severity === 'high' || i.severity === 'critical'
        )
      ).toHaveLength(0);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate appropriate score for valid configuration', () => {
      process.env.JWT_SECRET = 'Kx9vP2cR5nM8jQ4fT7wE1yU3iI6oP0zL';
      process.env.BCRYPT_ROUNDS = '14';
      const freshValidator = createFreshValidator();
      const validation = freshValidator.validate();

      expect(validation.score).toBeGreaterThan(70);
      expect(validation.score).toBeLessThanOrEqual(100);
    });

    it('should heavily penalize critical issues', () => {
      delete process.env.JWT_SECRET;
      const validation = validator.validate();

      expect(validation.score).toBeLessThan(60);
      expect(validation.issues.some((i) => i.severity === 'critical')).toBe(
        true
      );
    });

    it('should moderately penalize high-severity issues', () => {
      process.env.JWT_SECRET = 'short';
      const validation = validator.validate();

      expect(validation.score).toBeLessThan(80);
      expect(validation.issues.some((i) => i.severity === 'high')).toBe(true);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations for security issues', () => {
      delete process.env.JWT_SECRET;
      const validation = validator.validate();

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(
        validation.recommendations.some((r) => r.includes('security'))
      ).toBe(true);
      expect(
        validation.recommendations.some((r) => r.includes('JWT secret'))
      ).toBe(true);
    });

    it('should include configuration recommendations when needed', () => {
      delete process.env.JWT_SECRET;
      const validation = validator.validate();

      expect(
        validation.recommendations.some((r) =>
          r.includes('environment variables')
        )
      ).toBe(true);
    });
  });

  describe('Production Readiness', () => {
    it('should not be production-ready without JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      expect(validator.isProductionReady()).toBe(false);
    });

    it('should not be production-ready with short JWT secret', () => {
      process.env.JWT_SECRET = 'short';
      expect(validator.isProductionReady()).toBe(false);
    });

    it('should not be production-ready with weak secrets in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET =
        'test-secret-key-change-in-production-min-32-chars';
      expect(validator.isProductionReady()).toBe(false);
    });

    it('should be production-ready with proper configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'Kx9vP2cR5nM8jQ4fT7wE1yU3iI6oP0zL';
      process.env.BCRYPT_ROUNDS = '14';
      const freshValidator = createFreshValidator();
      expect(freshValidator.isProductionReady()).toBe(true);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect accurate metrics', () => {
      process.env.JWT_SECRET = 'Kx9vP2cR5nM8jQ4fT7wE1yU3iI6oP0zL';
      process.env.BCRYPT_ROUNDS = '14';
      const freshValidator = createFreshValidator();
      const metrics = freshValidator.getMetrics();

      expect(metrics.passwordHashRounds).toBe(14);
      expect(metrics.jwtSecretLength).toBe(32);
      expect(metrics.sessionDuration).toBeGreaterThan(0);
      expect(metrics.apiKeyEntropy).toBeGreaterThan(0);
      expect(metrics.timestamp).toBeGreaterThan(0);
      expect(metrics.environment).toBeDefined();
    });

    it('should handle missing JWT_SECRET in metrics', () => {
      delete process.env.JWT_SECRET;
      const freshValidator = createFreshValidator();
      const metrics = freshValidator.getMetrics();

      expect(metrics.jwtSecretLength).toBe(0);
    });
  });

  describe('Export Functionality', () => {
    it('should export validation results as JSON', () => {
      const exported = validator.exportValidation();

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.timestamp).toBeGreaterThan(0);
      expect(parsed.validation).toBeDefined();
      expect(parsed.metrics).toBeDefined();
      expect(parsed.configuration).toBeDefined();
      expect(parsed.recommendations).toBeDefined();
      expect(parsed.issues).toBeDefined();
    });

    it('should include production readiness in export', () => {
      process.env.JWT_SECRET = 'Kx9vP2cR5nM8jQ4fT7wE1yU3iI6oP0zL';
      process.env.BCRYPT_ROUNDS = '14';
      const freshValidator = createFreshValidator();
      const exported = freshValidator.exportValidation();
      const parsed = JSON.parse(exported);

      expect(parsed.configuration.productionReady).toBe(true);
    });
  });

  describe('Issue Sorting', () => {
    it('should sort issues by severity', () => {
      delete process.env.JWT_SECRET; // Creates critical issue
      const validation = validator.validate();

      if (validation.issues.length > 1) {
        for (let i = 0; i < validation.issues.length - 1; i++) {
          const currentWeight = getSeverityWeight(
            validation.issues[i].severity
          );
          const nextWeight = getSeverityWeight(
            validation.issues[i + 1].severity
          );
          expect(currentWeight).toBeGreaterThanOrEqual(nextWeight);
        }
      }
    });

    // Helper method for testing
    function getSeverityWeight(severity: string): number {
      switch (severity) {
        case 'critical':
          return 4;
        case 'high':
          return 3;
        case 'medium':
          return 2;
        case 'low':
          return 1;
        default:
          return 0;
      }
    }
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values gracefully', () => {
      process.env.JWT_SECRET = undefined;
      const validation = validator.validate();

      expect(validation.issues.length).toBeGreaterThan(0);
      expect(
        validation.issues.every(
          (issue) => issue.message && issue.recommendation && issue.severity
        )
      ).toBe(true);
    });

    it('should handle empty string values', () => {
      process.env.JWT_SECRET = '';
      const validation = validator.validate();

      expect(validation.issues.some((i) => i.message.includes('JWT'))).toBe(
        true
      );
    });

    it('should validate with maximum length JWT secret', () => {
      process.env.JWT_SECRET = 'a'.repeat(1000);
      process.env.BCRYPT_ROUNDS = '14';
      const freshValidator = createFreshValidator();
      const validation = freshValidator.validate();

      expect(
        validation.issues.some((i) => i.message.includes('too short'))
      ).toBe(false);
      expect(validation.score).toBeGreaterThan(80);
    });
  });
});
