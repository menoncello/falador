/**
 * Project Controller
 * REST API endpoints for project management
 */

import type { ProjectManagementUseCase } from '@falador/application/use-cases/project-management.js';
import type {
  Project,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@falador/core-domain';
import type { Elysia } from 'elysia';
import { injectable, inject } from 'tsyringe';

export interface CreateProjectRequest {
  title: string;
  userId: string;
}

export interface UpdateProjectRequest {
  title?: string;
}

export interface ProjectResponse {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

/**
 *
 */
@injectable()
export class ProjectController {
  /**
   *
   * @param projectUseCase
   */
  constructor(
    @inject('ProjectManagementUseCase')
    private projectUseCase: ProjectManagementUseCase
  ) {}

  /**
   *
   * @param app
   */
  registerRoutes(app: Elysia): void {
    // POST /api/projects - Create project
    app.post('/api/projects', async ({ body, set }) => {
      try {
        const request = body as CreateProjectRequest;
        const project = await this.projectUseCase.createProject(request);

        set.status = 201;
        return this.mapProjectToResponse(project);
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

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to create project',
        } as ErrorResponse;
      }
    });

    // GET /api/projects/:id - Get project by ID
    app.get('/api/projects/:id', async ({ params, query, set }) => {
      try {
        const userId = query.userId as string;
        const project = await this.projectUseCase.getProjectById(
          params.id,
          userId
        );

        if (!project) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: 'Project not found',
          } as ErrorResponse;
        }

        return this.mapProjectToResponse(project);
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
          message: 'Failed to get project',
        } as ErrorResponse;
      }
    });

    // GET /api/users/:userId/projects - Get projects by user ID
    app.get('/api/users/:userId/projects', async ({ params, set }) => {
      try {
        const projects = await this.projectUseCase.getProjectsByUserId(
          params.userId
        );
        return projects.map((project) => this.mapProjectToResponse(project));
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

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to get projects',
        } as ErrorResponse;
      }
    });

    // PUT /api/projects/:id - Update project
    app.put('/api/projects/:id', async ({ params, body, query, set }) => {
      try {
        const request = body as UpdateProjectRequest;
        const userId = query.userId as string;
        const project = await this.projectUseCase.updateProject(
          params.id,
          request,
          userId
        );

        return this.mapProjectToResponse(project);
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
          message: 'Failed to update project',
        } as ErrorResponse;
      }
    });

    // DELETE /api/projects/:id - Delete project
    app.delete('/api/projects/:id', async ({ params, query, set }) => {
      try {
        const userId = query.userId as string;
        const deleted = await this.projectUseCase.deleteProject(
          params.id,
          userId
        );

        if (!deleted) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: 'Project not found',
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
          message: 'Failed to delete project',
        } as ErrorResponse;
      }
    });
  }

  /**
   *
   * @param project
   */
  private mapProjectToResponse(project: Project): ProjectResponse {
    return {
      id: project.id,
      title: project.title,
      userId: project.userId,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt?.toISOString(),
    };
  }
}
