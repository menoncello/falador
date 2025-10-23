import { TEST_CREDENTIALS } from './test-constants';
import { app } from './index';

/**
 * Helper function to create a test user and get auth token
 * @returns JWT authentication token
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
