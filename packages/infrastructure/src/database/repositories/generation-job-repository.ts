/**
 * Generation Job Repository Implementation
 * In-memory implementation for development/testing
 */

import type {
  GenerationJob,
  GenerationJobRepository,
} from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryGenerationJobRepository
  implements GenerationJobRepository
{
  private jobs: Map<string, GenerationJob> = new Map();

  /**
   *
   * @param jobData
   */
  async create(
    jobData: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GenerationJob> {
    const id = this.generateId();
    const now = new Date();
    const job: GenerationJob = {
      id,
      ...jobData,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(id, job);
    return job;
  }

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
    const projectJobs: GenerationJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.projectId === projectId) {
        projectJobs.push(job);
      }
    }
    // Sort by creation date, newest first
    return projectJobs.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   *
   * @param id
   * @param updates
   */
  async update(
    id: string,
    updates: Partial<GenerationJob>
  ): Promise<GenerationJob> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) {
      throw new Error(`Job with id ${id} not found`);
    }

    const updatedJob: GenerationJob = {
      ...existingJob,
      ...updates,
      updatedAt: new Date(),
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.jobs.clear();
  }

  // Helper method for testing
  /**
   *
   */
  getAll(): GenerationJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   *
   */
  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
