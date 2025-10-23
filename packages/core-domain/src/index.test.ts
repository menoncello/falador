/**
 * Core Domain Module Tests
 */

import { User, Project } from './index';

describe('Core Domain Types', () => {
  it('should have User interface defined', () => {
    const user: User = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    };

    expect(user.id).toBe('test-user-id');
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('should have Project interface defined', () => {
    const project: Project = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'A test project',
      userId: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(project.id).toBe('test-project-id');
    expect(project.name).toBe('Test Project');
    expect(project.description).toBe('A test project');
    expect(project.userId).toBe('test-user-id');
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });
});