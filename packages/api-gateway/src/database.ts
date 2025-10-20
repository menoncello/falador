/**
 * In-memory database for development and testing
 *
 * This provides a simple in-memory store for users, projects, and API keys.
 * In production, this would be replaced with PostgreSQL via Drizzle ORM.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';

// Constants for cryptographic operations
const SALT_BYTES = 16;
const HASH_LENGTH = 64;
const PASSWORD_HASH_PARTS = 2;
const ID_BYTES = 16;
const API_KEY_BYTES = 32;
const TOKEN_EXPIRY_MS = 86_400_000; // 24 hours in milliseconds
const MS_TO_SECONDS = 1000;

// JWT Secret - In production, this should come from environment variables
const JWT_SECRET =
  process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production';

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

interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

/**
 * In-memory database singleton
 */
export class Database {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private sessions: Map<string, Session> = new Map();

  /**
   * Hash password using scrypt
   * @param password - The plaintext password to hash
   * @returns The hashed password in format "salt:hash"
   */
  hashPassword(password: string): string {
    const salt = randomBytes(SALT_BYTES).toString('hex');
    const hash = scryptSync(password, salt, HASH_LENGTH).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   * @param password - The plaintext password to verify
   * @param storedHash - The stored hash in format "salt:hash"
   * @returns True if password matches, false otherwise
   */
  verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== PASSWORD_HASH_PARTS || !parts[0] || !parts[1]) {
      return false;
    }
    const salt = parts[0];
    const hash = parts[1];
    const hashToVerify = scryptSync(password, salt, HASH_LENGTH);
    const hashBuffer = Buffer.from(hash, 'hex');
    return timingSafeEqual(hashBuffer, hashToVerify);
  }

  /**
   * Generate unique ID
   * @returns A random hex string ID
   */
  private generateId(): string {
    return randomBytes(ID_BYTES).toString('hex');
  }

  /**
   * Generate properly signed JWT token
   * @param userId - The user ID to include in the token
   * @returns A cryptographically signed JWT token string
   */
  generateToken(userId: string): string {
    return jwt.sign(
      {
        userId,
        iat: Math.floor(Date.now() / MS_TO_SECONDS),
        exp:
          Math.floor(Date.now() / MS_TO_SECONDS) +
          TOKEN_EXPIRY_MS / MS_TO_SECONDS,
      },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );
  }

  /**
   * Generate API key
   * @returns A random base64url-encoded API key
   */
  generateApiKey(): string {
    return randomBytes(API_KEY_BYTES).toString('base64url');
  }

  // User operations
  /**
   * Create a new user
   * @param data - User creation data
   * @param data.email - User's email address
   * @param data.name - User's full name
   * @param data.password - User's plaintext password (will be hashed)
   * @param data.tier - User's subscription tier (defaults to 'free')
   * @returns The created user object
   */
  createUser(data: {
    email: string;
    name: string;
    password: string;
    tier?: 'free' | 'pro' | 'enterprise';
  }): User {
    const id = this.generateId();
    const now = new Date().toISOString();
    const user: User = {
      id,
      email: data.email,
      name: data.name,
      passwordHash: this.hashPassword(data.password),
      tier: data.tier || 'free',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  /**
   * Get user by ID
   * @param id - The user ID
   * @returns The user object if found, undefined otherwise
   */
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  /**
   * Get user by email address
   * @param email - The user's email address
   * @returns The user object if found, undefined otherwise
   */
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  /**
   * Delete user by ID
   * @param id - The user ID to delete
   * @returns True if deleted, false if not found
   */
  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // Project operations
  /**
   * Create a new project
   * @param data - Project creation data
   * @param data.userId - ID of the user creating the project
   * @param data.title - Project title
   * @param data.author - Book author name (optional)
   * @param data.language - Audio language (defaults to 'pt-BR')
   * @param data.genre - Book genre (optional)
   * @param data.status - Project status (defaults to 'draft')
   * @param data.metadata - Additional metadata (optional)
   * @returns The created project object
   */
  createProject(data: {
    userId: string;
    title: string;
    author?: string;
    language?: 'pt-BR' | 'en';
    genre?: string;
    status?: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
  }): Project {
    const id = this.generateId();
    const now = new Date().toISOString();
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
   * Get project by ID
   * @param id - The project ID
   * @returns The project object if found, undefined otherwise
   */
  getProjectById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  /**
   * Get all projects for a user
   * @param userId - The user ID
   * @returns Array of projects belonging to the user
   */
  getProjectsByUserId(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId
    );
  }

  /**
   * Update an existing project
   * @param id - The project ID to update
   * @param data - Partial project data to update
   * @returns The updated project object if found, undefined otherwise
   */
  updateProject(
    id: string,
    data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
  ): Project | undefined {
    const project = this.projects.get(id);
    if (!project) {
      return undefined;
    }
    const updated: Project = {
      ...project,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  /**
   * Delete project by ID
   * @param id - The project ID to delete
   * @returns True if deleted, false if not found
   */
  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  // API Key operations
  /**
   * Create a new API key
   * @param data - API key creation data
   * @param data.userId - ID of the user creating the API key
   * @param data.name - Descriptive name for the API key
   * @param data.scopes - Array of permission scopes
   * @returns The created API key object
   */
  createApiKey(data: {
    userId: string;
    name: string;
    scopes: string[];
  }): ApiKey {
    const id = this.generateId();
    const key = this.generateApiKey();
    const now = new Date().toISOString();
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
   * Get API key by ID
   * @param id - The API key ID
   * @returns The API key object if found, undefined otherwise
   */
  getApiKeyById(id: string): ApiKey | undefined {
    return this.apiKeys.get(id);
  }

  /**
   * Get API key by key value
   * @param key - The API key string
   * @returns The API key object if found, undefined otherwise
   */
  getApiKeyByKey(key: string): ApiKey | undefined {
    return Array.from(this.apiKeys.values()).find((ak) => ak.key === key);
  }

  /**
   * Delete API key by ID
   * @param id - The API key ID to delete
   * @returns True if deleted, false if not found
   */
  deleteApiKey(id: string): boolean {
    return this.apiKeys.delete(id);
  }

  // Session operations
  /**
   * Create a new session for a user
   * @param userId - The user ID
   * @returns The session token
   */
  createSession(userId: string): string {
    const token = this.generateToken(userId);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();
    this.sessions.set(token, { userId, token, expiresAt });
    return token;
  }

  /**
   * Get session by JWT token
   * @param token - The JWT session token
   * @returns The session object if token is valid, undefined otherwise
   */
  getSession(token: string): Session | undefined {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as {
        userId: string;
        exp?: number;
      };

      // Create a session object from JWT token
      const session: Session = {
        userId: decoded.userId,
        token,
        expiresAt: new Date((decoded.exp || 0) * MS_TO_SECONDS).toISOString(),
      };

      // Check if the user exists
      const user = this.users.get(decoded.userId);
      if (!user) {
        return undefined;
      }

      return session;
    } catch {
      // Invalid token
      return undefined;
    }
  }

  /**
   * Get user by session token
   * @param token - The session token
   * @returns The user object if token is valid, undefined otherwise
   */
  getUserByToken(token: string): User | undefined {
    const session = this.getSession(token);
    if (!session) {
      return undefined;
    }
    return this.getUserById(session.userId);
  }

  /**
   * Get user by API key
   * @param apiKey - The API key string
   * @returns The user object if API key is valid, undefined otherwise
   */
  getUserByApiKey(apiKey: string): User | undefined {
    const key = this.getApiKeyByKey(apiKey);
    if (!key) {
      return undefined;
    }
    return this.getUserById(key.userId);
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.users.clear();
    this.projects.clear();
    this.apiKeys.clear();
    this.sessions.clear();
  }
}

export const db = new Database();
