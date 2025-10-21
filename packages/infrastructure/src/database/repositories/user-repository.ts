/**
 * User Repository Implementation
 * In-memory implementation for development/testing
 */

import type { User, UserRepository } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  /**
   *
   * @param userData
   */
  async create(
    userData: { email: string; name: string; password: string; tier?: 'free' | 'pro' | 'enterprise' }
  ): Promise<User> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const passwordHash = `hashed_${userData.password}`; // Mock password hashing
    const user: User = {
      id,
      email: userData.email,
      name: userData.name,
      passwordHash,
      tier: userData.tier || 'free',
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    return user;
  }

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   *
   * @param email
   */
  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   *
   * @param id
   * @param updates
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.users.clear();
  }

  // Helper method for testing
  /**
   *
   */
  getAll(): User[] {
    return Array.from(this.users.values());
  }

  /**
   *
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
