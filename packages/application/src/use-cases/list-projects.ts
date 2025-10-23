/**
 * Use Case: ListProjects
 *
 * Retrieves all projects for a user
 */

import type { Project, ProjectRepository } from '@falador/core-domain';

export interface ListProjectsRequestDTO {
  userId: string;
}

export interface ListProjectsResponse {
  success: boolean;
  projects?: Project[];
  error?: string;
}

/**
 * Use Case for listing user's projects
 * Returns all projects owned by the authenticated user
 */
export class ListProjectsUseCase {
  /**
   * Creates a new instance of ListProjectsUseCase
   * @param projectRepository - Repository for project operations
   */
  constructor(private readonly projectRepository: ProjectRepository) {}

  /**
   * Execute the use case
   * @param request - Project list request
   * @returns Promise<ListProjectsResponse> - Result with projects or error
   */
  async execute(
    request: ListProjectsRequestDTO
  ): Promise<ListProjectsResponse> {
    try {
      const projects = await this.projectRepository.findByUserId(
        request.userId
      );

      return {
        success: true,
        projects,
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
