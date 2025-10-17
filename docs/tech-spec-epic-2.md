# Technical Specification - Epic 2: Multi-Format Book Processing

**Epic:** Epic 2 - Multi-Format Book Processing
**Author:** Eduardo Menoncello
**Date:** 2025-10-17
**Status:** Ready for Implementation
**Prerequisites:** Epic 1 complete

---

## Epic Overview

**Goal:** Enable CLI to process real books in multiple formats (EPUB, PDF, Markdown) with automatic chapter detection, structure preservation, and batch generation capabilities.

**Value Delivered:**
- Technical publishers can process production books (EPUB, PDF, Markdown, HTML)
- Chapter structure automatically detected and preserved
- Batch processing enables high-volume workflows (25+ books simultaneously)
- Metadata extraction reduces manual configuration

**Total Stories:** 10 stories across 4 parallel tracks

---

## Architecture Extract

### Technology Stack (Epic 2 Additions)

| Technology | Version | Purpose |
|------------|---------|---------|
| epub2 | 3.0.2 | EPUB parsing, chapter extraction, TOC parsing |
| pdf-parse | 1.1.1 | PDF text extraction, layout preservation |
| marked | 14.1.3 | Markdown parsing, heading detection |
| FFmpeg | 7.1.0 | Audio concatenation, M4B generation, metadata embedding |

### Component Boundaries

**New Plugins:**
- `file-processing`: EPUB/PDF/Markdown/HTML parsers with unified interface
- `batch-processing`: Queue orchestration, job management

**Extensions:**
- `audio-generation` plugin: Multi-chapter support, concatenation

### Data Models (Epic 2 Extensions)

```typescript
// batch_jobs table (new)
interface BatchJob {
  id: string;
  userId: string;
  name: string;
  config: object; // JSONB: voice, quality settings
  totalBooks: number;
  completedBooks: number;
  failedBooks: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// projects table (extended for multi-format)
interface Project {
  // ... existing fields from Epic 1
  sourceFormat: 'txt' | 'epub' | 'pdf' | 'md' | 'html'; // NEW
  chapterCount: number | null; // NEW
  metadata: {
    isbn?: string;
    publisher?: string;
    language?: string;
    genre?: string;
    // ... extracted from source files
  };
}

// audio_generation_jobs table (extended)
interface AudioGenerationJob {
  // ... existing fields from Epic 1
  chapterNumber: number | null; // Now properly used
  chapterTitle: string | null; // NEW
}
```

### API Routes (Epic 2 Additions)

**Batch Processing:**
- `POST /batch` - Create batch job (multiple books)
- `GET /batch/:id` - Get batch status
- `GET /batch/:id/books` - List books in batch
- `POST /batch/:id/cancel` - Cancel batch job

**Projects (Extended):**
- `POST /projects/:id/upload` - Now supports EPUB, PDF, MD, HTML
- `GET /projects/:id/chapters` - List detected chapters

**Audio (Extended):**
- `POST /audio/concatenate` - Combine chapter audio files
- `GET /audio/jobs/:id/chapters` - List chapter-level job status

---

## Implementation Guidance

### Directory Structure for Epic 2

```
plugins/
  └── file-processing/
      ├── src/
      │   ├── parsers/
      │   │   ├── book-parser.ts           # Interface
      │   │   ├── epub-parser.ts           # Story 2.1
      │   │   ├── pdf-parser.ts            # Story 2.2
      │   │   ├── markdown-parser.ts       # Story 2.3
      │   │   └── html-parser.ts           # Story 2.3 (bonus)
      │   ├── chapter-segmentation.ts      # Story 2.4
      │   └── metadata-extractor.ts        # Story 2.10
      └── tests/
          ├── fixtures/
          │   ├── sample.epub
          │   ├── sample.pdf
          │   └── sample.md
          └── parsers/
              ├── epub-parser.test.ts
              ├── pdf-parser.test.ts
              └── markdown-parser.test.ts

  └── batch-processing/
      ├── src/
      │   ├── queue-orchestrator.ts        # Story 2.7
      │   ├── progress-tracker.ts          # Story 2.8
      │   └── config-parser.ts             # Story 2.9
      └── tests/
          └── batch-processing.test.ts

packages/
  └── cli/
      └── src/
          └── commands/
              ├── batch.ts                  # Stories 2.7-2.9
              └── metadata.ts               # Story 2.10
```

