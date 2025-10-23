/**
 * Use Case: DeleteProject
 *
 * Deletes a project with authorization checks
 */

import type { ProjectRepository } from '@falador/core-domain';

export interface DeleteProjectRequestDTO {
  projectId: string;
  userId: string;
}

export interface DeleteProjectResponse {
  success: boolean;
  error?: string;
}

/**
 * Use Case for deleting a project
 * Ensures users can only delete their own projects
 */
export class DeleteProjectUseCase {
  /**
   * Creates a new instance of DeleteProjectUseCase
   * @param projectRepository - Repository for project operations
   */
  constructor(private readonly projectRepository: ProjectRepository) {}

  /**
   * Execute the use case
   * @param request - Project deletion request
   * @returns Promise<DeleteProjectResponse> - Result with success or error
   */
  async execute(
    request: DeleteProjectRequestDTO
  ): Promise<DeleteProjectResponse> {
    try {
      const authResult = await this.checkAuthorization(request);
      if (!authResult.success) {
        return authResult;
      }

      const deleted = await this.projectRepository.delete(request.projectId);

      if (!deleted) {
        return { success: false, error: 'Failed to delete project' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if user is authorized to delete the project
   * @param request - Project deletion request
   * @returns Authorization result
   */
  private async checkAuthorization(
    request: DeleteProjectRequestDTO
  ): Promise<DeleteProjectResponse> {
    const project = await this.projectRepository.findById(request.projectId);

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== request.userId) {
      return { success: false, error: 'Forbidden' };
    }

    return { success: true };
  }
}
