# Technical Specification: Epic 5 - Quality Tools & Pronunciation Editor

**Epic:** 5
**Title:** Quality Tools & Pronunciation Editor
**Target Stories:** 8-10 stories
**Dependencies:** Epic 1 (TTS), Epic 2 (chapters), Epic 3 (voices), Epic 4 (web UI)

---

## Overview

Provide interactive tools for quality review, pronunciation correction, and selective chapter regeneration. This ensures professional-grade output (4.5/5 quality target from PRD) through iterative refinement workflows.

### Quality Challenges

- Portuguese pronunciation variations (Brazilian vs European, regional accents)
- Technical terms, proper nouns, brand names
- Abbreviations and acronyms
- Numbers and dates (contextual reading)
- Homographs (same spelling, different pronunciation: "economia" as noun vs verb)

---

## Architecture Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Quality System                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Quality    │─────▶│ Pronunciation│─────▶│ Chapter   │ │
│  │   Scorer     │      │  Dictionary  │      │Regenerator│ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                     │       │
│         ▼                      ▼                     ▼       │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Quality    │      │  Phonetic    │      │   Diff    │ │
│  │   Report     │      │   Editor     │      │  Tracker  │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
   Analytics DB            PostgreSQL             Audit Logs
```

### Data Model

```typescript
interface PronunciationEntry {
  id: string; // UUID
  userId: string; // Owner (null for global dictionary)
  projectId: string | null; // Project-specific or global
  word: string; // Original word
  pronunciation: string; // Phonetic spelling or SSML
  language: string; // 'pt-BR'
  type: 'global' | 'project' | 'user'; // Scope
  context: string | null; // Usage context hint
  frequency: number; // Usage count
  metadata: {
    createdBy: 'user' | 'suggestion_engine';
    verifiedBy: string | null; // User ID who verified
    verifiedAt: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface QualityScore {
  id: string;
  audioFileId: string; // References audio_files.id
  overallScore: number; // 0-100
  metrics: {
    pronunciation: number; // 0-100
    naturalness: number; // 0-100
    pacing: number; // 0-100
    clarity: number; // 0-100
    emotionalTone: number; // 0-100
  };
  issues: Array<{
    type: 'mispronunciation' | 'unnatural_pause' | 'speed' | 'clarity';
    timestamp: number; // seconds into audio
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string | null;
  }>;
  analyzedAt: Date;
  analyzerVersion: string; // '1.0.0'
}

interface RegenerationJob {
  id: string;
  projectId: string;
  userId: string;
  chapterIds: string[]; // Chapters to regenerate
  reason: 'pronunciation' | 'quality' | 'settings' | 'voice';
  changes: {
    pronunciationUpdates: string[]; // Entry IDs
    settingsChanges: Record<string, any>;
    voiceChange: string | null;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  createdAt: Date;
  completedAt: Date | null;
}
```

---

## Implementation Approach

### Phase 1: Quality Scoring (Stories 5.1-5.2)

**Story 5.1: Audio Quality Analyzer**

Implement automated quality scoring algorithm analyzing generated audio files.

```typescript
// application/use-cases/analyze-audio-quality.use-case.ts
export class AnalyzeAudioQualityUseCase {
  constructor(
    @inject('AudioAnalyzer') private analyzer: AudioAnalyzer,
    @inject('QualityScoreRepository') private repository: QualityScoreRepository,
    @inject('Logger') private logger: Logger
  ) {}

  async execute(audioFileId: string): Promise<QualityScore> {
    const audioFile = await this.getAudioFile(audioFileId);

    // Run quality analysis
    const metrics = await this.analyzer.analyze(audioFile.url);

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(metrics);

    // Detect issues
    const issues = await this.detectIssues(audioFile.url, metrics);

    const qualityScore: QualityScore = {
      id: randomUUID(),
      audioFileId,
      overallScore,
      metrics,
      issues,
      analyzedAt: new Date(),
      analyzerVersion: '1.0.0',
    };

    await this.repository.save(qualityScore);

    return qualityScore;
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      pronunciation: 0.35,
      naturalness: 0.25,
      pacing: 0.20,
      clarity: 0.15,
      emotionalTone: 0.05,
    };

    return Math.round(
      metrics.pronunciation * weights.pronunciation +
      metrics.naturalness * weights.naturalness +
      metrics.pacing * weights.pacing +
      metrics.clarity * weights.clarity +
      metrics.emotionalTone * weights.emotionalTone
    );
  }

  private async detectIssues(
    audioUrl: string,
    metrics: QualityMetrics
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Detect pronunciation issues (low pronunciation score)
    if (metrics.pronunciation < 70) {
      issues.push({
        type: 'mispronunciation',
        timestamp: 0, // TODO: Implement timestamp detection
        severity: 'high',
        description: 'Pronunciation quality below threshold',
        suggestion: 'Review pronunciation dictionary',
      });
    }

    // Detect pacing issues (very fast or very slow)
    const wordsPerMinute = await this.analyzer.calculateWPM(audioUrl);
    if (wordsPerMinute < 150 || wordsPerMinute > 200) {
      issues.push({
        type: 'speed',
        timestamp: 0,
        severity: 'medium',
        description: `Speaking rate: ${wordsPerMinute} WPM (optimal: 150-200)`,
        suggestion: 'Adjust speed settings',
      });
    }

    return issues;
  }
}
```

**Quality Metrics Calculation:**

```typescript
// infrastructure/adapters/audio-analyzer.adapter.ts
import { AudioContext } from 'web-audio-api';
import { getAudioDurationInSeconds } from 'get-audio-duration';

export class AudioAnalyzerAdapter implements AudioAnalyzer {
  async analyze(audioUrl: string): Promise<QualityMetrics> {
    // Download audio file
    const audioBuffer = await this.downloadAudio(audioUrl);

    // Calculate metrics
    const pronunciation = await this.analyzePronunciation(audioBuffer);
    const naturalness = await this.analyzeNaturalness(audioBuffer);
    const pacing = await this.analyzePacing(audioBuffer);
    const clarity = await this.analyzeClarity(audioBuffer);
    const emotionalTone = await this.analyzeEmotionalTone(audioBuffer);

    return {
      pronunciation,
      naturalness,
      pacing,
      clarity,
      emotionalTone,
    };
  }

  private async analyzePronunciation(buffer: Buffer): Promise<number> {
    // Simplified heuristic (v1.0)
    // Future: Use speech recognition to compare transcript vs source text

    // For now, use spectral analysis as proxy
    const spectralCentroid = this.calculateSpectralCentroid(buffer);

    // Portuguese typical spectral centroid: 2000-3000 Hz
    const distance = Math.abs(spectralCentroid - 2500);
    const score = Math.max(0, 100 - (distance / 10));

    return Math.round(score);
  }

  private async analyzeNaturalness(buffer: Buffer): Promise<number> {
    // Analyze prosody, intonation variance
    const pitchVariance = this.calculatePitchVariance(buffer);

    // Natural speech has moderate variance (not monotone, not extreme)
    const optimal = 50; // Hz variance
    const distance = Math.abs(pitchVariance - optimal);
    const score = Math.max(0, 100 - distance);

    return Math.round(score);
  }

  private async analyzePacing(buffer: Buffer): Promise<number> {
    const duration = await getAudioDurationInSeconds(buffer);
    const silences = await this.detectSilences(buffer);

    // Ideal: 10-15% silence (natural pauses)
    const silencePercentage = (silences.totalDuration / duration) * 100;

    if (silencePercentage >= 10 && silencePercentage <= 15) {
      return 100;
    }

    const distance = Math.abs(silencePercentage - 12.5);
    const score = Math.max(0, 100 - (distance * 5));

    return Math.round(score);
  }

  private async analyzeClarity(buffer: Buffer): Promise<number> {
    // Signal-to-noise ratio
    const snr = this.calculateSNR(buffer);

    // Good clarity: SNR > 30dB
    if (snr >= 30) return 100;
    if (snr < 10) return 0;

    return Math.round((snr / 30) * 100);
  }

  private async analyzeEmotionalTone(buffer: Buffer): Promise<number> {
    // Simplified: Check for monotone vs varied intonation
    const intonationVariance = this.calculateIntonationVariance(buffer);

    // Future: ML-based emotion detection
    return Math.min(100, Math.round(intonationVariance * 10));
  }
}
```

**Story 5.2: Quality Report Generation**

Generate human-readable quality reports with actionable insights.

```typescript
// application/use-cases/generate-quality-report.use-case.ts
export class GenerateQualityReportUseCase {
  async execute(projectId: string): Promise<QualityReport> {
    const audioFiles = await this.getProjectAudioFiles(projectId);
    const qualityScores = await this.getQualityScores(audioFiles);

    const report: QualityReport = {
      projectId,
      overallScore: this.calculateProjectScore(qualityScores),
      chapterScores: qualityScores.map((score) => ({
        chapterId: score.audioFileId,
        score: score.overallScore,
        status: this.getScoreStatus(score.overallScore),
      })),
      issues: this.aggregateIssues(qualityScores),
      recommendations: this.generateRecommendations(qualityScores),
      generatedAt: new Date(),
    };

    return report;
  }

  private getScoreStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private generateRecommendations(scores: QualityScore[]): string[] {
    const recommendations: string[] = [];

    const avgPronunciation = this.average(scores.map((s) => s.metrics.pronunciation));
    if (avgPronunciation < 70) {
      recommendations.push('Consider adding pronunciation corrections for technical terms');
    }

    const avgPacing = this.average(scores.map((s) => s.metrics.pacing));
    if (avgPacing < 70) {
      recommendations.push('Adjust speed settings (current pacing may be too fast/slow)');
    }

    return recommendations;
  }
}
```

### Phase 2: Pronunciation Dictionary (Stories 5.3-5.5)

**Story 5.3: Pronunciation Dictionary System**

```typescript
// domain/entities/pronunciation-dictionary.ts
export class PronunciationDictionary {
  private entries: Map<string, PronunciationEntry> = new Map();

  constructor(
    private readonly scope: 'global' | 'project' | 'user',
    private readonly ownerId: string
  ) {}

  addEntry(word: string, pronunciation: string, context?: string): void {
    const entry: PronunciationEntry = {
      id: randomUUID(),
      userId: this.ownerId,
      projectId: this.scope === 'project' ? this.ownerId : null,
      word: word.toLowerCase(),
      pronunciation,
      language: 'pt-BR',
      type: this.scope,
      context: context || null,
      frequency: 0,
      metadata: {
        createdBy: 'user',
        verifiedBy: null,
        verifiedAt: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.entries.set(word.toLowerCase(), entry);
  }

  lookup(word: string): PronunciationEntry | null {
    return this.entries.get(word.toLowerCase()) || null;
  }

  applyToText(text: string): string {
    let processedText = text;

    // Replace words with pronunciation entries
    for (const [word, entry] of this.entries) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processedText = processedText.replace(regex, entry.pronunciation);
    }

    return processedText;
  }
}
```

**API Endpoints:**

```typescript
// presentation/controllers/pronunciation.controller.ts
export class PronunciationController {
  @Post('/api/v1/pronunciation')
  async createEntry(@Body() dto: CreatePronunciationEntryDTO): Promise<PronunciationEntry> {
    return this.createPronunciationEntryUseCase.execute(dto);
  }

  @Get('/api/v1/pronunciation')
  async listEntries(
    @Query() filters: { projectId?: string; type?: string }
  ): Promise<PronunciationEntry[]> {
    return this.listPronunciationEntriesUseCase.execute(filters);
  }

  @Get('/api/v1/pronunciation/:id')
  async getEntry(@Param('id') id: string): Promise<PronunciationEntry> {
    return this.getPronunciationEntryUseCase.execute(id);
  }

  @Patch('/api/v1/pronunciation/:id')
  async updateEntry(
    @Param('id') id: string,
    @Body() dto: UpdatePronunciationEntryDTO
  ): Promise<PronunciationEntry> {
    return this.updatePronunciationEntryUseCase.execute(id, dto);
  }

  @Delete('/api/v1/pronunciation/:id')
  async deleteEntry(@Param('id') id: string): Promise<void> {
    return this.deletePronunciationEntryUseCase.execute(id);
  }

  @Post('/api/v1/pronunciation/import')
  async importDictionary(@Body() dto: ImportDictionaryDTO): Promise<{ imported: number }> {
    return this.importDictionaryUseCase.execute(dto);
  }

  @Get('/api/v1/pronunciation/export')
  async exportDictionary(@Query('projectId') projectId: string): Promise<Buffer> {
    const entries = await this.listPronunciationEntriesUseCase.execute({ projectId });
    return this.exportAsJSON(entries);
  }
}
```

**Story 5.4: Phonetic Editor UI**

Web interface for managing pronunciation corrections.

```tsx
// packages/web/src/components/quality/PhoneticEditor.tsx
export function PhoneticEditor({ projectId }: Props) {
  const [entries, setEntries] = useState<PronunciationEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<PronunciationEntry | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Pronunciation List */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Pronunciation Dictionary</h3>

        <Button onClick={() => setShowAddModal(true)}>
          Add Entry
        </Button>

        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedEntry(entry)}
            >
              <div>
                <p className="font-medium">{entry.word}</p>
                <p className="text-sm text-gray-500">→ {entry.pronunciation}</p>
              </div>
              <button onClick={() => deleteEntry(entry.id)}>
                <TrashIcon className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Entry Editor */}
      <div className="border rounded-lg p-4">
        {selectedEntry ? (
          <PronunciationForm
            entry={selectedEntry}
            onSave={handleSave}
            onPreview={handlePreview}
          />
        ) : (
          <p className="text-gray-500">Select an entry to edit</p>
        )}
      </div>
    </div>
  );
}

