import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type {
  Project,
  CreateProjectRequest,
} from '../../../core-domain/src/index';
import type { Database } from '../database';
import { InMemoryProjectRepository } from './in-memory-project-repository';

describe('InMemoryProjectRepository', () => {
  let repository: InMemoryProjectRepository;
  let mockDatabase: Database;

  beforeEach(() => {
    mockDatabase = {
      createProject: mock(
        async (data: CreateProjectRequest): Promise<Project> => ({
          id: 'project-123',
          userId: data.userId,
          title: data.title,
          author: data.author || null,
          language: data.language || 'pt-BR',
          genre: data.genre || null,
          status: data.status || 'draft',
          metadata: data.metadata || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      ),
      getProjectById: mock(async (id: string) => ({
        id,
        userId: 'user-123',
        title: 'Test Project',
        author: 'Test Author',
        language: 'pt-BR',
        genre: 'fiction',
        status: 'draft',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      getProjectsByUserId: mock(async (userId: string) => [
        {
          id: 'project-1',
          userId,
          title: 'Project 1',
          author: null,
          language: 'pt-BR',
          genre: null,
          status: 'draft',
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
      updateProject: mock(async (id: string, data: any) => ({
        id,
        userId: 'user-123',
        title: data.title || 'Test Project',
        author: data.author || null,
        language: data.language || 'pt-BR',
        genre: data.genre || null,
        status: data.status || 'draft',
        metadata: data.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      deleteProject: mock(async () => true),
    } as unknown as Database;

    repository = new InMemoryProjectRepository(mockDatabase);
  });

  describe('create', () => {
    it('should create project via database', async () => {
      const projectData: CreateProjectRequest = {
        userId: 'user-123',
        title: 'My Audiobook',
        author: 'John Doe',
        language: 'en-US',
        genre: 'fiction',
        status: 'draft',
      };

      const result = await repository.create(projectData);

      expect(result).toBeDefined();
      expect(result.title).toBe(projectData.title);
      expect(result.userId).toBe(projectData.userId);
      expect(mockDatabase.createProject).toHaveBeenCalledWith(projectData);
      expect(mockDatabase.createProject).toHaveBeenCalledTimes(1);
    });

    it('should create project with default values', async () => {
      const projectData: CreateProjectRequest = {
        userId: 'user-123',
        title: 'My Audiobook',
      };

      const result = await repository.create(projectData);

      expect(result).toBeDefined();
      expect(result.language).toBe('pt-BR');
      expect(result.status).toBe('draft');
    });
  });

  describe('findById', () => {
    it('should find project by id', async () => {
      const projectId = 'project-123';

      const result = await repository.findById(projectId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(projectId);
      expect(mockDatabase.getProjectById).toHaveBeenCalledWith(projectId);
    });

    it('should return null for non-existent project', async () => {
      mockDatabase.getProjectById = mock(async () => null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find projects by user id', async () => {
      const userId = 'user-123';

      const result = await repository.findByUserId(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockDatabase.getProjectsByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return empty array for user with no projects', async () => {
      mockDatabase.getProjectsByUserId = mock(async () => []);

      const result = await repository.findByUserId('user-no-projects');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const projectId = 'project-123';
      const updateData = {
        title: 'Updated Title',
        status: 'published' as const,
      };

      const result = await repository.update(projectId, updateData);

      expect(result).toBeDefined();
      expect(result?.id).toBe(projectId);
      expect(mockDatabase.updateProject).toHaveBeenCalledWith(
        projectId,
        updateData
      );
    });

    it('should return null for non-existent project', async () => {
      mockDatabase.updateProject = mock(async () => null);

      const result = await repository.update('non-existent', { title: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete project by id', async () => {
      const projectId = 'project-123';

      const result = await repository.delete(projectId);

      expect(result).toBe(true);
      expect(mockDatabase.deleteProject).toHaveBeenCalledWith(projectId);
    });

    it('should return false when delete fails', async () => {
      mockDatabase.deleteProject = mock(async () => false);

      const result = await repository.delete('project-123');

      expect(result).toBe(false);
    });
  });
});
