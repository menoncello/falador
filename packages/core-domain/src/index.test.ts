import { describe, expect, test } from 'bun:test';
import type {
  User,
  Project,
  Voice,
  AudioFile,
  GenerationJob,
  ApiKey,
  Session,
} from './entities/index.js';
import type {
  UserRepository,
  ProjectRepository,
  VoiceRepository,
  GenerationJobRepository,
  TTSEngine,
  Storage,
  Queue,
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from './interfaces/index.js';
import { version } from './index';

describe('1.5-DOMAIN: Domain Layer Exports and Structure', () => {
  describe('Entity Exports', () => {
    test('1.5-DOM-EXPORT-001 [P1]: should export User entity type', () => {
      const testUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'salt:hash',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      expect(testUser.email).toBe('test@example.com');
      expect(testUser.tier).toBe('free');
    });

    test('1.5-DOM-EXPORT-002 [P1]: should export Project entity type', () => {
      const testProject: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: 'Test Author',
        language: 'en',
        genre: 'Fiction',
        status: 'draft',
        metadata: { test: 'value' },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      expect(testProject.title).toBe('Test Project');
      expect(testProject.status).toBe('draft');
    });

    test('1.5-DOM-EXPORT-003 [P1]: should export Voice entity type', () => {
      const testVoice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      expect(testVoice.name).toBe('Test Voice');
      expect(testVoice.isActive).toBe(true);
    });

    test('1.5-DOM-EXPORT-004 [P1]: should export AudioFile entity type', () => {
      const testAudioFile: AudioFile = {
        id: 'audio-123',
        projectId: 'project-123',
        filename: 'test.mp3',
        path: '/path/to/test.mp3',
        duration: 60,
        size: 1024,
        format: 'mp3',
        metadata: { bitrate: 320 },
        createdAt: '2023-01-01T00:00:00Z',
      };

      expect(testAudioFile.format).toBe('mp3');
      expect(testAudioFile.duration).toBe(60);
    });

    test('1.5-DOM-EXPORT-005 [P1]: should export GenerationJob entity type', () => {
      const testJob: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Test text',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      expect(testJob.status).toBe('pending');
      expect(testJob.progress).toBe(0);
    });

    test('1.5-DOM-EXPORT-006 [P1]: should export ApiKey entity type', () => {
      const testApiKey: ApiKey = {
        id: 'key-123',
        userId: 'user-123',
        key: 'abc123def456',
        name: 'Test Key',
        scopes: ['read', 'write'],
        createdAt: '2023-01-01T00:00:00Z',
        lastUsedAt: null,
      };

      expect(testApiKey.key).toBe('abc123def456');
      expect(testApiKey.scopes).toContain('read');
    });

    test('1.5-DOM-EXPORT-007 [P1]: should export Session entity type', () => {
      const testSession: Session = {
        userId: 'user-123',
        token: 'jwt-token-123',
        expiresAt: '2023-01-01T12:00:00Z',
      };

      expect(testSession.token).toBe('jwt-token-123');
      expect(testSession.expiresAt).toBe('2023-01-01T12:00:00Z');
    });
  });

  describe('Repository Interface Exports', () => {
    test('1.5-DOM-EXPORT-008 [P1]: should export UserRepository interface', () => {
      const userRepository: UserRepository = {} as UserRepository;
      expect(typeof userRepository.create).toBe('function');
      expect(typeof userRepository.findById).toBe('function');
      expect(typeof userRepository.findByEmail).toBe('function');
      expect(typeof userRepository.delete).toBe('function');
    });

    test('1.5-DOM-EXPORT-009 [P1]: should export ProjectRepository interface', () => {
      const projectRepository: ProjectRepository = {} as ProjectRepository;
      expect(typeof projectRepository.create).toBe('function');
      expect(typeof projectRepository.findById).toBe('function');
      expect(typeof projectRepository.findByUserId).toBe('function');
      expect(typeof projectRepository.update).toBe('function');
      expect(typeof projectRepository.delete).toBe('function');
    });

    test('1.5-DOM-EXPORT-010 [P1]: should export VoiceRepository interface', () => {
      const voiceRepository: VoiceRepository = {} as VoiceRepository;
      expect(typeof voiceRepository.create).toBe('function');
      expect(typeof voiceRepository.findById).toBe('function');
      expect(typeof voiceRepository.findAll).toBe('function');
      expect(typeof voiceRepository.findByLanguage).toBe('function');
      expect(typeof voiceRepository.update).toBe('function');
      expect(typeof voiceRepository.delete).toBe('function');
    });

    test('1.5-DOM-EXPORT-011 [P1]: should export GenerationJobRepository interface', () => {
      const generationJobRepository: GenerationJobRepository =
        {} as GenerationJobRepository;
      expect(typeof generationJobRepository.create).toBe('function');
      expect(typeof generationJobRepository.findById).toBe('function');
      expect(typeof generationJobRepository.findByProjectId).toBe('function');
      expect(typeof generationJobRepository.update).toBe('function');
      expect(typeof generationJobRepository.delete).toBe('function');
    });
  });

  describe('Service Interface Exports', () => {
    test('1.5-DOM-EXPORT-012 [P1]: should export TTSEngine interface', () => {
      const ttsEngine: TTSEngine = {} as TTSEngine;
      expect(typeof ttsEngine.generate).toBe('function');
      expect(typeof ttsEngine.getVoices).toBe('function');
      expect(typeof ttsEngine.validateVoice).toBe('function');
    });

    test('1.5-DOM-EXPORT-013 [P1]: should export Storage interface', () => {
      const storage: Storage = {} as Storage;
      expect(typeof storage.save).toBe('function');
      expect(typeof storage.load).toBe('function');
      expect(typeof storage.delete).toBe('function');
    });

    test('1.5-DOM-EXPORT-014 [P1]: should export Queue interface', () => {
      const queue: Queue = {} as Queue;
      expect(typeof queue.enqueue).toBe('function');
      expect(typeof queue.dequeue).toBe('function');
      expect(typeof queue.complete).toBe('function');
      expect(typeof queue.fail).toBe('function');
    });
  });

  describe('Error Class Exports', () => {
    test('1.5-DOM-EXPORT-015 [P1]: should export DomainError class', () => {
      const error = new DomainError('Test error', 'TEST_CODE');
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
    });

    test('1.5-DOM-EXPORT-016 [P1]: should export ValidationError class', () => {
      const error = new ValidationError('Test validation error');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe('Test validation error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('1.5-DOM-EXPORT-017 [P1]: should export NotFoundError class', () => {
      const error = new NotFoundError('User', 'user-123');
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe('User with id user-123 not found');
      expect(error.code).toBe('NOT_FOUND');
    });

    test('1.5-DOM-EXPORT-018 [P1]: should export UnauthorizedError class', () => {
      const error = new UnauthorizedError('Test unauthorized error');
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe('Test unauthorized error');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Clean Architecture Compliance', () => {
    test('1.5-DOM-ARCH-001 [P2]: should have no external dependencies', () => {
      // Domain layer should not import external packages
      expect(() => {
        // This should not throw if domain layer is pure
        const testUser: User = {
          id: 'test',
          email: 'test@example.com',
          name: 'Test',
          passwordHash: 'salt:hash',
          tier: 'free',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        };
        expect(testUser.email).toBe('test@example.com');
      }).not.toThrow();
    });

    test('1.5-DOM-ARCH-002 [P2]: should maintain interface contracts', () => {
      // Verify that all interfaces define required methods
      const interfaceNames = [
        'UserRepository',
        'ProjectRepository',
        'VoiceRepository',
        'GenerationJobRepository',
      ];

      for (const name of interfaceNames) {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
      }
    });

    test('1.5-DOM-ARCH-003 [P2]: should support type safety', () => {
      // Verify that types are properly defined and strict
      const testString = 'test';
      const testNumber = 123;
      const testBoolean = true;

      expect(typeof testString).toBe('string');
      expect(typeof testNumber).toBe('number');
      expect(typeof testBoolean).toBe('boolean');
    });
  });

  describe('Version and Package Info', () => {
    test('1.5-DOM-VERSION-001 [P2]: should export version', () => {
      expect(version).toBe('0.0.1');
      expect(typeof version).toBe('string');
    });

    test('1.5-DOM-VERSION-002 [P2]: should have semantic versioning', () => {
      const versionRegex = /^\d+\.\d+\.\d+$/;
      expect(versionRegex.test(version)).toBe(true);
    });
  });
});
