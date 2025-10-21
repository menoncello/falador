import { test as base } from 'bun:test';
import { db } from '../database';
import { TEST_CREDENTIALS } from '../test-constants';

interface AuthFixture {
  authenticatedUser: {
    user: any;
    token: any;
  };
  testUser: any;
  setupUser: (overrides?: any) => any;
  cleanupDatabase: () => void;
}

export const test = base.extend<AuthFixture>({
  // Fixture para usuário autenticado
  authenticatedUser: async ({}, use) => {
    // Setup: Limpar database e criar usuário
    db.clear();

    const user = db.createUser({
      email: TEST_CREDENTIALS.EMAIL,
      name: TEST_CREDENTIALS.NAME,
      password: TEST_CREDENTIALS.PASSWORD,
    });

    const token = db.createSession(user.id);

    // Provide authenticated user to test
    await use({ user, token });

    // Cleanup automático handled by db.clear() in next test
  },

  // Fixture para usuário de teste (não autenticado)
  testUser: async ({}, use) => {
    db.clear();

    const user = db.createUser({
      email: TEST_CREDENTIALS.EMAIL,
      name: TEST_CREDENTIALS.NAME,
      password: TEST_CREDENTIALS.PASSWORD,
    });

    await use(user);
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

      createdUsers.push(user);
      return user;
    };

    await use(createUser);

    // Cleanup automático (se necessário)
    for (const user of createdUsers) {
      // Cleanup logic se necessário
    }
  },

  // Helper para limpar database
  cleanupDatabase: async ({}, use) => {
    await use(() => {
      db.clear();
    });
  },
});

export { expect } from 'bun:test';
