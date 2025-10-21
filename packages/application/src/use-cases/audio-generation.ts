/**
 * Audio Generation Use Cases
 */

import type {
  GenerationJob,
  GenerationJobRepository,
  ProjectRepository,
  UserRepository,
  TTSEngine,
  Storage,
  Queue,
  VoiceRepository,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@falador/core-domain';
import { injectable, inject } from 'tsyringe';

export interface GenerateAudioRequest {
  text: string;
  voiceId: string;
  projectId: string;
  userId?: string;
}

export interface AudioResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  duration?: number;
  errorMessage?: string;
}

/**
 *
 */
@injectable()
export class AudioGenerationUseCase {
  /**
   *
   * @param userRepository
   * @param projectRepository
   * @param voiceRepository
   * @param jobRepository
   * @param ttsEngine
   * @param storage
   * @param queue
   */
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('ProjectRepository') private projectRepository: ProjectRepository,
    @inject('VoiceRepository') private voiceRepository: VoiceRepository,
    @inject('GenerationJobRepository')
    private jobRepository: GenerationJobRepository,
    @inject('TTSEngine') private ttsEngine: TTSEngine,
    @inject('Storage') private storage: Storage,
    @inject('Queue') private queue: Queue
  ) {}

  /**
   *
   * @param request
   */
  async generateAudio(request: GenerateAudioRequest): Promise<AudioResult> {
    // Validation
    if (!request.text?.trim()) {
      throw new ValidationError('Text is required');
    }
    if (!request.voiceId?.trim()) {
      throw new ValidationError('Voice ID is required');
    }
    if (!request.projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    // Validate text length
    if (request.text.length > 10000) {
      throw new ValidationError('Text is too long (maximum 10,000 characters)');
    }

    // Check if project exists and user has access
    const project = await this.projectRepository.findById(request.projectId);
    if (!project) {
      throw new NotFoundError('Project', request.projectId);
    }
    if (request.userId && project.userId !== request.userId) {
      throw new UnauthorizedError('Not authorized to access this project');
    }

    // Check if voice exists and is valid
    const voice = await this.voiceRepository.findById(request.voiceId);
    if (!voice) {
      throw new NotFoundError('Voice', request.voiceId);
    }

    const isVoiceValid = await this.ttsEngine.validateVoice(request.voiceId);
    if (!isVoiceValid) {
      throw new ValidationError('Voice is not available');
    }

    // Create generation job
    const job = await this.jobRepository.create({
      text: request.text.trim(),
      voiceId: request.voiceId,
      projectId: request.projectId,
      status: 'pending',
      progress: 0,
    });

    // Enqueue job for processing
    await this.queue.enqueue(job);

    return {
      jobId: job.id,
      status: 'pending',
    };
  }

  /**
   *
   * @param jobId
   * @param userId
   */
  async getJobStatus(
    jobId: string,
    userId?: string
  ): Promise<GenerationJob | null> {
    if (!jobId?.trim()) {
      throw new ValidationError('Job ID is required');
    }

    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      return null;
    }

    // If userId is provided, check authorization
    if (userId) {
      const project = await this.projectRepository.findById(job.projectId);
      if (project && project.userId !== userId) {
        throw new UnauthorizedError('Not authorized to access this job');
      }
    }

    return job;
  }

  /**
   *
   * @param projectId
   * @param userId
   */
  async getJobsByProject(
    projectId: string,
    userId?: string
  ): Promise<GenerationJob[]> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    // Check if project exists and user has access
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    if (userId && project.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this project');
    }

    return await this.jobRepository.findByProjectId(projectId);
  }

  /**
   *
   * @param jobId
   * @param userId
   */
  async cancelJob(jobId: string, userId?: string): Promise<boolean> {
    if (!jobId?.trim()) {
      throw new ValidationError('Job ID is required');
    }

    // Check if job exists and user has access
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    if (userId) {
      const project = await this.projectRepository.findById(job.projectId);
      if (project && project.userId !== userId) {
        throw new UnauthorizedError('Not authorized to cancel this job');
      }
    }

    // Can only cancel pending or processing jobs
    if (job.status === 'completed' || job.status === 'failed') {
      throw new ValidationError('Cannot cancel completed or failed jobs');
    }

    // Update job status to failed
    await this.jobRepository.update(jobId, {
      status: 'failed',
      errorMessage: 'Cancelled by user',
    });

    return true;
  }
}
