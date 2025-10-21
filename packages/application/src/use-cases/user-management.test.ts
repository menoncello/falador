/**
 * User Management Use Case Tests
 * Testing application layer business logic with mocked dependencies
 */

import 'reflect-metadata';
import type {
  UserRepository,
  User,
  ValidationError,
  NotFoundError,
} from '@falador/core-domain';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { UserManagementUseCase } from './user-management.js';

describe('UserManagementUseCase', () => {
  let userUseCase: UserManagementUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = {
      create: mock(() => Promise.resolve({} as User)),
      findById: mock(() => Promise.resolve(null)),
      findByEmail: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({} as User)),
      delete: mock(() => Promise.resolve(true)),
    } as UserRepository;

    userUseCase = new UserManagementUseCase(mockUserRepository);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const expectedUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await userUseCase.createUser(userData);

      expect(result).toBe(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
    });

    it('should throw ValidationError for missing email', async () => {
      const userData = {
        email: '',
        name: 'Test User',
      };

      await expect(userUseCase.createUser(userData)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing name', async () => {
      const userData = {
        email: 'test@example.com',
        name: '',
      };

      await expect(userUseCase.createUser(userData)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
      };

      await expect(userUseCase.createUser(userData)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const existingUser: User = {
        id: 'existing-user',
        email: 'test@example.com',
        name: 'Existing User',
        createdAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(userUseCase.createUser(userData)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should trim whitespace from email and name', async () => {
      const userData = {
        email: '  test@example.com  ',
        name: '  Test User  ',
      };

      const expectedUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await userUseCase.createUser(userData);

      expect(result).toBe(expectedUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      const expectedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(expectedUser);

      const result = await userUseCase.getUserById(userId);

      expect(result).toBe(expectedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userUseCase.getUserById(userId);

      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw ValidationError for missing user ID', async () => {
      await expect(userUseCase.getUserById('')).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com';
      const expectedUser: User = {
        id: 'user-123',
        email: email,
        name: 'Test User',
        createdAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(expectedUser);

      const result = await userUseCase.getUserByEmail(email);

      expect(result).toBe(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userUseCase.getUserByEmail(email);

      expect(result).toBeNull();
    });

    it('should throw ValidationError for missing email', async () => {
      await expect(userUseCase.getUserByEmail('')).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      const userId = 'user-123';
      const updateData = { name: 'Updated Name' };

      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Original Name',
        createdAt: new Date(),
      };

      const updatedUser: User = {
        ...existingUser,
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userUseCase.updateUser(userId, updateData);

      expect(result).toBe(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        updateData
      );
    });

    it('should throw ValidationError for missing user ID', async () => {
      await expect(
        userUseCase.updateUser('', { name: 'Test' })
      ).rejects.toThrow(ValidationError);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing name', async () => {
      const userId = 'user-123';
      const updateData = { name: '' };

      await expect(userUseCase.updateUser(userId, updateData)).rejects.toThrow(
        ValidationError
      );
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const userId = 'non-existent-user';
      const updateData = { name: 'Updated Name' };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userUseCase.updateUser(userId, updateData)).rejects.toThrow(
        NotFoundError
      );
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should trim whitespace from name', async () => {
      const userId = 'user-123';
      const updateData = { name: '  Updated Name  ' };

      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Original Name',
        createdAt: new Date(),
      };

      const updatedUser: User = {
        ...existingUser,
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userUseCase.updateUser(userId, updateData);

      expect(result).toBe(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        name: 'Updated Name',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const userId = 'user-123';
      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.delete.mockResolvedValue(true);

      const result = await userUseCase.deleteUser(userId);

      expect(result).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw ValidationError for missing user ID', async () => {
      await expect(userUseCase.deleteUser('')).rejects.toThrow(ValidationError);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const userId = 'non-existent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userUseCase.deleteUser(userId)).rejects.toThrow(
        NotFoundError
      );
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });
  });
});
