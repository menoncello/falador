# Technical Specification: Epic 9 - Distribution & Platform Integration

**Epic:** 9
**Title:** Distribution & Platform Integration
**Target Stories:** 8-10 stories
**Dependencies:** Epic 1-8 (all features complete)

---

## Overview

Enable direct export to major audiobook platforms (ACX, Audible, Spotify) with automated metadata submission and format conversion. Provide one-click distribution workflow for publishers.

### Target Platforms

1. **ACX (Audiobook Creation Exchange)** - Amazon/Audible distribution
2. **Audible Direct** - Direct Audible submission
3. **Spotify Audiobooks** - Podcast/audiobook distribution
4. **Apple Books** - iBooks audiobook store
5. **Google Play Books** - Android audiobook distribution

---

## Architecture

### Distribution Pipeline

```
Project Complete
    ↓
Format Conversion (M4B, specific platform requirements)
    ↓
Metadata Mapping (platform-specific schemas)
    ↓
Quality Validation (platform requirements)
    ↓
Platform API Integration
    ↓
Submission & Status Tracking
    ↓
Distribution Analytics
```

### Integration Strategy

```typescript
// Platform-agnostic distribution interface
export interface DistributionPlatform {
  platform: 'acx' | 'audible' | 'spotify' | 'apple' | 'google';
  connect(credentials: PlatformCredentials): Promise<void>;
  validateContent(content: AudiobookContent): Promise<ValidationResult>;
  submit(content: AudiobookContent, metadata: PlatformMetadata): Promise<SubmissionResult>;
  getStatus(submissionId: string): Promise<SubmissionStatus>;
  withdraw(submissionId: string): Promise<void>;
}
```

---

## Data Model

```typescript
interface DistributionTarget {
  id: string;
  organizationId: string;
  platform: 'acx' | 'audible' | 'spotify' | 'apple' | 'google';
  credentials: EncryptedCredentials;
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
}

interface DistributionSubmission {
  id: string;
  projectId: string;
  targetId: string; // References DistributionTarget
  platform: string;
  status: 'preparing' | 'validating' | 'submitting' | 'submitted' | 'live' | 'failed';
  metadata: PlatformMetadata;
  submissionId: string | null; // Platform-specific ID
  validationErrors: string[];
  submittedAt: Date | null;
  liveAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PlatformMetadata {
  // Common fields
  title: string;
  author: string;
  narrator: string;
  publisher: string;
  language: string;
  genre: string;
  description: string;
  coverImageUrl: string;
  isbn: string | null;
  copyright: {
    year: number;
    holder: string;
  };

  // Platform-specific fields
  acx?: {
    dealType: 'exclusive' | 'non-exclusive';
    royaltyShare: number; // 20, 40
    territories: string[]; // ['US', 'UK', 'CA']
  };

  spotify?: {
    showType: 'audiobook' | 'podcast';
    explicit: boolean;
  };

  apple?: {
    vendor: string;
    territoryRights: string[];
  };
}
```

---

## Implementation

### Phase 1: Format Conversion (Stories 9.1-9.2)

**Story 9.1: M4B Audiobook Format**

M4B (MPEG-4 Audio Book) is the standard format for most platforms.

```typescript
// application/services/audio-format-converter.service.ts
import ffmpeg from 'fluent-ffmpeg';

export class AudioFormatConverter {
  async convertToM4B(input: ConversionInput): Promise<string> {
    const outputPath = `/tmp/${input.projectId}.m4b`;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(input.audioFilePath)
        .audioCodec('aac')
        .audioBitrate('64k') // ACX requires 32-128kbps
        .audioFrequency(44100) // 44.1kHz or 22.05kHz for ACX
        .audioChannels(2) // Stereo
        .outputOptions([
          '-metadata', `title=${input.metadata.title}`,
          '-metadata', `artist=${input.metadata.narrator}`,
          '-metadata', `album=${input.metadata.title}`,
          '-metadata', `album_artist=${input.metadata.author}`,
          '-metadata', `genre=${input.metadata.genre}`,
          '-metadata', `date=${input.metadata.copyright.year}`,
          '-metadata', `copyright=${input.metadata.copyright.holder}`,
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (error) => reject(error))
        .run();
    });

    // Embed chapter markers
    if (input.chapters.length > 0) {
      await this.embedChapterMarkers(outputPath, input.chapters);
    }

    // Embed cover art
    if (input.metadata.coverImageUrl) {
      await this.embedCoverArt(outputPath, input.metadata.coverImageUrl);
    }

    return outputPath;
  }

  private async embedChapterMarkers(filePath: string, chapters: Chapter[]): Promise<void> {
    // Generate chapter metadata file (MP4Box format)
    const chapterFile = chapters
      .map((ch, i) => {
        const startTime = this.formatTime(ch.startTime);
        const endTime = this.formatTime(ch.endTime);
        return `CHAPTER${i + 1}=${startTime}\nCHAPTER${i + 1}NAME=${ch.title}`;
      })
      .join('\n');

    // Use MP4Box to inject chapters
    await exec(`MP4Box -add "${filePath}#audio" -chap "${chapterFile}" "${filePath}"`);
  }

  private async embedCoverArt(filePath: string, coverUrl: string): Promise<void> {
    // Download cover image
    const coverPath = await this.downloadImage(coverUrl);

    // Embed using ffmpeg
    await exec(`ffmpeg -i "${filePath}" -i "${coverPath}" -map 0 -map 1 -c copy -disposition:v:0 attached_pic "${filePath}.tmp"`);

    // Replace original
    await fs.rename(`${filePath}.tmp`, filePath);
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}
```

