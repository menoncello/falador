# Performance Testing with k6

This directory contains performance tests for the authentication endpoints using k6.

## Prerequisites

1. **k6 installed**: `brew install k6`
2. **API Gateway running**: `cd packages/api-gateway && bun run dev`
3. **Environment**: Tests require test environment for cleanup endpoints

## Available Tests

### 1. Auth Smoke Test (`auth-smoke-test.js`)

Quick performance validation test with:

- **Duration**: ~4 minutes
- **Users**: Up to 10 concurrent users
- **Endpoints**: `/api/auth/login`, `/api/auth/me`
- **Purpose**: Quick performance check and baseline establishment

### 2. Auth Load Test (`auth-load-test.js`)

Comprehensive load testing with:

- **Duration**: ~23 minutes
- **Users**: Up to 100 concurrent users
- **Endpoints**: `/api/auth/login`, `/api/auth/me`, `/api/auth/api-keys`
- **Purpose**: Stress testing and performance scaling analysis

## Running Tests

### Smoke Test (Recommended for Development)

```bash
bun run test:performance:smoke
```

### Full Load Test (Release Validation)

```bash
bun run test:performance
```

### Baseline Establishment

```bash
bun run test:performance:baseline
```

Creates `performance-baseline.json` with metrics for comparison.

## Performance Thresholds

Both tests enforce these performance requirements:

- **p95 Response Time**: < 500ms (95th percentile)
- **Error Rate**: < 10%
- **HTTP Failure Rate**: < 10%

## Test Flow

1. **Setup**: Clean up test data and register test users
2. **Load Generation**: Simulate concurrent users performing:
   - User authentication (login)
   - User profile retrieval (`/me`)
   - API key creation (load test only)
3. **Teardown**: Clean up test data

## Key Metrics

- **Response Time**: How long requests take
- **Request Rate**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Concurrent Users**: Number of simulated users

## Output Interpretation

### Success Criteria

- All thresholds pass (green)
- p95 response time < 500ms
- Error rates < 10%

### Failure Indicators

- Red thresholds indicate performance issues
- High error rates suggest system instability
- Slow response times indicate bottlenecks

## Troubleshooting

### API Gateway Not Running

```bash
cd packages/api-gateway && bun run dev
```

### Port Already in Use

Ensure port 3000 is available or update `BASE_URL` in test files.

### Cleanup Issues

Tests use `/api/auth/test/cleanup` (test environment only) to manage data.

## Integration with CI/CD

Add to quality gates:

```bash
"quality-gates": "bun run typecheck && bun run lint && bun run format:check && bun test && bun run test:performance:smoke && bun run test:mutate"
```

## Customization

### Adjust Target URL

```javascript
const BASE_URL = 'http://localhost:3000'; // Update as needed
```

### Modify Load Patterns

Edit `stages` in `options` to change user ramp-up and duration.

### Update Thresholds

Modify `thresholds` in `options` to adjust performance requirements.
