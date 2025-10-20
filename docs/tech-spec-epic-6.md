# Technical Specification: Epic 6 - API & Webhook Integration

**Epic:** 6
**Title:** API & Webhook Integration
**Target Stories:** 10-12 stories
**Dependencies:** Epic 1-5 (all core features)

---

## Overview

Build comprehensive REST API with OAuth 2.0 authentication, webhooks, SDKs (TypeScript, Python), and developer documentation. Enable third-party integrations and programmatic access.

---

## Architecture

### API Design Principles

- REST level 3 (HATEOAS)
- Versioned endpoints (/api/v1)
- JSON:API specification compliance
- OAuth 2.0 + API keys
- Rate limiting (tier-based)
- Webhook event delivery guarantees

### Technology Stack

```typescript
const stack = {
  authentication: 'OAuth 2.0 (authorization code + device flow)',
  apiKeys: 'Bearer tokens (sha256 hashed)',
  rateLimiting: 'Redis + sliding window algorithm',
  webhooks: 'BullMQ + exponential backoff retry',
  documentation: 'OpenAPI 3.1 + Redocly',
  sdks: ['TypeScript (generated)', 'Python (generated)'],
  apiGateway: 'Elysia middleware chain',
};
```

---

## API Routes

### Core Resources

```typescript
// Projects
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id

// Audio Generation
POST   /api/v1/projects/:id/generate
GET    /api/v1/projects/:id/jobs
GET    /api/v1/jobs/:id
POST   /api/v1/jobs/:id/cancel

// Voices
GET    /api/v1/voices
POST   /api/v1/voices
GET    /api/v1/voices/:id
PATCH  /api/v1/voices/:id
DELETE /api/v1/voices/:id
POST   /api/v1/voices/:id/preview

// Webhooks
GET    /api/v1/webhooks
POST   /api/v1/webhooks
GET    /api/v1/webhooks/:id
PATCH  /api/v1/webhooks/:id
DELETE /api/v1/webhooks/:id
POST   /api/v1/webhooks/:id/test

// API Keys
GET    /api/v1/api-keys
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

### Response Format (JSON:API)

```json
{
  "data": {
    "id": "uuid",
    "type": "project",
    "attributes": {
      "name": "My Audiobook",
      "status": "processing",
      "progress": 45
    },
    "relationships": {
      "voice": {
        "data": { "id": "voice-uuid", "type": "voice" }
      }
    },
    "links": {
      "self": "/api/v1/projects/uuid"
    }
  },
  "included": [
    {
      "id": "voice-uuid",
      "type": "voice",
      "attributes": { "name": "Custom Voice" }
    }
  ]
}
```

---

## Authentication

### OAuth 2.0 Flows

**Authorization Code Flow (Web Apps)**

```
1. Client redirects to /oauth/authorize
2. User logs in and grants permission
3. Redirect back with authorization code
4. Client exchanges code for access token
5. Access token used for API requests
```

**Device Flow (CLI)**

```
1. CLI requests device code
2. User visits URL and enters code
3. CLI polls for access token
4. Token granted after user approval
```

### API Keys

```typescript
// API Key format
const apiKey = 'fal_live_' + base64(sha256(randomBytes(32)));

// Usage
curl -H "Authorization: Bearer fal_live_abc123..." https://api.falador.com/v1/projects
```

### Rate Limiting

```typescript
interface RateLimitTier {
  free: { requests: 100, window: '1h' };
  pro: { requests: 1000, window: '1h' };
  enterprise: { requests: 10000, window: '1h' };
}

// Response headers
'X-RateLimit-Limit': '1000',
'X-RateLimit-Remaining': '950',
'X-RateLimit-Reset': '1677649200',
```

---

## Webhooks

### Event Types

```typescript
type WebhookEvent =
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'job.started'
  | 'job.progress'
  | 'job.completed'
  | 'job.failed'
  | 'voice.trained'
  | 'voice.failed'
  | 'audio.generated';
