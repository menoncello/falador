/**
 * Database Repository Implementation
 *
 * Implements repository interfaces using the existing in-memory database
 */

import { randomBytes } from 'crypto';
import { injectable } from 'tsyringe';
import { CRYPTO } from '../constants/crypto.js';
import type { User, Project, ApiKey, Session } from '../types/entities';

// Service interfaces
export interface PasswordHasher {
  hash: (password: string) => string;
}

export interface TokenGenerator {
  generate: () => string;
}

export interface ApiKeyGenerator {
  generate: () => string;
}

// Request types
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

// Repository interfaces
export interface UserRepository {
  createUser: (userData: CreateUserRequest) => Promise<User>;
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface ProjectRepository {
  createProject: (data: CreateProjectRequest) => Promise<Project>;
  findById: (id: string) => Promise<Project | null>;
  findByUserId: (userId: string) => Promise<Project[]>;
  update: (id: string, data: Partial<Project>) => Promise<Project | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface ApiKeyRepository {
  createApiKey: (data: CreateApiKeyRequest) => Promise<ApiKey>;
  findById: (id: string) => Promise<ApiKey | null>;
  findByKey: (key: string) => Promise<ApiKey | null>;
  delete: (id: string) => Promise<boolean>;
}

export interface SessionRepository {
  createSession: (userId: string) => Promise<string>;
  findByToken: (token: string) => Promise<Session | null>;
  delete: (token: string) => Promise<boolean>;
}

/**
 * In-memory database repository implementation
 */
@injectable()
export class DatabaseRepository {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private sessions: Map<string, Session> = new Map();

  /**
   * Creates a new DatabaseRepository instance
   * @param passwordHasher - Service for hashing passwords
   * @param tokenGenerator - Service for generating tokens
   * @param apiKeyGenerator - Service for generating API keys
   */
  constructor(
    private passwordHasher: PasswordHasher,
    private tokenGenerator: TokenGenerator,
    private apiKeyGenerator: ApiKeyGenerator
  ) {}

  // Helper method to generate IDs
  /**
   * Generates a unique identifier using random bytes
   * @returns Generated ID as hexadecimal string
   */
  private generateId(): string {
    return randomBytes(CRYPTO.ID_BYTES).toString('hex');
  }

  /**
   * Gets the current timestamp in ISO format
   * @returns Current timestamp as ISO string
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // UserRepository implementation
  /**
   * Creates a new user in the database
   * @param userData - User data to create
   * @returns Created user object
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const id = this.generateId();
    const now = this.getCurrentTimestamp();
    const user: User = {
      id,
      email: userData.email,
      name: userData.name,
      passwordHash: this.passwordHasher.hash(userData.password),
      tier: userData.tier || 'free',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  /**
   * Finds a user by email address
   * @param email - Email address to search for
   * @returns User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return (
      Array.from(this.users.values()).find((user) => user.email === email) ||
      null
    );
  }

  /**
   * Finds a user by ID
   * @param id - User ID to search for
   * @returns User object or null if not found
   */
  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   * Deletes a user by ID
   * @param id - User ID to delete
   * @returns True if user was deleted, false otherwise
   */
  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // ProjectRepository implementation
  /**
   * Creates a new project in the database
   * @param data - Project data to create
   * @returns Created project object
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const id = this.generateId();
    const now = this.getCurrentTimestamp();
    const project: Project = {
      id,
      userId: data.userId,
      title: data.title,
      author: data.author || null,
      language: data.language || 'pt-BR',
      genre: data.genre || null,
      status: data.status || 'draft',
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, project);
    return project;
  }

  /**
   * Finds a project by ID
   * @param id - Project ID to search for
   * @returns Project object or null if not found
   */
  async findProjectById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  /**
   * Finds all projects for a specific user
   * @param userId - User ID to search projects for
   * @returns Array of projects belonging to the user
   */
  async findProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId
    );
  }

  /**
   * Updates a project with new data
   * @param id - Project ID to update
   * @param data - Partial project data to update
   * @returns Updated project object or null if not found
   */
  async updateProject(
    id: string,
    data: Partial<Project>
  ): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) {
      return null;
    }
    const updated: Project = {
      ...project,
      ...data,
      updatedAt: this.getCurrentTimestamp(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  /**
   * Deletes a project by ID
   * @param id - Project ID to delete
   * @returns True if project was deleted, false otherwise
   */
  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // ApiKeyRepository implementation
  /**
   * Creates a new API key in the database
   * @param data - API key data to create
   * @returns Created API key object
   */
  async createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
    const id = this.generateId();
    const key = this.apiKeyGenerator.generate();
    const now = this.getCurrentTimestamp();
    const apiKey: ApiKey = {
      id,
      userId: data.userId,
      key,
      name: data.name,
      scopes: data.scopes,
      createdAt: now,
      lastUsedAt: null,
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  /**
   * Finds an API key by ID
   * @param id - API key ID to search for
   * @returns API key object or null if not found
   */
  async findApiKeyById(id: string): Promise<ApiKey | null> {
    return this.apiKeys.get(id) || null;
  }

  /**
   * Finds an API key by the actual key value
   * @param key - API key value to search for
   * @returns API key object or null if not found
   */
  async findApiKeyByKey(key: string): Promise<ApiKey | null> {
    return (
      Array.from(this.apiKeys.values()).find((ak) => ak.key === key) || null
    );
  }

  /**
   * Deletes an API key by ID
   * @param id - API key ID to delete
   * @returns True if API key was deleted, false otherwise
   */
  async deleteApiKey(id: string): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  // SessionRepository implementation
  /**
   * Creates a new session for a user
   * @param userId - User ID to create session for
   * @returns Generated session token
   */
  async createSession(userId: string): Promise<string> {
    const token = this.tokenGenerator.generate();
    const expiresAt = new Date(
      Date.now() + CRYPTO.SESSION_DURATION_MS
    ).toISOString(); // 24 hours
    this.sessions.set(token, { userId, token, expiresAt });
    return token;
  }

  /**
   * Finds a session by token
   * @param token - Session token to search for
   * @returns Session object or null if not found or expired
   */
  async findSessionByToken(token: string): Promise<Session | null> {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  /**
   * Deletes a session by token
   * @param token - Session token to delete
   * @returns True if session was deleted, false otherwise
   */
  async deleteSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  // Additional convenience methods for testing
  /**
   * Gets a user by session token
   * @param token - Session token to find user for
   * @returns User object or null if not found
   */
  async getUserByToken(token: string): Promise<User | null> {
    const session = await this.findSessionByToken(token);
    if (!session) {
      return null;
    }
    return this.findUserById(session.userId);
  }

  /**
   * Gets a user by API key
   * @param apiKey - API key to find user for
   * @returns User object or null if not found
   */
  async getUserByApiKey(apiKey: string): Promise<User | null> {
    const key = await this.findApiKeyByKey(apiKey);
    if (!key) {
      return null;
    }
    return this.findUserById(key.userId);
  }

  // Clear all data (for testing)
  /**
   * Clears all data from all repositories
   */
  clear(): void {
    this.users.clear();
    this.projects.clear();
    this.apiKeys.clear();
    this.sessions.clear();
  }
}
