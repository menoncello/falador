/**
 * In-Memory User Repository Implementation
 *
 * Implements the UserRepository interface using the in-memory Database
 * This is an adapter between the clean architecture interface and the concrete implementation
 */

import { UserRepository, PasswordHasher } from '@falador/core-domain';
import { inject, injectable } from 'tsyringe';
import { Database } from '../database.js';

/**
 *
 */
@injectable()
export class InMemoryUserRepository implements UserRepository {
  /**
   *
   * @param database
   * @param passwordHasher
   */
  constructor(
    @inject('Database') private database: Database,
    @inject('PasswordHasher') private passwordHasher: PasswordHasher
  ) {}

  /**
   *
   * @param userData
   * @param userData.email
   * @param userData.name
   * @param userData.password
   * @param userData.tier
   */
  async create(userData: {
    email: string;
    name: string;
    password: string;
    tier?: 'free' | 'pro' | 'enterprise';
  }): Promise<import('@falador/core-domain').User> {
    const passwordHash = this.passwordHasher.hash(userData.password);
    return this.database.createUser({
      ...userData,
      passwordHash,
    });
  }

  /**
   *
   * @param id
   */
  async findById(
    id: string
  ): Promise<import('@falador/core-domain').User | null> {
    return this.database.getUserById(id) || null;
  }

  /**
   *
   * @param email
   */
  async findByEmail(
    email: string
  ): Promise<import('@falador/core-domain').User | null> {
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
