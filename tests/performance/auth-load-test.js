import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms (NFR requirement)
    http_req_failed: ['rate<0.1'], // Error rate should be less than 10%
    errors: ['rate<0.1'], // Custom error rate should be less than 10%
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data
const users = [
  { email: 'user1@example.com', name: 'User One', password: 'Password123!' },
  { email: 'user2@example.com', name: 'User Two', password: 'Password123!' },
  { email: 'user3@example.com', name: 'User Three', password: 'Password123!' },
  { email: 'user4@example.com', name: 'User Four', password: 'Password123!' },
  { email: 'user5@example.com', name: 'User Five', password: 'Password123!' },
];

export function setup() {
  // Cleanup test data before starting
  const cleanupResponse = http.post(
    `${BASE_URL}/api/auth/test/cleanup`,
    {},
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  console.log('Cleanup response:', cleanupResponse.status);

  // Register test users
  users.forEach((user) => {
    const registerResponse = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify(user),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    check(registerResponse, {
      'user registered successfully': (r) => r.status === 201,
    });
  });

  return { users };
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];

  // Test login endpoint
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'token returned': (r) => r.json('token') !== undefined,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess) {
    const token = loginResponse.json('token');

    // Test protected endpoint with authentication
    const meResponse = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const meSuccess = check(meResponse, {
      'me endpoint successful': (r) => r.status === 200,
      'user data returned': (r) => r.json('id') !== undefined,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });

    errorRate.add(!meSuccess);

    // Test API key creation
    const apiKeyResponse = http.post(
      `${BASE_URL}/api/auth/api-keys`,
      JSON.stringify({
        name: `Test API Key - ${Date.now()}`,
        scopes: ['read', 'write'],
      }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const apiKeySuccess = check(apiKeyResponse, {
      'API key created': (r) => r.status === 201,
      'API key returned': (r) => r.json('key') !== undefined,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });

    errorRate.add(!apiKeySuccess);
  }

  sleep(1); // Wait 1 second between iterations
}

export function teardown(data) {
  // Cleanup test data after test completion
  const cleanupResponse = http.post(
    `${BASE_URL}/api/auth/test/cleanup`,
    {},
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  console.log('Final cleanup response:', cleanupResponse.status);
}
