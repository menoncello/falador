import { test, expect } from '@playwright/test';
import { createTestProject } from '../../../packages/api-gateway/src/test-factories';

test.describe('Projects Route Validation Tests', () => {
  test.describe('GET /api/projects - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth', async ({
      request,
    }) => {
      // WHEN: Requesting projects without authentication
      const response = await request.get('/api/projects');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid token', async ({
      request,
    }) => {
      // WHEN: Requesting projects with invalid token
      const response = await request.get('/api/projects', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('POST /api/projects - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth', async ({
      request,
    }) => {
      // GIVEN: Valid project data
      const projectData = createTestProject();

      // WHEN: Creating project without authentication
      const response = await request.post('/api/projects', {
        data: projectData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid token', async ({
      request,
    }) => {
      // GIVEN: Valid project data
      const projectData = createTestProject();

      // WHEN: Creating project with invalid token
      const response = await request.post('/api/projects', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        data: projectData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('GET /api/projects/:id - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth', async ({
      request,
    }) => {
      // WHEN: Getting project without authentication
      const response = await request.get('/api/projects/some-id');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid token', async ({
      request,
    }) => {
      // WHEN: Getting project with invalid token
      const response = await request.get('/api/projects/some-id', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return forbidden error for accessing other user project', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Two different users
      const user1 = await userFactory.createUser();
      const user2 = await userFactory.createUser();
      const token1 = await userFactory.login(user1.email, user1.password ?? '');

      // GIVEN: Project belonging to user2
      const projectData = createTestProject({ userId: user2.id });
      const createResponse = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${await userFactory.login(user2.email, user2.password ?? '')}`,
        },
        data: projectData,
      });
      const createdProject = await createResponse.json();

      // WHEN: User1 tries to access user2's project
      const response = await request.get(`/api/projects/${createdProject.id}`, {
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      });

      // THEN: Access is forbidden
      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Access denied');
    });
  });

  test.describe('PATCH /api/projects/:id - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth', async ({
      request,
    }) => {
      // GIVEN: Update data
      const updateData = { title: 'Updated Title' };

      // WHEN: Updating project without authentication
      const response = await request.patch('/api/projects/some-id', {
        data: updateData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid token', async ({
      request,
    }) => {
      // GIVEN: Update data
      const updateData = { title: 'Updated Title' };

      // WHEN: Updating project with invalid token
      const response = await request.patch('/api/projects/some-id', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        data: updateData,
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return forbidden error for updating other user project', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Two different users
      const user1 = await userFactory.createUser();
      const user2 = await userFactory.createUser();
      const token1 = await userFactory.login(user1.email, user1.password ?? '');

      // GIVEN: Project belonging to user2
      const projectData = createTestProject({ userId: user2.id });
      const createResponse = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${await userFactory.login(user2.email, user2.password ?? '')}`,
        },
        data: projectData,
      });
      const createdProject = await createResponse.json();

      // WHEN: User1 tries to update user2's project
      const updateData = { title: 'Updated Title' };
      const response = await request.patch(
        `/api/projects/${createdProject.id}`,
        {
          headers: {
            Authorization: `Bearer ${token1}`,
          },
          data: updateData,
        }
      );

      // THEN: Access is forbidden
      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Access denied');
    });
  });

  test.describe('DELETE /api/projects/:id - Authorization Error Validation', () => {
    test('should return specific unauthorized error for missing auth', async ({
      request,
    }) => {
      // WHEN: Deleting project without authentication
      const response = await request.delete('/api/projects/some-id');

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return specific unauthorized error for invalid token', async ({
      request,
    }) => {
      // WHEN: Deleting project with invalid token
      const response = await request.delete('/api/projects/some-id', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      // THEN: Specific error message is returned
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('should return forbidden error for deleting other user project', async ({
      userFactory,
      request,
    }) => {
      // GIVEN: Two different users
      const user1 = await userFactory.createUser();
      const user2 = await userFactory.createUser();
      const token1 = await userFactory.login(user1.email, user1.password ?? '');

      // GIVEN: Project belonging to user2
      const projectData = createTestProject({ userId: user2.id });
      const createResponse = await request.post('/api/projects', {
        headers: {
          Authorization: `Bearer ${await userFactory.login(user2.email, user2.password ?? '')}`,
        },
        data: projectData,
      });
      const createdProject = await createResponse.json();

      // WHEN: User1 tries to delete user2's project
      const response = await request.delete(
        `/api/projects/${createdProject.id}`,
        {
          headers: {
            Authorization: `Bearer ${token1}`,
          },
        }
      );

      // THEN: Access is forbidden
      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Access denied');
    });
  });

  test.describe('Project Access Control Edge Cases', () => {
    test('should handle malformed authorization header consistently', async ({
      request,
    }) => {
      // GIVEN: Various malformed auth headers
      const malformedHeaders = [
        'InvalidFormat',
        'Bearer',
        'Bearer ',
        'bearer token', // lowercase bearer
        'Token token',
        '',
        ' ',
        'Bearer multiple spaces token',
      ];

      for (const authHeader of malformedHeaders) {
        // WHEN: Making request with malformed auth header
        const response = await request.get('/api/projects', {
          headers: authHeader ? { Authorization: authHeader } : {},
        });

        // THEN: Consistent unauthorized error
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('Unauthorized');
      }
    });

    test('should validate all project endpoints require authentication', async ({
      request,
    }) => {
      // GIVEN: All project endpoints
      const endpoints = [
        { method: 'GET', path: '/api/projects' },
        { method: 'POST', path: '/api/projects' },
        { method: 'GET', path: '/api/projects/test-id' },
        { method: 'PATCH', path: '/api/projects/test-id' },
        { method: 'DELETE', path: '/api/projects/test-id' },
      ];

      for (const endpoint of endpoints) {
        // WHEN: Making request without authentication
        let response;
        if (endpoint.method === 'GET') {
          response = await request.get(endpoint.path);
        } else if (endpoint.method === 'POST') {
          response = await request.post(endpoint.path, { data: {} });
        } else if (endpoint.method === 'PATCH') {
          response = await request.patch(endpoint.path, { data: {} });
        } else if (endpoint.method === 'DELETE') {
          response = await request.delete(endpoint.path);
        }

        // THEN: Consistent unauthorized error
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('Unauthorized');
      }
    });
  });
});