---

## Core Implementations

### 1. Book Parser Interface (Foundation for Stories 2.1-2.3)

```typescript
// plugins/file-processing/src/parsers/book-parser.ts
export interface Chapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
}

export interface BookMetadata {
  title?: string;
  author?: string;
  language?: string;
  isbn?: string;
  publisher?: string;
  genre?: string;
}

export interface BookParser {
  /**
   * Parse book file and extract chapters
   * @param filePath Path to book file
   * @returns Parsed chapters and metadata
   */
  parse(filePath: string): Promise<{
    chapters: Chapter[];
    metadata: BookMetadata;
  }>;

  /**
   * Supported file extension (e.g., '.epub', '.pdf')
   */
  readonly supportedExtension: string;
}
```

### 2. EPUB Parser (Story 2.1)

```typescript
// plugins/file-processing/src/parsers/epub-parser.ts
import EPub from 'epub2';

@injectable()
export class EPUBParser implements BookParser {
  readonly supportedExtension = '.epub';

  constructor(
    @inject('Logger') private logger: Logger
  ) {}

  async parse(filePath: string): Promise<{ chapters: Chapter[]; metadata: BookMetadata }> {
    const epub = await EPub.createAsync(filePath);

    // Extract metadata
    const metadata: BookMetadata = {
      title: epub.metadata.title,
      author: epub.metadata.creator,
      language: epub.metadata.language,
      isbn: epub.metadata.ISBN,
      publisher: epub.metadata.publisher
    };

    // Extract chapters from spine
    const chapters: Chapter[] = [];

    for (const [index, item] of epub.flow.entries()) {
      const chapterContent = await epub.getChapterAsync(item.id);

      // Convert HTML to plain text (strip tags)
      const plainText = this.htmlToPlainText(chapterContent);

      chapters.push({
        number: index + 1,
        title: item.title || `Chapter ${index + 1}`,
        content: plainText,
        wordCount: plainText.split(/\s+/).length
      });
    }

    this.logger.info({
      file: filePath,
      chapterCount: chapters.length
    }, 'EPUB parsed successfully');

    return { chapters, metadata };
  }

  private htmlToPlainText(html: string): string {
    // Remove HTML tags, preserve paragraph breaks
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

### 3. PDF Parser (Story 2.2)

```typescript
// plugins/file-processing/src/parsers/pdf-parser.ts
import pdfParse from 'pdf-parse';

@injectable()
export class PDFParser implements BookParser {
  readonly supportedExtension = '.pdf';

  constructor(
    @inject('Logger') private logger: Logger
  ) {}

  async parse(filePath: string): Promise<{ chapters: Chapter[]; metadata: BookMetadata }> {
    const dataBuffer = await Bun.file(filePath).arrayBuffer();
    const pdfData = await pdfParse(Buffer.from(dataBuffer));

    // Extract metadata
    const metadata: BookMetadata = {
      title: pdfData.info?.Title,
      author: pdfData.info?.Author,
      // PDF rarely has ISBN in metadata
    };

    // Chapter detection via heuristics
    const text = pdfData.text;
    const chapters = this.detectChapters(text);

    this.logger.info({
      file: filePath,
      pages: pdfData.numpages,
      chapterCount: chapters.length
    }, 'PDF parsed successfully');

    return { chapters, metadata };
  }

  private detectChapters(text: string): Chapter[] {
    // Heuristic: Look for "Chapter N" or "CHAPTER N" patterns
    const chapterRegex = /(?:^|\n)(Chapter|CHAPTER)\s+(\d+|[IVXLCDM]+)[:\s]+(.*?)$/gm;
    const matches = Array.from(text.matchAll(chapterRegex));

    if (matches.length === 0) {
      // No chapters detected, return entire book as single chapter
      return [{
        number: 1,
        title: 'Full Document',
        content: text,
        wordCount: text.split(/\s+/).length
      }];
    }

    const chapters: Chapter[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];

      const startIndex = match.index!;
      const endIndex = nextMatch ? nextMatch.index! : text.length;

      const chapterText = text.substring(startIndex, endIndex);

      chapters.push({
        number: i + 1,
        title: match[3].trim() || `Chapter ${i + 1}`,
        content: chapterText,
        wordCount: chapterText.split(/\s+/).length
      });
    }

