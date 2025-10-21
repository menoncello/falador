/**
 * Project Repository Implementation
 * In-memory implementation for development/testing
 */

import type { Project, ProjectRepository } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryProjectRepository implements ProjectRepository {
  private projects: Map<string, Project> = new Map();

  /**
   *
   * @param projectData
   */
  async create(
    projectData: { userId: string; title: string; author?: string; language?: 'pt-BR' | 'en'; genre?: string; status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed'; metadata?: Record<string, unknown> }
  ): Promise<Project> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const project: Project = {
      id,
      userId: projectData.userId,
      title: projectData.title,
      author: projectData.author || null,
      language: projectData.language || 'pt-BR',
      genre: projectData.genre || null,
      status: projectData.status || 'draft',
      metadata: projectData.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    this.projects.set(id, project);
    return project;
  }

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  /**
   *
   * @param userId
   */
  async findByUserId(userId: string): Promise<Project[]> {
    const userProjects: Project[] = [];
    for (const project of this.projects.values()) {
      if (project.userId === userId) {
        userProjects.push(project);
      }
    }
    return userProjects;
  }

  /**
   *
   * @param id
   * @param updates
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const existingProject = this.projects.get(id);
    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`);
    }

    const updatedProject: Project = {
      ...existingProject,
      ...updates,
      updatedAt: new Date(),
    };

    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.projects.clear();
  }

  // Helper method for testing
  /**
   *
   */
  getAll(): Project[] {
    return Array.from(this.projects.values());
  }

  /**
   *
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
