/**
 * Queue Implementation
 * In-memory implementation for development/testing
 */

import type { Queue, GenerationJob } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryQueue implements Queue {
  private queue: GenerationJob[] = [];
  private processing = false;

  /**
   *
   * @param job
   */
  async enqueue(job: GenerationJob): Promise<void> {
    this.queue.push(job);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   *
   */
  async dequeue(): Promise<GenerationJob | null> {
    return this.queue.shift() || null;
  }

  /**
   *
   * @param jobId
   */
  async complete(jobId: string): Promise<void> {
    // In a real implementation, this would update job status
    // For now, we'll just log the completion
    console.log(`Job ${jobId} completed`);
  }

  /**
   *
   * @param jobId
   * @param error
   */
  async fail(jobId: string, error: string): Promise<void> {
    // In a real implementation, this would update job status
    // For now, we'll just log the failure
    console.error(`Job ${jobId} failed: ${error}`);
  }

  /**
   *
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue[0];

      try {
        // Simulate job processing
        await this.processJob(job);

        // Remove completed job from queue
        this.queue.shift();
        await this.complete(job.id);
      } catch (error) {
        // Remove failed job from queue
        this.queue.shift();
        await this.fail(
          job.id,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    this.processing = false;
  }

  /**
   *
   * @param job
   */
  private async processJob(job: GenerationJob): Promise<void> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update job progress (in a real implementation, this would update the database)
    console.log(`Processing job ${job.id}: ${job.text.substring(0, 50)}...`);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.queue = [];
  }

  // Helper method for testing
  /**
   *
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  // Helper method for testing
  /**
   *
   */
  isProcessing(): boolean {
    return this.processing;
  }
}
