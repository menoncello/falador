/**
 * Test for CreateProjectUseCase
 * This demonstrates Clean Architecture testing:
 * - Unit testing use case logic
 * - Mocking repository interfaces
 * - Testing business rules
 */

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import {
  CreateProjectUseCase,
  CreateProjectRequestDTO,
  PROJECT_LIMITS,
  User,
  Project,
  UserRepository,
  ProjectRepository,
} from '../index';
import {
  createDomainUser,
  createDomainProject,
  createProUser,
  createMultipleProjects,
} from '../test-domain-factories';

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockProjectRepository: jest.Mocked<ProjectRepository>;
  let mockUser: User;
  let mockProject: Project;

  beforeEach(() => {
    // Create mock objects
    mockUser = createDomainUser({ id: 'user-123' });
    mockProject = createDomainProject({
      id: 'project-123',
      userId: 'user-123',
      title: 'My Audiobook Project',
      author: 'Test Author',
      language: 'pt-BR',
      genre: 'fiction',
    });

    // Create mock repositories
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepository>;

    mockProjectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ProjectRepository>;

    useCase = new CreateProjectUseCase(
      mockProjectRepository,
      mockUserRepository
    );
  });

  describe('successful project creation', () => {
    it('1.5-USE-CASE-001 [P0]: should create project for valid user', async () => {
      // Given: A valid user and project request using factory pattern
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: 'My Audiobook Project',
        author: 'Test Author',
        language: 'pt-BR',
        genre: 'fiction',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);
      mockProjectRepository.create.mockResolvedValue(mockProject);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'My Audiobook Project',
        author: 'Test Author',
        language: 'pt-BR',
        genre: 'fiction',
        status: 'draft',
        metadata: {},
      });
    });

    it('should create project with defaults', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: 'Simple Project',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);
      mockProjectRepository.create.mockResolvedValue({
        ...mockProject,
        title: 'Simple Project',
        author: null,
        language: 'pt-BR',
        genre: null,
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.project?.title).toBe('Simple Project');
      expect(result.project?.language).toBe('pt-BR');
      expect(result.project?.genre).toBeNull();
    });
  });

  describe('business rule validation', () => {
    it('should reject project creation for non-existent user', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'non-existent-user',
        title: 'Test Project',
      };

      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('1.5-USE-CASE-LIMIT-001 [P0]: should enforce project limit for free tier users', async () => {
      // Given: A free tier user at their project limit
      const freeUser = createDomainUser({ id: 'free-user', tier: 'free' });
      const existingProjects = createMultipleProjects(
        'free-user',
        PROJECT_LIMITS.FREE_TIER
      );

      const request: CreateProjectRequestDTO = {
        userId: 'free-user',
        title: 'Test Project',
      };

      mockUserRepository.findById.mockResolvedValue(freeUser);
      mockProjectRepository.findByUserId.mockResolvedValue(existingProjects);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        `Project limit exceeded for free tier (max: ${PROJECT_LIMITS.FREE_TIER})`
      );
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('1.5-USE-CASE-LIMIT-002 [P0]: should allow higher limits for pro users', async () => {
      // Given: A pro user within their allowed project limit
      const proUser = createProUser({ id: 'pro-user' });
      const existingProjects = createMultipleProjects(
        'pro-user',
        PROJECT_LIMITS.FREE_TIER
      );
      const newProject = createDomainProject({
        userId: 'pro-user',
        title: 'Test Project',
      });

      const request: CreateProjectRequestDTO = {
        userId: 'pro-user',
        title: 'Test Project',
      };

      mockUserRepository.findById.mockResolvedValue(proUser);
      mockProjectRepository.findByUserId.mockResolvedValue(existingProjects);
      mockProjectRepository.create.mockResolvedValue(newProject);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(mockProjectRepository.create).toHaveBeenCalled();
    });

    it('should reject empty project title', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: '   ', // Whitespace only
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Project title is required');
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('should reject title that is too long', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: 'A'.repeat(201), // 201 characters
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Project title must be 200 characters or less');
      expect(mockProjectRepository.create).not.toHaveBeenCalled();
    });

    it('should validate title length correctly', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: 'A'.repeat(200), // Exactly 200 characters
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);
      mockProjectRepository.create.mockResolvedValue(mockProject);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: 'Test Project',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);
      mockProjectRepository.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const request: CreateProjectRequestDTO = {
        userId: 'user-123',
        title: 'Test Project',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockProjectRepository.findByUserId.mockResolvedValue([]);
      mockProjectRepository.create.mockRejectedValue('String error');

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('project limit validation by tier', () => {
    const testCases = [
      { tier: 'free', limit: PROJECT_LIMITS.FREE_TIER },
      { tier: 'pro', limit: PROJECT_LIMITS.PRO_TIER },
      { tier: 'enterprise', limit: PROJECT_LIMITS.ENTERPRISE_TIER },
      { tier: 'unknown', limit: PROJECT_LIMITS.FREE_TIER }, // Default case
    ];

    for (const { tier, limit } of testCases) {
      it(`should allow ${limit} projects for ${tier} tier`, async () => {
        // Arrange
        const request: CreateProjectRequestDTO = {
          userId: `${tier}-user`,
          title: 'Test Project',
        };

        const user = { ...mockUser, id: `${tier}-user`, tier: tier as any };
        const existingProjects: Project[] = [];
        for (let i = 0; i < limit - 1; i++) {
          existingProjects.push({
            ...mockProject,
            id: `project-${i}`,
            userId: `${tier}-user`,
          });
        }

        mockUserRepository.findById.mockResolvedValue(user);
        mockProjectRepository.findByUserId.mockResolvedValue(existingProjects);
        mockProjectRepository.create.mockResolvedValue({
          ...mockProject,
          userId: `${tier}-user`,
        });

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(true);
        expect(result.project).toBeDefined();
      });

      it(`should reject project creation when ${tier} tier exceeds limit`, async () => {
        // Arrange
        const request: CreateProjectRequestDTO = {
          userId: `${tier}-user-exceeded`,
          title: 'Test Project',
        };

        const user = {
          ...mockUser,
          id: `${tier}-user-exceeded`,
          tier: tier as any,
        };
        const existingProjects: Project[] = [];
        for (let i = 0; i < limit; i++) {
          existingProjects.push({
            ...mockProject,
            id: `project-${i}`,
            userId: `${tier}-user-exceeded`,
          });
        }

        mockUserRepository.findById.mockResolvedValue(user);
        mockProjectRepository.findByUserId.mockResolvedValue(existingProjects);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          `Project limit exceeded for ${tier} tier (max: ${limit})`
        );
      });
    }
  });
});
