import { faker } from '@faker-js/faker';
import { createUser } from './user.factory';

/**
 * Project Factory
 *
 * Factory for creating test project data using faker for randomization.
 * Supports different project statuses and configurations.
 */

export interface ProjectSettings {
  voiceId?: string;
  speed?: number;
  pitch?: number;
  format?: string;
  quality?: string;
}

export interface ProjectFactoryData {
  id?: string;
  userId?: string;
  name?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'archived';
  settings?: ProjectSettings;
  createdAt?: string;
  updatedAt?: string;
}

export const createProject = (
  overrides: ProjectFactoryData = {}
): Required<ProjectFactoryData> => {
  const now = new Date().toISOString();
  const user = createUser();

  return {
    id: overrides.id || faker.string.uuid(),
    userId: overrides.userId || user.id,
    name:
      overrides.name ||
      faker.lorem
        .words({ min: 2, max: 5 })
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    status:
      overrides.status ||
      faker.helpers.weightedArrayElement([
        { weight: 30, value: 'draft' },
        { weight: 25, value: 'in_progress' },
        { weight: 35, value: 'completed' },
        { weight: 10, value: 'archived' },
      ]),
    settings: overrides.settings || {
      voiceId: faker.helpers.arrayElement([
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'shimmer',
      ]),
      speed: faker.helpers.weightedArrayElement([
        { weight: 40, value: 1.0 },
        { weight: 20, value: 0.8 },
        { weight: 20, value: 1.2 },
        { weight: 10, value: 0.9 },
        { weight: 10, value: 1.1 },
      ]),
      pitch: faker.helpers.weightedArrayElement([
        { weight: 50, value: 1.0 },
        { weight: 15, value: 0.9 },
        { weight: 15, value: 1.1 },
        { weight: 10, value: 0.8 },
        { weight: 10, value: 1.2 },
      ]),
      format: 'mp3',
      quality: 'standard',
    },
    createdAt:
      overrides.createdAt || faker.date.recent({ days: 60 }).toISOString(),
    updatedAt: overrides.updatedAt || now,
  };
};

export const createProjects = (
  count: number,
  overrides: ProjectFactoryData = {}
): Array<Required<ProjectFactoryData>> => {
  return Array.from({ length: count }, () => createProject(overrides));
};

export const createDraftProject = (
  overrides: ProjectFactoryData = {}
): Required<ProjectFactoryData> => {
  return createProject({
    status: 'draft',
    ...overrides,
  });
};

export const createInProgressProject = (
  overrides: ProjectFactoryData = {}
): Required<ProjectFactoryData> => {
  return createProject({
    status: 'in_progress',
    ...overrides,
  });
};

export const createCompletedProject = (
  overrides: ProjectFactoryData = {}
): Required<ProjectFactoryData> => {
  return createProject({
    status: 'completed',
    ...overrides,
  });
};

export const createProjectsForUser = (
  userId: string,
  counts: { draft?: number; in_progress?: number; completed?: number } = {}
): Array<Required<ProjectFactoryData>> => {
  const { draft = 2, in_progress = 1, completed = 3 } = counts;

  return [
    ...createProjects(draft, { userId, status: 'draft' }),
    ...createProjects(in_progress, { userId, status: 'in_progress' }),
    ...createProjects(completed, { userId, status: 'completed' }),
  ];
};

export const createProjectWithAudioCount = (
  audioFileCount: number,
  overrides: ProjectFactoryData = {}
): Required<ProjectFactoryData> & { expectedAudioFileCount: number } => {
  const project = createProject(overrides);

  // Set status based on audio file count
  let status: ProjectFactoryData['status'] = 'draft';
  if (audioFileCount > 0 && audioFileCount < 5) {
    status = 'in_progress';
  } else if (audioFileCount >= 5) {
    status = 'completed';
  }

  return {
    ...project,
    status: overrides.status || status,
    expectedAudioFileCount: audioFileCount,
  };
};