**Story 9.2: Platform-Specific Format Requirements**

```typescript
// Platform requirements
const platformRequirements: Record<string, FormatRequirements> = {
  acx: {
    format: 'm4b',
    codec: 'aac',
    bitrate: { min: 32, max: 128 }, // kbps
    sampleRate: [22050, 44100],
    channels: 2, // Stereo
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB per file
    requiresChapters: false,
    requiresCoverArt: true,
    coverArt: {
      minSize: { width: 2400, height: 2400 },
      maxSize: { width: 3000, height: 3000 },
      format: ['jpg', 'png'],
    },
  },

  spotify: {
    format: 'mp3',
    codec: 'mp3',
    bitrate: { min: 96, max: 320 },
    sampleRate: [44100, 48000],
    channels: 2,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    requiresChapters: false,
    requiresCoverArt: true,
  },

  apple: {
    format: 'm4b',
    codec: 'aac',
    bitrate: { min: 64, max: 256 },
    sampleRate: [44100],
    channels: 2,
    requiresChapters: true, // Apple requires chapters
    requiresCoverArt: true,
  },
};
```

### Phase 2: Platform Integrations (Stories 9.3-9.5)

**Story 9.3: ACX Integration**

```typescript
// infrastructure/integrations/acx.integration.ts
export class ACXIntegration implements DistributionPlatform {
  platform = 'acx' as const;

  constructor(private httpClient: HttpClient) {}

  async connect(credentials: { username: string; password: string }): Promise<void> {
    // ACX uses OAuth (hypothetical - actual implementation depends on API)
    const response = await this.httpClient.post('https://api.acx.com/oauth/token', {
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
    });

    this.accessToken = response.data.access_token;
  }

  async validateContent(content: AudiobookContent): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check audio format
    if (!this.isValidFormat(content.audioUrl)) {
      errors.push('Audio must be M4B format with AAC codec');
    }

    // Check audio quality
    const audioInfo = await this.getAudioInfo(content.audioUrl);

    if (audioInfo.bitrate < 32 || audioInfo.bitrate > 128) {
      errors.push(`Bitrate must be 32-128kbps (current: ${audioInfo.bitrate}kbps)`);
    }

    if (![22050, 44100].includes(audioInfo.sampleRate)) {
      errors.push('Sample rate must be 22.05kHz or 44.1kHz');
    }

    // Check metadata
    if (!content.metadata.isbn) {
      errors.push('ISBN is required for ACX submission');
    }

    if (!content.metadata.coverImageUrl) {
      errors.push('Cover art is required');
    }

    // Check cover art dimensions
    const coverInfo = await this.getImageInfo(content.metadata.coverImageUrl);

    if (coverInfo.width < 2400 || coverInfo.height < 2400) {
      errors.push('Cover art must be at least 2400x2400 pixels');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async submit(
    content: AudiobookContent,
    metadata: PlatformMetadata
  ): Promise<SubmissionResult> {
    // 1. Upload audio file
    const uploadUrl = await this.getUploadUrl();
    await this.uploadFile(uploadUrl, content.audioUrl);

    // 2. Upload cover art
    const coverUploadUrl = await this.getCoverUploadUrl();
    await this.uploadFile(coverUploadUrl, metadata.coverImageUrl);

    // 3. Submit metadata
    const response = await this.httpClient.post('https://api.acx.com/v1/audiobooks', {
      title: metadata.title,
      author: metadata.author,
      narrator: metadata.narrator,
      publisher: metadata.publisher,
      language: metadata.language,
      genre: metadata.genre,
      description: metadata.description,
      isbn: metadata.isbn,
      copyright: metadata.copyright,
      dealType: metadata.acx.dealType,
      royaltyShare: metadata.acx.royaltyShare,
      territories: metadata.acx.territories,
      audioFileUrl: uploadUrl,
      coverArtUrl: coverUploadUrl,
    });

    return {
      submissionId: response.data.id,
      status: 'submitted',
      estimatedReviewTime: 7, // days
    };
  }

  async getStatus(submissionId: string): Promise<SubmissionStatus> {
    const response = await this.httpClient.get(
      `https://api.acx.com/v1/audiobooks/${submissionId}`
    );

    return {
      status: this.mapStatus(response.data.status),
      reviewProgress: response.data.reviewProgress,
      issues: response.data.issues || [],
      liveDate: response.data.liveDate,
    };
  }

  private mapStatus(acxStatus: string): SubmissionStatus['status'] {
    const statusMap: Record<string, SubmissionStatus['status']> = {
      pending_review: 'validating',
      in_review: 'validating',
      approved: 'live',
      rejected: 'failed',
    };

    return statusMap[acxStatus] || 'submitted';
  }
}
```

**Story 9.4: Spotify Integration**

```typescript
// infrastructure/integrations/spotify.integration.ts
export class SpotifyIntegration implements DistributionPlatform {
  platform = 'spotify' as const;

