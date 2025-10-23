import {
  CreateProjectUseCase,
  GetProjectUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
  ListProjectsUseCase,
} from '@falador/application';
import { resolve } from '@falador/infrastructure/container';
import { Elysia, t } from 'elysia';
import { extractAuthUser } from '../utils/auth';

/**
 * Project API Routes
 *
 * This module defines all HTTP endpoints for project management.
 * All routes use use cases from the application layer following Clean Architecture principles.
 * Dependencies are resolved through the DI container to maintain loose coupling.
 */

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  // GET /api/projects
  .get('/', async ({ headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    // Resolve the ListProjectsUseCase from the DI container
    const listProjectsUseCase =
      resolve<ListProjectsUseCase>(ListProjectsUseCase);

    // Execute the use case
    const result = await listProjectsUseCase.execute({
      userId: authUser.id,
    });

    // Handle the result
    if (!result.success) {
      set.status = 500;
      return { error: result.error };
    }

    set.status = 200;
    return result.projects;
  })

  // POST /api/projects
  .post(
    '/',
    async ({ body, headers, set }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      // Resolve the CreateProjectUseCase from the DI container
      const createProjectUseCase =
        resolve<CreateProjectUseCase>(CreateProjectUseCase);

      // Execute the use case
      const result = await createProjectUseCase.execute({
        userId: authUser.id,
        title: body.title || '',
        ...(body.author && { author: body.author }),
        ...(body.language && { language: body.language }),
        ...(body.genre && { genre: body.genre }),
        ...(body.status && { status: body.status }),
        ...(body.metadata && { metadata: body.metadata }),
      });

      // Handle the result
      if (!result.success) {
        // Map business logic errors to appropriate HTTP status codes
        if (result.error?.includes('not found')) {
          set.status = 404;
        } else if (result.error?.includes('limit exceeded')) {
          set.status = 403;
        } else if (
          result.error?.includes('required') ||
          result.error?.includes('must be')
        ) {
          set.status = 400;
        } else {
          set.status = 500;
        }
        return { error: result.error };
      }

      set.status = 201;
      return result.project;
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        author: t.Optional(t.String()),
        language: t.Optional(t.Union([t.Literal('pt-BR'), t.Literal('en')])),
        genre: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal('draft'),
            t.Literal('queued'),
            t.Literal('processing'),
            t.Literal('completed'),
            t.Literal('failed'),
          ])
        ),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  )

  // GET /api/projects/:id
  .get('/:id', async ({ params, headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    // Resolve the GetProjectUseCase from the DI container
    const getProjectUseCase = resolve<GetProjectUseCase>(GetProjectUseCase);

    // Execute the use case
    const result = await getProjectUseCase.execute({
      projectId: params.id,
      userId: authUser.id,
    });

    // Handle the result
    if (!result.success) {
      // Map business logic errors to appropriate HTTP status codes
      if (result.error?.includes('not found')) {
        set.status = 404;
      } else if (
        result.error?.includes('Forbidden') ||
        result.error?.includes('access') ||
        result.error?.includes('authorization')
      ) {
        set.status = 403;
      } else {
        set.status = 500;
      }
      return { error: result.error };
    }

    set.status = 200;
    return result.project;
  })

  // PATCH /api/projects/:id
  .patch(
    '/:id',
    async ({ params, body, headers, set }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      // Resolve the UpdateProjectUseCase from the DI container
      const updateProjectUseCase =
        resolve<UpdateProjectUseCase>(UpdateProjectUseCase);

      // Execute the use case
      const result = await updateProjectUseCase.execute({
        projectId: params.id,
        userId: authUser.id,
        ...(body.title !== undefined && { title: body.title }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
      });

      // Handle the result
      if (!result.success) {
        // Map business logic errors to appropriate HTTP status codes
        if (result.error?.includes('not found')) {
          set.status = 404;
        } else if (
          result.error?.includes('Forbidden') ||
          result.error?.includes('access') ||
          result.error?.includes('authorization')
        ) {
          set.status = 403;
        } else if (
          result.error?.includes('required') ||
          result.error?.includes('must be')
        ) {
          set.status = 400;
        } else {
          set.status = 500;
        }
        return { error: result.error };
      }

      set.status = 200;
      return result.project;
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        author: t.Optional(t.String()),
        language: t.Optional(t.Union([t.Literal('pt-BR'), t.Literal('en')])),
        genre: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal('draft'),
            t.Literal('queued'),
            t.Literal('processing'),
            t.Literal('completed'),
            t.Literal('failed'),
          ])
        ),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  )

  // DELETE /api/projects/:id
  .delete('/:id', async ({ params, headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    // Resolve the DeleteProjectUseCase from the DI container
    const deleteProjectUseCase =
      resolve<DeleteProjectUseCase>(DeleteProjectUseCase);

    // Execute the use case
    const result = await deleteProjectUseCase.execute({
      projectId: params.id,
      userId: authUser.id,
    });

    // Handle the result
    if (!result.success) {
      // Map business logic errors to appropriate HTTP status codes
      if (result.error?.includes('not found')) {
        set.status = 404;
      } else if (
        result.error?.includes('Forbidden') ||
        result.error?.includes('access') ||
        result.error?.includes('authorization')
      ) {
        set.status = 403;
      } else {
        set.status = 500;
      }
      return { error: result.error };
    }

    set.status = 204;
    return null;
  });
