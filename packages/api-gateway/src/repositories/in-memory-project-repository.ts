/**
 * In-Memory Project Repository Implementation
 *
 * Implements the ProjectRepository interface using the in-memory Database
 */

import { ProjectRepository } from '@falador/core-domain';
import { inject, injectable } from 'tsyringe';
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
   * @param data.userId
   * @param data.title
   * @param data.author
   * @param data.language
   * @param data.genre
   * @param data.status
   * @param data.metadata
   */
  async create(data: {
    userId: string;
    title: string;
    author?: string;
    language?: 'pt-BR' | 'en';
    genre?: string;
    status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
  }) {
    return this.database.createProject(data);
  }

  /**
   *
   * @param id
   */
  async findById(id: string) {
    return this.database.getProjectById(id) || null;
  }

  /**
   *
   * @param userId
   */
  async findByUserId(userId: string) {
    return this.database.getProjectsByUserId(userId);
  }

  /**
   *
   * @param id
   * @param data
   */
  async update(
    id: string,
    data: Partial<
      Omit<
        import('@falador/core-domain').Project,
        'id' | 'userId' | 'createdAt'
      >
    >
  ) {
    return this.database.updateProject(id, data) || null;
  }

  /**
   *
   * @param id
   */
  async delete(id: string) {
    return this.database.deleteProject(id);
  }
}
