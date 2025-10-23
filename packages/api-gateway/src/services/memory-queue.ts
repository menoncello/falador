import type { GenerationJob, Queue } from '../../../core-domain/src/index.js';

/**
 * In-Memory Queue Implementation
 *
 * This is a simple in-memory queue for development and testing.
 * In production, this would use a proper message queue like Redis, RabbitMQ, or AWS SQS.
 */
interface QueueJob {
  id: string;
  job: GenerationJob;
  createdAt: Date;
}

/**
 * In-Memory Queue Implementation
 */
export class MemoryQueue implements Queue {
  private jobs: QueueJob[] = [];
  private completedJobs: Set<string> = new Set();
  private failedJobs: Map<string, string> = new Map();

  /**
   *
   * @param job
   */
  async enqueue(job: GenerationJob): Promise<void> {
    const queueJob: QueueJob = {
      id: job.id,
      job,
      createdAt: new Date(),
    };
    this.jobs.push(queueJob);
  }

  /**
   *
   */
  async dequeue(): Promise<GenerationJob | null> {
    const queueJob = this.jobs.shift();
    return queueJob ? queueJob.job : null;
  }

  /**
   *
   * @param jobId
   */
  async complete(jobId: string): Promise<void> {
    this.completedJobs.add(jobId);
    // Remove from failed jobs if it was there
    this.failedJobs.delete(jobId);
  }

  /**
   *
   * @param jobId
   * @param error
   */
  async fail(jobId: string, error: string): Promise<void> {
    this.failedJobs.set(jobId, error);
  }

  // Utility methods for testing
  /**
   *
   */
  size(): number {
    return this.jobs.length;
  }

  /**
   *
   */
  getCompletedJobs(): string[] {
    return Array.from(this.completedJobs);
  }

  /**
   *
   */
  getFailedJobs(): Map<string, string> {
    return new Map(this.failedJobs);
  }

  /**
   *
   */
  async clear(): Promise<void> {
    this.jobs = [];
    this.completedJobs.clear();
    this.failedJobs.clear();
  }
}
