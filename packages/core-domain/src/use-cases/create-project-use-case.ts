/**
 * Example Use Case: CreateProjectUseCase
 *
 * This demonstrates Clean Architecture flow by:
 * 1. Using domain entities and interfaces
 * 2. Depending on abstractions (repository interfaces)
 * 3. Orchestrating business logic across layers
 * 4. Being framework-agnostic
 */

import type {
  Project,
  CreateProjectRequest,
  ProjectRepository,
  UserRepository,
  User,
} from '../index';

// Constants for business rules
export const PROJECT_LIMITS = {
  FREE_TIER: 3,
  PRO_TIER: 25,
  ENTERPRISE_TIER: 1000,
} as const;

export const PROJECT_TITLE_MAX_LENGTH = 200;

export interface CreateProjectRequestDTO {
  userId: string;
  title: string;
  author?: string;
  language?: 'pt-BR' | 'en';
  genre?: string;
  status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface CreateProjectResponse {
  success: boolean;
  project?: Project;
  error?: string | undefined;
}

/**
 * Use Case for creating a new project
 * This demonstrates the Clean Architecture pattern by:
 * - Depending only on domain interfaces (not implementations)
 * - Containing business logic for project creation
 * - Being independent of frameworks and external concerns
 */
export class CreateProjectUseCase {
  /**
   * Creates a new instance of CreateProjectUseCase
   * @param projectRepository - Repository for project operations
   * @param userRepository - Repository for user operations
   */
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository
  ) {}

  /**
   * Execute the use case
   * @param request - Project creation data
   * @returns Promise<CreateProjectResponse> - Result with project or error
   */
  async execute(
    request: CreateProjectRequestDTO
  ): Promise<CreateProjectResponse> {
    try {
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      return await this.createProject(request);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate the complete request
   * @param request - Project creation request
   * @returns Validation result
   */
  private async validateRequest(
    request: CreateProjectRequestDTO
  ): Promise<{ isValid: boolean; error?: string }> {
    // Validate user exists
    const userValidation = await this.validateUser(request.userId);
    if (!userValidation.isValid) {
      return {
        isValid: false,
        error: userValidation.error || 'User validation failed',
      };
    }

    // Check project limits
    const limitValidation = await this.validateProjectLimit(
      userValidation.user,
      request.userId
    );
    if (!limitValidation.isValid) {
      return {
        isValid: false,
        error: limitValidation.error || 'Project limit validation failed',
      };
    }

    // Validate project title
    const titleValidation = this.validateProjectTitle(request.title);
    if (!titleValidation.isValid) {
      return {
        isValid: false,
        error: titleValidation.error || 'Project title validation failed',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate user exists
   * @param userId - User ID to validate
   * @returns User validation result
   */
  private async validateUser(
    userId: string
  ): Promise<{ isValid: boolean; error?: string; user?: User }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        isValid: false,
        error: 'User not found',
      };
    }
    return { isValid: true, user };
  }

  /**
   * Validate project limit for user
   * @param user - User to check limits for (can be undefined)
   * @param userId - User ID for checking existing projects
   * @returns Validation result
   */
  private async validateProjectLimit(
    user: User | undefined,
    userId: string
  ): Promise<{ isValid: boolean; error?: string }> {
    if (!user) {
      return {
        isValid: false,
        error: 'User is required for project limit validation',
      };
    }

    const projectLimit = this.getProjectLimit(user.tier);
    const existingProjects = await this.projectRepository.findByUserId(userId);

    if (existingProjects.length >= projectLimit) {
      return {
        isValid: false,
        error: `Project limit exceeded for ${user.tier} tier (max: ${projectLimit})`,
      };
    }

    return { isValid: true };
  }

  /**
   * Create project with validated data
   * @param request - Project creation request
   * @returns Success response with created project
   */
  private async createProject(
    request: CreateProjectRequestDTO
  ): Promise<CreateProjectResponse> {
    const createProjectData: CreateProjectRequest = {
      userId: request.userId,
      title: request.title.trim(),
      language: request.language || 'pt-BR',
      status: request.status || 'draft',
      metadata: request.metadata || {},
    };

    // Only include optional fields if they have values
    if (request.author) {
      createProjectData.author = request.author;
    }
    if (request.genre) {
      createProjectData.genre = request.genre;
    }

    const project = await this.projectRepository.create(createProjectData);

    return {
      success: true,
      project,
    };
  }

  /**
   * Handle errors consistently
   * @param error - Error to handle
   * @returns Error response
   */
  private handleError(error: unknown): CreateProjectResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }

  /**
   * Validate project title according to business rules
   * @param title - The project title to validate
   * @returns Validation result
   */
  private validateProjectTitle(title: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!title || title.trim().length === 0) {
      return {
        isValid: false,
        error: 'Project title is required',
      };
    }

    if (title.length > PROJECT_TITLE_MAX_LENGTH) {
      return {
        isValid: false,
        error: `Project title must be ${PROJECT_TITLE_MAX_LENGTH} characters or less`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get project limit based on user tier
   * This demonstrates business logic encapsulation
   * @param tier - User's subscription tier
   * @returns Maximum number of projects allowed
   */
  private getProjectLimit(tier: string): number {
    switch (tier) {
      case 'free':
        return PROJECT_LIMITS.FREE_TIER;
      case 'pro':
        return PROJECT_LIMITS.PRO_TIER;
      case 'enterprise':
        return PROJECT_LIMITS.ENTERPRISE_TIER;
      default:
        return PROJECT_LIMITS.FREE_TIER;
    }
  }
}
