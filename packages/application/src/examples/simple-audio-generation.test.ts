/**
 * Simple Audio Generation Example Tests
 * Testing the complete Clean Architecture flow demonstration
 */

import 'reflect-metadata';
import type { User, Project, Voice, GenerationJob } from '@falador/core-domain';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type {
  UserManagementUseCase,
  ProjectManagementUseCase,
  AudioGenerationUseCase,
  VoiceManagementUseCase,
} from '../use-cases/index.js';
import { SimpleAudioGenerationExample } from './simple-audio-generation.js';

describe('SimpleAudioGenerationExample', () => {
  let example: SimpleAudioGenerationExample;
  let mockUserUseCase: UserManagementUseCase;
  let mockProjectUseCase: ProjectManagementUseCase;
  let mockAudioUseCase: AudioGenerationUseCase;
  let mockVoiceUseCase: VoiceManagementUseCase;

  beforeEach(() => {
    // Create mock use cases
    mockUserUseCase = {
      createUser: mock(() => Promise.resolve({} as User)),
      getUserById: mock(() => Promise.resolve(null)),
      getUserByEmail: mock(() => Promise.resolve(null)),
      updateUser: mock(() => Promise.resolve({} as User)),
      deleteUser: mock(() => Promise.resolve(true)),
    } as UserManagementUseCase;

    mockProjectUseCase = {
      createProject: mock(() => Promise.resolve({} as Project)),
      getProjectById: mock(() => Promise.resolve(null)),
      getProjectsByUserId: mock(() => Promise.resolve([])),
      updateProject: mock(() => Promise.resolve({} as Project)),
      deleteProject: mock(() => Promise.resolve(true)),
    } as ProjectManagementUseCase;

    mockAudioUseCase = {
      generateAudio: mock(() =>
        Promise.resolve({ jobId: 'job-123', status: 'pending' })
      ),
      getJobStatus: mock(() => Promise.resolve(null)),
      getJobsByProject: mock(() => Promise.resolve([])),
      cancelJob: mock(() => Promise.resolve(true)),
    } as AudioGenerationUseCase;

    mockVoiceUseCase = {
      getAvailableVoices: mock(() => Promise.resolve([])),
      getVoiceById: mock(() => Promise.resolve(null)),
      validateVoice: mock(() => Promise.resolve(false)),
      syncVoicesFromProvider: mock(() => Promise.resolve([])),
      getDefaultVoice: mock(() => Promise.resolve(null)),
    } as VoiceManagementUseCase;

    example = new SimpleAudioGenerationExample(
      mockUserUseCase,
      mockProjectUseCase,
      mockAudioUseCase,
      mockVoiceUseCase
    );
  });

  describe('demonstrateCompleteFlow', () => {
    it('should execute complete flow successfully', async () => {
      // Setup mock data
      const mockUser: User = {
        id: 'user-123',
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date(),
      };

      const mockProject: Project = {
        id: 'project-123',
        title: 'Demo Audiobook Project',
        userId: 'user-123',
        createdAt: new Date(),
      };

      const mockVoice: Voice = {
        id: 'voice-123',
        name: 'Demo Voice',
        language: 'pt-BR',
        gender: 'female',
        provider: 'demo-provider',
        isDefault: true,
      };

      const mockJob: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        text: 'Olá! Este é um exemplo de geração de áudio usando Clean Architecture.',
        voiceId: 'voice-123',
        status: 'completed',
        progress: 100,
        createdAt: new Date(),
      };

      // Setup mock implementations
      mockUserUseCase.createUser.mockResolvedValue(mockUser);
      mockProjectUseCase.createProject.mockResolvedValue(mockProject);
      mockVoiceUseCase.getAvailableVoices.mockResolvedValue([mockVoice]);
      mockAudioUseCase.generateAudio.mockResolvedValue({
        jobId: 'job-123',
        status: 'pending',
      });
      mockAudioUseCase.getJobStatus.mockResolvedValue(mockJob);

      // Execute the flow
      const result = await example.demonstrateCompleteFlow();

      // Verify all use cases were called correctly
      expect(mockUserUseCase.createUser).toHaveBeenCalledWith({
        email: 'demo@example.com',
        name: 'Demo User',
      });

      expect(mockProjectUseCase.createProject).toHaveBeenCalledWith({
        title: 'Demo Audiobook Project',
        userId: 'user-123',
      });

      expect(mockVoiceUseCase.getAvailableVoices).toHaveBeenCalledWith('pt-BR');

      expect(mockAudioUseCase.generateAudio).toHaveBeenCalledWith({
        text: 'Olá! Este é um exemplo de geração de áudio usando Clean Architecture.',
        voiceId: 'voice-123',
        projectId: 'project-123',
        userId: 'user-123',
      });

      expect(mockAudioUseCase.getJobStatus).toHaveBeenCalledWith(
        'job-123',
        'user-123'
      );

      // Verify result
      expect(result).toEqual({
        user: mockUser,
        project: mockProject,
        voice: mockVoice,
        job: mockJob,
      });
    });

    it('should handle job progress correctly', async () => {
      // Setup mock data
      const mockUser: User = {
        id: 'user-123',
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date(),
      };

      const mockProject: Project = {
        id: 'project-123',
        title: 'Demo Project',
        userId: 'user-123',
        createdAt: new Date(),
      };

      const mockVoice: Voice = {
        id: 'voice-123',
        name: 'Demo Voice',
        language: 'pt-BR',
        gender: 'female',
        provider: 'demo-provider',
        isDefault: true,
      };

      const processingJob: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        text: 'Test text',
        voiceId: 'voice-123',
        status: 'processing',
        progress: 50,
        createdAt: new Date(),
      };

      const completedJob: GenerationJob = {
        ...processingJob,
        status: 'completed',
        progress: 100,
      };

      // Setup mocks to simulate job progression
      mockUserUseCase.createUser.mockResolvedValue(mockUser);
      mockProjectUseCase.createProject.mockResolvedValue(mockProject);
      mockVoiceUseCase.getAvailableVoices.mockResolvedValue([mockVoice]);
      mockAudioUseCase.generateAudio.mockResolvedValue({
        jobId: 'job-123',
        status: 'pending',
      });

      // Simulate job progression: pending -> processing -> completed
      mockAudioUseCase.getJobStatus
        .mockResolvedValueOnce({
          ...processingJob,
          status: 'pending',
          progress: 0,
        })
        .mockResolvedValueOnce(processingJob)
        .mockResolvedValueOnce(completedJob);

      const result = await example.demonstrateCompleteFlow();

      expect(result.job.status).toBe('completed');
      expect(result.job.progress).toBe(100);
    });
  });

  describe('demonstrateErrorHandling', () => {
    it('should handle validation errors gracefully', async () => {
      // Setup mocks to throw validation errors
      mockUserUseCase.createUser.mockRejectedValue(
        new ValidationError('Invalid email format')
      );
      mockProjectUseCase.getProjectById.mockRejectedValue(
        new NotFoundError('Project', 'invalid-id')
      );
      mockAudioUseCase.generateAudio.mockRejectedValue(
        new ValidationError('Text cannot be empty')
      );

      // Should not throw errors
      await expect(example.demonstrateErrorHandling()).resolves.not.toThrow();

      // Verify error handling was called
      expect(mockUserUseCase.createUser).toHaveBeenCalled();
      expect(mockProjectUseCase.getProjectById).toHaveBeenCalled();
      expect(mockAudioUseCase.generateAudio).toHaveBeenCalled();
    });

    it('should handle different types of errors', async () => {
      // Test different error types
      mockUserUseCase.createUser.mockRejectedValueOnce(
        new ValidationError('Invalid email')
      );
      mockProjectUseCase.getProjectById.mockRejectedValueOnce(
        new UnauthorizedError('Access denied')
      );
      mockAudioUseCase.generateAudio.mockRejectedValueOnce(
        new NotFoundError('Voice', 'invalid-voice')
      );

      await example.demonstrateErrorHandling();

      // All methods should have been called
      expect(mockUserUseCase.createUser).toHaveBeenCalledTimes(1);
      expect(mockProjectUseCase.getProjectById).toHaveBeenCalledTimes(1);
      expect(mockAudioUseCase.generateAudio).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration verification', () => {
    it('should demonstrate proper dependency flow', async () => {
      // This test verifies that the example properly demonstrates the Clean Architecture flow

      const mockUser: User = {
        id: 'user-123',
        email: 'demo@example.com',
        name: 'Demo User',
        createdAt: new Date(),
      };

      const mockProject: Project = {
        id: 'project-123',
        title: 'Demo Project',
        userId: 'user-123',
        createdAt: new Date(),
      };

      const mockVoice: Voice = {
        id: 'voice-123',
        name: 'Demo Voice',
        language: 'pt-BR',
        gender: 'female',
        provider: 'demo-provider',
        isDefault: true,
      };

      const mockJob: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        text: 'Test text',
        voiceId: 'voice-123',
        status: 'completed',
        progress: 100,
        createdAt: new Date(),
      };

      // Setup mocks
      mockUserUseCase.createUser.mockResolvedValue(mockUser);
      mockProjectUseCase.createProject.mockResolvedValue(mockProject);
      mockVoiceUseCase.getAvailableVoices.mockResolvedValue([mockVoice]);
      mockAudioUseCase.generateAudio.mockResolvedValue({
        jobId: 'job-123',
        status: 'pending',
      });
      mockAudioUseCase.getJobStatus.mockResolvedValue(mockJob);

      const result = await example.demonstrateCompleteFlow();

      // Verify the flow demonstrates all layers:
      // 1. User creation (Domain -> Application -> Infrastructure)
      // 2. Project creation (Domain -> Application -> Infrastructure)
      // 3. Voice retrieval (Domain -> Application -> Infrastructure)
      // 4. Audio generation (Domain -> Application -> Infrastructure)
      // 5. Job monitoring (Domain -> Application -> Infrastructure)

      expect(result.user.id).toBe(mockUser.id);
      expect(result.project.userId).toBe(mockUser.id);
      expect(result.voice.id).toBe(mockJob.voiceId);
      expect(result.job.projectId).toBe(mockProject.id);

      // Verify call order represents the correct flow
      expect(mockUserUseCase.createUser).toHaveBeenCalledBefore(
        mockProjectUseCase.createProject as any
      );
      expect(mockProjectUseCase.createProject).toHaveBeenCalledBefore(
        mockVoiceUseCase.getAvailableVoices as any
      );
      expect(mockVoiceUseCase.getAvailableVoices).toHaveBeenCalledBefore(
        mockAudioUseCase.generateAudio as any
      );
      expect(mockAudioUseCase.generateAudio).toHaveBeenCalledBefore(
        mockAudioUseCase.getJobStatus as any
      );
    });
  });
});
