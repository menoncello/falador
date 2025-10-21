/**
 * Tests specifically targeting surviving mutants in project routes
 * These tests are designed to kill specific mutants that survived the initial test suite
 */

import { test, expect } from '@playwright/test';

test.describe('Projects Mutation Targets', () => {
  const BASE_URL = 'http://localhost:3000';

  test('should return correct error message for unauthorized project access', async ({ request }) => {
    // Test the exact error message string to kill string literal mutants
    const response = await request.get(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.status()).toBe(401);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty('error', 'Unauthorized');
  });

  test('should validate project creation with all fields', async ({ request }) => {
    // This test targets project creation mutants and field validation
    const userData = {
      email: `project-test-${Date.now()}@example.com`,
      name: 'Project Test User',
      password: 'Password123!',
    };

    // Register and login
    const registerResponse = await request.post(`${BASE_URL}/api/auth/register`, {
      data: userData,
    });

    expect(registerResponse.status()).toBe(201);

    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: userData.email,
        password: userData.password,
      },
    });

    expect(loginResponse.status()).toBe(200);
    const { token } = await loginResponse.json();

    // Create project with all optional fields
    const projectData = {
      title: 'Test Project Title',
      author: 'Test Author',
      language: 'pt-BR',
      genre: 'Fiction',
      status: 'draft',
      metadata: {
        description: 'Test project description',
        tags: ['test', 'mutation'],
      },
    };

    const createResponse = await request.post(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: projectData,
    });

    expect(createResponse.status()).toBe(201);
    const project = await createResponse.json();

    // Verify all fields are correctly set
    expect(project.title).toBe(projectData.title);
    expect(project.author).toBe(projectData.author);
    expect(project.language).toBe(projectData.language);
    expect(project.genre).toBe(projectData.genre);
    expect(project.status).toBe(projectData.status);
    expect(project.metadata).toEqual(projectData.metadata);
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('createdAt');
    expect(project).toHaveProperty('updatedAt');
  });

  test('should validate project ownership enforcement', async ({ request }) => {
    // This test targets the conditional expression mutants for ownership checks
    const userData1 = {
      email: `owner1-${Date.now()}@example.com`,
      name: 'Owner One',
      password: 'Password123!',
    };

    const userData2 = {
      email: `owner2-${Date.now() + 1}@example.com`,
      name: 'Owner Two',
      password: 'Password123!',
    };

    // Register two users
    const register1Response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: userData1,
    });

    const register2Response = await request.post(`${BASE_URL}/api/auth/register`, {
      data: userData2,
    });

    expect(register1Response.status()).toBe(201);
    expect(register2Response.status()).toBe(201);

    // Login both users
    const login1Response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: userData1.email,
        password: userData1.password,
      },
    });

    const login2Response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: userData2.email,
        password: userData2.password,
      },
    });

    expect(login1Response.status()).toBe(200);
    expect(login2Response.status()).toBe(200);

    const { token: token1 } = await login1Response.json();
    const { token: token2 } = await login2Response.json();

    // Create project with user 1
    const createResponse = await request.post(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token1}`,
      },
      data: {
        title: 'Ownership Test Project',
      },
    });

    expect(createResponse.status()).toBe(201);
    const { id: projectId } = await createResponse.json();

    // Try to access project with user 2 (should fail)
    const unauthorizedAccess = await request.get(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });

    expect([401, 403]).toContain(unauthorizedAccess.status());
    const errorResponse = await unauthorizedAccess.json();
    expect(['Unauthorized', 'Forbidden']).toContain(errorResponse.error);

    // Try to update project with user 2 (should fail)
    const unauthorizedUpdate = await request.put(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
      data: {
        title: 'Hacked Title',
      },
    });

    expect(unauthorizedUpdate.status()).toBe(401);

    // Try to delete project with user 2 (should fail)
    const unauthorizedDelete = await request.delete(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });

    expect(unauthorizedDelete.status()).toBe(401);

    // Verify project still exists and unchanged with user 1
    const verifyResponse = await request.get(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token1}`,
      },
    });

    expect(verifyResponse.status()).toBe(200);
    const project = await verifyResponse.json();
    expect(project.title).toBe('Ownership Test Project');
  });

  test('should validate project update functionality', async ({ request }) => {
    // This test targets project update mutants
    const userData = {
      email: `update-test-${Date.now()}@example.com`,
      name: 'Update Test User',
      password: 'Password123!',
    };

    // Register and login
    await request.post(`${BASE_URL}/api/auth/register`, {
      data: userData,
    });

    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: userData.email,
        password: userData.password,
      },
    });

    expect(loginResponse.status()).toBe(200);
    const { token } = await loginResponse.json();

    // Create project
    const createResponse = await request.post(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: 'Original Title',
        status: 'draft',
      },
    });

    expect(createResponse.status()).toBe(201);
    const { id: projectId } = await createResponse.json();

    // Update project
    const updateData = {
      title: 'Updated Title',
      author: 'Updated Author',
      status: 'completed',
      metadata: {
        updated: true,
        version: 2,
      },
    };

    const updateResponse = await request.put(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: updateData,
    });

    expect(updateResponse.status()).toBe(200);
    const updatedProject = await updateResponse.json();

    // Verify all fields were updated
    expect(updatedProject.title).toBe(updateData.title);
    expect(updatedProject.author).toBe(updateData.author);
    expect(updatedProject.status).toBe(updateData.status);
    expect(updatedProject.metadata).toEqual(updateData.metadata);
    expect(updatedProject.updatedAt).not.toBe(updatedProject.createdAt);
  });

  test('should validate project deletion functionality', async ({ request }) => {
    // This test targets project deletion mutants
    const userData = {
      email: `delete-test-${Date.now()}@example.com`,
      name: 'Delete Test User',
      password: 'Password123!',
    };

    // Register and login
    await request.post(`${BASE_URL}/api/auth/register`, {
      data: userData,
    });

    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: userData.email,
        password: userData.password,
      },
    });

    expect(loginResponse.status()).toBe(200);
    const { token } = await loginResponse.json();

    // Create project
    const createResponse = await request.post(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        title: 'Project to Delete',
      },
    });

    expect(createResponse.status()).toBe(201);
    const { id: projectId } = await createResponse.json();

    // Verify project exists
    const getResponse = await request.get(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(getResponse.status()).toBe(200);

    // Delete project
    const deleteResponse = await request.delete(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect([200, 204]).toContain(deleteResponse.status());

    // Verify project no longer exists
    const verifyDeleteResponse = await request.get(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(verifyDeleteResponse.status()).toBe(404);
  });

  test('should validate project language and status enums', async ({ request }) => {
    // This test targets string literal mutants for enums
    const userData = {
      email: `enum-test-${Date.now()}@example.com`,
      name: 'Enum Test User',
      password: 'Password123!',
    };

    // Register and login
    await request.post(`${BASE_URL}/api/auth/register`, {
      data: userData,
    });

    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: userData.email,
        password: userData.password,
      },
    });

    expect(loginResponse.status()).toBe(200);
    const { token } = await loginResponse.json();

    // Test all valid languages
    const languages = ['pt-BR', 'en'];
    for (const language of languages) {
      const createResponse = await request.post(`${BASE_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title: `Project in ${language}`,
          language,
        },
      });

      expect(createResponse.status()).toBe(201);
      const project = await createResponse.json();
      expect(project.language).toBe(language);
    }

    // Test all valid statuses
    const statuses = ['draft', 'queued', 'processing', 'completed', 'failed'];
    for (const status of statuses) {
      const createResponse = await request.post(`${BASE_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title: `Project with ${status} status`,
          status,
        },
      });

      expect(createResponse.status()).toBe(201);
      const project = await createResponse.json();
      expect(project.status).toBe(status);
    }
  });
});