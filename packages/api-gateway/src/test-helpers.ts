import { TEST_CREDENTIALS } from './test-constants';
import { app } from './index';

/**
 * Helper function to create a test user and get authentication token
 *
 * This utility creates a user using predefined test credentials and returns
 * a valid JWT token for authentication in tests. It uses the actual application
 * endpoints to ensure realistic token generation.
 *
 * @note This function should be used in tests that require a valid authenticated
 * user but don't need specific user customization. For customized users, use
 * the fixtures from test-fixtures.ts instead.
 *
 * @returns Promise<string> JWT authentication token for the test user
 *
 * @throws {Error} If user registration or login fails
 *
 * @example
 * ```typescript
 * const token = await getAuthToken();
 * const response = await app.handle(
 *   new Request('http://localhost/api/projects', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   })
 * );
 * ```
 */
export async function getAuthToken(): Promise<string> {
  await app.handle(
    new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      }),
    })
  );

  const loginRes = await app.handle(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_CREDENTIALS.EMAIL,
        password: TEST_CREDENTIALS.PASSWORD,
      }),
    })
  );

  const { token } = (await loginRes.json()) as { token: string };
  return token;
}
