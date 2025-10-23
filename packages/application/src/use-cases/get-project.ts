/**
 * Use Case: GetProject
 *
 * Retrieves a single project by ID with authorization checks
 */

import type { Project, ProjectRepository } from '@falador/core-domain';

export interface GetProjectRequestDTO {
  projectId: string;
  userId: string;
}

export interface GetProjectResponse {
  success: boolean;
  project?: Project;
  error?: string;
}

/**
 * Use Case for retrieving a project
 * Ensures users can only access their own projects
 */
export class GetProjectUseCase {
  /**
   * Creates a new instance of GetProjectUseCase
   * @param projectRepository - Repository for project operations
   */
  constructor(private readonly projectRepository: ProjectRepository) {}

  /**
   * Execute the use case
   * @param request - Project retrieval request
   * @returns Promise<GetProjectResponse> - Result with project or error
   */
  async execute(request: GetProjectRequestDTO): Promise<GetProjectResponse> {
    try {
      const project = await this.projectRepository.findById(request.projectId);

      if (!project) {
        return {
          success: false,
          error: 'Project not found',
        };
      }

      // Authorization check
      if (project.userId !== request.userId) {
        return {
          success: false,
          error: 'Forbidden',
        };
      }

      return {
        success: true,
        project,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
