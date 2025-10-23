/**
 * Application Layer
 * Contains use cases and application logic
 */

export interface ProjectService {
  createProject: (name: string, userId: string) => Promise<string>;
  getProject: (id: string) => Promise<unknown>;
  updateProject: (id: string, data: unknown) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  listProjects: (userId: string) => Promise<unknown[]>;
}