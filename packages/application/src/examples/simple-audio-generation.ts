/**
 * Simple Audio Generation Example
 * Demonstrates the complete Clean Architecture flow
 */

import type { User, Project, Voice, GenerationJob } from '@falador/core-domain';
import { injectable, inject } from 'tsyringe';
import type {
  UserManagementUseCase,
  ProjectManagementUseCase,
  AudioGenerationUseCase,
  VoiceManagementUseCase,
} from '../use-cases/index.js';

/**
 * Example use case demonstrating the full Clean Architecture flow:
 * Domain -> Application -> Infrastructure -> Presentation
 */
@injectable()
export class SimpleAudioGenerationExample {
  /**
   *
   * @param userUseCase
   * @param projectUseCase
   * @param audioUseCase
   * @param voiceUseCase
   */
  constructor(
    @inject('UserManagementUseCase') private userUseCase: UserManagementUseCase,
    @inject('ProjectManagementUseCase')
    private projectUseCase: ProjectManagementUseCase,
    @inject('AudioGenerationUseCase')
    private audioUseCase: AudioGenerationUseCase,
    @inject('VoiceManagementUseCase')
    private voiceUseCase: VoiceManagementUseCase
  ) {}

  /**
   * Complete flow demonstration:
   * 1. Create a user
   * 2. Create a project for the user
   * 3. Get available voices
   * 4. Generate audio for the project
   * 5. Monitor job progress
   */
  async demonstrateCompleteFlow(): Promise<{
    user: User;
    project: Project;
    voice: Voice;
    job: GenerationJob;
  }> {
    console.log('🏗️  Starting Clean Architecture flow demonstration...\n');

    // Step 1: Create a user (Domain -> Application -> Infrastructure)
    console.log('📝 Step 1: Creating user...');
    const user = await this.userUseCase.createUser({
      email: 'demo@example.com',
      name: 'Demo User',
    });
    console.log(`✅ User created: ${user.name} (${user.id})\n`);

    // Step 2: Create a project for the user
    console.log('📚 Step 2: Creating project...');
    const project = await this.projectUseCase.createProject({
      title: 'Demo Audiobook Project',
      userId: user.id,
    });
    console.log(`✅ Project created: ${project.title} (${project.id})\n`);

    // Step 3: Get available voices
    console.log('🎤 Step 3: Getting available voices...');
    const voices = await this.voiceUseCase.getAvailableVoices('pt-BR');
    const voice = voices[0]; // Use first available voice
    console.log(`✅ Selected voice: ${voice.name} (${voice.language})\n`);

    // Step 4: Generate audio for the project
    console.log('🔊 Step 4: Generating audio...');
    const audioRequest = {
      text: 'Olá! Este é um exemplo de geração de áudio usando Clean Architecture.',
      voiceId: voice.id,
      projectId: project.id,
      userId: user.id,
    };

    const generationResult =
      await this.audioUseCase.generateAudio(audioRequest);
    console.log(`✅ Audio generation started: Job ${generationResult.jobId}\n`);

    // Step 5: Monitor job progress
    console.log('⏳ Step 5: Monitoring job progress...');
    let job: GenerationJob | null = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms

      job = await this.audioUseCase.getJobStatus(
        generationResult.jobId,
        user.id
      );
      if (!job) {
        throw new Error('Job not found');
      }

      console.log(`   Status: ${job.status} (${job.progress}% complete)`);

      if (job.status === 'completed') {
        console.log('✅ Audio generation completed!\n');
        break;
      } else if (job.status === 'failed') {
        console.log(`❌ Audio generation failed: ${job.errorMessage}\n`);
        break;
      }

      attempts++;
    }

    if (!job || job.status !== 'completed') {
      throw new Error('Audio generation did not complete in time');
    }

    console.log(
      '🎉 Clean Architecture flow demonstration completed successfully!\n'
    );
    console.log('📊 Summary:');
    console.log(`   User: ${user.name} (${user.id})`);
    console.log(`   Project: ${project.title} (${project.id})`);
    console.log(`   Voice: ${voice.name} (${voice.language})`);
    console.log(`   Job: ${job.id} (${job.status})`);

    return { user, project, voice, job };
  }

  /**
   * Demonstrate error handling in Clean Architecture
   */
  async demonstrateErrorHandling(): Promise<void> {
    console.log('\n🚨 Demonstrating error handling...\n');

    try {
      // Try to create user with invalid email
      await this.userUseCase.createUser({
        email: 'invalid-email',
        name: '',
      });
    } catch (error) {
      console.log(
        `✅ Validation error caught: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    try {
      // Try to get non-existent project
      await this.projectUseCase.getProjectById('non-existent-id');
    } catch (error) {
      console.log(
        `✅ Authorization error caught: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    try {
      // Try to generate audio with empty text
      await this.audioUseCase.generateAudio({
        text: '',
        voiceId: 'invalid-voice',
        projectId: 'invalid-project',
      });
    } catch (error) {
      console.log(
        `✅ Domain validation error caught: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    console.log('\n✅ Error handling demonstration completed!');
  }
}
