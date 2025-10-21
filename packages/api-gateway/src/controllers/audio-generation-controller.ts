/**
 * Audio Generation Controller
 * REST API endpoints for audio generation
 */

import type { AudioGenerationUseCase } from '@falador/application/use-cases/audio-generation';
import type { GenerationJob, Elysia } from 'elysia';
import { ValidationError, NotFoundError, UnauthorizedError } from '@falador/core-domain';
import { injectable } from 'tsyringe';
import type { ErrorResponse } from '../types';

export interface GenerateAudioRequest {
  text: string;
  voiceId: string;
  projectId: string;
  userId?: string;
}

export interface AudioGenerationResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  duration?: number;
  errorMessage?: string;
}

export interface JobStatusResponse {
  id: string;
  text: string;
  voiceId: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  audioFileId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

@injectable()
export class AudioGenerationController {
  constructor(
    private audioUseCase: AudioGenerationUseCase
  ) {}

  /**
   *
   * @param app
   */
  registerRoutes(app: Elysia): void {
    // POST /api/audio/generate - Generate audio
    app.post('/api/audio/generate', async ({ body, set }) => {
      try {
        const request = body as GenerateAudioRequest;
        const result = await this.audioUseCase.generateAudio(request);

        set.status = 201;
        return result;
      } catch (error) {
        if (error instanceof ValidationError) {
          set.status = 400;
          return {
            error: 'Validation Error',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof NotFoundError) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof UnauthorizedError) {
          set.status = 403;
          return {
            error: 'Unauthorized',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to generate audio',
        } as ErrorResponse;
      }
    });

    // GET /api/audio/jobs/:jobId - Get job status
    app.get('/api/audio/jobs/:jobId', async ({ params, query, set }) => {
      try {
        const userId = query['userId'] as string;
        const job = await this.audioUseCase.getJobStatus(params.jobId, userId);

        if (!job) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: 'Job not found',
          } as ErrorResponse;
        }

        return this.mapJobToResponse(job);
      } catch (error) {
        if (error instanceof ValidationError) {
          set.status = 400;
          return {
            error: 'Validation Error',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof UnauthorizedError) {
          set.status = 403;
          return {
            error: 'Unauthorized',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to get job status',
        } as ErrorResponse;
      }
    });

    // GET /api/projects/:projectId/jobs - Get jobs by project
    app.get('/api/projects/:projectId/jobs', async ({ params, query, set }) => {
      try {
        const userId = query['userId'] as string;
        const jobs = await this.audioUseCase.getJobsByProject(
          params.projectId,
          userId
        );
        return jobs.map((job) => this.mapJobToResponse(job));
      } catch (error) {
        if (error instanceof ValidationError) {
          set.status = 400;
          return {
            error: 'Validation Error',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof NotFoundError) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof UnauthorizedError) {
          set.status = 403;
          return {
            error: 'Unauthorized',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to get jobs',
        } as ErrorResponse;
      }
    });

    // DELETE /api/audio/jobs/:jobId - Cancel job
    app.delete('/api/audio/jobs/:jobId', async ({ params, query, set }) => {
      try {
        const userId = query['userId'] as string;
        const cancelled = await this.audioUseCase.cancelJob(
          params.jobId,
          userId
        );

        if (!cancelled) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: 'Job not found',
          } as ErrorResponse;
        }

        set.status = 204;
        return null;
      } catch (error) {
        if (error instanceof ValidationError) {
          set.status = 400;
          return {
            error: 'Validation Error',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof NotFoundError) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        if (error instanceof UnauthorizedError) {
          set.status = 403;
          return {
            error: 'Unauthorized',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to cancel job',
        } as ErrorResponse;
      }
    });
  }

  private mapJobToResponse(job: GenerationJob): JobStatusResponse {
    return {
      id: job.id,
      text: job.text,
      voiceId: job.voiceId,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      audioFileId: job.outputPath, // Map outputPath to audioFileId for API response
      errorMessage: job.error, // Map error to errorMessage for API response
      createdAt: typeof job.createdAt === 'string' ? job.createdAt : job.createdAt.toISOString(),
      updatedAt: job.updatedAt ? (typeof job.updatedAt === 'string' ? job.updatedAt : job.updatedAt.toISOString()) : undefined,
    };
  }
}
