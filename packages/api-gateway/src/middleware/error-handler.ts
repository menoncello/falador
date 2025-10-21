/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

import type {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@falador/core-domain';
import type { Elysia } from 'elysia';
import { injectable } from 'tsyringe';

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

/**
 *
 */
@injectable()
export class ErrorHandlerMiddleware {
  /**
   *
   * @param app
   */
  registerMiddleware(app: Elysia): void {
    // Global error handler
    app.onError(({ error, set, request }) => {
      const timestamp = new Date().toISOString();
      const requestId = request.headers.get('x-request-id') || undefined;

      // Handle domain errors
      if (error instanceof ValidationError) {
        set.status = 400;
        return this.createErrorResponse(
          'Validation Error',
          error.message,
          error.code,
          timestamp,
          requestId
        );
      }

      if (error instanceof NotFoundError) {
        set.status = 404;
        return this.createErrorResponse(
          'Not Found',
          error.message,
          error.code,
          timestamp,
          requestId
        );
      }

      if (error instanceof UnauthorizedError) {
        set.status = 403;
        return this.createErrorResponse(
          'Unauthorized',
          error.message,
          error.code,
          timestamp,
          requestId
        );
      }

      if (error instanceof DomainError) {
        set.status = 400;
        return this.createErrorResponse(
          'Domain Error',
          error.message,
          error.code,
          timestamp,
          requestId
        );
      }

      // Handle validation errors from Elysia
      if (error.name === 'ValidationError') {
        set.status = 400;
        return this.createErrorResponse(
          'Validation Error',
          error.message,
          'VALIDATION_ERROR',
          timestamp,
          requestId
        );
      }

      // Handle generic errors
      console.error('Unhandled error:', error);

      set.status = 500;
      return this.createErrorResponse(
        'Internal Server Error',
        'An unexpected error occurred',
        'INTERNAL_ERROR',
        timestamp,
        requestId
      );
    });

    // Request ID middleware
    app.derive(({ request }) => {
      const requestId =
        request.headers.get('x-request-id') || this.generateRequestId();
      request.headers.set('x-request-id', requestId);
      return {
        requestId,
      };
    });
  }

  /**
   *
   * @param error
   * @param message
   * @param code
   * @param timestamp
   * @param requestId
   */
  private createErrorResponse(
    error: string,
    message: string,
    code?: string,
    timestamp?: string,
    requestId?: string
  ): ErrorResponse {
    return {
      error,
      message,
      code,
      timestamp: timestamp || new Date().toISOString(),
      requestId,
    };
  }

  /**
   *
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
