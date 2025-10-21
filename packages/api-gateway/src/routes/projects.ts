import { Elysia, t } from 'elysia';
import { HTTP_STATUS } from '../constants';
import { db } from '../database';
import type {
  CreateProjectBody,
  UpdateProjectBody,
  RouteHandler,
} from '../types';
import { extractAuthUser } from '../utils/auth';

const ERROR_PROJECT_NOT_FOUND = 'Project not found';

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  // GET /api/projects
  .get('/', ({ headers, set }: any) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = HTTP_STATUS.UNAUTHORIZED;
      return { error: 'Unauthorized' };
    }

    const projects = db.getProjectsByUserId(authUser.id);
    set.status = HTTP_STATUS.OK;
    return projects;
  })

  // POST /api/projects
  .post(
    '/',
    ({ body, headers, set }: any) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = HTTP_STATUS.UNAUTHORIZED;
        return { error: 'Unauthorized' };
      }

      // Validate required fields
      if (!body.title) {
        set.status = HTTP_STATUS.BAD_REQUEST;
        return { error: 'Missing required field: title' };
      }

      const project = db.createProject({
        userId: authUser.id,
        title: body.title,
        ...(body.author !== undefined && { author: body.author }),
        ...(body.language && { language: body.language }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.status && { status: body.status }),
        ...(body.metadata && { metadata: body.metadata }),
      });

      set.status = HTTP_STATUS.CREATED;
      return project;
    },
    {
      body: t.Object({
        title: t.String(),
        author: t.Optional(t.Union([t.String(), t.Null()])),
        language: t.Optional(t.Union([t.Literal('pt-BR'), t.Literal('en')])),
        genre: t.Optional(t.Union([t.String(), t.Null()])),
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
  .get('/:id', ({ params, headers, set }: any) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = HTTP_STATUS.UNAUTHORIZED;
      return { error: 'Unauthorized' };
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      set.status = HTTP_STATUS.NOT_FOUND;
      return { error: ERROR_PROJECT_NOT_FOUND };
    }

    // Check authorization
    if (project.userId !== authUser.id) {
      set.status = HTTP_STATUS.FORBIDDEN;
      return { error: 'Forbidden' };
    }

    set.status = HTTP_STATUS.OK;
    return project;
  })

  // PATCH /api/projects/:id
  .patch(
    '/:id',
    ({ params, body, headers, set }: any) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = HTTP_STATUS.UNAUTHORIZED;
        return { error: 'Unauthorized' };
      }

      const project = db.getProjectById(params.id);
      if (!project) {
        set.status = HTTP_STATUS.NOT_FOUND;
        return { error: ERROR_PROJECT_NOT_FOUND };
      }

      // Check authorization
      if (project.userId !== authUser.id) {
        set.status = HTTP_STATUS.FORBIDDEN;
        return { error: 'Forbidden' };
      }

      const updated = db.updateProject(params.id, body);
      set.status = HTTP_STATUS.OK;
      return updated;
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
  .delete('/:id', ({ params, headers, set }: any) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = HTTP_STATUS.UNAUTHORIZED;
      return { error: 'Unauthorized' };
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      set.status = HTTP_STATUS.NOT_FOUND;
      return { error: ERROR_PROJECT_NOT_FOUND };
    }

    // Check authorization
    if (project.userId !== authUser.id) {
      set.status = HTTP_STATUS.FORBIDDEN;
      return { error: 'Forbidden' };
    }

    const deleted = db.deleteProject(params.id);
    if (!deleted) {
      set.status = HTTP_STATUS.NOT_FOUND;
      return { error: ERROR_PROJECT_NOT_FOUND };
    }
    set.status = HTTP_STATUS.NO_CONTENT;
    return null;
  });
