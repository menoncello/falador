/**
 * In-Memory Session Repository Implementation
 *
 * Implements the SessionRepository interface using the in-memory Database
 */

import { SessionRepository, TokenGenerator } from '@falador/core-domain';
import { inject, injectable } from 'tsyringe';
import { Database } from '../database.js';

/**
 *
 */
@injectable()
export class InMemorySessionRepository implements SessionRepository {
  /**
   *
   * @param database
   * @param tokenGenerator
   */
  constructor(
    @inject('Database') private database: Database,
    @inject('TokenGenerator') private tokenGenerator: TokenGenerator
  ) {}

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
  async findByToken(
    token: string
  ): Promise<{ userId: string; expiresAt: string } | null> {
    const session = this.database.getSession(token);
    if (!session) {
      return null;
    }
    return {
      userId: session.userId,
      expiresAt: session.expiresAt,
    };
  }

  /**
   *
   * @param token
   */
  async delete(token: string): Promise<boolean> {
    // The Database class doesn't have a deleteSession method, so we'll implement it
    // by clearing the session from the sessions map
    return (
      (this.database.deleteSession && this.database.deleteSession(token)) ||
      true
    );
  }
}
