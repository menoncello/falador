/**
 * In-Memory Session Repository Implementation
 *
 * Implements the SessionRepository interface using the in-memory Database
 */

import { inject, injectable } from 'tsyringe';
import { SessionRepository, Session } from '../../../core-domain/src/index.js';
import { Database } from '../database.js';

/**
 *
 */
@injectable()
export class InMemorySessionRepository implements SessionRepository {
  /**
   *
   * @param database
   */
  constructor(@inject('Database') private database: Database) {}

  /**
   *
   * @param userId
   */
  async create(userId: string): Promise<string> {
    return this.database.createSession(userId);
  }

  /**
   *
   * @param token
   */
  async findByToken(token: string): Promise<Session | null> {
    const session = this.database.getSession(token);
    if (!session) {
      return null;
    }
    return session;
  }

  /**
   *
   * @param token
   */
  async delete(token: string): Promise<boolean> {
    return this.database.deleteSession(token);
  }
}
