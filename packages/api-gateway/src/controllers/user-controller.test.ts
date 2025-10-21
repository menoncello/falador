/**
 * User Controller Tests
 * Testing presentation layer with mocked dependencies
 */

import 'reflect-metadata';
import type { UserManagementUseCase } from '@falador/application/use-cases/user-management.js';
import type {
  User,
  ValidationError,
  NotFoundError,
} from '@falador/core-domain';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Elysia } from 'elysia';
import { UserController } from './user-controller.js';

describe('UserController', () => {
  let userController: UserController;
  let mockUserUseCase: UserManagementUseCase;
  let app: Elysia;

  beforeEach(() => {
    // Create mock use case
    mockUserUseCase = {
      createUser: mock(() => Promise.resolve({} as User)),
      getUserById: mock(() => Promise.resolve(null)),
      getUserByEmail: mock(() => Promise.resolve(null)),
      updateUser: mock(() => Promise.resolve({} as User)),
      deleteUser: mock(() => Promise.resolve(true)),
    } as UserManagementUseCase;

    userController = new UserController(mockUserUseCase);
    app = new Elysia();
    userController.registerRoutes(app);
  });

  describe('POST /api/users', () => {
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

      mockUserUseCase.createUser.mockResolvedValue(expectedUser);

      const response = await app
        .handle(
          new Request('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: expectedUser.createdAt.toISOString(),
        updatedAt: expectedUser.updatedAt.toISOString(),
      });

      expect(mockUserUseCase.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for validation error', async () => {
      const userData = {
        email: 'invalid-email',
        name: '',
      };

      mockUserUseCase.createUser.mockRejectedValue(
        new ValidationError('Invalid email format')
      );

      const response = await app
        .handle(
          new Request('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Validation Error',
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should return 500 for unexpected error', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserUseCase.createUser.mockRejectedValue(new Error('Database error'));

      const response = await app
        .handle(
          new Request('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to create user',
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      const expectedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };

      mockUserUseCase.getUserById.mockResolvedValue(expectedUser);

      const response = await app
        .handle(new Request(`http://localhost:3000/api/users/${userId}`))
        .then((res) => res.json());

      expect(response).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: expectedUser.createdAt.toISOString(),
      });

      expect(mockUserUseCase.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return 404 when user not found', async () => {
      const userId = 'non-existent-user';

      mockUserUseCase.getUserById.mockResolvedValue(null);

      const response = await app
        .handle(new Request(`http://localhost:3000/api/users/${userId}`))
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Not Found',
        message: 'User not found',
      });
    });

    it('should return 400 for validation error', async () => {
      mockUserUseCase.getUserById.mockRejectedValue(
        new ValidationError('Invalid user ID')
      );

      const response = await app
        .handle(new Request('http://localhost:3000/api/users/invalid-id'))
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Validation Error',
        message: 'Invalid user ID',
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with valid data', async () => {
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Name',
      };

      const expectedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserUseCase.updateUser.mockResolvedValue(expectedUser);

      const response = await app
        .handle(
          new Request(`http://localhost:3000/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: expectedUser.createdAt.toISOString(),
        updatedAt: expectedUser.updatedAt.toISOString(),
      });

      expect(mockUserUseCase.updateUser).toHaveBeenCalledWith(
        userId,
        updateData
      );
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 'non-existent-user';
      const updateData = { name: 'Updated Name' };

      mockUserUseCase.updateUser.mockRejectedValue(
        new NotFoundError('User', userId)
      );

      const response = await app
        .handle(
          new Request(`http://localhost:3000/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Not Found',
        message: 'User with id non-existent-user not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete existing user', async () => {
      const userId = 'user-123';

      mockUserUseCase.getUserById.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      } as User);

      mockUserUseCase.deleteUser.mockResolvedValue(true);

      const response = await app.handle(
        new Request(`http://localhost:3000/api/users/${userId}`, {
          method: 'DELETE',
        })
      );

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');

      expect(mockUserUseCase.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should return 404 when trying to delete non-existent user', async () => {
      const userId = 'non-existent-user';

      mockUserUseCase.deleteUser.mockResolvedValue(false);

      const response = await app
        .handle(
          new Request(`http://localhost:3000/api/users/${userId}`, {
            method: 'DELETE',
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Not Found',
        message: 'User not found',
      });
    });

    it('should return 400 for validation error', async () => {
      mockUserUseCase.deleteUser.mockRejectedValue(
        new ValidationError('Invalid user ID')
      );

      const response = await app
        .handle(
          new Request('http://localhost:3000/api/users/invalid-id', {
            method: 'DELETE',
          })
        )
        .then((res) => res.json());

      expect(response).toEqual({
        error: 'Validation Error',
        message: 'Invalid user ID',
        code: 'VALIDATION_ERROR',
      });
    });
  });
});