    return chapters;
  }
}
```

### 4. Markdown Parser (Story 2.3)

```typescript
// plugins/file-processing/src/parsers/markdown-parser.ts
import { marked } from 'marked';

@injectable()
export class MarkdownParser implements BookParser {
  readonly supportedExtension = '.md';

  constructor(
    @inject('Logger') private logger: Logger
  ) {}

  async parse(filePath: string): Promise<{ chapters: Chapter[]; metadata: BookMetadata }> {
    const markdown = await Bun.file(filePath).text();

    // Extract frontmatter metadata (YAML)
    const metadata = this.extractFrontmatter(markdown);

    // Chapter detection via headings (# or ##)
    const chapters = this.detectChapters(markdown);

    this.logger.info({
      file: filePath,
      chapterCount: chapters.length
    }, 'Markdown parsed successfully');

    return { chapters, metadata };
  }

  private extractFrontmatter(markdown: string): BookMetadata {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = markdown.match(frontmatterRegex);

    if (!match) return {};

    // Simple YAML parsing (title, author, etc.)
    const yaml = match[1];
    const metadata: BookMetadata = {};

    yaml.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (key && value) {
        metadata[key.trim() as keyof BookMetadata] = value;
      }
    });

    return metadata;
  }

  private detectChapters(markdown: string): Chapter[] {
    const lines = markdown.split('\n');
    const chapters: Chapter[] = [];
    let currentChapter: { title: string; content: string[] } | null = null;
    let chapterNumber = 0;

    for (const line of lines) {
      // Detect H1 or H2 headings as chapter boundaries
      const headingMatch = line.match(/^(#{1,2})\s+(.+)$/);

      if (headingMatch) {
        // Save previous chapter
        if (currentChapter) {
          chapters.push({
            number: chapterNumber,
            title: currentChapter.title,
            content: currentChapter.content.join('\n'),
            wordCount: currentChapter.content.join(' ').split(/\s+/).length
          });
        }

        // Start new chapter
        chapterNumber++;
        currentChapter = {
          title: headingMatch[2].trim(),
          content: []
        };
      } else if (currentChapter) {
        // Add to current chapter
        currentChapter.content.push(line);
      }
    }

    // Save last chapter
    if (currentChapter) {
      chapters.push({
        number: chapterNumber,
        title: currentChapter.title,
        content: currentChapter.content.join('\n'),
        wordCount: currentChapter.content.join(' ').split(/\s+/).length
      });
    }

    return chapters.length > 0 ? chapters : [{
      number: 1,
      title: 'Document',
      content: markdown,
      wordCount: markdown.split(/\s+/).length
    }];
  }
}
```

### 5. Chapter Segmentation Service (Story 2.4)

```typescript
// plugins/file-processing/src/chapter-segmentation.ts
@injectable()
export class ChapterSegmentationService {
  private readonly MIN_CHAPTER_WORDS = 500;
  private readonly MAX_CHAPTER_WORDS = 10000;

  constructor(
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * Normalize chapters (merge short, split long)
   */
  segment(chapters: Chapter[]): Chapter[] {
    let normalized = this.mergeShortChapters(chapters);
    normalized = this.splitLongChapters(normalized);

    this.logger.info({
      original: chapters.length,
      normalized: normalized.length
    }, 'Chapters segmented');

    return normalized;
  }

  private mergeShortChapters(chapters: Chapter[]): Chapter[] {
    const merged: Chapter[] = [];
    let buffer: Chapter | null = null;

    for (const chapter of chapters) {
      if (chapter.wordCount < this.MIN_CHAPTER_WORDS && buffer) {
        // Merge with buffered chapter
        buffer = {
          number: buffer.number,
          title: `${buffer.title} / ${chapter.title}`,
          content: `${buffer.content}\n\n${chapter.content}`,
          wordCount: buffer.wordCount + chapter.wordCount
        };
      } else if (chapter.wordCount < this.MIN_CHAPTER_WORDS) {
        // Start new buffer
        buffer = chapter;
      } else {
        // Flush buffer if exists
        if (buffer) {
          merged.push(buffer);
          buffer = null;
        }
        merged.push(chapter);
      }
    }

    // Flush remaining buffer
    if (buffer) merged.push(buffer);

    return merged;
  }

  private splitLongChapters(chapters: Chapter[]): Chapter[] {
    const split: Chapter[] = [];

    for (const chapter of chapters) {
      if (chapter.wordCount > this.MAX_CHAPTER_WORDS) {
        // Split by paragraphs
        const paragraphs = chapter.content.split(/\n\n+/);
        let partNumber = 1;
        let currentPart: string[] = [];
        let currentWordCount = 0;

        for (const paragraph of paragraphs) {
          const paragraphWords = paragraph.split(/\s+/).length;

          if (currentWordCount + paragraphWords > this.MAX_CHAPTER_WORDS && currentPart.length > 0) {
            // Save current part
            split.push({
              number: chapter.number + (partNumber - 1) * 0.1,
              title: `${chapter.title} (Part ${partNumber})`,
              content: currentPart.join('\n\n'),
              wordCount: currentWordCount
            });

            // Start new part
            partNumber++;
            currentPart = [paragraph];
            currentWordCount = paragraphWords;
          } else {
            currentPart.push(paragraph);
            currentWordCount += paragraphWords;
          }
        }

        // Save last part
        if (currentPart.length > 0) {
          split.push({
            number: chapter.number + (partNumber - 1) * 0.1,
            title: partNumber > 1 ? `${chapter.title} (Part ${partNumber})` : chapter.title,
            content: currentPart.join('\n\n'),
            wordCount: currentWordCount
          });
        }
      } else {
        split.push(chapter);
      }
    }

    return split;
  }
}
```

### 6. Batch Processing CLI (Stories 2.7-2.9)

```typescript
// packages/cli/src/commands/batch.ts
import { Command } from 'commander';
import YAML from 'yaml';

export const batchCommand = new Command('batch')
  .description('Batch process multiple books');

batchCommand
  .command('process')
  .description('Process multiple books from directory')
  .option('-d, --input-dir <dir>', 'Input directory with books')
  .option('-c, --config <file>', 'YAML configuration file')
  .option('-o, --output-dir <dir>', 'Output directory for audio files')
  .action(async (options) => {
    // Load configuration
    const config = options.config
      ? YAML.parse(await Bun.file(options.config).text())
      : {};

    // Scan directory
    const files = await scanDirectory(options.inputDir, ['.epub', '.pdf', '.md']);

    console.log(`Found ${files.length} books to process`);

    // Create batch job
    const apiClient = new FaladorAPIClient();
    const batch = await apiClient.batch.create({
      name: `Batch ${new Date().toISOString()}`,
      books: files.map(file => ({ path: file })),
      config: {
        voiceId: config.voiceId || 'default-pt-br',
        format: config.format || 'mp3',
        quality: config.quality || 'high'
      }
    });

    console.log(`Batch job created: ${batch.id}`);
    console.log('Processing... (use `falador batch status` to monitor)');
  });

batchCommand
  .command('status <job-id>')
  .description('Check batch job status')
  .option('-f, --follow', 'Follow progress in real-time')
  .action(async (jobId, options) => {
    const apiClient = new FaladorAPIClient();

    if (options.follow) {
      // Poll every 5 seconds
      while (true) {
        const batch = await apiClient.batch.get(jobId);

        console.clear();
        console.log(`Batch Job: ${batch.id}`);
        console.log(`Status: ${batch.status}`);
        console.log(`Progress: ${batch.completedBooks}/${batch.totalBooks} books`);
        console.log('\nBooks:');

        const books = await apiClient.batch.getBooks(jobId);
        books.forEach(book => {
          const status = book.status === 'completed' ? '✓' :
                        book.status === 'failed' ? '✗' : '⋯';
          console.log(`  ${status} ${book.title}`);
        });

        if (batch.status === 'completed' || batch.status === 'failed') {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } else {
      const batch = await apiClient.batch.get(jobId);
      console.log(JSON.stringify(batch, null, 2));
    }
  });
```

---

## Testing Approach

### Unit Tests

```typescript
// plugins/file-processing/tests/parsers/epub-parser.test.ts
import { describe, test, expect } from 'bun:test';
import { EPUBParser } from '../src/parsers/epub-parser';

describe('EPUBParser', () => {
  test('should parse EPUB with chapters', async () => {
    const parser = new EPUBParser(mockLogger);
    const result = await parser.parse('./tests/fixtures/sample.epub');

    expect(result.chapters.length).toBeGreaterThan(0);
    expect(result.chapters[0].title).toBeDefined();
    expect(result.chapters[0].content).toBeDefined();
    expect(result.metadata.title).toBe('Sample Book');
  });

  test('should extract metadata from EPUB', async () => {
    const parser = new EPUBParser(mockLogger);
    const result = await parser.parse('./tests/fixtures/sample.epub');

    expect(result.metadata.title).toBeDefined();
    expect(result.metadata.author).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// packages/api-gateway/tests/integration/batch.test.ts
import { describe, test, expect } from 'bun:test';

describe('Batch Processing Integration', () => {
  test('should create batch job with multiple books', async () => {
    const client = treaty(app);
    const user = await createTestUser();
    const apiKey = await createTestApiKey(user.id);

    const response = await client.batch.post({
      name: 'Test Batch',
      books: [
        { path: '/uploads/book1.epub' },
        { path: '/uploads/book2.pdf' }
      ],
      config: { voiceId: 'pt-br-default' }
    }, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    expect(response.status).toBe(200);
    expect(response.data.data.batchId).toBeDefined();
    expect(response.data.data.totalBooks).toBe(2);
  });
});
```

---

## Story Breakdown Summary

### Track A: File Format Parsers (Independent)
- **Story 2.1**: EPUB parser (epub2 library, chapter extraction, metadata)
- **Story 2.2**: PDF parser (pdf-parse library, heuristic chapter detection)
- **Story 2.3**: Markdown/HTML parser (marked library, heading-based chapters)

### Track B: Chapter Processing (Depends on Track A)
- **Story 2.4**: Chapter segmentation (normalize, merge short, split long)
- **Story 2.5**: Multi-chapter audio generation (parallel processing)
- **Story 2.6**: Audio concatenation (FFmpeg, M4B format, chapter markers)

### Track C: Batch Processing (Depends on Track B)
- **Story 2.7**: Batch processing command (queue management)
- **Story 2.8**: Batch job monitoring (status tracking, progress)
- **Story 2.9**: Configuration file support (YAML configs, profiles)

### Track D: Metadata (Parallel with Track A)
- **Story 2.10**: Metadata management (extraction, storage, validation)

---

## Acceptance Criteria Checklist

### Functionality
- [ ] EPUB files parse with chapter detection
- [ ] PDF files parse with heuristic chapter detection
- [ ] Markdown files parse with heading-based chapters
- [ ] Chapters normalized (merged/split based on word count)
- [ ] Multi-chapter books generate separate audio files
- [ ] Audio files concatenate into single M4B with chapter markers
- [ ] Batch processing handles 25+ books simultaneously
- [ ] Batch status queryable via CLI and API

### Quality
- [ ] Parser unit tests (all formats)
- [ ] Chapter segmentation tests (edge cases)
- [ ] Batch processing integration tests
- [ ] 80% mutation score maintained

### Performance
- [ ] Parallel chapter processing (configurable concurrency)
- [ ] Batch processing doesn't block other users
- [ ] Memory efficient (streaming for large files)

---

**Epic 2 Status:** Ready for implementation
**Prerequisites:** Epic 1 must be complete (foundational infrastructure)
**Next Steps:** Begin Story 2.1 (EPUB Parser)

---

_Generated from solution-architecture.md and epics.md_
_Date: 2025-10-17_
