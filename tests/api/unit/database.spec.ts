import { describe, test, expect, beforeEach } from 'bun:test';
import { Database } from '../../../packages/api-gateway/src/database';

// Helper function to check if project belongs to user
function _projectBelongsToUser(project: any, userId: string): boolean {
  return project.userId === userId;
}

// Helper function to extract project IDs
const extractProjectIds = (projectList: any[]): string[] => {
  return projectList.map((p) => p.id);
};

describe('Database Utilities', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database();
  });

  describe('User Operations', () => {
    test('should create user with valid data', () => {
      // WHEN: Creating a user
      const user = db.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      // THEN: User should be created successfully
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.id).toBeDefined();
      expect(user.tier).toBe('free');
    });

    test('should find user by email', () => {
      // GIVEN: A user exists
      const createdUser = db.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      // WHEN: Finding user by email
      const foundUser = db.getUserByEmail('test@example.com');

      // THEN: User should be found
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
    });

    test('should return undefined for non-existent user', () => {
      // WHEN: Finding non-existent user
      const foundUser = db.getUserByEmail('nonexistent@example.com');

      // THEN: Should return undefined
      expect(foundUser).toBeUndefined();
    });
  });

  describe('Project Operations', () => {
    test('should create project for user', () => {
      // GIVEN: A user exists
      const user = db.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      // WHEN: Creating a project
      const project = db.createProject(user.id, {
        title: 'Test Project',
        author: 'Test Author',
        language: 'en',
        genre: 'Fiction',
      });

      // THEN: Project should be created successfully
      expect(project).toBeDefined();
      expect(project.title).toBe('Test Project');
      expect(project.userId).toBe(user.id);
    });

    test('should get projects for user', () => {
      // GIVEN: A user with projects
      const user = db.createUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      const project1 = db.createProject({ title: 'Project 1' });
      const project2 = db.createProject({ title: 'Project 2' });

      // WHEN: Getting projects for user
      const projects = db.getProjectsByUserId(user.id);

      // THEN: Should return user's projects
      expect(projects).toHaveLength(2);
      const projectIds = extractProjectIds(projects);
      expect(projectIds).toContain(project1.id);
      expect(projectIds).toContain(project2.id);
    });
  });
});
