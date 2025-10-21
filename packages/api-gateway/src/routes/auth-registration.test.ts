import { createTestUser } from '../test-factories';
import { test, expect } from '../test-support/fixtures/auth-fixture';
import { authRoutes } from './auth';

describe('P0 - Critical: User Registration Flow', () => {
  describe('Given a new user wants to register', () => {
    describe('When all required fields are provided with valid data', () => {
      it('Then registration should succeed and return user data', async ({
        testUser,
      }) => {
        // Given: Valid registration data
        const registrationData = {
          email: 'newuser@example.com',
          name: 'New User',
          password: 'ValidPassword123!',
        };

        // When: Submitting registration request
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData),
          })
        );

        // Then: Should return 201 with user data
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.email).toBe(registrationData.email);
        expect(data.name).toBe(registrationData.name);
        expect(data.tier).toBe('free'); // Default tier
        expect(data.id).toBeTruthy();
        expect(data.createdAt).toBeTruthy();
      });
    });

    describe('When user tries to register with existing email', () => {
      it('Then registration should fail with conflict error', async ({
        setupUser,
      }) => {
        // Given: Existing user with email
        const existingUser = setupUser({
          email: 'existing@example.com',
          name: 'Existing User',
          password: 'Password123!',
        });

        // When: New user tries to register with same email
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: existingUser.email, // Same email
              name: 'Different User',
              password: 'Password123!',
            }),
          })
        );

        // Then: Should return 409 conflict error
        expect(response.status).toBe(409);
        const data = await response.json();
        expect(data.error).toBe('User with this email already exists');
      });
    });
  });
});

describe('P1 - High: Registration Validation', () => {
  describe('Given a user attempts to register', () => {
    describe('When required fields are missing', () => {
      it('Then registration should fail with specific error message', async () => {
        // Test cases for missing fields
        const testCases = [
          {
            name: 'missing email',
            data: { name: 'Test User', password: 'ValidPassword123!' },
            expectedError: 'Missing required fields: email, name, password',
          },
          {
            name: 'missing name',
            data: { email: 'test@example.com', password: 'ValidPassword123!' },
            expectedError: 'Missing required fields: email, name, password',
          },
          {
            name: 'missing password',
            data: { email: 'test@example.com', name: 'Test User' },
            expectedError: 'Missing required fields: email, name, password',
          },
          {
            name: 'all fields missing',
            data: {},
            expectedError: 'Missing required fields: email, name, password',
          },
        ];

        for (const testCase of testCases) {
          // Given: Invalid registration data
          const registrationData = testCase.data;

          // When: Submitting registration request
          const response = await authRoutes.handle(
            new Request('http://localhost/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(registrationData),
            })
          );

          // Then: Should return 400 with specific error
          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toBe(testCase.expectedError);
        }
      });
    });

    describe('When email format is invalid', () => {
      it('Then registration should fail with validation error', async () => {
        // Given: Invalid email formats
        const invalidEmails = [
          'plainaddress',
          '@missinglocal.com',
          'missingatsign.com',
          'missingdomain@',
          'space in@address.com',
          'duplicate@@domain.com',
        ];

        for (const email of invalidEmails) {
          // When: Submitting registration with invalid email
          const response = await authRoutes.handle(
            new Request('http://localhost/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                name: 'Test User',
                password: 'ValidPassword123!',
              }),
            })
          );

          // Then: Should return 400 with email validation error
          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toContain('Email must be at least');
        }
      });
    });

    describe('When password requirements are not met', () => {
      it('Then registration should fail with password validation error', async () => {
        // Test cases for weak passwords
        const weakPasswords = [
          { password: 'Short1!', description: 'too short (< 12 chars)' },
          { password: 'nocaps123!', description: 'missing uppercase' },
          { password: 'NOLOWER123!', description: 'missing lowercase' },
          { password: 'NoNumbersHere!', description: 'missing numbers' },
          {
            password: 'NoSpecialChars123',
            description: 'missing special characters',
          },
        ];

        for (const { password, description } of weakPasswords) {
          // When: Submitting registration with weak password
          const response = await authRoutes.handle(
            new Request('http://localhost/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: 'test@example.com',
                name: 'Test User',
                password,
              }),
            })
          );

          // Then: Should return 400 with password validation error
          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data.error).toMatch(/Password must contain/);
        }
      });
    });
  });
});

describe('P2 - Medium: Registration Optional Fields', () => {
  describe('Given a user registers with optional fields', () => {
    describe('When tier field is provided', () => {
      it('Then user should be created with specified tier', async () => {
        // Given: Registration data with tier
        const registrationData = {
          email: 'pro@example.com',
          name: 'Pro User',
          password: 'ValidPassword123!',
          tier: 'pro',
        };

        // When: Submitting registration
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData),
          })
        );

        // Then: Should create user with specified tier
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.tier).toBe('pro');
      });
    });

    describe('When tier field is not provided', () => {
      it('Then user should be created with default tier', async () => {
        // Given: Registration data without tier
        const registrationData = {
          email: 'free@example.com',
          name: 'Free User',
          password: 'ValidPassword123!',
        };

        // When: Submitting registration
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData),
          })
        );

        // Then: Should create user with default 'free' tier
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.tier).toBe('free');
      });
    });
  });
});

describe('P3 - Low: Edge Cases and Error Handling', () => {
  describe('Given edge case scenarios', () => {
    describe('When null or undefined values are submitted', () => {
      it('Then registration should fail gracefully', async () => {
        // Test cases for null/undefined values
        const edgeCases = [
          { email: null, name: null, password: null },
          { email: undefined, name: undefined, password: undefined },
        ];

        for (const edgeCase of edgeCases) {
          // When: Submitting registration with null/undefined values
          const response = await authRoutes.handle(
            new Request('http://localhost/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(edgeCase),
            })
          );

          // Then: Should return 400 validation error
          expect(response.status).toBe(400);
        }
      });
    });

    describe('When malformed JSON is submitted', () => {
      it('Then registration should fail gracefully', async () => {
        // When: Submitting malformed request
        const response = await authRoutes.handle(
          new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json{',
          })
        );

        // Then: Should handle error gracefully
        expect([400, 422]).toContain(response.status);
      });
    });
  });
});