function PronunciationForm({ entry, onSave, onPreview }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: entry,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label>Word</label>
        <input {...register('word')} className="input" />
      </div>

      <div>
        <label>Pronunciation</label>
        <input {...register('pronunciation')} className="input" placeholder="e.g., KokoroTTS → koh-koh-roh tee-tee-ess" />
        <p className="text-xs text-gray-500 mt-1">
          Use phonetic spelling or SSML syntax
        </p>
      </div>

      <div>
        <label>Context (optional)</label>
        <input {...register('context')} className="input" placeholder="e.g., technical term, brand name" />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onPreview}>
          Preview Audio
        </Button>
      </div>
    </form>
  );
}
```

**Story 5.5: Pronunciation Suggestion Engine**

Automatically suggest pronunciation corrections based on common issues.

```typescript
// application/services/pronunciation-suggester.service.ts
export class PronunciationSuggester {
  private commonIssues = [
    { pattern: /\bAPI\b/gi, suggestion: 'a-pê-i', reason: 'Acronym' },
    { pattern: /\bHTML\b/gi, suggestion: 'agá-tê-eme-éle', reason: 'Acronym' },
    { pattern: /\bSQL\b/gi, suggestion: 'essee-cu-éle', reason: 'Acronym' },
    { pattern: /\bJavaScript\b/gi, suggestion: 'Java Script', reason: 'Brand name' },
    // Brazilian tech terms
    { pattern: /\bbugfix\b/gi, suggestion: 'bá-gui-fíxe', reason: 'English term' },
  ];

