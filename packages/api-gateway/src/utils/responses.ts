import { ERROR_MESSAGES } from '../constants/errors';
import { HTTP_STATUS } from '../constants/status';

interface ResponseHelpers {
  set: {
    status: number;
  };
}

/**
 * Creates a standardized error response
 * @param helpers
 * @param status
 * @param message
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
 * Creates a 401 Unauthorized response
 * @param helpers
 */
export const unauthorizedResponse = (
  helpers: ResponseHelpers
): { error: string } =>
  errorResponse(helpers, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);

/**
 * Creates a 403 Forbidden response
 * @param helpers
 */
export const forbiddenResponse = (
  helpers: ResponseHelpers
): { error: string } =>
  errorResponse(helpers, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);

/**
 * Creates a 404 Not Found response with custom message
 * @param helpers
 * @param message
 */
export const notFoundResponse = (
  helpers: ResponseHelpers,
  message: string
): { error: string } => errorResponse(helpers, HTTP_STATUS.NOT_FOUND, message);

/**
 * Creates a 409 Conflict response with custom message
 * @param helpers
 * @param message
 */
export const conflictResponse = (
  helpers: ResponseHelpers,
  message: string
): { error: string } => errorResponse(helpers, HTTP_STATUS.CONFLICT, message);

/**
 * Creates a 400 Bad Request response with custom message
 * @param helpers
 * @param message
 */
export const badRequestResponse = (
  helpers: ResponseHelpers,
  message: string
): { error: string } =>
  errorResponse(helpers, HTTP_STATUS.BAD_REQUEST, message);
