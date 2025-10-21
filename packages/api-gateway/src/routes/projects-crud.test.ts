import { test, expect } from '../test-support/fixtures/project-fixture';
import { projectRoutes } from './projects';

describe('P0 - Critical: Project CRUD Operations', () => {
  describe('Given an authenticated user', () => {
    describe('When creating a new project with valid data', () => {
      it('Then should create project successfully and return project details', async ({
        authenticatedUser,
      }) => {
        // Given: Valid project data
        const projectData = {
          title: 'My New Audiobook',
          author: 'John Doe',
          language: 'en',
          genre: 'Fiction',
          status: 'draft',
          metadata: { description: 'A great story' },
        };

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
          'Content-Type': 'application/json',
        };

        // When: Creating project
        const response = await projectRoutes.handle(
          new Request('http://localhost/api/projects', {
            method: 'POST',
            headers,
            body: JSON.stringify(projectData),
          })
        );

        // Then: Should return 201 with project details
        expect(response.status).toBe(201);
        const data = await response.json();

        expect(data.title).toBe(projectData.title);
        expect(data.author).toBe(projectData.author);
        expect(data.language).toBe(projectData.language);
        expect(data.genre).toBe(projectData.genre);
        expect(data.status).toBe(projectData.status);
        expect(data.metadata).toEqual(projectData.metadata);
        expect(data.id).toBeTruthy();
        expect(data.createdAt).toBeTruthy();
        expect(data.userId).toBe(authenticatedUser.user.id);
      });
    });

    describe('When creating project without authentication', () => {
      it('Then should return unauthorized error', async () => {
        // Given: Project data without authentication
        const projectData = {
          title: 'Unauthorized Project',
        };

        // When: Creating project
        const response = await projectRoutes.handle(
          new Request('http://localhost/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          })
        );

        // Then: Should return 401
        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('When accessing own project', () => {
      it('Then should return project details', async ({
        testProject,
        authenticatedUser,
      }) => {
        // Given: Existing project and authenticated user
        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
        };

        // When: Getting project
        const response = await projectRoutes.handle(
          new Request(`http://localhost/api/projects/${testProject.id}`, {
            headers,
          })
        );

        // Then: Should return 200 with project details
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe(testProject.id);
        expect(data.title).toBe(testProject.title);
        expect(data.userId).toBe(authenticatedUser.user.id);
      });
    });

    describe('When updating own project', () => {
      it('Then should update project successfully', async ({
        testProject,
        authenticatedUser,
      }) => {
        // Given: Existing project and update data
        const updateData = {
          title: 'Updated Title',
          author: 'Updated Author',
          status: 'processing',
        };

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
          'Content-Type': 'application/json',
        };

        // When: Updating project
        const response = await projectRoutes.handle(
          new Request(`http://localhost/api/projects/${testProject.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateData),
          })
        );

        // Then: Should return 200 with updated data
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.title).toBe(updateData.title);
        expect(data.author).toBe(updateData.author);
        expect(data.status).toBe(updateData.status);
      });
    });

    describe('When deleting own project', () => {
      it('Then should delete project successfully', async ({
        authenticatedUser,
        setupProject,
      }) => {
        // Given: Project to delete
        const projectToDelete = setupProject({
          title: 'Project to Delete',
        });

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
        };

        // When: Deleting project
        const response = await projectRoutes.handle(
          new Request(`http://localhost/api/projects/${projectToDelete.id}`, {
            method: 'DELETE',
            headers,
          })
        );

        // Then: Should return 204 and project should be deleted
        expect(response.status).toBe(204);

        // Verify project is deleted
        const deletedProject = db.getProjectById(projectToDelete.id);
        expect(deletedProject).toBeUndefined();
      });
    });
  });
});

describe('P1 - High: Project Authorization', () => {
  describe('Given multiple users', () => {
    describe("When user tries to access another user's project", () => {
      it('Then should return forbidden error', async ({
        authenticatedUser,
        setupUser,
      }) => {
        // Given: User 1 (authenticated) and User 2 (different user)
        const user2 = setupUser({
          email: 'user2@example.com',
          name: 'User Two',
          password: 'Password123!',
        });

        // Create project owned by user 2
        const otherUserProject = db.createProject({
          userId: user2.user.id,
          title: 'Other User Project',
        });

        // When: User 1 tries to access user 2's project
        const response = await projectRoutes.handle(
          new Request(`http://localhost/api/projects/${otherUserProject.id}`, {
            headers: {
              Authorization: `Bearer ${authenticatedUser.token}`,
            },
          })
        );

        // Then: Should return 403
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('Forbidden');
      });
    });

    describe("When user tries to update another user's project", () => {
      it('Then should return forbidden error', async ({
        authenticatedUser,
        setupUser,
      }) => {
        // Given: Different user's project
        const user2 = setupUser({
          email: 'user2@example.com',
          name: 'User Two',
          password: 'Password123!',
        });

        const otherUserProject = db.createProject({
          userId: user2.user.id,
          title: 'Other User Project',
        });

        // When: Trying to update another user's project
        const response = await projectRoutes.handle(
          new Request(`http://localhost/api/projects/${otherUserProject.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${authenticatedUser.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Should Not Work' }),
          })
        );

        // Then: Should return 403
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('Forbidden');
      });
    });

    describe("When user tries to delete another user's project", () => {
      it('Then should return forbidden error', async ({
        authenticatedUser,
        setupUser,
      }) => {
        // Given: Different user's project
        const user2 = setupUser({
          email: 'user2@example.com',
          name: 'User Two',
          password: 'Password123!',
        });

        const otherUserProject = db.createProject({
          userId: user2.user.id,
          title: 'Other User Project',
        });

        // When: Trying to delete another user's project
        const response = await projectRoutes.handle(
          new Request(`http://localhost/api/projects/${otherUserProject.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${authenticatedUser.token}`,
            },
          })
        );

        // Then: Should return 403
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('Forbidden');

        // Verify project still exists
        const existingProject = db.getProjectById(otherUserProject.id);
        expect(existingProject).toBeDefined();
      });
    });
  });
});

