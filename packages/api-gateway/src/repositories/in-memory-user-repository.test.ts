import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { User, CreateUserRequest } from '../../../core-domain/src/index';
import type { Database } from '../database';
import { InMemoryUserRepository } from './in-memory-user-repository';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;
  let mockDatabase: Database;

  beforeEach(() => {
    // Create mock database
    mockDatabase = {
      createUser: mock(
        async (data: CreateUserRequest): Promise<User> => ({
          id: 'user-123',
          email: data.email,
          name: data.name,
          passwordHash: 'hashed_password',
          tier: data.tier || 'free',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      ),
      getUserById: mock(async (id: string) => ({
        id,
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        tier: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      getUserByEmail: mock(async (email: string) => ({
        id: 'user-123',
        email,
        name: 'Test User',
        passwordHash: 'hashed_password',
        tier: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      deleteUser: mock(async () => true),
    } as unknown as Database;

    repository = new InMemoryUserRepository(mockDatabase);
  });

  describe('create', () => {
    it('should create user via database', async () => {
      // Arrange
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        tier: 'free',
      };

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(mockDatabase.createUser).toHaveBeenCalledWith(userData);
      expect(mockDatabase.createUser).toHaveBeenCalledTimes(1);
    });

    it('should create user with default tier', async () => {
      // Arrange
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.tier).toBe('free');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      // Arrange
      const userId = 'user-123';

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
      expect(mockDatabase.getUserById).toHaveBeenCalledWith(userId);
      expect(mockDatabase.getUserById).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockDatabase.getUserById = mock(async () => null);
      const userId = 'non-existent';

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const email = 'test@example.com';

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(mockDatabase.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockDatabase.getUserByEmail).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent email', async () => {
      // Arrange
      mockDatabase.getUserByEmail = mock(async () => null);
      const email = 'non-existent@example.com';

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      // Arrange
      const userId = 'user-123';

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(true);
      expect(mockDatabase.deleteUser).toHaveBeenCalledWith(userId);
      expect(mockDatabase.deleteUser).toHaveBeenCalledTimes(1);
    });

    it('should return false when delete fails', async () => {
      // Arrange
      mockDatabase.deleteUser = mock(async () => false);
      const userId = 'user-123';

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
