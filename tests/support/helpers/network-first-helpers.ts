import { APIRequestContext, Page } from '@playwright/test';

/**
 * Network-First Pattern Helpers
 *
 * These helpers implement the intercept-before-act pattern to prevent race conditions
 * and ensure deterministic test behavior by waiting for actual network responses.
 *
 * @see testarch/knowledge/network-first.md
 */

/**
 * Create a user with network interception pattern
 * @param request - API request context
 * @param userData - User data to create
 * @returns Promise resolving to created user and response
 */
export async function createUserWithNetworkIntercept(
  request: APIRequestContext,
  userData: Record<string, any>
) {
  // Step 1: Register interception FIRST
  const userResponsePromise = request.waitForResponse(
    (resp) => resp.url().includes('/api/auth/register') && resp.status() === 200
  );

  // Step 2: THEN trigger the request
  const createResponse = await request.post('/api/auth/register', {
    data: userData,
  });

  // Step 3: THEN await the response (network-first)
  const userResponse = await userResponsePromise;

  // Step 4: Return both responses for validation
  return {
    createResponse,
    userResponse,
    user: await userResponse.json(),
  };
}

/**
 * Login with network interception pattern
 * @param request - API request context
 * @param credentials - Login credentials
 * @returns Promise resolving to login response and token
 */
export async function loginWithNetworkIntercept(
  request: APIRequestContext,
  credentials: { email: string; password: string }
) {
  // Step 1: Register interception FIRST
  const loginResponsePromise = request.waitForResponse(
    (resp) => resp.url().includes('/api/auth/login') && resp.status() === 200
  );

  // Step 2: THEN trigger the request
  const response = await request.post('/api/auth/login', {
    data: credentials,
  });

  // Step 3: THEN await the response
  const loginResponse = await loginResponsePromise;

  // Step 4: Extract token
  const body = await loginResponse.json();

  return {
    response,
    loginResponse,
    token: body.token,
  };
}

/**
 * Create API key with network interception pattern
 * @param request - API request context
 * @param token - Auth token
 * @param keyData - API key data
 * @returns Promise resolving to API key response and key
 */
export async function createApiKeyWithNetworkIntercept(
  request: APIRequestContext,
  token: string,
  keyData: Record<string, any>
) {
  // Step 1: Register interception FIRST
  const apiKeyResponsePromise = request.waitForResponse(
    (resp) => resp.url().includes('/api/auth/api-keys') && resp.status() === 201
  );

  // Step 2: THEN trigger the request
  const response = await request.post('/api/auth/api-keys', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: keyData,
  });

  // Step 3: THEN await the response
  const apiKeyResponse = await apiKeyResponsePromise;

  // Step 4: Extract API key
  const body = await apiKeyResponse.json();

  return {
    response,
    apiKeyResponse,
    apiKey: body.key,
    apiKeyId: body.id,
  };
}

/**
 * Wait for specific response with validation
 * @param request - API request context
 * @param method - HTTP method
 * @param urlPattern - URL pattern to match
 * @param expectedStatus - Expected status code
 * @param timeout - Optional timeout
 * @returns Promise resolving to response
 */
export async function waitForResponseWithValidation(
  request: APIRequestContext,
  method: string,
  urlPattern: string | RegExp,
  expectedStatus: number = 200,
  timeout: number = 10000
) {
  const responsePromise = request.waitForResponse(
    (resp) => {
      const urlMatch = typeof urlPattern === 'string'
        ? resp.url().includes(urlPattern)
        : urlPattern.test(resp.url());

      return resp.request().method() === method && urlMatch && resp.status() === expectedStatus;
    },
    { timeout }
  );

  return responsePromise;
}

/**
 * Setup network monitoring for a test
 * @param page - Playwright page (optional, for UI tests)
 * @returns Object with monitoring utilities
 */
export function setupNetworkMonitoring(page?: Page) {
  const capturedRequests: any[] = [];
  const capturedResponses: any[] = [];

  if (page) {
    // Monitor requests
    page.on('request', (request) => {
      capturedRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData(),
      });
    });

    // Monitor responses
    page.on('response', (response) => {
      capturedResponses.push({
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
      });
    });
  }

  return {
    getCapturedRequests: () => [...capturedRequests],
    getCapturedResponses: () => [...capturedResponses],
    findRequest: (pattern: string | RegExp) =>
      capturedRequests.find(req =>
        typeof pattern === 'string'
          ? req.url.includes(pattern)
          : pattern.test(req.url)
      ),
    findResponse: (pattern: string | RegExp, status?: number) =>
      capturedResponses.find(resp => {
        const urlMatch = typeof pattern === 'string'
          ? resp.url.includes(pattern)
          : pattern.test(resp.url);
        return urlMatch && (!status || resp.status === status);
      }),
    clear: () => {
      capturedRequests.length = 0;
      capturedResponses.length = 0;
    },
  };
}