```

### Webhook Payload

```json
{
  "id": "evt_1234",
  "type": "job.completed",
  "created_at": "2025-10-17T10:00:00Z",
  "data": {
    "job_id": "job-uuid",
    "project_id": "project-uuid",
    "status": "completed",
    "audio_files": [
      {
        "chapter_id": "ch1",
        "url": "https://storage.googleapis.com/...",
        "duration": 1234
      }
    ]
  }
}
```

### Delivery Guarantees

- Retry policy: Exponential backoff (1s, 2s, 4s, 8s, 16s, 32s)
- Max retries: 5
- Timeout: 10 seconds per attempt
- Signature verification (HMAC-SHA256)

```typescript
// Webhook signature verification
const signature = hmac('sha256', webhookSecret, payload);
const expectedSignature = request.headers['X-Webhook-Signature'];

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

---

## SDKs

### TypeScript SDK

```typescript
// Auto-generated from OpenAPI spec
import { FaladorClient } from '@falador/sdk';

const client = new FaladorClient({
  apiKey: process.env.FALADOR_API_KEY,
});

// Create project
const project = await client.projects.create({
  name: 'My Audiobook',
  file: fs.createReadStream('book.epub'),
  voiceId: 'default-pt-br',
});

// Generate audio
const job = await client.projects.generate(project.id);

// Poll for completion
const result = await client.jobs.waitForCompletion(job.id, {
  onProgress: (progress) => console.log(`Progress: ${progress}%`),
});

// Download audio
await client.audio.download(result.audioFiles[0].url, 'output.mp3');
```

### Python SDK

```python
from falador import FaladorClient

client = FaladorClient(api_key=os.environ['FALADOR_API_KEY'])

# Create project
project = client.projects.create(
    name='My Audiobook',
    file=open('book.epub', 'rb'),
    voice_id='default-pt-br'
)

# Generate audio
job = client.projects.generate(project.id)

# Wait for completion
result = client.jobs.wait_for_completion(
    job.id,
    on_progress=lambda p: print(f'Progress: {p}%')
)

# Download audio
client.audio.download(result.audio_files[0].url, 'output.mp3')
```

---

## Implementation

### Phase 1: API Foundation (Stories 6.1-6.3)

**Story 6.1: OpenAPI Specification**

- Define complete API spec (OpenAPI 3.1)
- Request/response schemas
- Error codes and messages
- Example requests/responses

**Story 6.2: API Versioning Strategy**

- URL versioning (/api/v1)
- Version deprecation policy (6-month notice)
- Breaking vs non-breaking changes

**Story 6.3: API Documentation**

- Redocly documentation portal
- Interactive API explorer
- Code examples in multiple languages

### Phase 2: Authentication (Stories 6.4-6.5)

**Story 6.4: OAuth 2.0 Implementation**

```typescript
// infrastructure/auth/oauth.service.ts
export class OAuthService {
  async generateAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scope: string[]
  ): Promise<string> {
    const state = randomBytes(32).toString('hex');
    const codeChallenge = this.generatePKCEChallenge();

    return (
      `https://falador.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope.join(' ')}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`
    );
  }

  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<AccessToken> {
    // Verify code challenge
    // Issue access token + refresh token
    // Store in database
  }
}
```

**Story 6.5: API Key Management**

- Generate API keys
- Rotate keys
- Revoke keys
- Key metadata (last used, creation date)

### Phase 3: Rate Limiting (Stories 6.6)

**Story 6.6: Rate Limiter Implementation**

```typescript
// infrastructure/middleware/rate-limiter.middleware.ts
export class RateLimiterMiddleware {
  constructor(@inject('RedisClient') private redis: RedisClient) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = `rate_limit:${req.user.id}:${Date.now() / 60000}`;
    const limit = this.getTierLimit(req.user.tier);

