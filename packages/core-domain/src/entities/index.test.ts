/**
 * Domain Entities Tests
 * Testing pure business logic with no external dependencies
 */

import { describe, it, expect } from 'bun:test';
import type {
  User,
  Project,
  Voice,
  AudioFile,
  GenerationJob,
} from './index.js';

describe('Domain Entities', () => {
  describe('User Entity', () => {
    it('should have required fields', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should allow optional updatedAt field', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Project Entity', () => {
    it('should have required fields', () => {
      const project: Project = {
        id: 'project-123',
        title: 'Test Project',
        userId: 'user-123',
        createdAt: new Date(),
      };

      expect(project.id).toBe('project-123');
      expect(project.title).toBe('Test Project');
      expect(project.userId).toBe('user-123');
      expect(project.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Voice Entity', () => {
    it('should have required fields', () => {
      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'pt-BR',
        gender: 'female',
        provider: 'test-provider',
        isDefault: false,
      };

      expect(voice.id).toBe('voice-123');
      expect(voice.name).toBe('Test Voice');
      expect(voice.language).toBe('pt-BR');
      expect(voice.gender).toBe('female');
      expect(voice.provider).toBe('test-provider');
      expect(voice.isDefault).toBe(false);
    });

    it('should support all gender types', () => {
      const maleVoice: Voice = {
        id: 'voice-male',
        name: 'Male Voice',
        language: 'pt-BR',
        gender: 'male',
        provider: 'test-provider',
        isDefault: false,
      };

      const femaleVoice: Voice = {
        id: 'voice-female',
        name: 'Female Voice',
        language: 'pt-BR',
        gender: 'female',
        provider: 'test-provider',
        isDefault: false,
      };

      const neutralVoice: Voice = {
        id: 'voice-neutral',
        name: 'Neutral Voice',
        language: 'pt-BR',
        gender: 'neutral',
        provider: 'test-provider',
        isDefault: false,
      };

      expect(maleVoice.gender).toBe('male');
      expect(femaleVoice.gender).toBe('female');
      expect(neutralVoice.gender).toBe('neutral');
    });
  });

  describe('AudioFile Entity', () => {
    it('should have required fields', () => {
      const audioFile: AudioFile = {
        id: 'audio-123',
        projectId: 'project-123',
        filename: 'test.mp3',
        path: '/path/to/test.mp3',
        duration: 120,
        size: 1024000,
        format: 'mp3',
        createdAt: new Date(),
      };

      expect(audioFile.id).toBe('audio-123');
      expect(audioFile.projectId).toBe('project-123');
      expect(audioFile.filename).toBe('test.mp3');
      expect(audioFile.path).toBe('/path/to/test.mp3');
      expect(audioFile.duration).toBe(120);
      expect(audioFile.size).toBe(1024000);
      expect(audioFile.format).toBe('mp3');
      expect(audioFile.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('GenerationJob Entity', () => {
    it('should have required fields', () => {
      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        text: 'Test text',
        voiceId: 'voice-123',
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
      };

      expect(job.id).toBe('job-123');
      expect(job.projectId).toBe('project-123');
      expect(job.text).toBe('Test text');
      expect(job.voiceId).toBe('voice-123');
      expect(job.status).toBe('pending');
      expect(job.progress).toBe(0);
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should support all status types', () => {
      const statuses: Array<GenerationJob['status']> = [
        'pending',
        'processing',
        'completed',
        'failed',
      ];

      for (const status of statuses) {
        const job: GenerationJob = {
          id: `job-${status}`,
          projectId: 'project-123',
          text: 'Test text',
          voiceId: 'voice-123',
          status,
          progress: status === 'completed' ? 100 : 0,
          createdAt: new Date(),
        };

        expect(job.status).toBe(status);
      }
    });

    it('should allow optional fields', () => {
      const job: GenerationJob = {
        id: 'job-123',
        projectId: 'project-123',
        text: 'Test text',
        voiceId: 'voice-123',
        status: 'completed',
        progress: 100,
        audioFileId: 'audio-123',
        errorMessage: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(job.audioFileId).toBe('audio-123');
      expect(job.errorMessage).toBeUndefined();
      expect(job.updatedAt).toBeInstanceOf(Date);
    });
  });
});
