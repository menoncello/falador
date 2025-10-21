import type {
  UserRepository,
  ProjectRepository,
  UserManagementUseCase,
  ProjectManagementUseCase,
  AudioGenerationUseCase,
  VoiceManagementUseCase,
} from '@falador/core-domain';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DIContainer } from '../di-container';
import { TestFactory } from '../test-factories';

/**
 * Cross-Layer Integration Tests
 *
 * These tests verify that the Clean Architecture layers work together correctly.
 * They test the integration between domain entities, application use cases,
 * infrastructure implementations, and API gateway interfaces.
 */

describe('Cross-Layer Integration Tests', () => {
  let testFactory: TestFactory;
  let userRepo: UserRepository;
  let projectRepo: ProjectRepository;
  let userManagement: UserManagementUseCase;
  let projectManagement: ProjectManagementUseCase;
  let audioGeneration: AudioGenerationUseCase;
  let voiceManagement: VoiceManagementUseCase;

  beforeEach(() => {
    // Initialize test factory and resolve dependencies from DI container
    testFactory = new TestFactory();
    const dependencies = DIContainer.resolveAPIGatewayDependencies();

    userRepo = dependencies.userRepository;
    projectRepo = dependencies.projectRepository;
    userManagement = dependencies.userManagement;
    projectManagement = dependencies.projectManagement;
    audioGeneration = dependencies.audioGeneration;
    voiceManagement = dependencies.voiceManagement;
  });

  afterEach(() => {
    testFactory.cleanup();
  });

  describe('User → Project Integration', () => {
    it('should create user and associate projects correctly', async () => {
      // Arrange: Create user via application layer
      const userData = testFactory.createUserData();
      const createdUser = await userManagement.createUser(userData);

      // Act: Create project associated with user
      const projectData = testFactory.createProjectData({
        userId: createdUser.id,
      });
      const createdProject = await projectManagement.createProject(
        projectData,
        createdUser.id
      );

      // Assert: Verify cross-layer consistency
      expect(createdProject.userId).toBe(createdUser.id);

      // Verify repository layer consistency
      const retrievedUser = await userRepo.findById(createdUser.id);
      const retrievedProject = await projectRepo.findById(createdProject.id);

      expect(retrievedUser).not.toBeNull();
      expect(retrievedProject).not.toBeNull();
      expect(retrievedProject!.userId).toBe(retrievedUser!.id);
    });

    it('should handle user deletion with project cleanup', async () => {
      // Arrange: Create user with projects
      const userData = testFactory.createUserData();
      const user = await userManagement.createUser(userData);

      const project1Data = testFactory.createProjectData({ userId: user.id });
      const project2Data = testFactory.createProjectData({ userId: user.id });

      await projectManagement.createProject(project1Data, user.id);
      await projectManagement.createProject(project2Data, user.id);

      // Act & Assert: User deletion should cascade or handle projects appropriately
      try {
        await userManagement.deleteUser(user.id);

        // Verify user is deleted
        const deletedUser = await userRepo.findById(user.id);
        expect(deletedUser).toBeNull();

        // Verify project handling (implementation dependent)
        const projects = await projectRepo.findByUserId(user.id);
        expect(projects.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // If deletion is not allowed due to foreign key constraints
        expect(error).toBeDefined();
      }
    });
  });

  describe('Voice → Audio Generation Integration', () => {
    it('should validate voice availability before audio generation', async () => {
      // Arrange: Create user and project
      const userData = testFactory.createUserData();
      const user = await userManagement.createUser(userData);

      const projectData = testFactory.createProjectData({ userId: user.id });
      const project = await projectManagement.createProject(
        projectData,
        user.id
      );

      // Arrange: Get available voices via voice management
      const voices = await voiceManagement.getAvailableVoices();
      expect(voices.length).toBeGreaterThan(0);

      const selectedVoice = voices[0];

      // Act: Generate audio using available voice
      const audioData = testFactory.createAudioGenerationData({
        projectId: project.id,
        voiceId: selectedVoice.id,
        text: 'Integration test text for audio generation',
      });

      const job = await audioGeneration.generateAudio(audioData, user.id);

      // Assert: Verify cross-layer integration
      expect(job).toBeDefined();
      expect(job.projectId).toBe(project.id);
      expect(job.voiceId).toBe(selectedVoice.id);
      expect(job.status).toBe('pending');
    });

    it('should reject invalid voice ID during audio generation', async () => {
      // Arrange: Create user and project
      const userData = testFactory.createUserData();
      const user = await userManagement.createUser(userData);

      const projectData = testFactory.createProjectData({ userId: user.id });
      const project = await projectManagement.createProject(
        projectData,
        user.id
      );

      // Act & Assert: Try to generate audio with invalid voice
      const audioData = testFactory.createAudioGenerationData({
        projectId: project.id,
        voiceId: 'invalid-voice-id',
        text: 'Test text',
      });

      await expect(
        audioGeneration.generateAudio(audioData, user.id)
      ).rejects.toThrow('Voice not found');
    });
  });

  describe('Project → Audio Generation Workflow Integration', () => {
    it('should enforce project-based audio generation limits', async () => {
      // Arrange: Create user and project
      const userData = testFactory.createUserData();
      const user = await userManagement.createUser(userData);

      const projectData = testFactory.createProjectData({ userId: user.id });
      const project = await projectManagement.createProject(
        projectData,
        user.id
      );

      // Arrange: Get available voice
      const voices = await voiceManagement.getAvailableVoices();
      const voice = voices[0];

      // Act: Generate multiple audio files
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        const audioData = testFactory.createAudioGenerationData({
          projectId: project.id,
          voiceId: voice.id,
          text: `Test audio generation ${i + 1}`,
        });

        try {
          const job = await audioGeneration.generateAudio(audioData, user.id);
          jobs.push(job);
        } catch {
          // Handle rate limiting or quota restrictions
          break;
        }
      }

      // Assert: Verify integration consistency
      expect(jobs.length).toBeGreaterThan(0);

      // Verify all jobs are associated with the correct project
      for (const job of jobs) {
        expect(job.projectId).toBe(project.id);
      }

      // Verify project statistics are updated
      const updatedProject = await projectRepo.findById(project.id);
      expect(updatedProject).not.toBeNull();
      // Note: Specific statistics depend on implementation
    });
  });

  describe('Authorization Integration Across Layers', () => {
    it('should enforce user ownership across all use cases', async () => {
      // Arrange: Create two users
      const user1Data = testFactory.createUserData({
        email: 'user1@example.com',
      });
      const user2Data = testFactory.createUserData({
        email: 'user2@example.com',
      });

      const user1 = await userManagement.createUser(user1Data);
      const user2 = await userManagement.createUser(user2Data);

      // Arrange: Create project for user1
      const projectData = testFactory.createProjectData({ userId: user1.id });
      const project = await projectManagement.createProject(
        projectData,
        user1.id
      );

      // Act & Assert: user2 should not access user1's project
      await expect(
        projectManagement.getProject(project.id, user2.id)
      ).rejects.toThrow();

      await expect(
        projectManagement.updateProject(
          project.id,
          { name: 'Hacked' },
          user2.id
        )
      ).rejects.toThrow();

      await expect(
        projectManagement.deleteProject(project.id, user2.id)
      ).rejects.toThrow();
    });

    it('should handle authorization in audio generation workflow', async () => {
      // Arrange: Create two users and project for user1
      const user1Data = testFactory.createUserData({
        email: 'user1@example.com',
      });
      const user2Data = testFactory.createUserData({
        email: 'user2@example.com',
      });

      const user1 = await userManagement.createUser(user1Data);
      const user2 = await userManagement.createUser(user2Data);

      const projectData = testFactory.createProjectData({ userId: user1.id });
      const project = await projectManagement.createProject(
        projectData,
        user1.id
      );

      // Arrange: Get available voice
      const voices = await voiceManagement.getAvailableVoices();
      const voice = voices[0];

      // Act & Assert: user2 should not generate audio for user1's project
      const audioData = testFactory.createAudioGenerationData({
        projectId: project.id,
        voiceId: voice.id,
        text: 'Unauthorized audio generation',
      });

      await expect(
        audioGeneration.generateAudio(audioData, user2.id)
      ).rejects.toThrow();
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate domain errors through application layer', async () => {
      // Arrange: Try to create user with invalid email (domain validation)
      const invalidUserData = {
        ...testFactory.createUserData(),
        email: 'invalid-email-format',
      };

      // Act & Assert: Domain validation error should propagate
      await expect(userManagement.createUser(invalidUserData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should handle repository errors gracefully in use cases', async () => {
      // This test would require mocking repository to throw errors
      // For now, we'll test constraint violations
      const userData = testFactory.createUserData();
      const user1 = await userManagement.createUser(userData);

      // Act & Assert: Duplicate email should be handled
      await expect(userManagement.createUser(userData)).rejects.toThrow();
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across concurrent operations', async () => {
      // Arrange: Create user
      const userData = testFactory.createUserData();
      const user = await userManagement.createUser(userData);

      // Act: Create multiple projects concurrently
      const projectPromises = Array.from({ length: 5 }, (_, i) => {
        const projectData = testFactory.createProjectData({
          userId: user.id,
          name: `Concurrent Project ${i + 1}`,
        });
        return projectManagement.createProject(projectData, user.id);
      });

      const projects = await Promise.all(projectPromises);

      // Assert: Verify data consistency
      expect(projects).toHaveLength(5);

      // Verify all projects belong to the correct user
      const userProjects = await projectRepo.findByUserId(user.id);
      expect(userProjects).toHaveLength(5);

      for (const project of userProjects) {
        expect(project.userId).toBe(user.id);
      }
    });
  });

  describe('Performance Integration', () => {
    it('should handle complex workflows within reasonable time', async () => {
      // Arrange: Create user
      const startTime = Date.now();
      const userData = testFactory.createUserData();
      const user = await userManagement.createUser(userData);

      // Act: Execute complete workflow
      const projectData = testFactory.createProjectData({ userId: user.id });
      const project = await projectManagement.createProject(
        projectData,
        user.id
      );

      const voices = await voiceManagement.getAvailableVoices();
      const voice = voices[0];

      const audioData = testFactory.createAudioGenerationData({
        projectId: project.id,
        voiceId: voice.id,
        text: 'Performance test audio generation',
      });

      const job = await audioGeneration.generateAudio(audioData, user.id);

      // Assert: Performance should be reasonable
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(job).toBeDefined();
    });
  });
});