    const current = await this.redis.incr(key);
    await this.redis.expire(key, 60);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 60000) * 60);

    if (current > limit) {
      throw new RateLimitExceededError();
    }

    next();
  }
}
```

### Phase 4: Webhooks (Stories 6.7-6.9)

**Story 6.7: Webhook Subscription Management**

**Story 6.8: Webhook Delivery System**

```typescript
// infrastructure/services/webhook-delivery.service.ts
export class WebhookDeliveryService {
  async deliver(event: WebhookEvent): Promise<void> {
    const subscriptions = await this.getSubscriptionsForEvent(event.type);

    for (const subscription of subscriptions) {
      await this.queue.add('webhook-delivery', {
        subscriptionId: subscription.id,
        event,
        attempt: 1,
      });
    }
  }
}

// workers/webhook-delivery.worker.ts
export class WebhookDeliveryWorker {
  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    const { subscriptionId, event, attempt } = job.data;
    const subscription =
      await this.subscriptionRepository.findById(subscriptionId);

    const signature = this.generateSignature(event, subscription.secret);

    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok && attempt < 5) {
        // Retry with exponential backoff
        throw new Error(`Webhook delivery failed: ${response.status}`);
      }
    } catch (error) {
      if (attempt < 5) {
        const delay = Math.pow(2, attempt) * 1000; // 2^attempt seconds
        await job.retry({ delay });
      } else {
        await this.markAsFailed(subscriptionId, event);
      }
    }
  }
}
```

**Story 6.9: Webhook Testing Tools**

- Test webhook endpoint (send sample event)
- Webhook logs (delivery history, retries)
- Signature verification helper

### Phase 5: SDKs (Stories 6.10-6.12)

**Story 6.10: SDK Code Generation**

- OpenAPI Generator integration
- TypeScript SDK generation
- Python SDK generation

**Story 6.11: SDK Publishing**

- npm package (@falador/sdk)
- PyPI package (falador)
- Version alignment with API

**Story 6.12: SDK Examples & Documentation**

- Example projects
- Integration guides
- Best practices

---

## API Documentation Portal

### Redocly Setup

```yaml
# redocly.yaml
apis:
  falador:
    root: ./openapi.yaml

theme:
  colors:
    primary:
      main: '#00a8a8'

nav:
  - page: docs/getting-started.md
  - page: docs/authentication.md
  - page: docs/rate-limits.md
  - page: docs/webhooks.md
  - page: docs/sdks.md
```

### Developer Portal Features

- Interactive API explorer
- Code snippets (auto-generated)
- Postman collection download
- Changelog
- API status page

---

## Technical Decisions (ADRs)

### ADR-021: API Authentication Strategy

**Decision:** OAuth 2.0 for web apps, API keys for servers/CLI

**Rationale:**

- OAuth standard for user-delegated access
- API keys simpler for server-to-server
- Device flow enables CLI authentication

### ADR-022: Webhook Delivery

**Decision:** BullMQ queue + exponential backoff

**Rationale:**

- Reliable delivery with retries
- Prevents blocking main application
- Exponential backoff prevents overwhelming failing endpoints

### ADR-023: SDK Generation Strategy

**Decision:** Auto-generate from OpenAPI spec

**Rationale:**

- Consistency between API and SDKs
- Automatic version synchronization
- Reduced maintenance burden

**Tools:** OpenAPI Generator, custom templates for ergonomics

---

## Database Migrations

```sql
-- OAuth clients
CREATE TABLE oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_secret_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  redirect_uris TEXT[] NOT NULL,
  scopes TEXT[] NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Webhook subscriptions
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  attempts INTEGER DEFAULT 1,
  response_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing Strategy

- API integration tests (all endpoints)
- OAuth flow testing
- Rate limiting tests
- Webhook delivery tests (retry logic)
- SDK tests (TypeScript, Python)

---

**Implementation Note:** This tech spec provides the foundation for Epic 6 story creation during Phase 4 implementation.
