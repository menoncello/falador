/**
 * In-Memory User Repository Implementation
 *
 * Implements the UserRepository interface using the in-memory Database
 * This is an adapter between the clean architecture interface and the concrete implementation
 */

import { inject, injectable } from 'tsyringe';
import {
  UserRepository,
  User,
  CreateUserRequest,
} from '../../../core-domain/src/index.js';
import { Database } from '../database.js';

/**
 *
 */
@injectable()
export class InMemoryUserRepository implements UserRepository {
  /**
   *
   * @param database
   */
  constructor(@inject('Database') private database: Database) {}

  /**
   *
   * @param userData
   */
  async create(userData: CreateUserRequest): Promise<User> {
    return this.database.createUser(userData);
  }

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<User | null> {
    return this.database.getUserById(id) || null;
  }

  /**
   *
   * @param email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.database.getUserByEmail(email) || null;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.database.deleteUser(id);
  }
}
