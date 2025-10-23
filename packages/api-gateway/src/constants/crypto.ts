/**
 * Cryptographic Constants
 * Prevents magic numbers in crypto operations
 */

export const CRYPTO = {
  ID_BYTES: 16,
  SESSION_DURATION_MS: 86_400_000, // 24 hours
  MIN_SECRET_LENGTH: 32,
} as const;
