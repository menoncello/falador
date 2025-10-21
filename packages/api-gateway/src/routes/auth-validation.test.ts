import { describe, expect, it, beforeEach } from 'bun:test';
import { HTTP_STATUS } from '../constants';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';
import { authRoutes } from './auth';

// Fixed timestamp for deterministic testing
const FIXED_TIMESTAMP = 1697702400000; // October 19, 2023

describe('Auth Validation Tests', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Schema Validation', () => {
    it('should validate tier field accepts only specific values', async () => {
      // Test valid tier values
      const validTiers = ['free', 'pro', 'enterprise'];

      for (const tier of validTiers) {
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: `test-${tier}@example.com`,
              name: 'Test User',
              password: TEST_CREDENTIALS.PASSWORD,
              tier,
            }),
          })
        );

        expect(response.status).toBe(HTTP_STATUS.CREATED);
      }
    });

    it('should handle registration with invalid tier values', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: TEST_CREDENTIALS.PASSWORD,
            tier: 'invalid-tier',
          }),
        })
      );

      // Should be rejected by Elysia validation
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should validate string length constraints', async () => {
      // Test name length validation
      const shortName = 'a';
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: shortName,
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Name must be at least');
    });

    it('should handle email validation edge cases', async () => {
      // Test emails that should fail the regex validation
      const invalidEmails = [
        'plainaddress',
        '@missinglocal.com',
        'missingatsign.com',
        'missingdomain@',
        'space in@address.com',
        'duplicate@@domain.com',
        'trailingdot@domain.com.',
        '.leadingdot@domain.com',
      ];

      for (const email of invalidEmails) {
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name: 'Test User',
              password: TEST_CREDENTIALS.PASSWORD,
            }),
          })
        );

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        const data = (await response.json()) as { error: string };
        expect(data.error).toContain('Email must be at least');
      }
    });

    it('should validate valid email formats', async () => {
      // Test emails that should pass validation
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example123.com',
        'test.email.with+symbol@example.com',
        'a@b.co',
      ];

      for (const email of validEmails) {
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name: 'Test User',
              password: TEST_CREDENTIALS.PASSWORD,
            }),
          })
        );

        // Should either succeed (201) or fail due to other validation, but not email validation
        expect([201, 400, 409]).toContain(response.status);
        if (response.status === 400) {
          const data = (await response.json()) as { error: string };
          expect(data.error).not.toContain('Email must be at least');
        }
      }
    });

    it('should handle validation schema mutations', async () => {
      // Test that the validation schema is properly structured
      // This helps kill mutants that change the schema structure
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: TEST_CREDENTIALS.PASSWORD,
            tier: 'free',
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      const data = await response.json();
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('tier');
    });
  });

  describe('Password Validation', () => {
    it('should reject passwords shorter than 12 characters', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: 'Short1!', // Only 7 characters
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Password must be at least 12 characters long');
    });

    it('should reject passwords without lowercase letters', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: 'UPPERCASE123!', // No lowercase
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject passwords without uppercase letters', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: 'lowercase123!', // No uppercase
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject passwords without numbers', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: 'NoNumbersHere!', // No numbers
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Password must contain at least one number');
    });

    it('should reject passwords without special characters', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: 'NoSpecialChars123', // No special characters
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe(
        'Password must contain at least one special character'
      );
    });

    it('should accept strong passwords', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'strong@example.com',
            name: 'Strong User',
            password: 'StrongPassword123!', // Meets all requirements
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should handle password at exact minimum length boundary', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: 'StrongPass1!', // Exactly 12 characters
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should handle password at exact maximum length boundary', async () => {
      const longPassword = 'StrongPassword123!'.repeat(4); // 80 characters
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: longPassword,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should reject password exceeding maximum length', async () => {
      const tooLongPassword = 'StrongPassword123!'.repeat(5); // 100 characters
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: tooLongPassword,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Password must be less than');
    });
  });

  describe('Error Message Validation', () => {
    it('should return exact error message for missing required fields', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            // Missing name and password
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Missing required fields: email, name, password');
    });

    it('should return exact error message for duplicate email', async () => {
      // Create first user
      await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'duplicate@example.com',
            name: 'First User',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      // Try to create duplicate
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'duplicate@example.com',
            name: 'Second User',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('User with this email already exists');
    });

    it('should return exact error message for invalid credentials (non-existent user)', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should return exact error message for invalid credentials (wrong password)', async () => {
      // Create user
      db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      // Try to login with wrong password - using fixed timestamp instead of Date.now()
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: TEST_CREDENTIALS.EMAIL,
            password: `wrong-${FIXED_TIMESTAMP}`, // Fixed timestamp instead of Date.now()
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('should validate conditional error responses', async () => {
      // Test various conditions that trigger different error responses
      const testCases = [
        {
          name: 'Missing email',
          body: { name: 'Test', password: TEST_CREDENTIALS.PASSWORD },
          expectedError: 'Missing required fields: email, name, password',
        },
        {
          name: 'Missing name',
          body: {
            email: 'test@example.com',
            password: TEST_CREDENTIALS.PASSWORD,
          },
          expectedError: 'Missing required fields: email, name, password',
        },
        {
          name: 'Missing password',
          body: { email: 'test@example.com', name: 'Test' },
          expectedError: 'Missing required fields: email, name, password',
        },
      ];

      for (const testCase of testCases) {
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase.body),
          })
        );

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        const data = (await response.json()) as { error: string };
        expect(data.error).toBe(testCase.expectedError);
      }
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle name at exact minimum length boundary', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'ab', // Exactly 2 characters
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should handle email at exact minimum length boundary', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'a@b.co', // 6 characters - minimum valid email
            name: 'Test User',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      expect(response.status).toBe(HTTP_STATUS.CREATED);
    });

    it('should validate token generation is consistent', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token1 = db.createSession(user.id);
      const token2 = db.createSession(user.id);

      // Tokens should be different (unique)
      expect(token1).not.toBe(token2);

      // Both should be valid format
      expect(token1).toContain('.');
      expect(token2).toContain('.');
    });

    it('should validate API key generation is unique', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response1 = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Test API Key 1',
            scopes: ['read'],
          }),
        })
      );

      const response2 = await authRoutes.handle(
        new Request('http://localhost/api/auth/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: 'Test API Key 2',
            scopes: ['read'],
          }),
        })
      );

      expect(response1.status).toBe(HTTP_STATUS.CREATED);
      expect(response2.status).toBe(HTTP_STATUS.CREATED);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // API keys should be different
      expect(data1.key).not.toBe(data2.key);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'malformed json{',
        })
      );

      // Should be handled by Elysia framework
      expect([
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        415,
      ]).toContain(response.status);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await authRoutes.handle(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            password: TEST_CREDENTIALS.PASSWORD,
          }),
        })
      );

      // Should still work or be rejected appropriately
      expect([
        HTTP_STATUS.CREATED,
        HTTP_STATUS.BAD_REQUEST,
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
      ]).toContain(response.status);
    });
  });
});
