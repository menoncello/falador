import { test, expect } from '@playwright/test';

/**
 * Clean Architecture End-to-End Demo Tests
 *
 * These tests validate the complete Clean Architecture flow for Story 1.5.
 * All tests MUST fail initially (RED phase) before implementation.
 *
 * Acceptance Criteria Mapping:
 * AC8: Example use case implemented demonstrating architecture flow
 */

test.describe('1.5-ARCH-008: Clean Architecture End-to-End Demo', () => {
  test.describe('AC8: Complete architecture flow demonstration', () => {
    test('should demonstrate complete audio generation workflow through all layers', async ({
      request,
    }) => {
      // GIVEN: Clean Architecture is implemented with all layers
      // WHEN: User generates audio through the complete system
      // THEN: Request should flow through all layers correctly

      // Step 1: User Registration (Presentation → Application → Domain → Infrastructure)
      const userData = {
        email: 'demo@example.com',
        name: 'Demo User',
        password: 'SecurePassword123!',
      };

      // Register user via API
      const registerResponse = await request.post('/api/auth/register', {
        data: userData,
      });

      expect(registerResponse.status()).toBe(201);
      const user = await registerResponse.json();
      expect(user.id).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.tier).toBe('free');

      // Step 2: User Login (Authentication flow)
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          email: userData.email,
          password: userData.password,
        },
      });

      expect(loginResponse.status()).toBe(200);
      const loginResult = await loginResponse.json();
      expect(loginResult.token).toMatch(/^(?:[\w-]+\.){2}[\w-]+$/);

      const authHeaders = {
        Authorization: `Bearer ${loginResult.token}`,
      };

      // Step 3: Create Project (Application layer orchestrates)
      const projectData = {
        name: 'Demo Audiobook Project',
        settings: {
          voiceId: 'alloy',
          speed: 1.0,
          pitch: 1.0,
        },
      };

      const projectResponse = await request.post('/api/projects', {
        headers: authHeaders,
        data: projectData,
      });

      expect(projectResponse.status()).toBe(201);
      const project = await projectResponse.json();
      expect(project.id).toBeTruthy();
      expect(project.name).toBe(projectData.name);
      expect(project.status).toBe('draft');

      // Step 4: Get Available Voices (Infrastructure layer calls external API)
      const voicesResponse = await request.get('/api/voices', {
        headers: authHeaders,
      });

      expect(voicesResponse.status()).toBe(200);
      const voices = await voicesResponse.json();
      expect(Array.isArray(voices.data)).toBe(true);
      expect(voices.data.length).toBeGreaterThan(0);

      const selectedVoice = voices.data.find((v: any) => v.id === 'alloy');
      expect(selectedVoice).toBeTruthy();
      expect(selectedVoice.name).toBe('Alloy');
      expect(selectedVoice.provider).toBe('openai');

      // Step 5: Generate Audio (Complete flow: API → UseCase → Domain → Infrastructure)
      const audioRequest = {
        text: 'This is a demonstration of Clean Architecture in action. The request flows through the presentation layer, application layer use cases, domain entities, and infrastructure adapters, maintaining separation of concerns and dependency inversion.',
        voiceId: selectedVoice.id,
        options: {
          speed: 1.0,
          pitch: 1.0,
          format: 'mp3',
        },
      };

      const audioResponse = await request.post(
        `/api/projects/${project.id}/audio`,
        {
          headers: authHeaders,
          data: audioRequest,
        }
      );

      expect(audioResponse.status()).toBe(201);
      const audioFile = await audioResponse.json();
      expect(audioFile.id).toBeTruthy();
      expect(audioFile.text).toBe(audioRequest.text);
      expect(audioFile.voiceId).toBe(selectedVoice.id);
      expect(audioFile.status).toBe('completed');

      // Step 6: Verify Project Status Updated (Domain rules applied)
      const updatedProjectResponse = await request.get(
        `/api/projects/${project.id}`,
        {
          headers: authHeaders,
        }
      );

      expect(updatedProjectResponse.status()).toBe(200);
      const updatedProject = await updatedProjectResponse.json();
      expect(updatedProject.status).toBe('in_progress');

      // Step 7: List All Audio Files for Project (Repository pattern)
      const audioListResponse = await request.get(
        `/api/projects/${project.id}/audio`,
        {
          headers: authHeaders,
        }
      );

      expect(audioListResponse.status()).toBe(200);
      const audioList = await audioListResponse.json();
      expect(Array.isArray(audioList.data)).toBe(true);
      expect(audioList.data).toHaveLength(1);
      expect(audioList.data[0].id).toBe(audioFile.id);

      // Step 8: Check Audio File Details (Domain entity validation)
      const audioDetailsResponse = await request.get(
        `/api/audio/${audioFile.id}`,
        {
          headers: authHeaders,
        }
      );

      expect(audioDetailsResponse.status()).toBe(200);
      const audioDetails = await audioDetailsResponse.json();
      expect(audioDetails.duration).toBeGreaterThan(0);
      expect(audioDetails.size).toBeGreaterThan(0);
      expect(audioDetails.format).toBe('mp3');
      expect(audioDetails.storagePath).toBeTruthy();
      expect(audioDetails.storagePath).toContain('s3');

      // Step 9: Generate Additional Audio (Demonstrate dependency injection)
      const secondAudioResponse = await request.post(
        `/api/projects/${project.id}/audio`,
        {
          headers: authHeaders,
          data: {
            ...audioRequest,
            text: 'This second audio file demonstrates how the same architecture can handle multiple requests efficiently with proper dependency injection and repository patterns.',
          },
        }
      );

      expect(secondAudioResponse.status()).toBe(201);
      const secondAudioFile = await secondAudioResponse.json();

      // Step 10: Complete Project (Application layer business rules)
      const completeResponse = await request.patch(
        `/api/projects/${project.id}`,
        {
          headers: authHeaders,
          data: { status: 'completed' },
        }
      );

      expect(completeResponse.status()).toBe(200);
      const completedProject = await completeResponse.json();
      expect(completedProject.status).toBe('completed');

      // Step 11: Verify Final State (All layers working together)
      const finalProjectResponse = await request.get(
        `/api/projects/${project.id}`,
        {
          headers: authHeaders,
        }
      );

      expect(finalProjectResponse.status()).toBe(200);
      const finalProject = await finalProjectResponse.json();
      expect(finalProject.status).toBe('completed');

      const finalAudioListResponse = await request.get(
        `/api/projects/${project.id}/audio`,
        {
          headers: authHeaders,
        }
      );

      expect(finalAudioListResponse.status()).toBe(200);
      const finalAudioList = await finalAudioListResponse.json();
      expect(finalAudioList.data).toHaveLength(2);

      // Step 12: User Logout (Cleanup)
      const logoutResponse = await request.post('/api/auth/logout', {
        headers: authHeaders,
      });

      expect(logoutResponse.status()).toBe(200);
    });

    test('should demonstrate error handling across all layers', async ({
      request,
    }) => {
      // GIVEN: Clean Architecture error handling
      // WHEN: Errors occur at different layers
      // THEN: Errors should be properly handled and propagated

      // Test 1: Domain layer validation error
      const invalidProjectData = {
        name: '', // Empty name should fail domain validation
        settings: {},
      };

      const user = await createTestUser(request);
      const authHeaders = { Authorization: `Bearer ${user.token}` };

      const invalidProjectResponse = await request.post('/api/projects', {
        headers: authHeaders,
        data: invalidProjectData,
      });

      expect(invalidProjectResponse.status()).toBe(400);
      const error1 = await invalidProjectResponse.json();
      expect(error1.success).toBe(false);
      expect(error1.error).toContain('Project name is required');

      // Test 2: Infrastructure layer service error
      const invalidVoiceId = 'non-existent-voice';
      const validProjectData = {
        name: 'Test Project',
        settings: { voiceId: invalidVoiceId },
      };

      const projectResponse = await request.post('/api/projects', {
        headers: authHeaders,
        data: validProjectData,
      });

      expect(projectResponse.status()).toBe(201);
      const project = await projectResponse.json();

      const audioResponse = await request.post(
        `/api/projects/${project.id}/audio`,
        {
          headers: authHeaders,
          data: {
            text: 'Test text',
            voiceId: invalidVoiceId,
          },
        }
      );

      expect(audioResponse.status()).toBe(400);
      const error2 = await audioResponse.json();
      expect(error2.success).toBe(false);
      expect(error2.error).toContain('Voice not found');

      // Test 3: Application layer business rule error
      await createTestProject(request, user.id, user.token);

      // Try to create audio for non-existent project
      const nonExistentProjectResponse = await request.post(
        '/api/projects/non-existent/audio',
        {
          headers: authHeaders,
          data: {
            text: 'Test text',
            voiceId: 'alloy',
          },
        }
      );

      expect(nonExistentProjectResponse.status()).toBe(404);
      const error3 = await nonExistentProjectResponse.json();
      expect(error3.success).toBe(false);
      expect(error3.error).toContain('Project not found');

      // Test 4: Repository layer constraint error
      const duplicateUserResponse = await request.post('/api/auth/register', {
        data: {
          email: user.email, // Same email as existing user
          name: 'Another User',
          password: 'password123',
        },
      });

      expect(duplicateUserResponse.status()).toBe(409);
      const error4 = await duplicateUserResponse.json();
      expect(error4.success).toBe(false);
      expect(error4.error).toContain('Email already exists');
    });

    test('should demonstrate dependency injection and interface segregation', async ({
      request,
    }) => {
      // GIVEN: Proper dependency injection setup
      // WHEN: Different implementations are injected
      // THEN: System should work with any valid implementation

      // This test would demonstrate how different implementations can be swapped
      // without changing the application layer code

      const user = await createTestUser(request);
      const authHeaders = { Authorization: `Bearer ${user.token}` };

      // Create project with default settings
      const projectResponse = await request.post('/api/projects', {
        headers: authHeaders,
        data: {
          name: 'DI Test Project',
          settings: {
            voiceId: 'alloy',
            speed: 1.0,
          },
        },
      });

      expect(projectResponse.status()).toBe(201);
      const project = await projectResponse.json();

      // Generate audio - this should work regardless of which TTS implementation is injected
      const audioResponse = await request.post(
        `/api/projects/${project.id}/audio`,
        {
          headers: authHeaders,
          data: {
            text: 'This demonstrates dependency injection - the use case works with any TTS implementation that follows the interface.',
            voiceId: 'alloy',
          },
        }
      );

      expect(audioResponse.status()).toBe(201);
      const audioFile = await audioResponse.json();

      // The fact that this works proves DI is working - the use case doesn't know
      // whether it's using OpenAI, Google TTS, or a mock implementation
      expect(audioFile.id).toBeTruthy();
      expect(audioFile.status).toBe('completed');

      // Test different storage implementations (S3, local, etc.)
      // The use case should work regardless of storage backend
      const audioDetailsResponse = await request.get(
        `/api/audio/${audioFile.id}`,
        {
          headers: authHeaders,
        }
      );

      expect(audioDetailsResponse.status()).toBe(200);
      const audioDetails = await audioDetailsResponse.json();
      expect(audioDetails.storagePath).toBeTruthy();

      // Could be S3 URL, local file path, or other storage location
      // The application layer doesn't need to know or care
    });
  });
});

// Helper functions for test setup
async function createTestUser(request: any) {
  const userData = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: 'TestPassword123!',
  };

  const registerResponse = await request.post('/api/auth/register', {
    data: userData,
  });

  expect(registerResponse.status()).toBe(201);
  const user = await registerResponse.json();

  const loginResponse = await request.post('/api/auth/login', {
    data: {
      email: userData.email,
      password: userData.password,
    },
  });

  expect(loginResponse.status()).toBe(200);
  const loginResult = await loginResponse.json();

  return {
    id: user.id,
    email: user.email,
    token: loginResult.token,
  };
}

async function createTestProject(request: any, userId: string, token: string) {
  const projectResponse = await request.post('/api/projects', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: 'Test Project',
      settings: { voiceId: 'alloy' },
    },
  });

  expect(projectResponse.status()).toBe(201);
  return await projectResponse.json();
}
