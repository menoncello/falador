import type {
  ProjectRepository,
  UserRepository,
  Project,
  User,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@falador/core-domain';
import { describe, expect, test, beforeEach, jest } from 'bun:test';
import {
  ProjectManagementUseCase,
  type CreateProjectRequest,
  type UpdateProjectRequest,
} from './project-management';

// Mock implementations
const mockUserRepository: jest.Mocked<UserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectRepository: jest.Mocked<ProjectRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('ProjectManagementUseCase - Business Logic Orchestration', () => {
  let projectManagement: ProjectManagementUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    projectManagement = new ProjectManagementUseCase(
      mockUserRepository,
      mockProjectRepository
    );
  });

  describe('createProject', () => {
    test('should create project with valid data', async () => {
      // Arrange
      const request: CreateProjectRequest = {
        title: 'Test Project',
        userId: 'user-123',
      };

      const existingUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const expectedProject: Project = {
        id: 'project-123',
        title: 'Test Project',
        userId: 'user-123',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockProjectRepository.create.mockResolvedValue(expectedProject);

      // Act
      const result = await projectManagement.createProject(request);

      // Assert
      expect(result).toEqual(expectedProject);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        title: 'Test Project',
        userId: 'user-123',
      });
    });

    test('should reject creation with missing title', async () => {
      const request: CreateProjectRequest = {
        title: '',
        userId: 'user-123',
      };

      await expect(projectManagement.createProject(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    test('should reject creation with missing user ID', async () => {
      const request: CreateProjectRequest = {
        title: 'Test Project',
        userId: '',
      };

      await expect(projectManagement.createProject(request)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    test('should reject creation when user not found', async () => {
      const request: CreateProjectRequest = {
        title: 'Test Project',
        userId: 'nonexistent-user',
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(projectManagement.createProject(request)).rejects.toThrow(
        NotFoundError
      );
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    test('should trim whitespace from title', async () => {
      const request: CreateProjectRequest = {
        title: '  Test Project  ',
        userId: 'user-123',
      };

      const existingUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const expectedProject: Project = {
        id: 'project-123',
        title: 'Test Project',
        userId: 'user-123',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockProjectRepository.create.mockResolvedValue(expectedProject);

      const result = await projectManagement.createProject(request);

      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        title: 'Test Project',
        userId: 'user-123',
      });
    });

    test('should handle title length constraints', async () => {
      const validTitles = [
        'Short',
        'A'.repeat(100),
        'Project with numbers 123 and symbols !@#',
      ];

      const existingUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockProjectRepository.create.mockResolvedValue({} as Project);

      for (const title of validTitles) {
        const request: CreateProjectRequest = { title, userId: 'user-123' };
        await expect(
          projectManagement.createProject(request)
        ).resolves.toBeDefined();
      }
    });
  });

  describe('getProjectById', () => {
    test('should return project when found', async () => {
      const projectId = 'project-123';
      const expectedProject: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(expectedProject);

      const result = await projectManagement.getProjectById(projectId);

      expect(result).toEqual(expectedProject);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    });

    test('should return null when project not found', async () => {
      const projectId = 'nonexistent-project';

      mockProjectRepository.findById.mockResolvedValue(null);

      const result = await projectManagement.getProjectById(projectId);

      expect(result).toBeNull();
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    });

    test('should return project when user has access', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';

      const project: Project = {
        id: projectId,
        userId,
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);

      const result = await projectManagement.getProjectById(projectId, userId);

      expect(result).toEqual(project);
    });

    test('should reject when user does not have access', async () => {
      const projectId = 'project-123';
      const userId = 'different-user';

      const project: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);

      await expect(
        projectManagement.getProjectById(projectId, userId)
      ).rejects.toThrow(UnauthorizedError);
    });

    test('should reject request with missing project ID', async () => {
      await expect(projectManagement.getProjectById('')).rejects.toThrow(
        ValidationError
      );
      expect(mockProjectRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getProjectsByUserId', () => {
    test('should return projects when user exists', async () => {
      const userId = 'user-123';

      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const expectedProjects: Project[] = [
        {
          id: 'project-1',
          userId,
          title: 'Project 1',
          author: null,
          language: 'pt-BR',
          genre: null,
          status: 'draft',
          metadata: {},
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'project-2',
          userId,
          title: 'Project 2',
          author: null,
          language: 'en',
          genre: 'Fiction',
          status: 'completed',
          metadata: {},
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockProjectRepository.findByUserId.mockResolvedValue(expectedProjects);

      const result = await projectManagement.getProjectsByUserId(userId);

      expect(result).toEqual(expectedProjects);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockProjectRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    test('should return empty array when user has no projects', async () => {
      const userId = 'user-123';

      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);

      const result = await projectManagement.getProjectsByUserId(userId);

      expect(result).toEqual([]);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockProjectRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    test('should reject when user not found', async () => {
      const userId = 'nonexistent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        projectManagement.getProjectsByUserId(userId)
      ).rejects.toThrow(NotFoundError);
      expect(mockProjectRepository.findByUserId).not.toHaveBeenCalled();
    });

    test('should reject request with missing user ID', async () => {
      await expect(projectManagement.getProjectsByUserId('')).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    test('should update project with valid data', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const request: UpdateProjectRequest = {
        title: 'Updated Project',
      };

      const existingProject: Project = {
        id: projectId,
        userId,
        title: 'Original Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const updatedProject: Project = {
        ...existingProject,
        title: 'Updated Project',
        updatedAt: '2023-01-02T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectManagement.updateProject(
        projectId,
        request,
        userId
      );

      expect(result).toEqual(updatedProject);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockProjectRepository.update).toHaveBeenCalledWith(projectId, {
        title: 'Updated Project',
      });
    });

    test('should reject update with missing project ID', async () => {
      const request: UpdateProjectRequest = { title: 'Updated' };

      await expect(
        projectManagement.updateProject('', request)
      ).rejects.toThrow(ValidationError);
      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    test('should reject update with missing title', async () => {
      const projectId = 'project-123';
      const request: UpdateProjectRequest = { title: '' };

      await expect(
        projectManagement.updateProject(projectId, request)
      ).rejects.toThrow(ValidationError);
      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    test('should reject update when project not found', async () => {
      const projectId = 'nonexistent-project';
      const request: UpdateProjectRequest = { title: 'Updated' };

      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(
        projectManagement.updateProject(projectId, request)
      ).rejects.toThrow(NotFoundError);
      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    test('should reject update when user does not have access', async () => {
      const projectId = 'project-123';
      const userId = 'different-user';
      const request: UpdateProjectRequest = { title: 'Updated' };

      const existingProject: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Original Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);

      await expect(
        projectManagement.updateProject(projectId, request, userId)
      ).rejects.toThrow(UnauthorizedError);
      expect(mockProjectRepository.update).not.toHaveBeenCalled();
    });

    test('should allow update without user ID (admin access)', async () => {
      const projectId = 'project-123';
      const request: UpdateProjectRequest = {
        title: 'Admin Updated',
      };

      const existingProject: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Original Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const updatedProject: Project = {
        ...existingProject,
        title: 'Admin Updated',
        updatedAt: '2023-01-02T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);
      mockProjectRepository.update.mockResolvedValue(updatedProject);

      const result = await projectManagement.updateProject(projectId, request);

      expect(result).toEqual(updatedProject);
      expect(mockProjectRepository.update).toHaveBeenCalledWith(projectId, {
        title: 'Admin Updated',
      });
    });

    test('should trim whitespace from title', async () => {
      const projectId = 'project-123';
      const request: UpdateProjectRequest = {
        title: '  Updated Project  ',
      };

      const existingProject: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Original Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);
      mockProjectRepository.update.mockResolvedValue(existingProject);

      await projectManagement.updateProject(projectId, request);

      expect(mockProjectRepository.update).toHaveBeenCalledWith(projectId, {
        title: 'Updated Project',
      });
    });
  });

  describe('deleteProject', () => {
    test('should delete project when user has access', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';

      const existingProject: Project = {
        id: projectId,
        userId,
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);
      mockProjectRepository.delete.mockResolvedValue(true);

      const result = await projectManagement.deleteProject(projectId, userId);

      expect(result).toBe(true);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockProjectRepository.delete).toHaveBeenCalledWith(projectId);
    });

    test('should reject deletion with missing project ID', async () => {
      await expect(projectManagement.deleteProject('')).rejects.toThrow(
        ValidationError
      );
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });

    test('should reject deletion when project not found', async () => {
      const projectId = 'nonexistent-project';

      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(projectManagement.deleteProject(projectId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });

    test('should reject deletion when user does not have access', async () => {
      const projectId = 'project-123';
      const userId = 'different-user';

      const existingProject: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);

      await expect(
        projectManagement.deleteProject(projectId, userId)
      ).rejects.toThrow(UnauthorizedError);
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });

    test('should allow deletion without user ID (admin access)', async () => {
      const projectId = 'project-123';

      const existingProject: Project = {
        id: projectId,
        userId: 'user-123',
        title: 'Test Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(existingProject);
      mockProjectRepository.delete.mockResolvedValue(true);

      const result = await projectManagement.deleteProject(projectId);

      expect(result).toBe(true);
      expect(mockProjectRepository.delete).toHaveBeenCalledWith(projectId);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      // Test null inputs
      await expect(
        projectManagement.getProjectById(null as any)
      ).rejects.toThrow(ValidationError);
      await expect(
        projectManagement.getProjectsByUserId(null as any)
      ).rejects.toThrow(ValidationError);
      await expect(
        projectManagement.updateProject(null as any, {})
      ).rejects.toThrow(ValidationError);
      await expect(
        projectManagement.deleteProject(null as any)
      ).rejects.toThrow(ValidationError);

      // Test undefined inputs
      await expect(
        projectManagement.getProjectById(undefined as any)
      ).rejects.toThrow(ValidationError);
      await expect(
        projectManagement.getProjectsByUserId(undefined as any)
      ).rejects.toThrow(ValidationError);
      await expect(
        projectManagement.updateProject(undefined as any, {})
      ).rejects.toThrow(ValidationError);
      await expect(
        projectManagement.deleteProject(undefined as any)
      ).rejects.toThrow(ValidationError);
    });

    test('should handle repository errors gracefully', async () => {
      const projectId = 'project-123';
      mockProjectRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(projectManagement.getProjectById(projectId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    test('should handle timeout scenarios', async () => {
      const userId = 'user-123';
      mockUserRepository.findById.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const promise = projectManagement.getProjectsByUserId(userId);
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('Authorization and Security', () => {
    test('should enforce ownership-based access control', async () => {
      const projectId = 'project-123';
      const ownerUserId = 'owner-user';
      const otherUserId = 'other-user';

      const project: Project = {
        id: projectId,
        userId: ownerUserId,
        title: 'Secret Project',
        author: null,
        language: 'pt-BR',
        genre: null,
        status: 'draft',
        metadata: { sensitive: true },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockProjectRepository.findById.mockResolvedValue(project);

      // Owner can access
      const ownerAccess = await projectManagement.getProjectById(
        projectId,
        ownerUserId
      );
      expect(ownerAccess).toEqual(project);

      // Other user cannot access
      await expect(
        projectManagement.getProjectById(projectId, otherUserId)
      ).rejects.toThrow(UnauthorizedError);
    });

    test('should handle cross-user data protection', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      const user1Projects: Project[] = [
        {
          id: 'project-1',
          userId: user1Id,
          title: 'User 1 Project',
          author: null,
          language: 'pt-BR',
          genre: null,
          status: 'draft',
          metadata: {},
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const user1: User = {
        id: user1Id,
        email: 'user1@example.com',
        name: 'User 1',
        passwordHash: 'hashed:password',
        tier: 'free',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockUserRepository.findById.mockResolvedValue(user1);
      mockProjectRepository.findByUserId.mockResolvedValue(user1Projects);

      const result = await projectManagement.getProjectsByUserId(user1Id);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(user1Id);
    });
  });
});
