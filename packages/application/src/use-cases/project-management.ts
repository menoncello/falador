/**
 * Project Management Use Cases
 */

import type {
  Project,
  ProjectRepository,
  UserRepository,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@falador/core-domain';
import { injectable, inject } from 'tsyringe';

export interface CreateProjectRequest {
  title: string;
  userId: string;
}

export interface UpdateProjectRequest {
  title?: string;
}

/**
 *
 */
@injectable()
export class ProjectManagementUseCase {
  /**
   *
   * @param userRepository
   * @param projectRepository
   */
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('ProjectRepository') private projectRepository: ProjectRepository
  ) {}

  /**
   *
   * @param request
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    // Validation
    if (!request.title?.trim()) {
      throw new ValidationError('Project title is required');
    }
    if (!request.userId?.trim()) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    // Create project
    return await this.projectRepository.create({
      title: request.title.trim(),
      userId: request.userId,
    });
  }

  /**
   *
   * @param projectId
   * @param userId
   */
  async getProjectById(
    projectId: string,
    userId?: string
  ): Promise<Project | null> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      return null;
    }

    // If userId is provided, check authorization
    if (userId && project.userId !== userId) {
      throw new UnauthorizedError('Not authorized to access this project');
    }

    return project;
  }

  /**
   *
   * @param userId
   */
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return await this.projectRepository.findByUserId(userId);
  }

  /**
   *
   * @param projectId
   * @param request
   * @param userId
   */
  async updateProject(
    projectId: string,
    request: UpdateProjectRequest,
    userId?: string
  ): Promise<Project> {
    // Validation
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }
    if (!request.title?.trim()) {
      throw new ValidationError('Title is required for update');
    }

    // Check if project exists
    const existingProject = await this.projectRepository.findById(projectId);
    if (!existingProject) {
      throw new NotFoundError('Project', projectId);
    }

    // If userId is provided, check authorization
    if (userId && existingProject.userId !== userId) {
      throw new UnauthorizedError('Not authorized to update this project');
    }

    // Update project
    return await this.projectRepository.update(projectId, {
      title: request.title.trim(),
    });
  }

  /**
   *
   * @param projectId
   * @param userId
   */
  async deleteProject(projectId: string, userId?: string): Promise<boolean> {
    if (!projectId?.trim()) {
      throw new ValidationError('Project ID is required');
    }

    // Check if project exists
    const existingProject = await this.projectRepository.findById(projectId);
    if (!existingProject) {
      throw new NotFoundError('Project', projectId);
    }

    // If userId is provided, check authorization
    if (userId && existingProject.userId !== userId) {
      throw new UnauthorizedError('Not authorized to delete this project');
    }

    return await this.projectRepository.delete(projectId);
  }
}
