# Technical Specification: Epic 7 - AI Direction & Genre Optimization

**Epic:** 7
**Title:** AI Direction & Genre Optimization
**Target Stories:** 10-12 stories
**Dependencies:** Epic 1-3 (TTS, processing, voice cloning)

---

## Overview

Implement intelligent narration that analyzes text content and applies genre-appropriate tone, pacing, and emotional expression. This achieves the PRD's 4.5/5 quality target through context-aware TTS generation.

### Quality Target

- **Current (without AI direction):** 3.5/5 (baseline TTS)
- **Target (with AI direction):** 4.5/5 (human-like narration)

### Differentiators

- Genre-specific narration styles (fiction vs technical vs poetry)
- Dialogue vs narration voice differentiation
- Emotional context awareness
- Pacing optimization per content type
- Character voice consistency

---

## Architecture

### AI Pipeline

```
Text Input
    ↓
┌─────────────────────────────────────┐
│   Content Analysis Pipeline          │
├─────────────────────────────────────┤
│ 1. Genre Classification              │
│ 2. Dialogue Detection                │
│ 3. Emotional Tone Analysis           │
│ 4. Character Attribution             │
│ 5. Pacing Optimization               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Direction Parameters               │
├─────────────────────────────────────┤
│ - Tone: formal/casual/dramatic       │
│ - Pace: 150-200 WPM                  │
│ - Emotion: neutral/happy/tense       │
│ - Voice: narrator/character-A/B      │
└─────────────────────────────────────┘
    ↓
TTS Generation (with SSML directives)
```

### Technology Stack

```typescript
const stack = {
  nlp: 'OpenAI GPT-4o-mini (text analysis)', // Cost-effective for classification
  sentiment: '@aws-sdk/client-comprehend', // Sentiment analysis
  dialogueDetection: 'Rule-based + ML hybrid',
  ssmlGeneration: 'Custom SSML builder',
  cache: 'Redis (analysis results)',
  testing: 'A/B testing framework',
};
```

---

## Implementation

### Phase 1: Genre Classification (Stories 7.1-7.2)

**Story 7.1: Genre Classifier**

```typescript
// domain/services/genre-classifier.service.ts
export class GenreClassifier {
  private genreProfiles: Record<Genre, GenreProfile> = {
    fiction: {
      tone: 'dramatic',
      pacing: 160, // WPM
      emotionalRange: 'wide',
      dialogueEmphasis: true,
    },
    nonFiction: {
      tone: 'formal',
      pacing: 170,
      emotionalRange: 'narrow',
      dialogueEmphasis: false,
    },
    technical: {
      tone: 'neutral',
      pacing: 150,
      emotionalRange: 'minimal',
      dialogueEmphasis: false,
    },
    poetry: {
      tone: 'expressive',
      pacing: 120,
      emotionalRange: 'wide',
      dialogueEmphasis: false,
    },
  };

  async classify(text: string): Promise<Genre> {
    // Use OpenAI for initial classification
    const prompt = `Classify the following text into one of these genres: fiction, nonFiction, technical, poetry.

Text:
${text.substring(0, 2000)}

Respond with only the genre name.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const genre = response.choices[0].message.content.trim() as Genre;

    // Validate response
    if (!this.genreProfiles[genre]) {
      return 'nonFiction'; // Default fallback
    }

    return genre;
  }

  getProfile(genre: Genre): GenreProfile {
    return this.genreProfiles[genre];
  }
}
```

**Story 7.2: User Genre Override**

- Manual genre selection
- Sub-genre customization (thriller, romance, biography)
- Genre profile editing (advanced users)

### Phase 2: Dialogue Detection (Stories 7.3-7.4)

**Story 7.3: Dialogue Detector**

```typescript
// domain/services/dialogue-detector.service.ts
export class DialogueDetector {
  private patterns = [
    /[""](.+?)[""]/, // Direct quotes
    /[''](.+?)['']/, // Single quotes
    /—\s*(.+?)$/, // Em dash dialogue (common in Portuguese)
    /^—\s*(.+?)/, // Dialogue at line start
  ];

