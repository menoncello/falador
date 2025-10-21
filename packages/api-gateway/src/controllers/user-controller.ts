/**
 * User Controller
 * REST API endpoints for user management
 */

import type { UserManagementUseCase } from '@falador/application/use-cases/user-management.js';
import type {
  User,
  ValidationError,
  NotFoundError,
} from '@falador/core-domain';
import { Elysia, t } from 'elysia';
import { injectable, inject } from 'tsyringe';
import type { RouteHandler } from '../types';

export interface CreateUserRequest {
  email: string;
  name: string;
}

export interface UpdateUserRequest {
  name?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

/**
 *
 */
@injectable()
export class UserController {
  /**
   *
   * @param userUseCase
   */
  constructor(
    @inject('UserManagementUseCase') private userUseCase: UserManagementUseCase
  ) {}

  /**
   *
   * @param app
   */
  registerRoutes(app: Elysia): void {
    // POST /api/users - Create user
    app.post(
      '/api/users',
      async ({ body, set }: any) => {
        try {
          const request = body as CreateUserRequest;
          const user = await this.userUseCase.createUser(request);

          set.status = 201;
          return this.mapUserToResponse(user);
        } catch (error) {
          if (error instanceof ValidationError) {
            set.status = 400;
            return {
              error: 'Validation Error',
              message: error.message,
              code: error.code,
            } as ErrorResponse;
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message: 'Failed to create user',
          } as ErrorResponse;
        }
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
          name: t.String({ minLength: 1, maxLength: 100 }),
        }),
      }
    );

    // GET /api/users/:id - Get user by ID
    app.get(
      '/api/users/:id',
      async ({ params, set }: any) => {
        try {
          const user = await this.userUseCase.getUserById(params.id);

          if (!user) {
            set.status = 404;
            return {
              error: 'Not Found',
              message: 'User not found',
            } as ErrorResponse;
          }

          return this.mapUserToResponse(user);
        } catch (error) {
          if (error instanceof ValidationError) {
            set.status = 400;
            return {
              error: 'Validation Error',
              message: error.message,
              code: error.code,
            } as ErrorResponse;
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message: 'Failed to get user',
          } as ErrorResponse;
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    );

    // PUT /api/users/:id - Update user
    app.put(
      '/api/users/:id',
      async ({ params, body, set }: any) => {
        try {
          const request = body as UpdateUserRequest;
          const user = await this.userUseCase.updateUser(params.id, request);

          return this.mapUserToResponse(user);
        } catch (error) {
          if (error instanceof ValidationError) {
            set.status = 400;
            return {
              error: 'Validation Error',
              message: error.message,
              code: error.code,
            } as ErrorResponse;
          }

          if (error instanceof NotFoundError) {
            set.status = 404;
            return {
              error: 'Not Found',
              message: error.message,
              code: error.code,
            } as ErrorResponse;
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message: 'Failed to update user',
          } as ErrorResponse;
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        }),
      }
    );

    // DELETE /api/users/:id - Delete user
    app.delete(
      '/api/users/:id',
      async ({ params, set }: any) => {
        try {
          const deleted = await this.userUseCase.deleteUser(params.id);

          if (!deleted) {
            set.status = 404;
            return {
              error: 'Not Found',
              message: 'User not found',
            } as ErrorResponse;
          }

          set.status = 204;
          return null;
        } catch (error) {
          if (error instanceof ValidationError) {
            set.status = 400;
            return {
              error: 'Validation Error',
              message: error.message,
              code: error.code,
            } as ErrorResponse;
          }

          set.status = 500;
          return {
            error: 'Internal Server Error',
            message: 'Failed to delete user',
          } as ErrorResponse;
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    );
  }

  /**
   *
   * @param user
   */
  private mapUserToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }
}
