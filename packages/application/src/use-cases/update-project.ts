/**
 * Use Case: UpdateProject
 *
 * Updates an existing project with authorization checks
 */

import type { Project, ProjectRepository } from '@falador/core-domain';

export interface UpdateProjectRequestDTO {
  projectId: string;
  userId: string;
  title?: string;
  author?: string;
  language?: 'pt-BR' | 'en';
  genre?: string;
  status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface UpdateProjectResponse {
  success: boolean;
  project?: Project;
  error?: string;
}

/**
 * Use Case for updating a project
 * Ensures users can only update their own projects
 */
export class UpdateProjectUseCase {
  /**
   * Creates a new instance of UpdateProjectUseCase
   * @param projectRepository - Repository for project operations
   */
  constructor(private readonly projectRepository: ProjectRepository) {}

  /**
   * Execute the use case
   * @param request - Project update request
   * @returns Promise<UpdateProjectResponse> - Result with updated project or error
   */
  async execute(
    request: UpdateProjectRequestDTO
  ): Promise<UpdateProjectResponse> {
    try {
      const project = await this.projectRepository.findById(request.projectId);

      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      if (project.userId !== request.userId) {
        return { success: false, error: 'Forbidden' };
      }

      const updateData = this.buildUpdateData(request);
      const updatedProject = await this.projectRepository.update(
        request.projectId,
        updateData
      );

      if (!updatedProject) {
        return { success: false, error: 'Failed to update project' };
      }

      return { success: true, project: updatedProject };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Build update data from request
   * @param request - Project update request
   * @returns Partial project data
   */
  private buildUpdateData(request: UpdateProjectRequestDTO): Partial<Project> {
    const updateData: Partial<Project> = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.author !== undefined) updateData.author = request.author;
    if (request.language !== undefined) updateData.language = request.language;
    if (request.genre !== undefined) updateData.genre = request.genre;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.metadata !== undefined) updateData.metadata = request.metadata;
    return updateData;
  }
}
