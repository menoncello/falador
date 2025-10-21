import { faker } from '@faker-js/faker';
import { createProject } from './project.factory';
import { createVoice } from './voice.factory';

/**
 * Audio File Factory
 *
 * Factory for creating test audio file data using faker for randomization.
 * Supports different audio formats, sizes, and processing statuses.
 */

export interface AudioFileFactoryData {
  id?: string;
  projectId?: string;
  text?: string;
  voiceId?: string;
  duration?: number;
  size?: number;
  format?: string;
  storagePath?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createAudioFile = (
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  const now = new Date().toISOString();
  const project = createProject();
  const voice = createVoice();
  const text = overrides.text || faker.lorem.paragraphs({ min: 1, max: 3 });

  // Estimate duration based on text length (average reading speed: 150 words per minute)
  const wordCount = text.split(' ').length;
  const estimatedDuration = (wordCount / 150) * 60; // in seconds

  const format = overrides.format || 'mp3';
  const sampleRate = 24000; // 24kHz
  const bitRate = format === 'mp3' ? 128000 : 256000; // bits per second

  return {
    id: overrides.id || faker.string.uuid(),
    projectId: overrides.projectId || project.id,
    text,
    voiceId: overrides.voiceId || voice.id,
    duration:
      overrides.duration ||
      faker.number.float({
        min: estimatedDuration * 0.8,
        max: estimatedDuration * 1.2,
        fractionDigits: 1,
      }),
    size: overrides.size || Math.floor((estimatedDuration * bitRate) / 8), // bytes
    format,
    storagePath:
      overrides.storagePath ||
      `audio/${faker.system.fileName({ extensionCount: 0 })}-${faker.string.alphanumeric(8)}.${format}`,
    status:
      overrides.status ||
      faker.helpers.weightedArrayElement([
        { weight: 60, value: 'completed' },
        { weight: 15, value: 'pending' },
        { weight: 15, value: 'processing' },
        { weight: 10, value: 'failed' },
      ]),
    errorMessage:
      overrides.errorMessage ||
      (overrides.status === 'failed'
        ? faker.helpers.arrayElement([
            'TTS service unavailable',
            'Invalid voice settings',
            'Text too long',
            'Payment required',
            'Rate limit exceeded',
          ])
        : ''),
    createdAt:
      overrides.createdAt || faker.date.recent({ days: 30 }).toISOString(),
    updatedAt: overrides.updatedAt || now,
  };
};

export const createAudioFiles = (
  count: number,
  overrides: AudioFileFactoryData = {}
): Array<Required<AudioFileFactoryData>> => {
  return Array.from({ length: count }, () => createAudioFile(overrides));
};

export const createPendingAudioFile = (
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  return createAudioFile({
    status: 'pending',
    ...overrides,
  });
};

export const createProcessingAudioFile = (
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  return createAudioFile({
    status: 'processing',
    ...overrides,
  });
};

export const createCompletedAudioFile = (
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  return createAudioFile({
    status: 'completed',
    ...overrides,
  });
};

export const createFailedAudioFile = (
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  return createAudioFile({
    status: 'failed',
    ...overrides,
  });
};

export const createAudioFilesForProject = (
  projectId: string,
  counts: {
    pending?: number;
    processing?: number;
    completed?: number;
    failed?: number;
  } = {}
): Array<Required<AudioFileFactoryData>> => {
  const { pending = 0, processing = 1, completed = 3, failed = 0 } = counts;

  return [
    ...createAudioFiles(pending, { projectId, status: 'pending' }),
    ...createAudioFiles(processing, { projectId, status: 'processing' }),
    ...createAudioFiles(completed, { projectId, status: 'completed' }),
    ...createAudioFiles(failed, { projectId, status: 'failed' }),
  ];
};

export const createAudioFileWithDuration = (
  durationSeconds: number,
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  // Generate text based on target duration
  const wordsPerMinute = 150;
  const targetWords = Math.floor((durationSeconds / 60) * wordsPerMinute);
  const text = faker.lorem.words({
    min: Math.max(targetWords - 10, 5),
    max: targetWords + 10,
  });

  return createAudioFile({
    text,
    duration: durationSeconds,
    size: Math.floor((durationSeconds * 128000) / 8), // MP3 at 128kbps
    ...overrides,
  });
};

export const createAudioFileWithFormat = (
  format: string,
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  const bitRates = {
    mp3: 128000,
    wav: 1411000, // 16-bit, 44.1kHz stereo
    flac: 800000,
    aac: 128000,
    ogg: 160000,
  };

  const bitRate = bitRates[format as keyof typeof bitRates] || 128000;
  const duration =
    overrides.duration || faker.number.int({ min: 30, max: 300 });

  return createAudioFile({
    format,
    duration,
    size: Math.floor((duration * bitRate) / 8),
    ...overrides,
  });
};

export const createAudioFileWithError = (
  errorMessage: string,
  overrides: AudioFileFactoryData = {}
): Required<AudioFileFactoryData> => {
  return createAudioFile({
    status: 'failed',
    errorMessage,
    ...overrides,
  });
};