  detect(text: string): DialogueSegment[] {
    const segments: DialogueSegment[] = [];
    const lines = text.split('\n');

    let currentCharacter: string | null = null;

    for (const line of lines) {
      // Detect attribution (e.g., "disse Maria")
      const attribution = this.detectAttribution(line);
      if (attribution) {
        currentCharacter = attribution.character;
      }

      // Detect dialogue
      for (const pattern of this.patterns) {
        const match = line.match(pattern);
        if (match) {
          segments.push({
            text: match[1],
            character: currentCharacter || 'unknown',
            isDialogue: true,
            startIndex: match.index!,
            endIndex: match.index! + match[0].length,
          });
        }
      }
    }

    return segments;
  }

  private detectAttribution(line: string): { character: string } | null {
    // Common Portuguese attribution patterns
    const patterns = [
      /disse\s+(\w+)/i, // "disse Maria"
      /perguntou\s+(\w+)/i, // "perguntou João"
      /respondeu\s+(\w+)/i,
      /—\s*(\w+)\s+(disse|perguntou)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return { character: match[1] };
      }
    }

    return null;
  }
}
```

**Story 7.4: Character Voice Mapping**

- Assign voices to detected characters
- Voice consistency across chapters
- Character voice gallery (voice selection per character)

### Phase 3: Emotional Tone Analysis (Stories 7.5-7.6)

**Story 7.5: Sentiment Analyzer**

```typescript
// infrastructure/adapters/sentiment-analyzer.adapter.ts
import {
  ComprehendClient,
  DetectSentimentCommand,
} from '@aws-sdk/client-comprehend';

export class SentimentAnalyzer {
  private client = new ComprehendClient({ region: 'us-east-1' });

  async analyze(text: string): Promise<EmotionalTone> {
    // AWS Comprehend supports Portuguese
    const command = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'pt',
    });

    const response = await this.client.send(command);

    return this.mapSentimentToTone(response.Sentiment, response.SentimentScore);
  }

  private mapSentimentToTone(
    sentiment: string,
    scores: SentimentScore
  ): EmotionalTone {
    // Map AWS sentiment to narration tone
    const toneMap: Record<string, EmotionalTone> = {
      POSITIVE: { emotion: 'happy', intensity: scores.Positive * 10 },
      NEGATIVE: { emotion: 'sad', intensity: scores.Negative * 10 },
      NEUTRAL: { emotion: 'neutral', intensity: 5 },
      MIXED: { emotion: 'complex', intensity: 5 },
    };

    return toneMap[sentiment] || { emotion: 'neutral', intensity: 5 };
  }
}
```

**Story 7.6: Emotion-Driven SSML Generation**

```typescript
// domain/services/ssml-generator.service.ts
export class SSMLGenerator {
  generate(text: string, context: NarrationContext): string {
    let ssml = '<speak>';

    // Apply genre-specific prosody
    ssml += this.applyGenreProsody(text, context.genre);

    // Apply emotional tone
    if (context.emotion.emotion !== 'neutral') {
      ssml += this.applyEmotionalTone(text, context.emotion);
    }

    // Apply dialogue emphasis
    if (context.isDialogue) {
      ssml += this.applyDialogueEmphasis(text, context.character);
    }

    ssml += '</speak>';

    return ssml;
  }

  private applyGenreProsody(text: string, genre: Genre): string {
    const profile = this.genreProfiles[genre];

    return `<prosody rate="${this.calculateRate(profile.pacing)}" pitch="${profile.pitch || 'medium'}">
      ${text}
    </prosody>`;
  }

  private applyEmotionalTone(text: string, emotion: EmotionalTone): string {
    // Adjust prosody based on emotion
    const emotionMap: Record<string, { pitch: string; rate: string }> = {
      happy: { pitch: '+10%', rate: '105%' },
      sad: { pitch: '-10%', rate: '90%' },
      tense: { pitch: '+5%', rate: '110%' },
      calm: { pitch: 'medium', rate: '95%' },
    };

    const prosody = emotionMap[emotion.emotion] || {
      pitch: 'medium',
      rate: '100%',
    };

    return `<prosody pitch="${prosody.pitch}" rate="${prosody.rate}">
      ${text}
    </prosody>`;
  }