  async suggestCorrections(text: string): Promise<PronunciationSuggestion[]> {
    const suggestions: PronunciationSuggestion[] = [];

    for (const issue of this.commonIssues) {
      const matches = text.match(issue.pattern);
      if (matches) {
        suggestions.push({
          word: matches[0],
          suggestion: issue.suggestion,
          reason: issue.reason,
          confidence: 0.9,
        });
      }
    }

    return suggestions;
  }
}
```

### Phase 3: Chapter Regeneration (Stories 5.6-5.8)

**Story 5.6: Selective Chapter Regeneration**

```typescript
// application/use-cases/regenerate-chapters.use-case.ts
export class RegenerateChaptersUseCase {
  constructor(
    @inject('AudioGenerationService') private audioService: AudioGenerationService,
    @inject('PronunciationDictionary') private dictionary: PronunciationDictionaryService,
    @inject('JobQueue') private jobQueue: JobQueue
  ) {}

  async execute(dto: RegenerateChaptersDTO): Promise<RegenerationJob> {
    // Create regeneration job
    const job: RegenerationJob = {
      id: randomUUID(),
      projectId: dto.projectId,
      userId: dto.userId,
      chapterIds: dto.chapterIds,
      reason: dto.reason,
      changes: dto.changes,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      completedAt: null,
    };

    // Queue job
    await this.jobQueue.add('regenerate-chapters', {
      jobId: job.id,
      projectId: dto.projectId,
      chapterIds: dto.chapterIds,
      changes: dto.changes,
    });

    return job;
  }
}

