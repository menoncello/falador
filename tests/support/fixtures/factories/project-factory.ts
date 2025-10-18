import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';
import type { UserFactory } from './user-factory';

/**
 * Project factory with faker-based data generation and auto-cleanup
 *
 * This factory creates test projects with realistic data.
 * Projects are automatically associated with users.
 *
 * @example
 * const project = await projectFactory.createProject();
 * const bookProject = await projectFactory.createProject({
 *   title: 'My Audiobook',
 *   language: 'pt-BR',
 *   genre: 'Fiction',
 * });
 */

type ProjectStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
type ProjectLanguage = 'pt-BR' | 'en';

interface Project {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  language: ProjectLanguage;
  genre: string | null;
  status: ProjectStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ProjectOverrides {
  userId?: string;
  title?: string;
  author?: string;
  language?: ProjectLanguage;
  genre?: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
}

export class ProjectFactory {
  private createdProjectIds: string[] = [];
  private userTokens: Map<string, string> = new Map(); // userId -> token mapping
  private defaultToken?: string; // Default token to use if none provided
  private defaultUserId?: string;

  constructor(
    private request: APIRequestContext,
    private userFactory: UserFactory
  ) {}

  /**
   * Set default authentication for all project operations
   */
  setDefaultAuth(token: string, userId: string): void {
    this.defaultToken = token;
    this.defaultUserId = userId;
  }

  /**
   * Create a test project with optional overrides
   *
   * @param overrides - Optional project properties to override
   * @returns Created project object
   */
  async createProject(overrides: ProjectOverrides = {}): Promise<Project> {
    const { token } = await this.getAuthToken();

    const projectData = this.buildProjectData(overrides);
    const project = await this.createProjectWithAuth(token, projectData);

    this.createdProjectIds.push(project.id);
    this.userTokens.set(project.userId, token);

    return project;
  }

  /**
   * Get authentication token (from default or create new user)
   * @returns Auth token and user ID
   */
  private async getAuthToken(): Promise<{ token: string }> {
    if (this.defaultToken && this.defaultUserId) {
      return { token: this.defaultToken };
    }

    const user = await this.userFactory.createUser();
    const password = user.password ?? '';
    const token = await this.userFactory.login(user.email, password);
    return { token };
  }

  /**
   * Build project data with defaults and overrides
   * @param overrides - Optional overrides
   * @returns Project data object
   */
  private buildProjectData(overrides: ProjectOverrides): {
    title: string;
    author: string;
    language: ProjectLanguage;
    genre: string;
    status: ProjectStatus;
    metadata: Record<string, unknown>;
  } {
    return {
      title: overrides.title ?? faker.book.title(),
      author: overrides.author ?? faker.person.fullName(),
      language: overrides.language ?? 'pt-BR',
      genre: overrides.genre ?? faker.book.genre(),
      status: overrides.status ?? 'draft',
      metadata: overrides.metadata ?? {},
    };
  }

  /**
   * Create project with authentication
   * @param token - Auth token
   * @param projectData - Project data
   * @param projectData.title - Project title
   * @param projectData.author - Book author
   * @param projectData.language - Audio language
   * @param projectData.genre - Book genre
   * @param projectData.status - Project status
   * @param projectData.metadata - Additional metadata
   * @returns Created project
   */
  private async createProjectWithAuth(
    token: string,
    projectData: {
      title: string;
      author: string;
      language: ProjectLanguage;
      genre: string;
      status: ProjectStatus;
      metadata: Record<string, unknown>;
    }
  ): Promise<Project> {
    const response = await this.request.post('/api/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: projectData,
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to create project: ${response.status()} ${await response.text()}`
      );
    }

    return response.json();
  }

  /**
   * Create multiple test projects
   *
   * @param count - Number of projects to create
   * @param userId - Optional user ID to associate all projects with
   * @returns Array of created project objects
   */
  async createProjects(count: number, userId?: string): Promise<Project[]> {
    const projects: Project[] = [];

    for (let i = 0; i < count; i++) {
      const project = await this.createProject({ userId });
      projects.push(project);
    }

    return projects;
  }

  /**
   * Update project status
   *
   * @param projectId - Project ID to update
   * @param status - New status
   * @returns Updated project
   */
  async updateStatus(
    projectId: string,
    status: ProjectStatus,
    userId?: string
  ): Promise<Project> {
    // Get token for the user who owns this project
    const token = userId ? this.userTokens.get(userId) : undefined;
    if (!token) {
      throw new Error('No auth token found for project. Create project first.');
    }

    const response = await this.request.patch(`/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { status },
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to update project: ${response.status()} ${await response.text()}`
      );
    }

    return response.json();
  }

  /**
   * Clean up all created test data
   * Called automatically by the fixture after each test
   */
  async cleanup(): Promise<void> {
    for (const projectId of this.createdProjectIds) {
      try {
        await this.request.delete(`/api/projects/${projectId}`);
      } catch (error) {
        console.warn(`Failed to cleanup project ${projectId}:`, error);
      }
    }

    this.createdProjectIds = [];
  }
}
