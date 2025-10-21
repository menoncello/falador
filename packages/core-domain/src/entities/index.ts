/**
 * Domain Entities
 * Pure business logic with no external dependencies
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

export interface AudioFile {
  id: string;
  projectId: string;
  filename: string;
  path: string;
  duration: number;
  size: number;
  format: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'mature';
  accent?: string;
  provider: string;
  providerId: string;
  isActive: boolean;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  voiceId: string;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}
