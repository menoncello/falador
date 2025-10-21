/**
 * Domain Entities
 *
 * Core business entities that define the domain model
 */

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

// Data Transfer Objects (DTOs)

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

export interface UpdateProjectRequest {
  title?: string;
  author?: string;
  language?: 'pt-BR' | 'en';
  genre?: string;
  status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}
