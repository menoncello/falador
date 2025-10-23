/**
 * In-Memory Project Repository Implementation
 *
 * Implements the ProjectRepository interface using the in-memory Database
 */

import { inject, injectable } from 'tsyringe';
import {
  ProjectRepository,
  Project,
  CreateProjectRequest,
} from '../../../core-domain/src/index.js';
import { Database } from '../database.js';

/**
 *
 */
@injectable()
export class InMemoryProjectRepository implements ProjectRepository {
  /**
   *
   * @param database
   */
  constructor(@inject('Database') private database: Database) {}

  /**
   *
   * @param data
   */
  async create(data: CreateProjectRequest): Promise<Project> {
    return this.database.createProject(data);
  }

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<Project | null> {
    return this.database.getProjectById(id) || null;
  }

  /**
   *
   * @param userId
   */
  async findByUserId(userId: string): Promise<Project[]> {
    return this.database.getProjectsByUserId(userId);
  }

  /**
   *
   * @param id
   * @param data
   */
  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Project | null> {
    return this.database.updateProject(id, data) || null;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.database.deleteProject(id);
  }
}
