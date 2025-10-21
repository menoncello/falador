/**
 * In-Memory User Repository Tests
 * Testing infrastructure layer implementation
 */

import 'reflect-metadata';
import type { User } from '@falador/core-domain';
import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryUserRepository } from './user-repository.js';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    repository.clear(); // Ensure clean state for each test
  });

  describe('create', () => {
    it('should create user with generated ID and timestamps', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await repository.create(userData);

      expect(result.id).toBeTruthy();
      expect(result.id).toMatch(/^user_\d+_[\da-z]+$/);
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt).toEqual(result.updatedAt);
    });

    it('should store user in memory', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);
      const foundUser = await repository.findById(createdUser.id);

      expect(foundUser).toEqual(createdUser);
    });

    it('should create multiple users with unique IDs', async () => {
      const userData1 = { email: 'user1@example.com', name: 'User 1' };
      const userData2 = { email: 'user2@example.com', name: 'User 2' };

      const user1 = await repository.create(userData1);
      const user2 = await repository.create(userData2);

      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).toBe(userData1.email);
      expect(user2.email).toBe(userData2.email);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);
      const foundUser = await repository.findById(createdUser.id);

      expect(foundUser).toEqual(createdUser);
    });

    it('should return null when user not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);
      const foundUser = await repository.findByEmail(userData.email);

      expect(foundUser).toEqual(createdUser);
    });

    it('should return null when email not found', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should find user by email regardless of case', async () => {
      const userData = {
        email: 'Test@Example.COM',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);
      const foundUser = await repository.findByEmail('test@example.com');

      expect(foundUser).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('should update user and set updatedAt timestamp', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Original Name',
      };

      const createdUser = await repository.create(userData);

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updateData = {
        name: 'Updated Name',
      };

      const updatedUser = await repository.update(createdUser.id, updateData);

      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.email).toBe(createdUser.email);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.createdAt).toEqual(createdUser.createdAt);
      expect(updatedUser.updatedAt).not.toEqual(createdUser.updatedAt);
      expect(updatedUser.updatedAt!.getTime()).toBeGreaterThan(
        createdUser.updatedAt!.getTime()
      );
    });

    it('should throw error when updating non-existent user', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      await expect(
        repository.update('non-existent-id', updateData)
      ).rejects.toThrow('User with id non-existent-id not found');
    });

    it('should allow partial updates', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);

      const updateData = {
        name: 'New Name',
      };

      const updatedUser = await repository.update(createdUser.id, updateData);

      expect(updatedUser.email).toBe(userData.email);
      expect(updatedUser.name).toBe(updateData.name);
    });
  });

  describe('delete', () => {
    it('should delete existing user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);
      const deleteResult = await repository.delete(createdUser.id);

      expect(deleteResult).toBe(true);

      const foundUser = await repository.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('should return false when deleting non-existent user', async () => {
      const deleteResult = await repository.delete('non-existent-id');

      expect(deleteResult).toBe(false);
    });
  });

  describe('helper methods', () => {
    it('should return all users', async () => {
      const userData1 = { email: 'user1@example.com', name: 'User 1' };
      const userData2 = { email: 'user2@example.com', name: 'User 2' };

      await repository.create(userData1);
      await repository.create(userData2);

      const allUsers = repository.getAll();

      expect(allUsers).toHaveLength(2);
      expect(allUsers[0].email).toBe(userData1.email);
      expect(allUsers[1].email).toBe(userData2.email);
    });

    it('should clear all users', async () => {
      const userData1 = { email: 'user1@example.com', name: 'User 1' };
      const userData2 = { email: 'user2@example.com', name: 'User 2' };

      await repository.create(userData1);
      await repository.create(userData2);

      expect(repository.getAll()).toHaveLength(2);

      repository.clear();

      expect(repository.getAll()).toHaveLength(0);
    });
  });

  describe('data persistence', () => {
    it('should persist data across operations', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const createdUser = await repository.create(userData);

      // Update user
      await repository.update(createdUser.id, { name: 'Updated Name' });

      // Find by email
      const foundByEmail = await repository.findByEmail(userData.email);

      // Find by ID
      const foundById = await repository.findById(createdUser.id);

      expect(foundByEmail?.name).toBe('Updated Name');
      expect(foundById?.name).toBe('Updated Name');
      expect(foundByEmail).toEqual(foundById);
    });
  });
});
