import { injectable } from 'tsyringe';
import {
  GenerationJob,
  GenerationJobRepository,
} from '../../../core-domain/src/index.js';

/**
 * In-Memory Generation Job Repository Implementation
 *
 * This is a temporary implementation for development and testing.
 * In production, this would be replaced with a database implementation.
 */
@injectable()
export class InMemoryGenerationJobRepository
  implements GenerationJobRepository
{
  private jobs: Map<string, GenerationJob> = new Map();

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<GenerationJob | null> {
    return this.jobs.get(id) || null;
  }

  /**
   *
   * @param projectId
   */
  async findByProjectId(projectId: string): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.projectId === projectId
    );
  }

  /**
   *
   * @param userId
   */
  async findByUserId(userId: string): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.userId === userId
    );
  }

  /**
   *
   * @param status
   */
  async findByStatus(status: string): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === status
    );
  }

  /**
   *
   * @param job
   */
  async save(job: GenerationJob): Promise<GenerationJob> {
    this.jobs.set(job.id, job);
    return job;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  /**
   *
   * @param id
   * @param updates
   */
  async update(
    id: string,
    updates: Partial<GenerationJob>
  ): Promise<GenerationJob | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }

    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  /**
   *
   * @param id
   * @param status
   * @param metadata
   */
  async updateStatus(
    id: string,
    status: string,
    metadata?: Record<string, unknown>
  ): Promise<GenerationJob | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }

    const updatedJob = {
      ...job,
      status,
      ...(metadata && { metadata: { ...job.metadata, ...metadata } }),
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  /**
   *
   */
  async findPendingJobs(): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'pending'
    );
  }

  /**
   *
   */
  async findProcessingJobs(): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'processing'
    );
  }

  /**
   *
   */
  async findCompletedJobs(): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'completed'
    );
  }

  /**
   *
   */
  async findFailedJobs(): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'failed'
    );
  }

  /**
   *
   * @param startDate
   * @param endDate
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.createdAt >= startDate && job.createdAt <= endDate
    );
  }

  /**
   *
   * @param status
   */
  async countByStatus(status: string): Promise<number> {
    return Array.from(this.jobs.values()).filter((job) => job.status === status)
      .length;
  }

  /**
   *
   * @param projectId
   */
  async countByProject(projectId: string): Promise<number> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.projectId === projectId
    ).length;
  }

  /**
   *
   * @param userId
   */
  async countByUser(userId: string): Promise<number> {
    return Array.from(this.jobs.values()).filter((job) => job.userId === userId)
      .length;
  }

  /**
   *
   * @param limit
   */
  async findRecentJobs(limit = 10): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   *
   * @param voiceId
   */
  async findJobsByVoice(voiceId: string): Promise<GenerationJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.voiceId === voiceId
    );
  }

  /**
   *
   * @param id
   * @param progress
   */
  async updateProgress(
    id: string,
    progress: number
  ): Promise<GenerationJob | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }

    const updatedJob = {
      ...job,
      progress,
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  /**
   *
   * @param id
   * @param error
   */
  async setJobError(id: string, error: string): Promise<GenerationJob | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }

    const updatedJob = {
      ...job,
      status: 'failed',
      error,
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  /**
   *
   * @param id
   * @param audioUrl
   * @param metadata
   */
  async completeJob(
    id: string,
    audioUrl?: string,
    metadata?: Record<string, unknown>
  ): Promise<GenerationJob | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }

    const updatedJob = {
      ...job,
      status: 'completed',
      progress: 100,
      ...(audioUrl && { audioUrl }),
      ...(metadata && { metadata: { ...job.metadata, ...metadata } }),
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // Clear all data (useful for testing)
  /**
   *
   */
  clear(): void {
    this.jobs.clear();
  }

  // Get current data size
  /**
   *
   */
  size(): number {
    return this.jobs.size;
  }
}
