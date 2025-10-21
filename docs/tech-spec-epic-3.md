# Technical Specification: Epic 3 - Voice Cloning & Custom Voices

**Epic:** 3
**Title:** Voice Cloning & Custom Voices
**Target Stories:** 12-15 stories
**Dependencies:** Epic 1 (TTS infrastructure), Epic 2 (file processing)

---

## Overview

Implement voice cloning capabilities using 30-second audio samples to create custom voices. This delivers the key competitive differentiator enabling authors to narrate with their own voices and publishers to establish brand voices.

### Technical Challenges

- Voice sample quality validation (noise, duration, clarity)
- Voice training pipeline integration with KokoroTTS or alternative models
- Voice model storage and versioning
- Multi-voice management per project
- Training time optimization (target: <5 minutes per voice)

---

## Architecture Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Voice Cloning System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │ Voice Sample │─────▶│ Voice Engine │─────▶│   Voice   │ │
│  │   Upload     │      │   Adapter    │      │  Library  │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                     │       │
│         ▼                      ▼                     ▼       │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Quality    │      │   Training   │      │   Voice   │ │
│  │  Validator   │      │   Pipeline   │      │  Metadata │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
   Cloud Storage            BullMQ Queue          PostgreSQL
```

### Data Model

```typescript
interface Voice {
  id: string; // UUID
  userId: string; // Owner
  name: string;
  description: string | null;
  sampleAudioUrl: string; // Cloud Storage path
  modelUrl: string | null; // Trained model path
  status: 'uploading' | 'validating' | 'training' | 'ready' | 'failed';
  qualityScore: number | null; // 0-100
  language: string; // 'pt-BR'
  gender: 'male' | 'female' | 'neutral' | null;
  tags: string[]; // ['narrative', 'character', 'formal']
  metadata: {
    sampleDuration: number; // seconds
    sampleQualityMetrics: {
      noiseLevel: number;
      clarity: number;
      consistency: number;
    };
    trainingDuration: number | null; // seconds
    modelVersion: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ProjectVoice {
  id: string;
  projectId: string;
  voiceId: string;
  role: 'narrator' | 'character' | 'custom'; // For multi-voice support
  characterName: string | null; // 'John Doe' for character voices
  settings: {
    pitch: number; // -1.0 to 1.0
    speed: number; // 0.5 to 2.0
    tone: number; // -1.0 to 1.0
  };
  createdAt: Date;
}
```

### Voice Engine Adapter Interface

```typescript
// domain/interfaces/voice-engine.interface.ts
export interface VoiceEngine {
  /**
   * Validates voice sample audio quality
   * @param audioPath Cloud Storage path to audio sample
   * @returns Quality metrics and validation result
   */
  validateSample(audioPath: string): Promise<{
    isValid: boolean;
    qualityScore: number;
    metrics: {
      duration: number;
      noiseLevel: number;
      clarity: number;
      consistency: number;
    };
    issues: string[]; // ['Background noise detected', 'Too short']
  }>;

  /**
   * Trains voice model from audio sample
   * @param audioPath Cloud Storage path to audio sample
   * @param options Training configuration
   * @returns Training job ID for status tracking
   */
  trainVoice(
    audioPath: string,
    options: {
      language: string;
      modelVersion: string;
    }
  ): Promise<{
    jobId: string;
    estimatedDuration: number; // seconds
  }>;

  /**
   * Checks training job status
   */
  getTrainingStatus(jobId: string): Promise<{
    status: 'queued' | 'training' | 'completed' | 'failed';
    progress: number; // 0-100
    modelUrl: string | null;
    error: string | null;
  }>;

  /**
   * Generates audio using custom voice
   */
  generateWithVoice(
    text: string,
    voiceModelUrl: string,
    settings: {
      pitch: number;
      speed: number;
      tone: number;
    }
  ): Promise<AudioBuffer>;
}
```

---

## Implementation Approach

### Phase 1: Voice Upload & Validation (Stories 3.1-3.3)

**Story 3.1: Voice Sample Upload Service**

- Cloud Storage integration (GCS signed URLs)
- File size limits: 1-10MB (30s-2min audio)
- Supported formats: MP3, WAV, M4A
- Virus scanning integration
- Upload progress tracking

**Story 3.2: Voice Quality Validator**

- Audio analysis using librosa or similar
- Quality metrics calculation:
  - Duration check (30s ± 5s)
  - Noise level detection (SNR > 20dB)
  - Clarity score (spectral analysis)
  - Consistency check (volume variance < 10dB)
- Rejection reasons with actionable feedback

**Story 3.3: Voice Preview Generator**

- Generate short preview audio (5-10s sample text)
- Preview before committing to full training
- Preview caching to avoid redundant generation

### Phase 2: Voice Training Pipeline (Stories 3.4-3.6)

**Story 3.4: Voice Training Adapter Implementation**

- Initial implementation: KokoroTTS fine-tuning
- BullMQ job queue for training jobs
- Training concurrency limits (2-3 parallel jobs)
- Training timeout: 10 minutes
- Model versioning and storage

**Story 3.5: Training Status Monitoring**

- Real-time progress tracking via WebSockets
- Training job status API endpoints
- Failure retry logic (max 2 retries)
- Training logs for debugging

**Story 3.6: Model Storage & Versioning**

- Cloud Storage bucket for trained models
- Model metadata versioning
- Model cleanup for deleted voices
- Model access control (user-scoped)

### Phase 3: Voice Library Management (Stories 3.7-3.9)

**Story 3.7: Voice CRUD API**

```typescript
// API Routes
POST   /api/v1/voices                 // Create voice (upload sample)
GET    /api/v1/voices                 // List user's voices
GET    /api/v1/voices/:id             // Get voice details
PATCH  /api/v1/voices/:id             // Update name/description/tags
DELETE /api/v1/voices/:id             // Soft delete voice
POST   /api/v1/voices/:id/preview     // Generate preview audio
GET    /api/v1/voices/:id/status      // Get training status
```

**Story 3.8: Voice Customization Controls**

- Pitch adjustment (-1.0 to 1.0, step 0.1)
- Speed adjustment (0.5x to 2.0x, step 0.1)
- Tone adjustment (-1.0 to 1.0, step 0.1)
- Settings preview before applying to full project

**Story 3.9: Voice Metadata & Tagging**

- User-defined tags for organization
- Auto-detected metadata (gender, language)
- Search and filter by tags
- Voice library gallery view

### Phase 4: Multi-Voice Support (Stories 3.10-3.12)

**Story 3.10: Project Voice Assignment**

- Assign voices to projects
- Multiple voices per project (narrator + characters)
- Voice role definition (narrator vs character)
- Character name mapping

**Story 3.11: Character Voice Detection**

- Text analysis to detect dialogue
- Character attribution logic
- Voice switching mid-chapter
- Fallback to narrator voice for unattributed dialogue

**Story 3.12: Voice Blending & Transitions**

- Smooth transitions between voices
- Cross-fade duration configuration
- Silence insertion between speakers

### Phase 5: CLI & Documentation (Stories 3.13-3.15)

**Story 3.13: CLI Voice Management Commands**

```bash
# Upload voice sample
falador voice create --name "Author Voice" --sample voice.mp3

# List voices
falador voice list

# Check training status
falador voice status <voice-id>

# Assign voice to project
falador project set-voice <project-id> --voice-id <voice-id> --role narrator

# Preview voice
falador voice preview <voice-id> --text "Sample narration text"
```

**Story 3.14: Voice Cloning Documentation**

- User guide: Recording optimal samples
- Quality requirements and tips
- Troubleshooting common issues
- Best practices for multi-voice projects

**Story 3.15: Voice Cloning Examples & Templates**

- Sample voice recordings (free tier)
- Example multi-voice configurations
- Demo projects showcasing voice cloning

---

## Technical Decisions (ADRs)

### ADR-014: Voice Training Technology

**Decision:** Start with KokoroTTS fine-tuning, abstract behind VoiceEngine interface

**Rationale:**

- KokoroTTS already integrated (Epic 1)
- Fine-tuning requires less infrastructure than training from scratch
- Interface allows future migration to specialized voice cloning services (ElevenLabs, Resemble.ai)

**Alternatives Considered:**

- ElevenLabs API (high cost, vendor lock-in)
- Coqui XTTS (complex setup, hardware requirements)

**Migration Path:** Month 12+ evaluate dedicated voice cloning service if quality/speed insufficient

### ADR-015: Voice Model Storage

**Decision:** Store trained models in Cloud Storage, metadata in PostgreSQL

**Rationale:**

- Models are 50-200MB each (too large for database)
- Cloud Storage provides versioning and lifecycle management
- PostgreSQL stores searchable metadata

**Implementation:**

- Bucket: `falador-voice-models-{env}`
- Path: `{user_id}/{voice_id}/model-v{version}.bin`
- Lifecycle: Delete models when voice deleted (30-day grace period)

### ADR-016: Voice Quality Threshold

**Decision:** Require minimum quality score of 70/100 for training

**Rationale:**

- Poor quality samples produce unusable voices
- Better to reject early than waste training resources
- Actionable feedback helps users record better samples

**Quality Metrics:**

- Duration: 30s ± 5s (weight: 20%)
- SNR: >20dB (weight: 30%)
- Clarity: Spectral analysis (weight: 30%)
- Consistency: Volume variance <10dB (weight: 20%)

### ADR-017: Training Concurrency Limits

**Decision:** Max 3 concurrent training jobs across all users

**Rationale:**

- Voice training is CPU/GPU intensive
- Prevents resource exhaustion
- Queue ensures fairness (FIFO)

**Implementation:**

- BullMQ concurrency: 3
- Queue priority: Pro users > Free users
- Estimated wait time displayed in UI

---

## Database Migrations

```sql
-- Migration: Add voices table
CREATE TABLE voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sample_audio_url TEXT NOT NULL,
  model_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'uploading',
  quality_score INTEGER,
  language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  gender VARCHAR(20),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CHECK (status IN ('uploading', 'validating', 'training', 'ready', 'failed')),
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'neutral'))
);

