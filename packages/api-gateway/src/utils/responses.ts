/**
 * HTTP Response utilities
 * Standardized response helpers to reduce code duplication
 */

import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export interface ResponseHelpers {
  set: {
    status: number;
  };
}

/**
 * Standard error response helper
 * @param helpers - Response helpers object with status setter
 * @param status - HTTP status code
 * @param message - Error message
 * @returns Standardized error response object
 */
export const errorResponse = (
  helpers: ResponseHelpers,
  status: number,
  message: string
): { error: string } => {
  helpers.set.status = status;
  return { error: message };
};

/**
 * Common error response helpers
 * @param helpers - Response helpers object with status setter
 * @returns Standardized unauthorized error response
 */
export const unauthorizedResponse = (
  helpers: ResponseHelpers
): { error: string } =>
  errorResponse(helpers, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);

/**
 * Forbidden error response helper
 * @param helpers - Response helpers object with status setter
 * @returns Standardized forbidden error response
 */
export const forbiddenResponse = (
  helpers: ResponseHelpers
): { error: string } =>
  errorResponse(helpers, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);

/**
 * Not found error response helper
 * @param helpers - Response helpers object with status setter
 * @param message - Custom error message
 * @returns Standardized not found error response
 */
export const notFoundResponse = (
  helpers: ResponseHelpers,
  message: string
): { error: string } => errorResponse(helpers, HTTP_STATUS.NOT_FOUND, message);

/**
 * Conflict error response helper
 * @param helpers - Response helpers object with status setter
 * @param message - Custom error message
 * @returns Standardized conflict error response
 */
export const conflictResponse = (
  helpers: ResponseHelpers,
  message: string
): { error: string } => errorResponse(helpers, HTTP_STATUS.CONFLICT, message);

/**
 * Bad request error response helper
 * @param helpers - Response helpers object with status setter
 * @param message - Custom error message
 * @returns Standardized bad request error response
 */
export const badRequestResponse = (
  helpers: ResponseHelpers,
  message: string
): { error: string } =>
  errorResponse(helpers, HTTP_STATUS.BAD_REQUEST, message);
