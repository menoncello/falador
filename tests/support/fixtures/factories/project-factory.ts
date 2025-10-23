import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';
import type { UserFactory } from './user-factory';
import {
  BaseFactory,
  TestProject,
  ProjectOverrides,
  TestUtils
} from '../base/base-fixture';
import { waitForResponseWithValidation } from '../../helpers/network-first-helpers';

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

/**
 * Enhanced Project Factory with network-first patterns and base factory integration
 */
export class ProjectFactory extends BaseFactory<TestProject, ProjectOverrides> {
  private userTokens: Map<string, string> = new Map(); // userId -> token mapping
  private defaultToken?: string; // Default token to use if none provided
  private defaultUserId?: string;

  constructor(
    request: APIRequestContext,
    private userFactory: UserFactory
  ) {
    super(request);
  }

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
  async create(overrides: ProjectOverrides = {}): Promise<TestProject> {
    return this.createProject(overrides);
  }

  /**
   * Create a test project with optional overrides using network-first pattern
   *
   * @param overrides - Optional project properties to override
   * @returns Created project object
   */
  async createProject(overrides: ProjectOverrides = {}): Promise<TestProject> {
    const { token } = await this.getAuthToken();

    const projectData = TestUtils.generateProjectData(overrides);
    const project = await this.createProjectWithAuthNetworkFirst(token, projectData, overrides);

    this.trackCreated(project.id);
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
   * Create project with authentication using network-first pattern
   * @param token - Auth token
   * @param projectData - Project data
   * @param overrides - Optional overrides for user assignment
   * @returns Created project
   */
  private async createProjectWithAuthNetworkFirst(
    token: string,
    projectData: ProjectOverrides,
    overrides: ProjectOverrides
  ): Promise<TestProject> {
    // Step 1: Register interception FIRST to prevent race conditions
    const projectResponsePromise = waitForResponseWithValidation(
      this.request,
      'POST',
      '/api/projects',
      201
    );

    // Step 2: THEN trigger the request
    const response = await this.request.post('/api/projects', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        ...projectData,
        userId: overrides.userId || this.defaultUserId,
      },
    });

    if (!response.ok()) {
      throw new Error(
        `Failed to create project: ${response.status()} ${await response.text()}`
      );
    }

    // Step 3: THEN await the response (network-first)
    const projectResponse = await projectResponsePromise;
    const project = await projectResponse.json();

    return project;
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
    const projectIds = this.getCreatedIds();
    for (const projectId of projectIds) {
      try {
        await this.request.delete(`/api/projects/${projectId}`);
      } catch (error) {
        console.warn(`Failed to cleanup project ${projectId}:`, error);
      }
    }

    this.resetTracking();
    this.userTokens.clear();
  }
}