  async submit(content: AudiobookContent, metadata: PlatformMetadata): Promise<SubmissionResult> {
    // Spotify uses Anchor API for audiobook/podcast submissions

    // 1. Create show (if not exists)
    const show = await this.createShow({
      title: metadata.title,
      description: metadata.description,
      language: metadata.language,
      explicit: metadata.spotify.explicit,
      coverArt: metadata.coverImageUrl,
    });

    // 2. Upload episodes (chapters)
    const episodes = await Promise.all(
      content.chapters.map(async (chapter, index) => {
        return await this.uploadEpisode(show.id, {
          title: `${metadata.title} - ${chapter.title}`,
          description: chapter.description || metadata.description,
          audioUrl: chapter.audioUrl,
          episodeNumber: index + 1,
        });
      })
    );

    return {
      submissionId: show.id,
      status: 'submitted',
      estimatedReviewTime: 3, // days
    };
  }
}
```

**Story 9.5: Apple Books Integration**

```typescript
// infrastructure/integrations/apple-books.integration.ts
export class AppleBooksIntegration implements DistributionPlatform {
  platform = 'apple' as const;

  async submit(content: AudiobookContent, metadata: PlatformMetadata): Promise<SubmissionResult> {
    // Apple uses Transporter API for content submission

    // 1. Generate ITMSP package (iTunes Package)
    const itmsPackage = await this.generateITMSPackage(content, metadata);

    // 2. Upload via Transporter
    const uploadResult = await this.uploadWithTransporter(itmsPackage);

    // 3. Submit for review
    const response = await this.submitForReview(uploadResult.packageId);

    return {
      submissionId: response.adamId, // Apple's internal ID
      status: 'submitted',
      estimatedReviewTime: 5, // days
    };
  }