  private applyDialogueEmphasis(text: string, character: string): string {
    // Add emphasis to dialogue
    return `<emphasis level="moderate">${text}</emphasis>`;
  }

  private calculateRate(wpm: number): string {
    // Convert WPM to prosody rate percentage
    const baseWPM = 160; // Average narration speed
    const percentage = (wpm / baseWPM) * 100;
    return `${percentage}%`;
  }
}
```

### Phase 4: Pacing Optimization (Stories 7.7-7.8)

**Story 7.7: Dynamic Pacing Algorithm**

```typescript
// domain/services/pacing-optimizer.service.ts
export class PacingOptimizer {
  optimize(chapter: Chapter, context: NarrationContext): PacingProfile {
    const segments = this.segmentChapter(chapter);

    const pacingProfile: PacingProfile = {
      segments: segments.map((segment) => {
        const baseWPM = context.genreProfile.pacing;
        const adjustedWPM = this.calculateOptimalPacing(segment, baseWPM);

        return {
          text: segment.text,
          wpm: adjustedWPM,
          pauseAfter: this.calculatePause(segment),
        };
      }),
    };

    return pacingProfile;
  }

  private calculateOptimalPacing(
    segment: TextSegment,
    baseWPM: number
  ): number {
    // Adjust pacing based on content type
    if (segment.type === 'action') {
      return baseWPM * 1.15; // 15% faster for action
    }

    if (segment.type === 'description') {
      return baseWPM * 0.95; // 5% slower for description
    }

    if (segment.type === 'dialogue') {
      return baseWPM * 1.05; // 5% faster for dialogue
    }

    return baseWPM;
  }

  private calculatePause(segment: TextSegment): number {
    // Pause duration in milliseconds
    if (segment.endsWithParagraph) {
      return 800; // Longer pause at paragraph end
    }

    if (segment.endsWithSentence) {
      return 400; // Medium pause at sentence end
    }

    return 200; // Short pause at clause
  }
}
```

**Story 7.8: Pause Insertion**

- Natural pauses at punctuation
- Longer pauses between paragraphs
- No pause mid-word or mid-phrase

### Phase 5: A/B Testing & Tuning (Stories 7.9-7.10)

**Story 7.9: Direction A/B Testing Framework**

```typescript
// application/services/ab-testing.service.ts
export class ABTestingService {
  async createTest(
    projectId: string,
    variants: DirectionVariant[]
  ): Promise<ABTest> {
    const test: ABTest = {
      id: randomUUID(),
      projectId,
      variants: variants.map((variant, index) => ({
        id: `variant-${index}`,
        name: variant.name,
        directionSettings: variant.settings,
        audioSampleUrl: null, // Generated later
      })),
      status: 'draft',
      createdAt: new Date(),
    };

    // Generate audio samples for each variant
    for (const variant of test.variants) {
      const audioUrl = await this.generateVariantSample(
        projectId,
        variant.directionSettings
      );
      variant.audioSampleUrl = audioUrl;
    }

    return test;
  }

  async recordVote(
    testId: string,
    variantId: string,
    userId: string
  ): Promise<void> {
    await this.voteRepository.save({
      testId,
      variantId,
      userId,
      votedAt: new Date(),
    });
  }

