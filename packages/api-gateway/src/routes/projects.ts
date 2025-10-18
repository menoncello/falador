import { Elysia, t } from 'elysia';
import { db } from '../database';
import { extractAuthUser } from '../utils/auth';

const ERROR_PROJECT_NOT_FOUND = 'Project not found';

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  // GET /api/projects
  .get('/', ({ headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const projects = db.getProjectsByUserId(authUser.id);
    set.status = 200;
    return projects;
  })

  // POST /api/projects
  .post(
    '/',
    ({ body, headers, set }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      // Validate required fields
      if (!body.title) {
        set.status = 400;
        return { error: 'Missing required field: title' };
      }

      const project = db.createProject({
        userId: authUser.id,
        title: body.title,
        ...(body.author && { author: body.author }),
        ...(body.language && { language: body.language }),
        ...(body.genre && { genre: body.genre }),
        ...(body.status && { status: body.status }),
        ...(body.metadata && { metadata: body.metadata }),
      });

      set.status = 201;
      return project;
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
  .get('/:id', ({ params, headers, set }) => {
    const authUser = extractAuthUser(headers['authorization'] || null);
    if (!authUser) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const project = db.getProjectById(params.id);
    if (!project) {
      set.status = 404;
      return { error: ERROR_PROJECT_NOT_FOUND };
    }

    // Check authorization
    if (project.userId !== authUser.id) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    set.status = 200;
    return project;
  })

  // PATCH /api/projects/:id
  .patch(
    '/:id',
    ({ params, body, headers, set }) => {
      const authUser = extractAuthUser(headers['authorization'] || null);
      if (!authUser) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const project = db.getProjectById(params.id);
      if (!project) {
        set.status = 404;
        return { error: ERROR_PROJECT_NOT_FOUND };
      }

      // Check authorization
      if (project.userId !== authUser.id) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      const updated = db.updateProject(params.id, body);
      set.status = 200;
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
  .delete('/:id', ({ params, set }) => {
    const deleted = db.deleteProject(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: ERROR_PROJECT_NOT_FOUND };
    }
    set.status = 204;
    return null;
  });
