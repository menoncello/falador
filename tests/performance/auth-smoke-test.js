import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration - shorter smoke test
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Ramp up to 5 users
    { duration: '1m', target: 5 }, // Stay at 5 users
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'], // Error rate should be less than 10%
    errors: ['rate<0.1'], // Custom error rate should be less than 10%
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data
const users = [
  {
    email: 'smoke1@example.com',
    name: 'Smoke User One',
    password: 'Password123!',
  },
  {
    email: 'smoke2@example.com',
    name: 'Smoke User Two',
    password: 'Password123!',
  },
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

  console.log('Smoke test cleanup response:', cleanupResponse.status);

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
    'response time < 500ms': (r) => r.timings.duration < 500,
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
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!meSuccess);
  }

  sleep(0.5); // Wait 0.5 seconds between iterations
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

  console.log('Smoke test final cleanup response:', cleanupResponse.status);
}
