import { describe, expect, it, beforeEach } from 'bun:test';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';
import { projectRoutes } from './projects';

describe('Project Routes', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('POST /api/projects', () => {
    it('should create project without optional author field', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { author: string | null };
      expect(data.author).toBeNull();
    });

    it('should create project with author field when provided', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            author: 'John Doe',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { author: string };
      expect(data.author).toBe('John Doe');
    });

    it('should create project without optional language field', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('pt-BR');
    });

    it('should create project with language field when provided', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            language: 'en',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { language: string };
      expect(data.language).toBe('en');
    });

    it('should create project without optional genre field', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { genre: string | null };
      expect(data.genre).toBeNull();
    });

    it('should create project with genre field when provided', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            genre: 'Fiction',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { genre: string };
      expect(data.genre).toBe('Fiction');
    });

    it('should create project without optional status field', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { status: string };
      expect(data.status).toBe('draft');
    });

    it('should create project with status field when provided', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            status: 'completed',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as { status: string };
      expect(data.status).toBe('completed');
    });

    it('should create project without optional metadata field', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as {
        metadata: Record<string, unknown>;
      };
      expect(data.metadata).toEqual({});
    });

    it('should create project with metadata field when provided', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Book',
            metadata: { custom: 'value' },
          }),
        })
      );

      expect(response.status).toBe(201);
      const data = (await response.json()) as {
        metadata: Record<string, unknown>;
      };
      expect(data.metadata).toEqual({ custom: 'value' });
    });

    it('should reject creating project without title', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Missing required field: title');
    });

    it('should reject creating project without auth', async () => {
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' }),
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 404 for non-existent project', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/nonexistent', {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });

    it('should return 403 for project owned by another user', async () => {
      const user1 = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const user2 = db.createUser({
        email: 'other@example.com',
        name: 'Other User',
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'Book',
      });

      const token2 = db.createSession(user2.id);

      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          headers: { Authorization: `Bearer ${token2}` },
        })
      );

      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });

    it('should reject unauthorized access', async () => {
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id')
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update project with optional fields', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const project = db.createProject({
        userId: user.id,
        title: 'Original Title',
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Title',
            author: 'John Doe',
            language: 'en',
            genre: 'Fiction',
            status: 'processing',
            metadata: { key: 'value' },
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        title: string;
        author: string;
        language: string;
        genre: string;
        status: string;
        metadata: Record<string, unknown>;
      };
      expect(data.title).toBe('Updated Title');
      expect(data.author).toBe('John Doe');
      expect(data.language).toBe('en');
      expect(data.genre).toBe('Fiction');
      expect(data.status).toBe('processing');
      expect(data.metadata).toEqual({ key: 'value' });
    });

    it('should return 404 for non-existent project', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);

      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/nonexistent', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });

    it('should return 403 for project owned by another user', async () => {
      const user1 = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const user2 = db.createUser({
        email: 'other@example.com',
        name: 'Other User',
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const project = db.createProject({
        userId: user1.id,
        title: 'Book',
      });

      const token2 = db.createSession(user2.id);

      const response = await projectRoutes.handle(
        new Request(`http://localhost/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token2}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Forbidden');
    });

    it('should reject unauthorized access', async () => {
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/some-id', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated' }),
        })
      );

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should return 404 for non-existent project', async () => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
      });

      const token = db.createSession(user.id);
      const response = await projectRoutes.handle(
        new Request('http://localhost/api/projects/nonexistent', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(404);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Project not found');
    });
  });
});
