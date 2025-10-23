/**
 * User Repository Implementation
 */

import { randomBytes } from 'crypto';
import { injectable } from 'tsyringe';
import { CRYPTO } from '../constants/crypto.js';
import type { User } from '../types/entities';
import type { PasswordHasher } from './database-repository';

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface UserRepository {
  createUser: (userData: CreateUserRequest) => Promise<User>;
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
  delete: (id: string) => Promise<boolean>;
}

/**
 * In-memory user repository implementation
 */
@injectable()
export class UserRepositoryImpl implements UserRepository {
  private users: Map<string, User> = new Map();

  /**
   * Creates a new UserRepositoryImpl instance
   * @param passwordHasher - Service for hashing passwords
   */
  constructor(private passwordHasher: PasswordHasher) {}

  /**
   * Generates a unique identifier using random bytes
   * @returns Generated ID as hexadecimal string
   */
  private generateId(): string {
    return randomBytes(CRYPTO.ID_BYTES).toString('hex');
  }

  /**
   * Gets the current timestamp in ISO format
   * @returns Current timestamp as ISO string
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Creates a new user in the database
   * @param userData - User data to create
   * @returns Created user object
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const id = this.generateId();
    const now = this.getCurrentTimestamp();
    const user: User = {
      id,
      email: userData.email,
      name: userData.name,
      passwordHash: this.passwordHasher.hash(userData.password),
      tier: userData.tier || 'free',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  /**
   * Finds a user by email address
   * @param email - Email address to search for
   * @returns User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return (
      Array.from(this.users.values()).find((user) => user.email === email) ||
      null
    );
  }

  /**
   * Finds a user by ID
   * @param id - User ID to search for
   * @returns User object or null if not found
   */
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   * Deletes a user by ID
   * @param id - User ID to delete
   * @returns True if user was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Clear all data (for testing)
  /**
   * Clears all user data from the repository
   */
  clear(): void {
    this.users.clear();
  }
}
