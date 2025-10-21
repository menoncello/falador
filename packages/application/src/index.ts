/**
 * Falador Application Layer
 * Use cases and orchestration layer
 */

export const version = '0.0.1';

// Export actual use case implementations
export { UserManagementUseCase } from './use-cases/user-management.js';
export { ProjectManagementUseCase } from './use-cases/project-management.js';
export { AudioGenerationUseCase } from './use-cases/audio-generation.js';
export { VoiceManagementUseCase } from './use-cases/voice-management.js';

// Export use case interfaces and types
export type {
  CreateUserRequest,
  UpdateUserRequest,
} from './use-cases/user-management.js';

export type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from './use-cases/project-management.js';

export type {
  GenerateAudioRequest,
  AudioResult,
} from './use-cases/audio-generation.js';

// Import domain types
export type {
  User,
  Project,
  Voice,
  AudioFile,
  GenerationJob,
} from '@falador/core-domain';
export type {
  ValidationError,
  NotFoundError,
  TTSEngine,
  Storage,
  Queue,
  UserRepository,
  ProjectRepository,
  VoiceRepository,
  GenerationJobRepository,
  AudioFileRepository,
} from '@falador/core-domain';
