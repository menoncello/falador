import type {
  GenerationJobRepository,
  ProjectRepository,
  UserRepository,
  VoiceRepository,
  TTSEngine,
  Storage,
  Queue,
  GenerationJob,
  Project,
  User,
  Voice,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@falador/core-domain';
import { describe, expect, test, beforeEach, jest } from 'bun:test';
import {
  AudioGenerationUseCase,
  type GenerateAudioRequest,
  type AudioResult,
} from './audio-generation';

// Mock implementations
const mockUserRepository: jest.Mocked<UserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectRepository: jest.Mocked<ProjectRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockVoiceRepository: jest.Mocked<VoiceRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findByLanguage: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockJobRepository: jest.Mocked<GenerationJobRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByProjectId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTTSEngine: jest.Mocked<TTSEngine> = {
  generate: jest.fn(),
  getVoices: jest.fn(),
  validateVoice: jest.fn(),
};

const mockStorage: jest.Mocked<Storage> = {
  save: jest.fn(),
  load: jest.fn(),
  delete: jest.fn(),
};

const mockQueue: jest.Mocked<Queue> = {
  enqueue: jest.fn(),
  dequeue: jest.fn(),
  complete: jest.fn(),
  fail: jest.fn(),
};

describe('AudioGenerationUseCase - Business Logic Orchestration', () => {
  let audioGeneration: AudioGenerationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    audioGeneration = new AudioGenerationUseCase(
      mockUserRepository,
      mockProjectRepository,
      mockVoiceRepository,
      mockJobRepository,
      mockTTSEngine,
      mockStorage,
      mockQueue
    );
  });

  describe('generateAudio', () => {
    test('should generate audio with valid request', async () => {
      // Arrange
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
        userId: 'user-123',
      };

      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);
      mockJobRepository.create.mockResolvedValue(job);
      mockQueue.enqueue.mockResolvedValue();

      // Act
      const result = await audioGeneration.generateAudio(request);

      // Assert
      expect(result).toEqual({
        jobId: 'job-123',
        status: 'pending',
      });
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(
        'project-123'
      );
      expect(mockVoiceRepository.findById).toHaveBeenCalledWith('voice-123');
      expect(mockTTSEngine.validateVoice).toHaveBeenCalledWith('voice-123');
      expect(mockJobRepository.create).toHaveBeenCalledWith({
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
        status: 'pending',
        progress: 0,
      });
      expect(mockQueue.enqueue).toHaveBeenCalledWith(job);
    });

    test('should reject generation with missing text', async () => {
      const request: GenerateAudioRequest = {
        text: '',
        voiceId: 'voice-123',
        projectId: 'project-123',
      };

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
      expect(mockQueue.enqueue).not.toHaveBeenCalled();
    });

    test('should reject generation with missing voice ID', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: '',
        projectId: 'project-123',
      };

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should reject generation with missing project ID', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: '',
      };

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should reject generation when text is too long', async () => {
      const request: GenerateAudioRequest = {
        text: 'A'.repeat(10001), // Over limit
        voiceId: 'voice-123',
        projectId: 'project-123',
      };

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should reject generation when project not found', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'nonexistent-project',
      };

      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        NotFoundError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should reject generation when user does not have project access', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
        userId: 'different-user',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        UnauthorizedError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should reject generation when voice not found', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'nonexistent-voice',
        projectId: 'project-123',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(null);

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        NotFoundError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should reject generation when voice is not available', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(false);

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should trim whitespace from text', async () => {
      const request: GenerateAudioRequest = {
        text: '  Hello, world!  ',
        voiceId: 'voice-123',
        projectId: 'project-123',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);
      mockJobRepository.create.mockResolvedValue(job);
      mockQueue.enqueue.mockResolvedValue();

      await audioGeneration.generateAudio(request);

      expect(mockJobRepository.create).toHaveBeenCalledWith({
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
        status: 'pending',
        progress: 0,
      });
    });

    test('should allow generation without user ID (public access)', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
        // No userId provided
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);
      mockJobRepository.create.mockResolvedValue(job);
      mockQueue.enqueue.mockResolvedValue();

      const result = await audioGeneration.generateAudio(request);

      expect(result).toEqual({
        jobId: 'job-123',
        status: 'pending',
      });
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    test('should return job status when found', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'processing',
        progress: 50,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const project: Project = {
        id: 'project-123',
        userId,
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockJobRepository.findById.mockResolvedValue(job);
      mockProjectRepository.findById.mockResolvedValue(project);

      const result = await audioGeneration.getJobStatus(jobId, userId);

      expect(result).toEqual(job);
      expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(
        'project-123'
      );
    });

    test('should return null when job not found', async () => {
      const jobId = 'nonexistent-job';

      mockJobRepository.findById.mockResolvedValue(null);

      const result = await audioGeneration.getJobStatus(jobId);

      expect(result).toBeNull();
      expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
    });

    test('should reject request with missing job ID', async () => {
      await expect(audioGeneration.getJobStatus('')).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.findById).not.toHaveBeenCalled();
    });

    test('should reject when user does not have access to job', async () => {
      const jobId = 'job-123';
      const userId = 'different-user';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockJobRepository.findById.mockResolvedValue(job);
      mockProjectRepository.findById.mockResolvedValue(project);

      await expect(audioGeneration.getJobStatus(jobId, userId)).rejects.toThrow(
        UnauthorizedError
      );
    });

    test('should allow access without user ID', async () => {
      const jobId = 'job-123';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'completed',
        progress: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockJobRepository.findById.mockResolvedValue(job);

      const result = await audioGeneration.getJobStatus(jobId);

      expect(result).toEqual(job);
      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getJobsByProject', () => {
    test('should return jobs for project when user has access', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';

      const project: Project = {
        id: projectId,
        userId,
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const jobs: GenerationJob[] = [
        {
          id: 'job-1',
          projectId,
          voiceId: 'voice-123',
          text: 'Hello',
          status: 'completed',
          progress: 100,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'job-2',
          projectId,
          voiceId: 'voice-456',
          text: 'World',
          status: 'pending',
          progress: 0,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockProjectRepository.findById.mockResolvedValue(project);
      mockJobRepository.findByProjectId.mockResolvedValue(jobs);

      const result = await audioGeneration.getJobsByProject(projectId, userId);

      expect(result).toEqual(jobs);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockJobRepository.findByProjectId).toHaveBeenCalledWith(projectId);
    });

    test('should reject when project not found', async () => {
      const projectId = 'nonexistent-project';

      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(audioGeneration.getJobsByProject(projectId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockJobRepository.findByProjectId).not.toHaveBeenCalled();
    });

    test('should reject when user does not have project access', async () => {
      const projectId = 'project-123';
      const userId = 'different-user';

      const project: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);

      await expect(
        audioGeneration.getJobsByProject(projectId, userId)
      ).rejects.toThrow(UnauthorizedError);
      expect(mockJobRepository.findByProjectId).not.toHaveBeenCalled();
    });

    test('should reject request with missing project ID', async () => {
      await expect(audioGeneration.getJobsByProject('')).rejects.toThrow(
        ValidationError
      );
      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('cancelJob', () => {
    test('should cancel job when user has access', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'processing',
        progress: 50,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const project: Project = {
        id: 'project-123',
        userId,
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockJobRepository.findById.mockResolvedValue(job);
      mockProjectRepository.findById.mockResolvedValue(project);
      mockJobRepository.update.mockResolvedValue(job);

      const result = await audioGeneration.cancelJob(jobId, userId);

      expect(result).toBe(true);
      expect(mockJobRepository.update).toHaveBeenCalledWith(jobId, {
        status: 'failed',
        errorMessage: 'Cancelled by user',
      });
    });

    test('should reject cancellation when job not found', async () => {
      const jobId = 'nonexistent-job';

      mockJobRepository.findById.mockResolvedValue(null);

      await expect(audioGeneration.cancelJob(jobId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockJobRepository.update).not.toHaveBeenCalled();
    });

    test('should reject cancellation when job is completed', async () => {
      const jobId = 'job-123';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'completed',
        progress: 100,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockJobRepository.findById.mockResolvedValue(job);

      await expect(audioGeneration.cancelJob(jobId)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.update).not.toHaveBeenCalled();
    });

    test('should reject cancellation when job is failed', async () => {
      const jobId = 'job-123';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'failed',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        error: 'Processing failed',
      };

      mockJobRepository.findById.mockResolvedValue(job);

      await expect(audioGeneration.cancelJob(jobId)).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.update).not.toHaveBeenCalled();
    });

    test('should allow cancellation of pending jobs', async () => {
      const jobId = 'job-123';

      const job: GenerationJob = {
        id: jobId,
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Hello, world!',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockJobRepository.findById.mockResolvedValue(job);
      mockProjectRepository.findById.mockResolvedValue(project);
      mockJobRepository.update.mockResolvedValue(job);

      const result = await audioGeneration.cancelJob(jobId, 'user-123');

      expect(result).toBe(true);
      expect(mockJobRepository.update).toHaveBeenCalledWith(jobId, {
        status: 'failed',
        errorMessage: 'Cancelled by user',
      });
    });

    test('should reject request with missing job ID', async () => {
      await expect(audioGeneration.cancelJob('')).rejects.toThrow(
        ValidationError
      );
      expect(mockJobRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      // Test null inputs
      await expect(audioGeneration.getJobStatus(null as any)).rejects.toThrow(
        ValidationError
      );
      await expect(
        audioGeneration.getJobsByProject(null as any)
      ).rejects.toThrow(ValidationError);
      await expect(audioGeneration.cancelJob(null as any)).rejects.toThrow(
        ValidationError
      );

      // Test undefined inputs
      await expect(
        audioGeneration.getJobStatus(undefined as any)
      ).rejects.toThrow(ValidationError);
      await expect(
        audioGeneration.getJobsByProject(undefined as any)
      ).rejects.toThrow(ValidationError);
      await expect(audioGeneration.cancelJob(undefined as any)).rejects.toThrow(
        ValidationError
      );
    });

    test('should handle repository errors gracefully', async () => {
      const jobId = 'job-123';
      mockJobRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(audioGeneration.getJobStatus(jobId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    test('should handle TTS engine errors gracefully', async () => {
      const request: GenerateAudioRequest = {
        text: 'Hello, world!',
        voiceId: 'voice-123',
        projectId: 'project-123',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockRejectedValue(
        new Error('TTS engine unavailable')
      );

      await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
        'TTS engine unavailable'
      );
      expect(mockJobRepository.create).not.toHaveBeenCalled();
    });

    test('should handle timeout scenarios', async () => {
      const jobId = 'job-123';
      mockJobRepository.findById.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const promise = audioGeneration.getJobStatus(jobId);
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('Integration and Workflow Testing', () => {
    test('should handle complete audio generation workflow', async () => {
      const request: GenerateAudioRequest = {
        text: 'Complete workflow test',
        voiceId: 'voice-123',
        projectId: 'project-123',
        userId: 'user-123',
      };

      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        voiceId: 'voice-123',
        text: 'Complete workflow test',
        status: 'pending',
        progress: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      // Setup mocks
      mockUserRepository.findById.mockResolvedValue(user);
      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);
      mockJobRepository.create.mockResolvedValue(job);
      mockQueue.enqueue.mockResolvedValue();

      // Generate audio
      const result = await audioGeneration.generateAudio(request);
      expect(result.jobId).toBe('job-123');

      // Check status
      mockJobRepository.findById.mockResolvedValue(job);
      const status = await audioGeneration.getJobStatus(job.id, user.id);
      expect(status).toEqual(job);

      // Get jobs by project
      mockJobRepository.findByProjectId.mockResolvedValue([job]);
      const jobs = await audioGeneration.getJobsByProject(project.id, user.id);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe(job.id);
    });

    test('should handle complex text validation scenarios', async () => {
      const validTexts = [
        'Short text',
        'A'.repeat(100), // 100 characters
        'Text with punctuation! and numbers 123.',
        'Multi-line\nText\nWith\nNewlines',
        'Special characters: @#$%^&*()',
      ];

      const invalidTexts = [
        '', // Empty
        '   ', // Whitespace only
        'A'.repeat(10001), // Too long
      ];

      const project: Project = {
        id: 'project-123',
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockProjectRepository.findById.mockResolvedValue(project);
      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);
      mockJobRepository.create.mockResolvedValue({} as GenerationJob);
      mockQueue.enqueue.mockResolvedValue();

      // Test valid texts
      for (const text of validTexts) {
        const request: GenerateAudioRequest = {
          text,
          voiceId: 'voice-123',
          projectId: 'project-123',
        };

        await expect(
          audioGeneration.generateAudio(request)
        ).resolves.toBeDefined();
      }

      // Test invalid texts
      for (const text of invalidTexts) {
        const request: GenerateAudioRequest = {
          text,
          voiceId: 'voice-123',
          projectId: 'project-123',
        };

        await expect(audioGeneration.generateAudio(request)).rejects.toThrow(
          ValidationError
        );
      }
    });
  });
});