// workers/regeneration.worker.ts
export class RegenerationWorker {
  async process(job: Job<RegenerationJobData>): Promise<void> {
    const { projectId, chapterIds, changes } = job.data;

    // Load pronunciation dictionary
    let dictionary = await this.dictionaryService.load(projectId);

    // Apply pronunciation updates
    if (changes.pronunciationUpdates) {
      for (const entryId of changes.pronunciationUpdates) {
        const entry = await this.pronunciationRepository.findById(entryId);
        dictionary.addEntry(entry.word, entry.pronunciation);
      }
    }

    // Regenerate each chapter
    for (let i = 0; i < chapterIds.length; i++) {
      const chapterId = chapterIds[i];

      // Update progress
      await job.updateProgress((i / chapterIds.length) * 100);

      // Get chapter text
      const chapter = await this.chapterRepository.findById(chapterId);

      // Apply pronunciation corrections
      const correctedText = dictionary.applyToText(chapter.content);

      // Generate audio
      const audioBuffer = await this.ttsEngine.generate(correctedText, {
        voiceId: changes.voiceChange || chapter.voiceId,
        ...changes.settingsChanges,
      });

      // Save new audio file (versioned)
      await this.audioFileRepository.save({
        chapterId,
        audioBuffer,
        version: chapter.audioVersion + 1,
        generatedAt: new Date(),
      });
    }

    await job.updateProgress(100);
  }
}
```

**Story 5.7: Regeneration Diff Viewer**

Show differences between old and new audio generations.

```tsx
// packages/web/src/components/quality/RegenerationDiff.tsx
export function RegenerationDiff({ chapterId }: Props) {
  const [versions, setVersions] = useState<AudioVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([0, 1]);

  return (
    <div className="space-y-4">
      <h3>Audio Version Comparison</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Version 1 */}
        <div className="border rounded p-4">
          <h4>Version {selectedVersions[0]}</h4>
          <AudioPlayer audioUrl={versions[selectedVersions[0]].url} />
          <QualityScore score={versions[selectedVersions[0]].qualityScore} />
        </div>

        {/* Version 2 */}
        <div className="border rounded p-4">
          <h4>Version {selectedVersions[1]}</h4>
          <AudioPlayer audioUrl={versions[selectedVersions[1]].url} />
          <QualityScore score={versions[selectedVersions[1]].qualityScore} />
        </div>
      </div>

      {/* Changes Summary */}
      <div className="border rounded p-4 bg-blue-50">
        <h4>Changes Applied</h4>
        <ul className="list-disc ml-4">
          {versions[selectedVersions[1]].changes.pronunciationUpdates.map((update) => (
            <li key={update}>{update.word} → {update.pronunciation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

**Story 5.8: Batch Pronunciation Correction**

Apply pronunciation corrections across multiple chapters at once.

```typescript
// CLI command
falador quality fix-pronunciation <project-id> --word "API" --pronunciation "a-pê-i" --apply-all
```

### Phase 4: Integration & Testing (Stories 5.9-5.10)

**Story 5.9: Quality Dashboard Integration**

Add quality tools to web dashboard.

**Story 5.10: Documentation & Examples**

Provide user guides for quality improvement workflows.

---

## Technical Decisions (ADRs)

### ADR-018: Quality Metrics Algorithm

**Decision:** Use signal processing heuristics (v1.0), plan ML-based approach (v2.0)

**Rationale:**
- Heuristics (SNR, spectral analysis) provide immediate value
- ML models require training data (transcripts + quality ratings)
- Collect data during v1.0 to train v2.0 models

**Migration Path:**
- Month 8: Collect quality ratings from users (thumbs up/down per chapter)
- Month 12: Train ML model on collected data
- Month 14: Deploy ML-based quality scorer

### ADR-019: Pronunciation Dictionary Format

**Decision:** Store phonetic spelling, support SSML subset

**Rationale:**
- Phonetic spelling easier for non-technical users
- SSML provides advanced control (pitch, rate, volume)
- TTS engine translates both formats

**Format Examples:**
```
Word: API
Phonetic: a-pê-i
SSML: <say-as interpret-as="characters">API</say-as>

Word: JavaScript
Phonetic: Java Script
SSML: JavaScript (space for pause)
```

### ADR-020: Regeneration Versioning

**Decision:** Keep last 3 audio versions per chapter

**Rationale:**
- Version history enables rollback
- Diff comparison shows quality improvements
- Storage cost: 3x per chapter (acceptable for 10-30 chapters)

**Cleanup:** Delete versions older than 30 days or when limit exceeded

---

## Database Migrations

```sql
-- Pronunciation dictionary
CREATE TABLE pronunciation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  pronunciation TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'pt-BR',
  type VARCHAR(20) NOT NULL CHECK (type IN ('global', 'project', 'user')),
  context TEXT,
  frequency INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pronunciation_word ON pronunciation_entries(word);
CREATE INDEX idx_pronunciation_project ON pronunciation_entries(project_id);
CREATE INDEX idx_pronunciation_user ON pronunciation_entries(user_id);

-- Quality scores
CREATE TABLE quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  metrics JSONB NOT NULL,
  issues JSONB DEFAULT '[]',
  analyzed_at TIMESTAMP DEFAULT NOW(),
  analyzer_version VARCHAR(20) NOT NULL
);

CREATE INDEX idx_quality_audio ON quality_scores(audio_file_id);

-- Regeneration jobs
CREATE TABLE regeneration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  chapter_ids UUID[] NOT NULL,
  reason VARCHAR(50) CHECK (reason IN ('pronunciation', 'quality', 'settings', 'voice')),
  changes JSONB NOT NULL,
  status VARCHAR(20) CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_regeneration_project ON regeneration_jobs(project_id);
```

---

## Testing Strategy

- Unit tests: Quality metrics calculations, pronunciation matching
- Integration tests: Complete correction → regeneration → quality improvement flow
- Manual testing: User acceptance of audio quality improvements

---

**Implementation Note:** This tech spec provides the foundation for Epic 5 story creation during Phase 4 implementation.
