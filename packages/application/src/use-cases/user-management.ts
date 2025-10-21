/**
 * User Management Use Cases
 */

import type {
  User,
  UserRepository,
  ValidationError,
  NotFoundError,
} from '@falador/core-domain';
import { injectable, inject } from 'tsyringe';

export interface CreateUserRequest {
  email: string;
  name: string;
}

export interface UpdateUserRequest {
  name?: string;
}

/**
 *
 */
@injectable()
export class UserManagementUseCase {
  /**
   *
   * @param userRepository
   */
  constructor(
    @inject('UserRepository') private userRepository: UserRepository
  ) {}

  /**
   *
   * @param request
   */
  async createUser(request: CreateUserRequest): Promise<User> {
    // Validation
    if (!request.email?.trim()) {
      throw new ValidationError('Email is required');
    }
    if (!request.name?.trim()) {
      throw new ValidationError('Name is required');
    }
    if (!this.isValidEmail(request.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user
    return await this.userRepository.create({
      email: request.email.trim(),
      name: request.name.trim(),
    });
  }

  /**
   *
   * @param userId
   */
  async getUserById(userId: string): Promise<User | null> {
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required');
    }

    return await this.userRepository.findById(userId);
  }

  /**
   *
   * @param email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    if (!email?.trim()) {
      throw new ValidationError('Email is required');
    }

    return await this.userRepository.findByEmail(email);
  }

  /**
   *
   * @param userId
   * @param request
   */
  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    // Validation
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required');
    }
    if (!request.name?.trim()) {
      throw new ValidationError('Name is required for update');
    }

    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User', userId);
    }

    // Update user
    return await this.userRepository.update(userId, {
      name: request.name.trim(),
    });
  }

  /**
   *
   * @param userId
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User', userId);
    }

    return await this.userRepository.delete(userId);
  }

  /**
   *
   * @param email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
