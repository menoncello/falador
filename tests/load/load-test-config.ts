/**
 * Load Testing Configuration
 * Defines test scenarios and configurations for load testing the API
 */

export interface LoadTestConfig {
  name: string;
  description: string;
  duration: number; // in seconds
  users: number;
  rampUp: number; // in seconds
  target: string; // API endpoint URL
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number;
  timeout: number; // in milliseconds
}

export interface LoadTestResult {
  config: LoadTestConfig;
  startTime: Date;
  endTime: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
}

export const loadTestConfigs: LoadTestConfig[] = [
  {
    name: 'Health Check Load Test',
    description: 'Basic health check endpoint load test',
    duration: 60,
    users: 10,
    rampUp: 5,
    target: '/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
  },
  {
    name: 'Authentication Load Test',
    description: 'Login endpoint load test with valid credentials',
    duration: 120,
    users: 20,
    rampUp: 10,
    target: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      email: 'test@example.com',
      password: 'testpassword123',
    },
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    name: 'Project List Load Test',
    description: 'Projects listing endpoint load test',
    duration: 90,
    users: 15,
    rampUp: 8,
    target: '/api/projects',
    method: 'GET',
    headers: {
      Authorization: 'Bearer test-token',
    },
    expectedStatus: 200,
    timeout: 8000,
  },
  {
    name: 'Project Creation Load Test',
    description: 'Project creation endpoint load test',
    duration: 180,
    users: 5,
    rampUp: 15,
    target: '/api/projects',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    },
    body: {
      title: `Load Test Project ${Date.now()}`,
      description: 'Project created during load testing',
      language: 'pt-BR',
    },
    expectedStatus: 201,
    timeout: 15000,
  },
  {
    name: 'Concurrent Mixed Load Test',
    description: 'Mixed workload with concurrent operations',
    duration: 240,
    users: 25,
    rampUp: 20,
    target: '/health', // Will be overridden in test runner
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
  },
];

export const performanceThresholds = {
  responseTime: {
    p95: 1000, // 95th percentile should be under 1s
    p99: 2000, // 99th percentile should be under 2s
    max: 5000, // Maximum response time should be under 5s
  },
  throughput: {
    min: 10, // Minimum requests per second
    target: 50, // Target requests per second
  },
  errorRate: {
    max: 1, // Maximum error rate percentage
  },
  availability: {
    min: 99.9, // Minimum availability percentage
  },
};

export interface LoadTestSuite {
  name: string;
  description: string;
  configs: LoadTestConfig[];
  thresholds: typeof performanceThresholds;
}

export const loadTestSuite: LoadTestSuite = {
  name: 'Falador API Load Test Suite',
  description:
    'Comprehensive load testing for the Falador audiobook platform API',
  configs: loadTestConfigs,
  thresholds: performanceThresholds,
};
