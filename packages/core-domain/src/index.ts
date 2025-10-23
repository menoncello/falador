/**
 * Falador Core Domain
 * Business logic and domain entities
 */

export const version = '0.0.1';

// Domain entities with complete structure
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  language: 'pt-BR' | 'en';
  genre: string | null;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'mature';
  provider: string;
  providerId: string;
  isActive: boolean;
  isAvailable: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationJob {
  id: string;
  userId: string;
  projectId: string;
  voiceId: string;
  status: string;
  progress: number;
  audioUrl?: string;
  error?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Data Transfer Objects
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface CreateProjectRequest {
  userId: string;
  title: string;
  author?: string;
  language?: 'pt-BR' | 'en';
  genre?: string;
  status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface CreateApiKeyRequest {
  userId: string;
  name: string;
  scopes: string[];
}

// Repository interfaces for dependency injection
export interface UserRepository {
  create: (userData: CreateUserRequest) => Promise<User>;
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface ProjectRepository {
  create: (data: CreateProjectRequest) => Promise<Project>;
  findById: (id: string) => Promise<Project | null>;
  findByUserId: (userId: string) => Promise<Project[]>;
  update: (id: string, data: Partial<Project>) => Promise<Project | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface ApiKeyRepository {
  create: (data: CreateApiKeyRequest) => Promise<ApiKey>;
  findById: (id: string) => Promise<ApiKey | null>;
  findByKey: (key: string) => Promise<ApiKey | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface SessionRepository {
  create: (userId: string) => Promise<string>;
  findByToken: (token: string) => Promise<Session | null>;
  delete: (token: string) => Promise<boolean>;
}

export interface VoiceRepository {
  findById: (id: string) => Promise<Voice | null>;
  findAll: () => Promise<Voice[]>;
  findByProvider: (provider: string) => Promise<Voice[]>;
  findAvailable: () => Promise<Voice[]>;
  save: (voice: Voice) => Promise<Voice>;
  delete: (id: string) => Promise<boolean>;
  update: (id: string, updates: Partial<Voice>) => Promise<Voice | null>;
  findByLanguage: (language: string) => Promise<Voice[]>;
  findDefault: () => Promise<Voice | null>;
}

export interface GenerationJobRepository {
  findById: (id: string) => Promise<GenerationJob | null>;
  findByProjectId: (projectId: string) => Promise<GenerationJob[]>;
  findByUserId: (userId: string) => Promise<GenerationJob[]>;
  findByStatus: (status: string) => Promise<GenerationJob[]>;
  save: (job: GenerationJob) => Promise<GenerationJob>;
  delete: (id: string) => Promise<boolean>;
  update: (
    id: string,
    updates: Partial<GenerationJob>
  ) => Promise<GenerationJob | null>;
  updateStatus: (
    id: string,
    status: string,
    metadata?: Record<string, unknown>
  ) => Promise<GenerationJob | null>;
  findPendingJobs: () => Promise<GenerationJob[]>;
  findProcessingJobs: () => Promise<GenerationJob[]>;
  findCompletedJobs: () => Promise<GenerationJob[]>;
  findFailedJobs: () => Promise<GenerationJob[]>;
  findByDateRange: (startDate: Date, endDate: Date) => Promise<GenerationJob[]>;
  countByStatus: (status: string) => Promise<number>;
  countByProject: (projectId: string) => Promise<number>;
  countByUser: (userId: string) => Promise<number>;
  findRecentJobs: (limit?: number) => Promise<GenerationJob[]>;
  findJobsByVoice: (voiceId: string) => Promise<GenerationJob[]>;
  updateProgress: (
    id: string,
    progress: number
  ) => Promise<GenerationJob | null>;
  setJobError: (id: string, error: string) => Promise<GenerationJob | null>;
  completeJob: (
    id: string,
    audioUrl?: string,
    metadata?: Record<string, unknown>
  ) => Promise<GenerationJob | null>;
}

// Service interfaces
export interface AuthService {
  hashPassword: (password: string) => string;
  verifyPassword: (password: string, storedHash: string) => boolean;
  generateToken: () => string;
  generateApiKey: () => string;
}

export interface PasswordHasher {
  hash: (password: string) => string | Promise<string>;
}

export interface TokenGenerator {
  generate: (payload?: Record<string, unknown>) => string;
  verify?: (token: string) => Record<string, unknown> | null;
  decode?: (token: string) => Record<string, unknown> | null;
}

export interface ApiKeyGenerator {
  generate: () => string;
  validate?: (apiKey: string) => boolean;
}

export interface Storage {
  save: (key: string, data: Buffer | string) => Promise<string>;
  load: (key: string) => Promise<Buffer | null>;
  delete: (key: string) => Promise<boolean>;
  exists: (key: string) => Promise<boolean>;
  getUrl: (key: string) => Promise<string>;
  list: (prefix?: string) => Promise<string[]>;
  getMetadata: (key: string) => Promise<Record<string, unknown> | null>;
  copy: (sourceKey: string, destinationKey: string) => Promise<boolean>;
  move: (sourceKey: string, destinationKey: string) => Promise<boolean>;
}

export interface Queue {
  enqueue: (job: GenerationJob) => Promise<void>;
  dequeue: () => Promise<GenerationJob | null>;
  complete: (jobId: string) => Promise<void>;
  fail: (jobId: string, error: string) => Promise<void>;
}

export interface TTSEngine {
  generate: (text: string, voice: Voice) => Promise<ArrayBuffer>;
  getVoices: () => Promise<Voice[]>;
  validateVoice: (voiceId: string) => Promise<boolean>;
}

// Export use cases (Application Layer)
export type {
  CreateProjectRequestDTO,
  CreateProjectResponse,
} from './use-cases/create-project-use-case';
export {
  CreateProjectUseCase,
  PROJECT_LIMITS,
  PROJECT_TITLE_MAX_LENGTH,
} from './use-cases/create-project-use-case';
