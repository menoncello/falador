import { describe, it, expect, beforeEach } from 'bun:test';
import type { GenerationJob } from '../../../core-domain/src/index';
import { InMemoryGenerationJobRepository } from './in-memory-generation-job-repository';

describe('InMemoryGenerationJobRepository', () => {
  let repository: InMemoryGenerationJobRepository;
  let mockJob1: GenerationJob;
  let mockJob2: GenerationJob;
  let mockJob3: GenerationJob;

  beforeEach(() => {
    repository = new InMemoryGenerationJobRepository();

    mockJob1 = {
      id: 'job-1',
      userId: 'user-1',
      projectId: 'project-1',
      voiceId: 'voice-1',
      status: 'pending',
      progress: 0,
      metadata: {},
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    };

    mockJob2 = {
      id: 'job-2',
      userId: 'user-1',
      projectId: 'project-2',
      voiceId: 'voice-2',
      status: 'processing',
      progress: 50,
      metadata: {},
      createdAt: new Date('2025-01-02'),
      updatedAt: new Date('2025-01-02'),
    };

    mockJob3 = {
      id: 'job-3',
      userId: 'user-2',
      projectId: 'project-3',
      voiceId: 'voice-1',
      status: 'completed',
      progress: 100,
      audioUrl: 'https://example.com/audio.mp3',
      metadata: {},
      createdAt: new Date('2025-01-03'),
      updatedAt: new Date('2025-01-03'),
      completedAt: new Date('2025-01-03'),
    };
  });

  describe('save and findById', () => {
    it('should save and retrieve job by id', async () => {
      await repository.save(mockJob1);

      const result = await repository.findById('job-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('job-1');
      expect(result?.userId).toBe('user-1');
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should update existing job when saving with same id', async () => {
      await repository.save(mockJob1);

      const updatedJob = { ...mockJob1, status: 'completed' };
      await repository.save(updatedJob);

      const result = await repository.findById('job-1');

      expect(result?.status).toBe('completed');
      expect(repository.size()).toBe(1);
    });
  });

  describe('findByProjectId', () => {
    it('should find jobs by project id', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findByProjectId('project-1');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe('job-1');
    });

    it('should return empty array for project with no jobs', async () => {
      const result = await repository.findByProjectId('non-existent');

      expect(result).toEqual([]);
    });

    it('should return multiple jobs for same project', async () => {
      const job4 = { ...mockJob1, id: 'job-4', projectId: 'project-1' };
      await repository.save(mockJob1);
      await repository.save(job4);

      const result = await repository.findByProjectId('project-1');

      expect(result.length).toBe(2);
    });
  });

  describe('findByUserId', () => {
    it('should find jobs by user id', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findByUserId('user-1');

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result.every((job) => job.userId === 'user-1')).toBe(true);
    });

    it('should return empty array for user with no jobs', async () => {
      const result = await repository.findByUserId('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find jobs by status', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findByStatus('pending');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe('pending');
    });

    it('should return empty array for status with no jobs', async () => {
      const result = await repository.findByStatus('failed');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete job by id', async () => {
      await repository.save(mockJob1);

      const result = await repository.delete('job-1');

      expect(result).toBe(true);
      expect(repository.size()).toBe(0);
    });

    it('should return false for non-existent job', async () => {
      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should not affect other jobs', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);

      await repository.delete('job-1');

      expect(repository.size()).toBe(1);
      const remaining = await repository.findById('job-2');
      expect(remaining).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update job', async () => {
      await repository.save(mockJob1);

      const result = await repository.update('job-1', {
        status: 'processing',
        progress: 25,
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe('processing');
      expect(result?.progress).toBe(25);
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.update('non-existent', {
        status: 'completed',
      });

      expect(result).toBeNull();
    });

    it('should merge updates with existing data', async () => {
      await repository.save(mockJob1);

      const result = await repository.update('job-1', { progress: 30 });

      expect(result?.id).toBe('job-1');
      expect(result?.userId).toBe('user-1');
      expect(result?.progress).toBe(30);
      expect(result?.status).toBe('pending');
    });
  });

  describe('updateStatus', () => {
    it('should update job status', async () => {
      await repository.save(mockJob1);

      const result = await repository.updateStatus('job-1', 'processing');

      expect(result).toBeDefined();
      expect(result?.status).toBe('processing');
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should update status with metadata', async () => {
      await repository.save(mockJob1);

      const result = await repository.updateStatus('job-1', 'failed', {
        error: 'Test error',
      });

      expect(result?.status).toBe('failed');
      expect(result?.metadata.error).toBe('Test error');
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.updateStatus('non-existent', 'completed');

      expect(result).toBeNull();
    });

    it('should merge metadata with existing', async () => {
      const jobWithMeta = { ...mockJob1, metadata: { existing: 'data' } };
      await repository.save(jobWithMeta);

      const result = await repository.updateStatus('job-1', 'processing', {
        new: 'metadata',
      });

      expect(result?.metadata.existing).toBe('data');
      expect(result?.metadata.new).toBe('metadata');
    });
  });

  describe('findPendingJobs', () => {
    it('should find all pending jobs', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findPendingJobs();

      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe('pending');
    });

    it('should return empty array when no pending jobs', async () => {
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findPendingJobs();

      expect(result).toEqual([]);
    });
  });

  describe('findProcessingJobs', () => {
    it('should find all processing jobs', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findProcessingJobs();

      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe('processing');
    });
  });

  describe('findCompletedJobs', () => {
    it('should find all completed jobs', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findCompletedJobs();

      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe('completed');
    });
  });

  describe('findFailedJobs', () => {
    it('should find all failed jobs', async () => {
      const failedJob = { ...mockJob1, status: 'failed' };
      await repository.save(failedJob);
      await repository.save(mockJob2);

      const result = await repository.findFailedJobs();

      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe('failed');
    });

    it('should return empty array when no failed jobs', async () => {
      await repository.save(mockJob1);

      const result = await repository.findFailedJobs();

      expect(result).toEqual([]);
    });
  });

  describe('findByDateRange', () => {
    it('should find jobs within date range', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findByDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-02')
      );

      expect(result.length).toBe(2);
    });

    it('should return empty array for range with no jobs', async () => {
      await repository.save(mockJob1);

      const result = await repository.findByDateRange(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(result).toEqual([]);
    });

    it('should include jobs on boundary dates', async () => {
      await repository.save(mockJob1);

      const result = await repository.findByDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-01')
      );

      expect(result.length).toBe(1);
    });
  });

  describe('countByStatus', () => {
    it('should count jobs by status', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.countByStatus('pending');

      expect(result).toBe(1);
    });

    it('should return 0 for status with no jobs', async () => {
      const result = await repository.countByStatus('failed');

      expect(result).toBe(0);
    });
  });

  describe('countByProject', () => {
    it('should count jobs by project', async () => {
      await repository.save(mockJob1);
      await repository.save({ ...mockJob2, projectId: 'project-1' });

      const result = await repository.countByProject('project-1');

      expect(result).toBe(2);
    });

    it('should return 0 for project with no jobs', async () => {
      const result = await repository.countByProject('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('countByUser', () => {
    it('should count jobs by user', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.countByUser('user-1');

      expect(result).toBe(2);
    });

    it('should return 0 for user with no jobs', async () => {
      const result = await repository.countByUser('non-existent');

      expect(result).toBe(0);
    });
  });

  describe('findRecentJobs', () => {
    it('should find recent jobs sorted by creation date', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findRecentJobs(2);

      expect(result.length).toBe(2);
      expect(result[0]?.id).toBe('job-3');
      expect(result[1]?.id).toBe('job-2');
    });

    it('should default to 10 jobs when limit not specified', async () => {
      for (let i = 0; i < 15; i++) {
        await repository.save({ ...mockJob1, id: `job-${i}` });
      }

      const result = await repository.findRecentJobs();

      expect(result.length).toBe(10);
    });

    it('should return all jobs when fewer than limit', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);

      const result = await repository.findRecentJobs(10);

      expect(result.length).toBe(2);
    });
  });

  describe('findJobsByVoice', () => {
    it('should find jobs by voice id', async () => {
      await repository.save(mockJob1);
      await repository.save(mockJob2);
      await repository.save(mockJob3);

      const result = await repository.findJobsByVoice('voice-1');

      expect(result.length).toBe(2);
      expect(result.every((job) => job.voiceId === 'voice-1')).toBe(true);
    });

    it('should return empty array for voice with no jobs', async () => {
      const result = await repository.findJobsByVoice('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('updateProgress', () => {
    it('should update job progress', async () => {
      await repository.save(mockJob1);

      const result = await repository.updateProgress('job-1', 75);

      expect(result).toBeDefined();
      expect(result?.progress).toBe(75);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.updateProgress('non-existent', 50);

      expect(result).toBeNull();
    });

    it('should allow progress to be 0', async () => {
      await repository.save(mockJob2);

      const result = await repository.updateProgress('job-2', 0);

      expect(result?.progress).toBe(0);
    });

    it('should allow progress to be 100', async () => {
      await repository.save(mockJob1);

      const result = await repository.updateProgress('job-1', 100);

      expect(result?.progress).toBe(100);
    });
  });

  describe('setJobError', () => {
    it('should set job error and mark as failed', async () => {
      await repository.save(mockJob1);

      const result = await repository.setJobError(
        'job-1',
        'Test error message'
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('failed');
      expect(result?.error).toBe('Test error message');
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.setJobError('non-existent', 'Error');

      expect(result).toBeNull();
    });

    it('should preserve other job fields', async () => {
      await repository.save(mockJob1);

      const result = await repository.setJobError('job-1', 'Error');

      expect(result?.id).toBe('job-1');
      expect(result?.userId).toBe('user-1');
      expect(result?.projectId).toBe('project-1');
    });
  });

  describe('completeJob', () => {
    it('should complete job with audio url', async () => {
      await repository.save(mockJob1);

      const audioUrl = 'https://example.com/output.mp3';
      const result = await repository.completeJob('job-1', audioUrl);

      expect(result).toBeDefined();
      expect(result?.status).toBe('completed');
      expect(result?.progress).toBe(100);
      expect(result?.audioUrl).toBe(audioUrl);
      expect(result?.completedAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should complete job without audio url', async () => {
      await repository.save(mockJob1);

      const result = await repository.completeJob('job-1');

      expect(result?.status).toBe('completed');
      expect(result?.audioUrl).toBeUndefined();
    });

    it('should complete job with metadata', async () => {
      await repository.save(mockJob1);

      const result = await repository.completeJob('job-1', undefined, {
        duration: 120,
        size: 5000000,
      });

      expect(result?.metadata.duration).toBe(120);
      expect(result?.metadata.size).toBe(5000000);
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.completeJob('non-existent');

      expect(result).toBeNull();
    });

    it('should merge metadata with existing', async () => {
      const jobWithMeta = { ...mockJob1, metadata: { existing: 'value' } };
      await repository.save(jobWithMeta);

      const result = await repository.completeJob('job-1', undefined, {
        new: 'data',
      });

      expect(result?.metadata.existing).toBe('value');
      expect(result?.metadata.new).toBe('data');
    });
  });

  describe('clear and size', () => {
    it('should clear all jobs', () => {
      repository.save(mockJob1);
      repository.save(mockJob2);

      repository.clear();

      expect(repository.size()).toBe(0);
    });

    it('should return correct size', async () => {
      expect(repository.size()).toBe(0);

      await repository.save(mockJob1);
      expect(repository.size()).toBe(1);

      await repository.save(mockJob2);
      expect(repository.size()).toBe(2);

      await repository.delete('job-1');
      expect(repository.size()).toBe(1);
    });
  });
});