CREATE INDEX idx_voices_user_id ON voices(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voices_status ON voices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_voices_tags ON voices USING GIN(tags);

-- Migration: Add project_voices table (multi-voice support)
CREATE TABLE project_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  voice_id UUID NOT NULL REFERENCES voices(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'narrator',
  character_name VARCHAR(255),
  settings JSONB NOT NULL DEFAULT '{"pitch": 0, "speed": 1.0, "tone": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CHECK (role IN ('narrator', 'character', 'custom')),
  UNIQUE (project_id, voice_id, role, character_name)
);

CREATE INDEX idx_project_voices_project_id ON project_voices(project_id);
CREATE INDEX idx_project_voices_voice_id ON project_voices(voice_id);
```

---

## Testing Strategy

### Unit Tests

- Voice validation logic (quality metrics)
- Voice settings calculations (pitch/speed/tone)
- Voice model path generation
- Voice metadata extraction

### Integration Tests

- Complete voice upload → validation → training → generation flow
- Multi-voice project configuration
- Voice preview generation
- Training job queue processing

### Manual Testing Checklist

- [ ] Record 30s sample, upload, verify quality score
- [ ] Train voice with valid sample, verify model generated
- [ ] Generate audio with custom voice, verify quality
- [ ] Test voice customization (pitch/speed/tone)
- [ ] Configure multi-voice project, verify character switching
- [ ] Delete voice, verify model cleanup

---

## Performance Requirements

| Metric                     | Target     | Measurement                        |
| -------------------------- | ---------- | ---------------------------------- |
| Voice validation time      | <10s       | Time from upload to quality result |
| Voice training time        | <5 minutes | 90th percentile                    |
| Preview generation time    | <15s       | Single sentence preview            |
| Voice listing (100 voices) | <500ms     | API response time                  |
| Concurrent training jobs   | 3          | System-wide limit                  |

---

## Security Considerations

- Voice models are user-scoped (no cross-user access)
- Sample audio files scanned for malware
- Trained models stored with user-specific paths
- Voice deletion includes 30-day soft delete (recovery period)
- Rate limiting on training jobs (3 per user per day for free tier)

---

## Monitoring & Observability

```typescript
// Key metrics to track
const metrics = {
  voiceTraining: {
    jobsQueued: 'gauge',
    jobsProcessing: 'gauge',
    jobsCompleted: 'counter',
    jobsFailed: 'counter',
    trainingDuration: 'histogram', // seconds
    qualityScoreDistribution: 'histogram',
  },
  voiceGeneration: {
    generationsPerVoice: 'counter',
    customVoiceUsage: 'counter',
    defaultVoiceUsage: 'counter',
  },
  storage: {
    voiceModelsSize: 'gauge', // total GB
    sampleAudioSize: 'gauge',
  },
};
```

---

## Dependencies

**External Libraries:**

- `librosa` or `@echogarden/audio-io` (audio analysis) - npm install @echogarden/audio-io@^2.4.0
- `fluent-ffmpeg` (audio conversion) - already in solution-architecture.md
- Voice training model (KokoroTTS fine-tuning scripts)

**GCP Services:**

- Cloud Storage (voice models, samples)
- Cloud Run (training workers - GPU instances)
- BullMQ/Redis (training job queue)

---

## Future Enhancements (Post-Epic 3)

- Emotion embedding in voices (happy, sad, excited)
- Accent customization (Brazilian regions: Rio, São Paulo, Nordeste)
- Voice marketplace (share/sell custom voices)
- Voice analytics (usage statistics, quality ratings)
- Voice templates (pre-trained celebrity-style voices)

---

**Implementation Note:** Stories will be created JIT (Just In Time) during Phase 4 using the `create-story` workflow. This tech spec provides the architectural foundation and implementation guidance for story development.
