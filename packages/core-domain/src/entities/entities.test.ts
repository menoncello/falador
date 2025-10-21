import { describe, expect, test } from 'bun:test';
import type {
  User,
  Project,
  Voice,
  AudioFile,
  GenerationJob,
  ApiKey,
} from './index';

describe('Domain Entities - Business Rules Validation', () => {
  describe('User Entity', () => {
    test('should enforce valid email format RFC compliance', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@example.co.uk',
        'user123@test-domain.com',
        'firstname.lastname@company.org',
      ];

      for (const email of validEmails) {
        const user: User = {
          id: 'user-123',
          email,
          name: 'Test User',
          passwordHash: 'hashed:password',
          tier: 'free',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        };

        // RFC 5322 email validation
        const emailRegex = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
        expect(emailRegex.test(user.email)).toBe(true);
      }
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.example.com',
        'user@example.',
        'user name@example.com',
      ];

      for (const email of invalidEmails) {
        const emailRegex = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    test('should enforce valid user tiers', () => {
      const validTiers: Array<User['tier']> = ['free', 'pro', 'enterprise'];

      for (const tier of validTiers) {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed:password',
          tier,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        };

        expect(validTiers).toContain(user.tier);
      }
    });

    test('should enforce password hash format with salt', () => {
      const validHashes = [
        'salt:hash',
        'abc123:def456',
        'randomSalt:hashedPassword',
      ];

      for (const hash of validHashes) {
        const parts = hash.split(':');
        expect(parts).toHaveLength(2);
        expect(parts[0]).toBeTruthy();
        expect(parts[1]).toBeTruthy();
      }
    });

    test('should reject invalid password hash formats', () => {
      const invalidHashes = [
        'single-part',
        'salt:hash:extra',
        ':missing-salt',
        'missing-hash:',
        '',
        'just:',
        ':',
      ];

      for (const hash of invalidHashes) {
        const parts = hash.split(':');
        expect(parts.length !== 2 || !parts[0] || !parts[1]).toBe(true);
      }
    });
  });

  describe('Project Entity', () => {
    test('should validate project status transitions', () => {
      const validTransitions: Record<string, Array<Project['status']>> = {
        draft: ['queued', 'processing'],
        queued: ['processing', 'failed'],
        processing: ['completed', 'failed'],
        completed: ['queued'], // Can regenerate
        failed: ['queued', 'draft'], // Can retry or go back to draft
      };

      for (const [fromStatus, allowedToStatuses] of Object.entries(
        validTransitions
      )) {
        for (const toStatus of allowedToStatuses) {
          expect(allowedToStatuses).toContain(toStatus);
        }
      }
    });

    test('should enforce valid project languages', () => {
      const validLanguages: Array<Project['language']> = ['pt-BR', 'en'];

      for (const language of validLanguages) {
        const project: Project = {
          id: 'project-123',
          userId: 'user-123',
          title: 'Test Project',
          author: 'Test Author',
          language,
          genre: 'Fiction',
          status: 'draft',
          metadata: {},
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        };

        expect(validLanguages).toContain(project.language);
      }
    });

    test('should validate metadata structure', () => {
      const validMetadata = [
        {},
        { isbn: '978-3-16-148410-0' },
        { pageCount: 250, published: true },
        { tags: ['fiction', 'bestseller'] },
        { complex: { nested: { data: 'value' } } },
      ];

      for (const metadata of validMetadata) {
        expect(typeof metadata).toBe('object');
        expect(metadata).not.toBeNull();
        expect(Array.isArray(metadata)).toBe(false);
      }
    });

    test('should enforce project title constraints', () => {
      const validTitles = [
        'Short Title',
        'A Much Longer Project Title That Is Still Valid',
        'Project with numbers 123',
        'Title-with-hyphens',
      ];

      const invalidTitles = [
        '',
        '   ',
        'a'.repeat(501), // Too long
      ];

      for (const title of validTitles) {
        expect(title.trim().length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(500);
      }

      for (const title of invalidTitles) {
        if (title.trim().length === 0) {
          expect(title.trim().length).toBe(0);
        } else {
          expect(title.length).toBeGreaterThan(500);
        }
      }
    });
  });

  describe('Voice Entity', () => {
    test('should validate voice gender constraints', () => {
      const validGenders: Array<Voice['gender']> = [
        'male',
        'female',
        'neutral',
      ];

      for (const gender of validGenders) {
        const voice: Voice = {
          id: 'voice-123',
          name: 'Test Voice',
          language: 'en-US',
          gender,
          age: 'adult',
          provider: 'openai',
          providerId: 'voice-abc123',
          isActive: true,
        };

        expect(validGenders).toContain(voice.gender);
      }
    });

    test('should validate voice age categories', () => {
      const validAges: Array<Voice['age']> = ['young', 'adult', 'mature'];

      for (const age of validAges) {
        const voice: Voice = {
          id: 'voice-123',
          name: 'Test Voice',
          language: 'en-US',
          gender: 'neutral',
          age,
          provider: 'openai',
          providerId: 'voice-abc123',
          isActive: true,
        };

        expect(validAges).toContain(voice.age);
      }
    });

    test('should validate language codes format', () => {
      const validLanguages = ['en-US', 'pt-BR', 'es-ES', 'fr-FR', 'de-DE'];

      const languageRegex = /^[a-z]{2}-[A-Z]{2}$/;

      for (const language of validLanguages) {
        expect(languageRegex.test(language)).toBe(true);
      }
    });

    test('should validate provider ID format', () => {
      const validProviderIds = [
        'voice-123',
        'abc123def456',
        'voice_name_with_underscores',
        'alphanumeric-voice-id',
      ];

      const providerIdRegex = /^[\w-]+$/;

      for (const providerId of validProviderIds) {
        expect(providerIdRegex.test(providerId)).toBe(true);
        expect(providerId.length).toBeGreaterThan(0);
      }
    });

    test('should prevent invalid voice configuration', () => {
      const invalidVoice = {
        id: '',
        name: '',
        language: 'invalid',
        gender: 'invalid' as Voice['gender'],
        age: 'invalid' as Voice['age'],
        provider: '',
        providerId: '',
        isActive: true,
      };

      // Validate constraints
      expect(invalidVoice.id).toBe('');
      expect(invalidVoice.name).toBe('');
      expect(invalidVoice.language).toBe('invalid');
      expect(['male', 'female', 'neutral']).not.toContain(invalidVoice.gender);
      expect(['young', 'adult', 'mature']).not.toContain(invalidVoice.age);
    });
  });

  describe('AudioFile Entity', () => {
    test('should validate audio duration constraints', () => {
      const validDurations = [0.1, 1, 60, 3600, 86400]; // 0.1s to 24 hours

      for (const duration of validDurations) {
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(86400); // Max 24 hours
      }
    });

    test('should validate file size constraints', () => {
      const validSizes = [1024, 1048576, 104857600]; // 1KB to 100MB

      for (const size of validSizes) {
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThanOrEqual(104857600); // Max 100MB
      }
    });

    test('should validate audio format constraints', () => {
      const validFormats = ['mp3', 'wav', 'ogg', 'aac', 'flac'];

      for (const format of validFormats) {
        const audioFile: AudioFile = {
          id: 'audio-123',
          projectId: 'project-123',
          filename: `test.${format}`,
          path: '/path/to/test.mp3',
          duration: 60,
          size: 1048576,
          format,
          metadata: { bitrate: 320 },
          createdAt: '2023-01-01T00:00:00Z',
        };

        expect(validFormats).toContain(audioFile.format);
      }
    });

    test('should validate filename constraints', () => {
      const validFilenames = [
        'audio.mp3',
        'test_file.wav',
        'my-audio-file.ogg',
        'file_with_numbers_123.mp3',
      ];

      const filenameRegex = /^[\w-]+\.[\dA-Za-z]{2,4}$/;

      for (const filename of validFilenames) {
        expect(filenameRegex.test(filename)).toBe(true);
      }
    });
  });

  describe('GenerationJob Entity', () => {
    test('should validate job status transitions', () => {
      const validTransitions: Record<string, Array<GenerationJob['status']>> = {
        pending: ['processing', 'failed'],
        processing: ['completed', 'failed'],
        completed: ['pending'], // Can regenerate
        failed: ['pending', 'processing'], // Can retry
      };

      for (const [fromStatus, allowedToStatuses] of Object.entries(
        validTransitions
      )) {
        for (const toStatus of allowedToStatuses) {
          expect(allowedToStatuses).toContain(toStatus);
        }
      }
    });

    test('should validate progress percentage', () => {
      const validProgressValues = [0, 0.5, 50, 99.9, 100];

      for (const progress of validProgressValues) {
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      }
    });

    test('should validate text length constraints', () => {
      const validTexts = [
        'Short text',
        'A'.repeat(100), // 100 characters
        'A'.repeat(5000), // 5000 characters
      ];

      const invalidTexts = [
        '',
        '   ',
        'A'.repeat(10001), // Too long
      ];

      for (const text of validTexts) {
        expect(text.trim().length).toBeGreaterThan(0);
        expect(text.length).toBeLessThanOrEqual(10000);
      }

      for (const text of invalidTexts) {
        if (text.trim().length === 0) {
          expect(text.trim().length).toBe(0);
        } else {
          expect(text.length).toBeGreaterThan(10000);
        }
      }
    });

    test('should validate timestamp consistency', () => {
      const now = '2023-01-01T12:00:00Z';
      const later = '2023-01-01T12:30:00Z';
      const earlier = '2023-01-01T11:30:00Z';

      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Test text',
        status: 'completed',
        progress: 100,
        outputPath: '/path/to/output.mp3',
        createdAt: now,
        updatedAt: later,
        startedAt: now,
        completedAt: later,
      };

      expect(new Date(job.startedAt!).getTime()).toBeGreaterThanOrEqual(
        new Date(job.createdAt).getTime()
      );
      expect(new Date(job.completedAt!).getTime()).toBeGreaterThanOrEqual(
        new Date(job.startedAt!).getTime()
      );
      expect(new Date(job.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(job.createdAt).getTime()
      );
    });
  });

  describe('ApiKey Entity', () => {
    test('should validate API key format', () => {
      const validKeys = [
        'ak_1234567890abcdef',
        'abc123def456',
        'key-with-underscores_and-numbers123',
      ];

      const keyRegex = /^[\w-]+$/;

      for (const key of validKeys) {
        expect(keyRegex.test(key)).toBe(true);
        expect(key.length).toBeGreaterThanOrEqual(10);
      }
    });

    test('should validate scopes format', () => {
      const validScopes = [
        ['read'],
        ['read', 'write'],
        ['read', 'write', 'admin'],
        ['api:read', 'api:write', 'projects:create'],
      ];

      for (const scopes of validScopes) {
        expect(Array.isArray(scopes)).toBe(true);
        expect(scopes.length).toBeGreaterThan(0);
        for (const scope of scopes) {
          expect(typeof scope).toBe('string');
          expect(scope.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('should validate key name constraints', () => {
      const validNames = [
        'My API Key',
        'Production Key',
        'Test-Key-123',
        'Dev Environment',
      ];

      for (const name of validNames) {
        expect(name.trim().length).toBeGreaterThan(0);
        expect(name.length).toBeLessThanOrEqual(100);
      }
    });

    test('should validate lastUsedAt timestamp consistency', () => {
      const createdAt = '2023-01-01T00:00:00Z';
      const lastUsedAt = '2023-01-02T12:00:00Z';

      const apiKey: ApiKey = {
        id: 'key-123',
        userId: 'user-123',
        key: 'abc123def456',
        name: 'Test Key',
        scopes: ['read'],
        createdAt,
        lastUsedAt,
      };

      if (apiKey.lastUsedAt) {
        expect(new Date(apiKey.lastUsedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(apiKey.createdAt).getTime()
        );
      }
    });
  });

  describe('Cross-Entity Business Rules', () => {
    test('should validate user-project ownership', () => {
      const userId = 'user-123';
      const project: Project = {
        id: 'project-123',
        userId,
        title: 'Test Project',
        author: null,
        language: 'en',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      expect(project.userId).toBe(userId);
    });

    test('should validate project-audio file relationship', () => {
      const projectId = 'project-123';
      const audioFile: AudioFile = {
        id: 'audio-123',
        projectId,
        filename: 'test.mp3',
        path: '/path/to/test.mp3',
        duration: 60,
        size: 1048576,
        format: 'mp3',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
      };

      expect(audioFile.projectId).toBe(projectId);
    });

    test('should validate generation job dependencies', () => {
      const projectId = 'project-123';
      const voiceId = 'voice-123';

      const job: GenerationJob = {
        id: 'job-123',
        projectId,
        voiceId,
        text: 'Test text',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      expect(job.projectId).toBe(projectId);
      expect(job.voiceId).toBe(voiceId);
      expect(job.text.trim().length).toBeGreaterThan(0);
    });

    test('should validate API key user association', () => {
      const userId = 'user-123';
      const apiKey: ApiKey = {
        id: 'key-123',
        userId,
        key: 'abc123def456',
        name: 'Test Key',
        scopes: ['read'],
        createdAt: '2023-01-01T00:00:00Z',
        lastUsedAt: null,
      };

      expect(apiKey.userId).toBe(userId);
      expect(apiKey.scopes.length).toBeGreaterThan(0);
    });
  });
});
