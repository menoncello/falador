import { faker } from '@faker-js/faker';

/**
 * Mock API Server for Testing
 *
 * This provides mock responses when the real API/database is not available.
 * It follows the same API contracts as the real service.
 */

interface MockUser {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  isActive: boolean;
}

interface MockProject {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  language: 'pt-BR' | 'en';
  genre: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, any>;
}

interface MockApiKey {
  id: string;
  key: string;
  name: string;
  scopes: string[];
  userId: string;
  createdAt: string;
}

// In-memory storage for mocks
const mockUsers = new Map<string, MockUser>();
const mockProjects = new Map<string, MockProject>();
const mockApiKeys = new Map<string, MockApiKey>();

// Helper functions
const generateMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  tier: 'free',
  createdAt: new Date().toISOString(),
  isActive: true,
  ...overrides,
});

const generateMockProject = (userId: string, overrides: Partial<MockProject> = {}): MockProject => ({
  id: faker.string.uuid(),
  userId,
  title: faker.lorem.words(3),
  author: faker.person.fullName(),
  language: 'pt-BR',
  genre: faker.book.genre(),
  status: 'draft',
  metadata: {},
  ...overrides,
});

const generateMockApiKey = (userId: string, overrides: Partial<MockApiKey> = {}): MockApiKey => ({
  id: faker.string.uuid(),
  key: `ak_${faker.string.alphanumeric(32)}`,
  name: faker.word.words(2),
  scopes: ['read', 'write'],
  userId,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Mock API handlers
export const mockApiHandlers = {
  // Authentication endpoints
  'POST /api/auth/register': async (requestData: any) => {
    const { email, name, password } = requestData;

    // Validation
    if (!email) {
      return {
        status: 422,
        body: { error: 'Email is required' }
      };
    }

    if (!name) {
      return {
        status: 422,
        body: { error: 'Name is required' }
      };
    }

    if (!password) {
      return {
        status: 422,
        body: { error: 'Password is required' }
      };
    }

    // Check for duplicate email
    for (const user of mockUsers.values()) {
      if (user.email === email) {
        return {
          status: 409,
          body: { error: 'Email already exists' }
        };
      }
    }

    // Create user
    const user = generateMockUser({ email, name });
    mockUsers.set(user.id, user);

    return {
      status: 200,
      body: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        createdAt: user.createdAt,
        isActive: user.isActive,
      }
    };
  },

  'POST /api/auth/login': async (requestData: any) => {
    const { email, password } = requestData;

    // Find user
    let user: MockUser | undefined;
    for (const u of mockUsers.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' }
      };
    }

    // Mock password validation (simplified)
    if (!password || password.length < 6) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' }
      };
    }

    // Generate JWT token (mock)
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(user.id).toString('base64')}.${faker.string.alphanumeric(32)}`;

    return {
      status: 200,
      body: { token }
    };
  },

  'GET /api/auth/me': async (requestData: any, headers: Record<string, string>) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: { error: 'No token provided' }
      };
    }

    // Extract user ID from mock token (simplified)
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }

    try {
      const userId = Buffer.from(parts[1], 'base64').toString();
      const user = mockUsers.get(userId);

      if (!user) {
        return {
          status: 401,
          body: { error: 'User not found' }
        };
      }

      return {
        status: 200,
        body: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
          createdAt: user.createdAt,
          isActive: user.isActive,
        }
      };
    } catch {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }
  },

  'POST /api/auth/api-keys': async (requestData: any, headers: Record<string, string>) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: { error: 'No token provided' }
      };
    }

    // Get user from token
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }

    try {
      const userId = Buffer.from(parts[1], 'base64').toString();
      const user = mockUsers.get(userId);

      if (!user) {
        return {
          status: 401,
          body: { error: 'User not found' }
        };
      }

      const { name, scopes } = requestData;
      const apiKey = generateMockApiKey(userId, { name, scopes });
      mockApiKeys.set(apiKey.id, apiKey);

      return {
        status: 201,
        body: {
          id: apiKey.id,
          key: apiKey.key,
          name: apiKey.name,
          scopes: apiKey.scopes,
        }
      };
    } catch {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }
  },

  // Projects endpoints
  'GET /api/projects': async (requestData: any, headers: Record<string, string>) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 404, // As observed in actual tests
        body: { error: 'Route not found or missing auth middleware' }
      };
    }

    // Get user from token
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }

    try {
      const userId = Buffer.from(parts[1], 'base64').toString();

      // Get user's projects
      const userProjects: MockProject[] = [];
      for (const project of mockProjects.values()) {
        if (project.userId === userId) {
          userProjects.push(project);
        }
      }

      return {
        status: 200,
        body: userProjects
      };
    } catch {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }
  },

  'POST /api/projects': async (requestData: any, headers: Record<string, string>) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: { error: 'Authentication required' }
      };
    }

    // Get user from token
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }

    try {
      const userId = Buffer.from(parts[1], 'base64').toString();

      const { title, author, language, genre } = requestData;

      // Validation
      if (!title) {
        return {
          status: 422,
          body: { error: 'Title is required' }
        };
      }

      const project = generateMockProject(userId, {
        title,
        author,
        language: language || 'pt-BR',
        genre: genre || 'General',
      });

      mockProjects.set(project.id, project);

      return {
        status: 201,
        body: project
      };
    } catch {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }
  },

  'GET /api/projects/:id': async (requestData: any, headers: Record<string, string>, params: { id: string }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: { error: 'Authentication required' }
      };
    }

    const project = mockProjects.get(params.id);

    if (!project) {
      return {
        status: 404,
        body: { error: 'Project not found' }
      };
    }

    // Get user from token to check authorization
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }

    try {
      const userId = Buffer.from(parts[1], 'base64').toString();

      // Check if user owns the project
      if (project.userId !== userId) {
        return {
          status: 403,
          body: { error: 'Access denied' }
        };
      }

      return {
        status: 200,
        body: project
      };
    } catch {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }
  },

  'PATCH /api/projects/:id': async (requestData: any, headers: Record<string, string>, params: { id: string }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: { error: 'Authentication required' }
      };
    }

    const project = mockProjects.get(params.id);

    if (!project) {
      return {
        status: 404,
        body: { error: 'Project not found' }
      };
    }

    // Get user from token to check authorization
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }

    try {
      const userId = Buffer.from(parts[1], 'base64').toString();

      // Check if user owns the project
      if (project.userId !== userId) {
        return {
          status: 403,
          body: { error: 'Access denied' }
        };
      }

      // Update project
      const { title, status } = requestData;
      if (title) project.title = title;
      if (status) project.status = status;

      mockProjects.set(params.id, project);

      return {
        status: 200,
        body: project
      };
    } catch {
      return {
        status: 401,
        body: { error: 'Invalid token' }
      };
    }
  },
};

/**
 * Setup mock API routes for Playwright tests
 */
export async function setupMockApi(page: any) {
  // Mock all API routes
  await page.route('**/api/auth/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const headers = route.request().headers();
    const requestData = route.request().postDataJSON();

    // Route to appropriate handler
    let handlerKey = `${method} ${new URL(url).pathname}`;

    if (mockApiHandlers[handlerKey as keyof typeof mockApiHandlers]) {
      const response = await mockApiHandlers[handlerKey as keyof typeof mockApiHandlers](requestData, headers);
      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body),
      });
    } else {
      // Default response for unhandled routes
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Route not found' }),
      });
    }
  });

  await page.route('**/api/projects/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const headers = route.request().headers();
    const requestData = route.request().postDataJSON();

    // Extract route parameters
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Handle dynamic routes
    let handlerKey = `${method} ${pathname}`;

    // Convert dynamic routes to generic pattern
    if (pathname.startsWith('/api/projects/') && method === 'GET') {
      handlerKey = 'GET /api/projects/:id';
    } else if (pathname.startsWith('/api/projects/') && method === 'PATCH') {
      handlerKey = 'PATCH /api/projects/:id';
    }

    if (mockApiHandlers[handlerKey as keyof typeof mockApiHandlers]) {
      // Extract ID for dynamic routes
      let params = {};
      if (handlerKey.includes(':id')) {
        const id = pathname.split('/').pop();
        params = { id };
      }

      const response = await mockApiHandlers[handlerKey as keyof typeof mockApiHandlers](requestData, headers, params);
      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body),
      });
    } else {
      // Default response for unhandled routes
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Route not found' }),
      });
    }
  });
}

/**
 * Check if mock mode should be used
 */
export function shouldUseMockMode(): boolean {
  return process.env.USE_MOCK_API === 'true' || process.env.NODE_ENV === 'test-mock';
}