  private async generateITMSPackage(
    content: AudiobookContent,
    metadata: PlatformMetadata
  ): Promise<string> {
    // Generate metadata.xml (Apple's format)
    const metadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://apple.com/itunes/importer" version="audiobook5.0">
  <audiobook>
    <vendor_id>${metadata.apple.vendor}</vendor_id>
    <title>${metadata.title}</title>
    <author>${metadata.author}</author>
    <narrator>${metadata.narrator}</narrator>
    <publisher>${metadata.publisher}</publisher>
    <language>${metadata.language}</language>
    <genre>${metadata.genre}</genre>
    <description>${metadata.description}</description>
    <copyright>${metadata.copyright.year} ${metadata.copyright.holder}</copyright>
    <audio_file>${path.basename(content.audioUrl)}</audio_file>
    <cover_art>${path.basename(metadata.coverImageUrl)}</cover_art>
  </audiobook>
</package>`;

    // Create package directory
    const packageDir = `/tmp/audiobook-${Date.now()}.itmsp`;
    await fs.mkdir(packageDir);

    // Write metadata
    await fs.writeFile(`${packageDir}/metadata.xml`, metadataXml);

    // Copy audio file
    await fs.copyFile(content.audioUrl, `${packageDir}/${path.basename(content.audioUrl)}`);

    // Copy cover art
    await fs.copyFile(
      metadata.coverImageUrl,
      `${packageDir}/${path.basename(metadata.coverImageUrl)}`
    );

    return packageDir;
  }
}
```

### Phase 3: Metadata Management (Stories 9.6-9.7)

**Story 9.6: Metadata Mapping Engine**

```typescript
// application/services/metadata-mapper.service.ts
export class MetadataMapper {
  map(projectMetadata: ProjectMetadata, platform: string): PlatformMetadata {
    const baseMetadata: PlatformMetadata = {
      title: projectMetadata.title,
      author: projectMetadata.author,
      narrator: projectMetadata.narrator || projectMetadata.author,
      publisher: projectMetadata.publisher || 'Self-Published',
      language: this.mapLanguageCode(projectMetadata.language, platform),
      genre: this.mapGenre(projectMetadata.genre, platform),
      description: projectMetadata.description,
      coverImageUrl: projectMetadata.coverImageUrl,
      isbn: projectMetadata.isbn,
      copyright: projectMetadata.copyright,
    };

    // Platform-specific mappings
    if (platform === 'acx') {
      baseMetadata.acx = {
        dealType: projectMetadata.distribution?.acx?.dealType || 'non-exclusive',
        royaltyShare: projectMetadata.distribution?.acx?.royaltyShare || 40,
        territories: projectMetadata.distribution?.acx?.territories || ['US', 'UK', 'CA'],
      };
    }

    if (platform === 'spotify') {
      baseMetadata.spotify = {
        showType: 'audiobook',
        explicit: projectMetadata.distribution?.spotify?.explicit || false,
      };
    }

    return baseMetadata;
  }

  private mapLanguageCode(language: string, platform: string): string {
    // Language code mapping (ISO 639-1 vs platform-specific)
    const languageMap: Record<string, Record<string, string>> = {
      'pt-BR': {
        acx: 'pt-BR',
        spotify: 'pt',
        apple: 'por',
      },
      'en-US': {
        acx: 'en',
        spotify: 'en',
        apple: 'eng',
      },
    };

    return languageMap[language]?.[platform] || language;
  }

  private mapGenre(genre: string, platform: string): string {
    // Genre mapping to platform taxonomies
    const genreMap: Record<string, Record<string, string>> = {
      fiction: {
        acx: 'Fiction',
        spotify: 'Fiction',
        apple: 'Fiction & Literature',
      },
      'non-fiction': {
        acx: 'Non-Fiction',
        spotify: 'Non-Fiction',
        apple: 'Nonfiction',
      },
    };

    return genreMap[genre]?.[platform] || genre;
  }
}
```

**Story 9.7: Metadata Validation**

```typescript
// Validate metadata against platform requirements
export class MetadataValidator {
  validate(metadata: PlatformMetadata, platform: string): ValidationResult {
    const errors: string[] = [];

    // Common validations
    if (!metadata.title || metadata.title.length === 0) {
      errors.push('Title is required');
    }

    if (!metadata.author) {
      errors.push('Author is required');
    }

    if (!metadata.description || metadata.description.length < 100) {
      errors.push('Description must be at least 100 characters');
    }

    // Platform-specific validations
    if (platform === 'acx') {
      if (!metadata.isbn) {
        errors.push('ISBN is required for ACX');
      }

      if (!metadata.acx?.dealType) {
        errors.push('Deal type is required for ACX');
      }
    }

    if (platform === 'apple') {
      if (!metadata.apple?.vendor) {
        errors.push('Vendor ID is required for Apple Books');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Phase 4: Distribution UI & Workflows (Stories 9.8-9.10)

**Story 9.8: Distribution Dashboard**

```tsx
// packages/web/src/components/distribution/DistributionDashboard.tsx
export function DistributionDashboard({ projectId }: Props) {
  const [submissions, setSubmissions] = useState<DistributionSubmission[]>([]);

  return (
    <div className="space-y-6">
      <h2>Distribution Status</h2>

      {/* Active Platforms */}
      <div className="grid grid-cols-3 gap-4">
        {['acx', 'spotify', 'apple'].map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            submission={submissions.find((s) => s.platform === platform)}
            onSubmit={() => handleSubmit(platform)}
          />
        ))}
      </div>

      {/* Submission History */}
      <SubmissionHistory submissions={submissions} />
    </div>
  );
}

