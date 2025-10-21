import { test as base } from 'bun:test';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';

interface ProjectFixture {
  authenticatedUser: {
    user: any;
    token: any;
  };
  testProject: any;
  setupProject: (overrides?: any) => any;
  setupUser: (overrides?: any) => any;
  cleanupDatabase: () => void;
}

export const test = base.extend<ProjectFixture>({
  // Fixture para usuário autenticado com permissões de projeto
  authenticatedUser: async ({}, use) => {
    db.clear();

    const user = db.createUser({
      email: TEST_CREDENTIALS.EMAIL,
      name: TEST_CREDENTIALS.NAME,
      password: TEST_CREDENTIALS.PASSWORD,
    });

    const token = db.createSession(user.id);

    await use({ user, token });
  },

  // Fixture para projeto de teste
  testProject: async ({ authenticatedUser }, use) => {
    const project = db.createProject({
      userId: authenticatedUser.user.id,
      title: 'Test Project',
      author: 'Test Author',
      language: 'pt-BR',
      genre: 'Fiction',
      status: 'draft',
      metadata: {},
    });

    await use(project);
  },

  // Factory function para criar projetos customizados
  setupProject: async ({ authenticatedUser }, use) => {
    const createdProjects: any[] = [];

    const createProject = (overrides: any = {}) => {
      const project = db.createProject({
        userId: authenticatedUser.user.id,
        title: 'Default Project',
        author: 'Default Author',
        language: 'pt-BR',
        genre: 'Fiction',
        status: 'draft',
        metadata: {},
        ...overrides,
      });

      createdProjects.push(project);
      return project;
    };

    await use(createProject);
  },

  // Factory function para criar usuários customizados
  setupUser: async ({}, use) => {
    const createdUsers: any[] = [];

    const createUser = (overrides: any = {}) => {
      const user = db.createUser({
        email: TEST_CREDENTIALS.EMAIL,
        name: TEST_CREDENTIALS.NAME,
        password: TEST_CREDENTIALS.PASSWORD,
        ...overrides,
      });

      const token = db.createSession(user.id);
      createdUsers.push({ user, token });
      return { user, token };
    };

    await use(createUser);
  },

  // Helper para limpar database
  cleanupDatabase: async ({}, use) => {
    await use(() => {
      db.clear();
    });
  },
});

export { expect } from 'bun:test';
