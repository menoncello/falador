import type { Elysia } from 'elysia';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
}

export interface RegisterBody {
  email: string;
  name: string;
  password: string;
  tier?: 'free' | 'pro' | 'enterprise';
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateApiKeyBody {
  name: string;
  scopes: string[];
}

export interface CreateProjectBody {
  title: string;
  author?: string;
  language?: 'pt-BR' | 'en';
  genre?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateProjectBody {
  title?: string;
  author?: string;
  language?: 'pt-BR' | 'en';
  genre?: string;
  status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

export interface RouteHandler {
  body?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  set: {
    status?: number;
    headers?: Record<string, string>;
  };
  query?: Record<string, string>;
}