  async getWinner(testId: string): Promise<DirectionVariant> {
    const votes = await this.voteRepository.findByTestId(testId);

    const voteCounts = votes.reduce(
      (acc, vote) => {
        acc[vote.variantId] = (acc[vote.variantId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const winnerId = Object.entries(voteCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    const test = await this.testRepository.findById(testId);
    return test.variants.find((v) => v.id === winnerId)!;
  }
}
```

**Story 7.10: Quality Metrics Dashboard**

- Compare AI-directed vs baseline quality scores
- User ratings per chapter
- Emotional accuracy metrics
- Pacing satisfaction scores

### Phase 6: Integration (Stories 7.11-7.12)

**Story 7.11: End-to-End AI Direction Pipeline**

```typescript
// application/use-cases/generate-with-ai-direction.use-case.ts
export class GenerateWithAIDirectionUseCase {
  async execute(chapterId: string): Promise<AudioFile> {
    const chapter = await this.chapterRepository.findById(chapterId);
    const project = await this.projectRepository.findById(chapter.projectId);

    // 1. Classify genre
    const genre = await this.genreClassifier.classify(chapter.content);

    // 2. Detect dialogue
    const dialogueSegments = await this.dialogueDetector.detect(
      chapter.content
    );

    // 3. Analyze emotional tone
    const emotions = await this.sentimentAnalyzer.analyze(chapter.content);

    // 4. Optimize pacing
    const pacingProfile = await this.pacingOptimizer.optimize(chapter, {
      genre,
      genreProfile: this.genreClassifier.getProfile(genre),
    });

    // 5. Generate SSML
    const ssml = await this.ssmlGenerator.generate(chapter.content, {
      genre,
      emotion: emotions,
      dialogueSegments,
      pacingProfile,
    });

    // 6. Generate audio with TTS engine
    const audioBuffer = await this.ttsEngine.generateFromSSML(ssml, {
      voiceId: project.voiceId,
    });

    // 7. Save audio file
    return await this.audioFileRepository.save({
      chapterId,
      audioBuffer,
      metadata: {
        genre,
        aiDirected: true,
        dialogueCount: dialogueSegments.length,
        averageWPM: pacingProfile.averageWPM,
      },
    });
  }
}
```

**Story 7.12: Direction Settings UI**

- Enable/disable AI direction toggle
- Genre override selector
- Emotion intensity slider
- Pacing adjustment (global multiplier)
- Preview with/without AI direction

---

## Technical Decisions (ADRs)

### ADR-024: AI Model Selection

**Decision:** GPT-4o-mini for text analysis, AWS Comprehend for sentiment

**Rationale:**

- GPT-4o-mini: Cost-effective ($0.15/1M tokens), excellent for classification
- AWS Comprehend: Native Portuguese support, real-time sentiment analysis
- Hybrid approach balances cost and accuracy

**Cost Estimate:** ~$0.02 per 100k words analyzed

### ADR-025: SSML vs Raw Text

**Decision:** Generate SSML for AI-directed narration

**Rationale:**

- SSML provides fine-grained prosody control
- TTS engines interpret SSML more accurately
- Enables emotion, pacing, pitch adjustments

**Fallback:** If TTS doesn't support SSML, use parameter-based approach

### ADR-026: Caching Strategy

**Decision:** Cache genre/dialogue/sentiment analysis results

**Rationale:**

- Analysis is deterministic (same text = same result)
- Reduces AI API costs on regeneration
- Cache key: `sha256(chapter.content)`

**TTL:** 30 days, invalidate on chapter edit

---

## Database Migrations

```sql
-- AI direction metadata
ALTER TABLE audio_files
ADD COLUMN direction_metadata JSONB DEFAULT '{}';

-- A/B tests
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  variants JSONB NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test votes
CREATE TABLE ab_test_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  voted_at TIMESTAMP DEFAULT NOW()
);
```

---

## Performance & Cost

### Cost Estimation

| Component                           | Cost per 100k words       |
| ----------------------------------- | ------------------------- |
| Genre classification (GPT-4o-mini)  | $0.005                    |
| Sentiment analysis (AWS Comprehend) | $0.01                     |
| Dialogue detection (rule-based)     | $0 (compute)              |
| **Total**                           | **$0.015 per 100k words** |

### Performance Targets

- Genre classification: <2s per chapter
- Dialogue detection: <1s per chapter
- Sentiment analysis: <3s per chapter
- SSML generation: <500ms per chapter

---

## Testing Strategy

- Unit tests: Genre classifier, dialogue detector, SSML generator
- Integration tests: End-to-end AI direction pipeline
- Quality tests: A/B comparison (baseline vs AI-directed)
- User acceptance: Minimum 4.2/5 rating on AI-directed audio

---

**Implementation Note:** This tech spec provides the foundation for Epic 7 story creation during Phase 4 implementation.
