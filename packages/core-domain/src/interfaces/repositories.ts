/**
 * Repository Interfaces
 *
 * Clean Architecture: Domain layer defines repository interfaces
 * Infrastructure layer implements these interfaces
 */

import {
  User,
  Project,
  ApiKey,
  CreateUserRequest,
  CreateProjectRequest,
  CreateApiKeyRequest,
  UpdateProjectRequest,
} from './entities.js';

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
  update: (id: string, data: UpdateProjectRequest) => Promise<Project | null>;
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
  findByToken: (
    token: string
  ) => Promise<{ userId: string; expiresAt: string } | null>;
  delete: (token: string) => Promise<boolean>;
}

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
