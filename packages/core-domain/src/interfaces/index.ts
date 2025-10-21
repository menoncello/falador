/**
 * Domain Interfaces
 * Contracts for repository and service implementations
 */

import type {
  User,
  Project,
  AudioFile,
  Voice,
  GenerationJob,
  ApiKey,
  Session,
} from '../entities/index.js';

// Repository Interfaces
export interface UserRepository {
  create: (userData: {
    email: string;
    name: string;
    password: string;
    tier?: 'free' | 'pro' | 'enterprise';
  }) => Promise<User>;
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface ProjectRepository {
  create: (data: {
    userId: string;
    title: string;
    author?: string;
    language?: 'pt-BR' | 'en';
    genre?: string;
    status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
  }) => Promise<Project>;
  findById: (id: string) => Promise<Project | null>;
  findByUserId: (userId: string) => Promise<Project[]>;
  update: (
    id: string,
    data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
  ) => Promise<Project | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface ApiKeyRepository {
  create: (data: {
    userId: string;
    name: string;
    scopes: string[];
  }) => Promise<ApiKey>;
  findById: (id: string) => Promise<ApiKey | null>;
  findByKey: (key: string) => Promise<ApiKey | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface SessionRepository {
  create: (userId: string) => Promise<string>;
  findByToken: (
    token: string
  ) => Promise<{ userId: string; expiresAt: string } | null>;
  delete: (token: string) => Promise<boolean>;
}

export interface AudioFileRepository {
  create: (
    audioFile: Omit<AudioFile, 'id' | 'createdAt'>
  ) => Promise<AudioFile>;
  findById: (id: string) => Promise<AudioFile | null>;
  findByProjectId: (projectId: string) => Promise<AudioFile[]>;
  delete: (id: string) => Promise<boolean>;
}

export interface VoiceRepository {
  create: (voice: Omit<Voice, 'id'>) => Promise<Voice>;
  findById: (id: string) => Promise<Voice | null>;
  findAll: () => Promise<Voice[]>;
  findByLanguage: (language: string) => Promise<Voice[]>;
  update: (id: string, updates: Partial<Voice>) => Promise<Voice>;
  delete: (id: string) => Promise<boolean>;
}

export interface GenerationJobRepository {
  create: (
    job: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<GenerationJob>;
  findById: (id: string) => Promise<GenerationJob | null>;
  findByProjectId: (projectId: string) => Promise<GenerationJob[]>;
  update: (
    id: string,
    updates: Partial<GenerationJob>
  ) => Promise<GenerationJob>;
  delete: (id: string) => Promise<boolean>;
}

// Service Interfaces
export interface PasswordHasher {
  hash: (password: string) => string;
  verify: (password: string, hash: string) => boolean;
}

export interface TokenGenerator {
  generate: () => string;
}

export interface ApiKeyGenerator {
  generate: () => string;
}

// Service Interfaces
export interface TTSEngine {
  generate: (text: string, voice: Voice) => Promise<ArrayBuffer>;
  getVoices: () => Promise<Voice[]>;
  validateVoice: (voiceId: string) => Promise<boolean>;
}

export interface Storage {
  save: (audioBuffer: ArrayBuffer, filename: string) => Promise<string>;
  load: (path: string) => Promise<ArrayBuffer>;
  delete: (path: string) => Promise<boolean>;
}

export interface Queue {
  enqueue: (job: GenerationJob) => Promise<void>;
  dequeue: () => Promise<GenerationJob | null>;
  complete: (jobId: string) => Promise<void>;
  fail: (jobId: string, error: string) => Promise<void>;
}

// Domain Service Interfaces
export interface EmailService {
  sendWelcomeEmail: (user: User) => Promise<void>;
  sendProjectCompletedEmail: (user: User, project: Project) => Promise<void>;
}

export interface NotificationService {
  notifyUser: (user: User, message: string) => Promise<void>;
  notifyProjectProgress: (
    user: User,
    project: Project,
    progress: number
  ) => Promise<void>;
}

// Value Objects
export interface VoiceConfig {
  id: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface AudioMetadata {
  duration: number;
  format: string;
  size: number;
  sampleRate: number;
}

// Domain Errors
/**
 *
 */
export class DomainError extends Error {
  /**
   *
   * @param message
   * @param code
   */
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 *
 */
export class ValidationError extends DomainError {
  /**
   *
   * @param message
   */
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 *
 */
export class NotFoundError extends DomainError {
  /**
   *
   * @param resource
   * @param id
   */
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 *
 */
export class UnauthorizedError extends DomainError {
  /**
   *
   * @param message
   */
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}