describe('P2 - Medium: Project Validation', () => {
  describe('Given project creation requests', () => {
    describe('When required fields are missing', () => {
      it('Then should return validation error', async ({
        authenticatedUser,
      }) => {
        // Given: Invalid project data
        const invalidData = [
          {}, // Missing title
          { author: 'Only Author' }, // Missing title
          { title: '' }, // Empty title
        ];

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
          'Content-Type': 'application/json',
        };

        for (const data of invalidData) {
          // When: Creating project with invalid data
          const response = await projectRoutes.handle(
            new Request('http://localhost/api/projects', {
              method: 'POST',
              headers,
              body: JSON.stringify(data),
            })
          );

          // Then: Should return 400 with validation error
          expect(response.status).toBe(400);
          const responseData = await response.json();
          expect(responseData.error).toContain('title');
        }
      });
    });

    describe('When invalid field values are provided', () => {
      it('Then should return validation error', async ({
        authenticatedUser,
      }) => {
        // Given: Invalid field values
        const invalidData = [
          { title: 'Test', language: 'invalid-lang' }, // Invalid language
          { title: 'Test', status: 'invalid-status' }, // Invalid status
        ];

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
          'Content-Type': 'application/json',
        };

        for (const data of invalidData) {
          // When: Creating project with invalid values
          const response = await projectRoutes.handle(
            new Request('http://localhost/api/projects', {
              method: 'POST',
              headers,
              body: JSON.stringify(data),
            })
          );

          // Then: Should return 400 with validation error
          expect(response.status).toBe(400);
        }
      });
    });

    describe('When valid field values are provided', () => {
      it('Then should accept all valid values', async ({
        authenticatedUser,
      }) => {
        // Given: Valid field values
        const validData = [
          { title: 'Test', language: 'pt-BR' }, // Valid language
          { title: 'Test', language: 'en' }, // Valid language
          { title: 'Test', status: 'draft' }, // Valid status
          { title: 'Test', status: 'queued' }, // Valid status
          { title: 'Test', status: 'processing' }, // Valid status
          { title: 'Test', status: 'completed' }, // Valid status
          { title: 'Test', status: 'failed' }, // Valid status
        ];

        const headers = {
          Authorization: `Bearer ${authenticatedUser.token}`,
          'Content-Type': 'application/json',
        };

        for (const data of validData) {
          // When: Creating project with valid values
          const response = await projectRoutes.handle(
            new Request('http://localhost/api/projects', {
              method: 'POST',
              headers,
              body: JSON.stringify(data),
            })
          );

          // Then: Should return 201
          expect(response.status).toBe(201);
          const responseData = await response.json();

          // Verify field was set correctly
          if (data.language) expect(responseData.language).toBe(data.language);
          if (data.status) expect(responseData.status).toBe(data.status);
        }
      });
    });
  });
});

describe('Network-First Patterns: Concurrent Project Operations', () => {
  describe('Given multiple concurrent project operations', () => {
    describe('When users create projects simultaneously', () => {
      it('Then should handle race conditions without interference', async ({
        setupUser,
      }) => {
        // Network-First: Setup multiple users and concurrent requests
        const users = Array.from({ length: 5 }, (_, i) =>
          setupUser({
            email: `user${i}@example.com`,
            name: `User ${i}`,
            password: 'Password123!',
          })
        );

        // Create concurrent project creation requests
        const projectPromises = users.map((user, index) =>
          projectRoutes.handle(
            new Request('http://localhost/api/projects', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: `Project ${index}`,
                author: `Author ${index}`,
              }),
            })
          )
        );

        // When: Executing all requests concurrently
        const responses = await Promise.all(projectPromises);

        // Then: All should succeed without interference
        for (const [index, response] of responses.entries()) {
          expect(response.status).toBe(201);
        }

        // Verify all projects were created with correct owners
        const projects = await Promise.all(
          responses.map((response) => response.json())
        );

        for (const [index, project] of projects.entries()) {
          expect(project.title).toBe(`Project ${index}`);
          expect(project.author).toBe(`Author ${index}`);
        }
      });
    });

    describe('When project operations happen concurrently for same user', () => {
      it('Then should maintain data consistency', async ({
        authenticatedUser,
        setupProject,
      }) => {
        // Create initial projects
        const initialProjects = Array.from({ length: 3 }, (_, i) =>
          setupProject({
            title: `Initial Project ${i}`,
          })
        );

        // Create concurrent update operations
        const updatePromises = initialProjects.map((project, index) =>
          projectRoutes.handle(
            new Request(`http://localhost/api/projects/${project.id}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${authenticatedUser.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'processing',
                metadata: { updatedBy: index },
              }),
            })
          )
        );

        // When: Executing concurrent updates
        const responses = await Promise.all(updatePromises);

        // Then: All updates should succeed
        for (const response of responses) {
          expect(response.status).toBe(200);
        }

        // Verify data consistency
        const updatedProjects = await Promise.all(
          responses.map((response) => response.json())
        );

        for (const [index, project] of updatedProjects.entries()) {
          expect(project.status).toBe('processing');
          expect(project.metadata.updatedBy).toBe(index);
        }
      });
    });
  });
});
