import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import type { GenerationJob } from '../../../core-domain/src/index.js';
import { MemoryQueue } from './memory-queue';

describe('MemoryQueue', () => {
  let queue: MemoryQueue;
  let mockJob1: GenerationJob;
  let mockJob2: GenerationJob;
  let mockJob3: GenerationJob;

  beforeEach(() => {
    queue = new MemoryQueue();
    mockJob1 = {
      id: 'job-1',
      projectId: 'project-1',
      userId: 'user-1',
      status: 'pending',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    } as GenerationJob;

    mockJob2 = {
      id: 'job-2',
      projectId: 'project-2',
      userId: 'user-2',
      status: 'pending',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    } as GenerationJob;

    mockJob3 = {
      id: 'job-3',
      projectId: 'project-3',
      userId: 'user-3',
      status: 'pending',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    } as GenerationJob;
  });

  afterEach(async () => {
    await queue.clear();
  });

  describe('enqueue', () => {
    it('should add job to empty queue', async () => {
      // Act
      await queue.enqueue(mockJob1);

      // Assert
      expect(queue.size()).toBe(1);
    });

    it('should add multiple jobs to queue', async () => {
      // Act
      await queue.enqueue(mockJob1);
      await queue.enqueue(mockJob2);
      await queue.enqueue(mockJob3);

      // Assert
      expect(queue.size()).toBe(3);
    });

    it('should handle job with missing properties', async () => {
      // Arrange
      const incompleteJob = { id: 'incomplete' } as GenerationJob;

      // Act
      await queue.enqueue(incompleteJob);

      // Assert
      expect(queue.size()).toBe(1);
    });
  });

  describe('dequeue', () => {
    it('should return null from empty queue', async () => {
      // Act
      const result = await queue.dequeue();

      // Assert
      expect(result).toBeNull();
    });

    it('should dequeue job in FIFO order', async () => {
      // Arrange
      await queue.enqueue(mockJob1);
      await queue.enqueue(mockJob2);
      await queue.enqueue(mockJob3);

      // Act
      const job1 = await queue.dequeue();
      const job2 = await queue.dequeue();
      const job3 = await queue.dequeue();

      // Assert
      expect(job1).toBe(mockJob1);
      expect(job2).toBe(mockJob2);
      expect(job3).toBe(mockJob3);
      expect(queue.size()).toBe(0);
    });

    it('should return null after all jobs dequeued', async () => {
      // Arrange
      await queue.enqueue(mockJob1);
      await queue.dequeue();

      // Act
      const result = await queue.dequeue();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle mixed enqueue/dequeue operations', async () => {
      // Act & Assert
      await queue.enqueue(mockJob1);
      expect(await queue.dequeue()).toBe(mockJob1);
      expect(await queue.dequeue()).toBeNull();

      await queue.enqueue(mockJob2);
      expect(await queue.dequeue()).toBe(mockJob2);
      expect(await queue.dequeue()).toBeNull();

      expect(queue.size()).toBe(0);
    });
  });

  describe('complete', () => {
    it('should mark job as completed', async () => {
      // Arrange
      await queue.enqueue(mockJob1);

      // Act
      await queue.complete(mockJob1.id);

      // Assert
      const completedJobs = queue.getCompletedJobs();
      expect(completedJobs).toContain(mockJob1.id);
      expect(completedJobs).toHaveLength(1);
    });

    it('should handle completion of non-existent job', async () => {
      // Act
      await queue.complete('non-existent-job-id');

      // Assert
      const completedJobs = queue.getCompletedJobs();
      expect(completedJobs).toContain('non-existent-job-id');
      expect(completedJobs).toHaveLength(1);
    });

    it('should handle completion of empty job id', async () => {
      // Act
      await queue.complete('');

      // Assert
      const completedJobs = queue.getCompletedJobs();
      expect(completedJobs).toContain('');
      expect(completedJobs).toHaveLength(1);
    });

    it('should remove job from failed jobs when completed', async () => {
      // Arrange
      await queue.fail(mockJob1.id, 'test error');

      // Act
      await queue.complete(mockJob1.id);

      // Assert
      const failedJobs = queue.getFailedJobs();
      const completedJobs = queue.getCompletedJobs();

      expect(failedJobs.has(mockJob1.id)).toBe(false);
      expect(completedJobs).toContain(mockJob1.id);
    });

    it('should handle multiple completions', async () => {
      // Arrange
      await queue.enqueue(mockJob1);
      await queue.enqueue(mockJob2);

      // Act
      await queue.complete(mockJob1.id);
      await queue.complete(mockJob2.id);

      // Assert
      const completedJobs = queue.getCompletedJobs();
      expect(completedJobs).toEqual(
        expect.arrayContaining([mockJob1.id, mockJob2.id])
      );
      expect(completedJobs).toHaveLength(2);
    });
  });

  describe('fail', () => {
    it('should mark job as failed with error message', async () => {
      // Arrange
      const errorMessage = 'Processing failed';

      // Act
      await queue.fail(mockJob1.id, errorMessage);

      // Assert
      const failedJobs = queue.getFailedJobs();
      expect(failedJobs.get(mockJob1.id)).toBe(errorMessage);
      expect(failedJobs.size).toBe(1);
    });

    it('should handle failure of non-existent job', async () => {
      // Arrange
      const errorMessage = 'Job not found';

      // Act
      await queue.fail('non-existent-job-id', errorMessage);

      // Assert
      const failedJobs = queue.getFailedJobs();
      expect(failedJobs.get('non-existent-job-id')).toBe(errorMessage);
    });

    it('should handle failure with empty error message', async () => {
      // Act
      await queue.fail(mockJob1.id, '');

      // Assert
      const failedJobs = queue.getFailedJobs();
      expect(failedJobs.get(mockJob1.id)).toBe('');
    });

    it('should overwrite previous failure for same job', async () => {
      // Arrange
      await queue.fail(mockJob1.id, 'first error');

      // Act
      await queue.fail(mockJob1.id, 'second error');

      // Assert
      const failedJobs = queue.getFailedJobs();
      expect(failedJobs.get(mockJob1.id)).toBe('second error');
      expect(failedJobs.size).toBe(1);
    });

    it('should handle multiple failures', async () => {
      // Arrange
      await queue.enqueue(mockJob1);
      await queue.enqueue(mockJob2);

      // Act
      await queue.fail(mockJob1.id, 'error 1');
      await queue.fail(mockJob2.id, 'error 2');

      // Assert
      const failedJobs = queue.getFailedJobs();
      expect(failedJobs.get(mockJob1.id)).toBe('error 1');
      expect(failedJobs.get(mockJob2.id)).toBe('error 2');
      expect(failedJobs.size).toBe(2);
    });
  });

  describe('utility methods', () => {
    describe('size', () => {
      it('should return 0 for empty queue', () => {
        // Act & Assert
        expect(queue.size()).toBe(0);
      });

      it('should return correct size after enqueuing jobs', async () => {
        // Act
        await queue.enqueue(mockJob1);
        await queue.enqueue(mockJob2);

        // Assert
        expect(queue.size()).toBe(2);
      });

      it('should return correct size after dequeuing jobs', async () => {
        // Arrange
        await queue.enqueue(mockJob1);
        await queue.enqueue(mockJob2);
        await queue.dequeue();

        // Assert
        expect(queue.size()).toBe(1);
      });
    });

    describe('getCompletedJobs', () => {
      it('should return empty array for no completed jobs', () => {
        // Act & Assert
        expect(queue.getCompletedJobs()).toEqual([]);
      });

      it('should return completed job IDs', async () => {
        // Arrange
        await queue.complete(mockJob1.id);
        await queue.complete(mockJob2.id);

        // Act
        const completedJobs = queue.getCompletedJobs();

        // Assert
        expect(completedJobs).toEqual(
          expect.arrayContaining([mockJob1.id, mockJob2.id])
        );
        expect(completedJobs).toHaveLength(2);
      });
    });

    describe('getFailedJobs', () => {
      it('should return empty map for no failed jobs', () => {
        // Act & Assert
        expect(queue.getFailedJobs().size).toBe(0);
      });

      it('should return failed jobs with error messages', async () => {
        // Arrange
        await queue.fail(mockJob1.id, 'error 1');
        await queue.fail(mockJob2.id, 'error 2');

        // Act
        const failedJobs = queue.getFailedJobs();

        // Assert
        expect(failedJobs.get(mockJob1.id)).toBe('error 1');
        expect(failedJobs.get(mockJob2.id)).toBe('error 2');
        expect(failedJobs.size).toBe(2);
      });
    });

    describe('clear', () => {
      it('should clear all jobs, completed jobs, and failed jobs', async () => {
        // Arrange
        await queue.enqueue(mockJob1);
        await queue.enqueue(mockJob2);
        await queue.complete(mockJob1.id);
        await queue.fail(mockJob2.id, 'error');

        // Act
        await queue.clear();

        // Assert
        expect(queue.size()).toBe(0);
        expect(queue.getCompletedJobs()).toEqual([]);
        expect(queue.getFailedJobs().size).toBe(0);
      });

      it('should handle clearing empty queue', async () => {
        // Act & Assert - should not throw
        await expect(queue.clear()).resolves.toBeUndefined();
        expect(queue.size()).toBe(0);
      });
    });
  });

  describe('integration behavior', () => {
    it('should handle complex queue operations', async () => {
      // Arrange & Act - Complex workflow
      await queue.enqueue(mockJob1);
      await queue.enqueue(mockJob2);
      await queue.enqueue(mockJob3);

      expect(queue.size()).toBe(3);

      const job1 = await queue.dequeue();
      expect(job1).toBe(mockJob1);
      expect(queue.size()).toBe(2);

      await queue.complete(job1!.id);
      expect(queue.getCompletedJobs()).toContain(job1!.id);

      const job2 = await queue.dequeue();
      expect(job2).toBe(mockJob2);

      await queue.fail(job2!.id, 'processing error');
      expect(queue.getFailedJobs().get(job2!.id)).toBe('processing error');

      const job3 = await queue.dequeue();
      expect(job3).toBe(mockJob3);
      expect(queue.size()).toBe(0);

      await queue.complete(job3!.id);

      // Assert final state
      expect(queue.getCompletedJobs()).toEqual(
        expect.arrayContaining([job1!.id, job3!.id])
      );
      expect(queue.getFailedJobs().get(job2!.id)).toBe('processing error');
    });

    it('should maintain queue state across multiple operations', async () => {
      // Arrange & Act
      for (let i = 0; i < 10; i++) {
        const job = { ...mockJob1, id: `job-${i}` } as GenerationJob;
        await queue.enqueue(job);
      }

      expect(queue.size()).toBe(10);

      // Process half the jobs
      for (let i = 0; i < 5; i++) {
        const job = await queue.dequeue();
        await queue.complete(job!.id);
      }

      // Fail the rest
      const remainingSize = queue.size();
      for (let i = 0; i < remainingSize; i++) {
        const job = await queue.dequeue();
        await queue.fail(job!.id, `error-${i}`);
      }

      // Assert
      expect(queue.size()).toBe(0);
      expect(queue.getCompletedJobs()).toHaveLength(5);
      expect(queue.getFailedJobs().size).toBe(5);
    });
  });
});