function PlatformCard({ platform, submission, onSubmit }: Props) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3>{platform.toUpperCase()}</h3>
        <StatusBadge status={submission?.status || 'not-submitted'} />
      </div>

      {submission ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm">Submitted: {formatDate(submission.submittedAt)}</p>
          {submission.status === 'live' && (
            <p className="text-sm text-green-600">Live: {formatDate(submission.liveAt)}</p>
          )}
          {submission.validationErrors.length > 0 && (
            <ul className="text-sm text-red-600">
              {submission.validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <Button onClick={onSubmit} className="mt-4">
          Submit to {platform.toUpperCase()}
        </Button>
      )}
    </div>
  );
}
```

**Story 9.9: One-Click Distribution**

```typescript
// application/use-cases/distribute-to-platform.use-case.ts
export class DistributeToPlatformUseCase {
  async execute(dto: DistributeToPlatformDTO): Promise<DistributionSubmission> {
    const project = await this.projectRepository.findById(dto.projectId);
    const target = await this.distributionTargetRepository.findByPlatform(
      dto.organizationId,
      dto.platform
    );

    // 1. Validate content
    const integration = this.getIntegration(dto.platform);
    const validationResult = await integration.validateContent({
      audioUrl: project.audioUrl,
      chapters: project.chapters,
      metadata: project.metadata,
    });

    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // 2. Convert format if needed
    const convertedAudioUrl = await this.convertFormat(project.audioUrl, dto.platform);

    // 3. Map metadata
    const platformMetadata = this.metadataMapper.map(project.metadata, dto.platform);

    // 4. Submit to platform
    const result = await integration.submit(
      {
        audioUrl: convertedAudioUrl,
        chapters: project.chapters,
        metadata: project.metadata,
      },
      platformMetadata
    );

    // 5. Save submission record
    const submission: DistributionSubmission = {
      id: randomUUID(),
      projectId: project.id,
      targetId: target.id,
      platform: dto.platform,
      status: result.status,
      metadata: platformMetadata,
      submissionId: result.submissionId,
      validationErrors: [],
      submittedAt: new Date(),
      liveAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.submissionRepository.save(submission);
  }
}
```

**Story 9.10: Distribution Analytics**

```typescript
// Track distribution performance
interface DistributionAnalytics {
  projectId: string;
  platform: string;
  downloads: number;
  revenue: number;
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

// Fetch analytics from platforms (if API available)
export class DistributionAnalyticsService {
  async fetchAnalytics(submissionId: string, platform: string): Promise<DistributionAnalytics> {
    const integration = this.getIntegration(platform);

    // Note: Actual implementation depends on platform API availability
    // ACX provides sales reports, Spotify provides analytics API

    return await integration.fetchAnalytics(submissionId);
  }
}
```

---

## Technical Decisions (ADRs)

### ADR-030: Platform Integration Strategy

**Decision:** Direct API integrations (not third-party aggregators)

**Rationale:**
- Full control over submission process
- No intermediary fees
- Better error handling and status tracking

**Trade-off:** More maintenance (multiple APIs to support)

### ADR-031: Format Conversion

**Decision:** Use FFmpeg for all audio conversions

**Rationale:**
- Industry-standard, battle-tested
- Supports all required formats (M4B, MP3, AAC)
- Chapter markers and metadata embedding

### ADR-032: Credentials Storage

**Decision:** Encrypt platform credentials using AES-256

**Rationale:**
- OAuth tokens and API keys are sensitive
- Per-organization encryption keys
- Rotation policy: 90 days

---

## Database Migrations

```sql
-- Distribution targets
CREATE TABLE distribution_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(50) CHECK (platform IN ('acx', 'audible', 'spotify', 'apple', 'google')),
  credentials BYTEA NOT NULL, -- Encrypted
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, platform)
);

-- Distribution submissions
CREATE TABLE distribution_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  target_id UUID REFERENCES distribution_targets(id),
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('preparing', 'validating', 'submitting', 'submitted', 'live', 'failed')),
  metadata JSONB NOT NULL,
  submission_id VARCHAR(255),
  validation_errors TEXT[],
  submitted_at TIMESTAMP,
  live_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_distribution_submissions_project ON distribution_submissions(project_id);
CREATE INDEX idx_distribution_submissions_status ON distribution_submissions(status);
```

---

## Testing Strategy

- Unit tests: Format conversion, metadata mapping
- Integration tests: Platform API calls (sandbox environments)
- E2E tests: Complete distribution workflow (ACX sandbox)

---

## Cost Estimation

- ACX: No API fees (revenue share model)
- Spotify: No submission fees
- Apple: $99/year developer program
- FFmpeg: Open source (no cost)

---

**Implementation Note:** This tech spec provides the foundation for Epic 9 story creation during Phase 4 implementation.
