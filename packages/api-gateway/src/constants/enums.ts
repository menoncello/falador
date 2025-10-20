/**
 * Application domain constants
 * Centralized to prevent magic strings and ensure consistency
 */

export const USER_TIER = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type UserTier = (typeof USER_TIER)[keyof typeof USER_TIER];

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const PROJECT_LANGUAGE = {
  PORTUGUESE_BRAZIL: 'pt-BR',
  ENGLISH: 'en',
} as const;

export type ProjectLanguage =
  (typeof PROJECT_LANGUAGE)[keyof typeof PROJECT_LANGUAGE];
