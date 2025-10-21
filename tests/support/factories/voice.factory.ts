import { faker } from '@faker-js/faker';

/**
 * Voice Factory
 *
 * Factory for creating test voice data using faker for randomization.
 * Supports different TTS providers and voice characteristics.
 */

export interface VoiceFactoryData {
  id?: string;
  name?: string;
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  provider?: 'openai' | 'google' | 'azure' | 'aws';
  providerVoiceId?: string;
  sampleRate?: number;
  createdAt?: string;
}

export const createVoice = (
  overrides: VoiceFactoryData = {}
): Required<VoiceFactoryData> => {
  const provider =
    overrides.provider ||
    faker.helpers.weightedArrayElement([
      { weight: 40, value: 'openai' },
      { weight: 30, value: 'google' },
      { weight: 20, value: 'azure' },
      { weight: 10, value: 'aws' },
    ]);

  const providerVoiceIds = {
    openai: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    google: [
      'en-US-Standard-A',
      'en-US-Standard-B',
      'en-US-Standard-C',
      'en-US-Standard-D',
      'en-US-Wavenet-A',
      'en-US-Wavenet-B',
    ],
    azure: [
      'en-US-JennyNeural',
      'en-US-GuyNeural',
      'en-US-AriaNeural',
      'en-US-DavisNeural',
      'en-US-JaneNeural',
    ],
    aws: ['Joanna', 'Matthew', 'Ivy', 'Justin', 'Kendra', 'Kevin'],
  };

  const voiceNames = {
    openai: ['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer'],
    google: [
      'Standard A',
      'Standard B',
      'Standard C',
      'Standard D',
      'WaveNet A',
      'WaveNet B',
    ],
    azure: ['Jenny', 'Guy', 'Aria', 'Davis', 'Jane'],
    aws: ['Joanna', 'Matthew', 'Ivy', 'Justin', 'Kendra', 'Kevin'],
  };

  const providerVoiceId =
    overrides.providerVoiceId ||
    faker.helpers.arrayElement(providerVoiceIds[provider]);

  const voiceName =
    overrides.name || faker.helpers.arrayElement(voiceNames[provider]);

  return {
    id: overrides.id || faker.string.uuid(),
    name: voiceName,
    language: overrides.language || 'en-US',
    gender:
      overrides.gender ||
      faker.helpers.weightedArrayElement([
        { weight: 35, value: 'female' },
        { weight: 30, value: 'male' },
        { weight: 35, value: 'neutral' },
      ]),
    provider,
    providerVoiceId,
    sampleRate:
      overrides.sampleRate ||
      faker.helpers.weightedArrayElement([
        { weight: 40, value: 24000 },
        { weight: 30, value: 22050 },
        { weight: 20, value: 16000 },
        { weight: 10, value: 44100 },
      ]),
    createdAt:
      overrides.createdAt || faker.date.recent({ days: 90 }).toISOString(),
  };
};

export const createVoices = (
  count: number,
  overrides: VoiceFactoryData = {}
): Array<Required<VoiceFactoryData>> => {
  return Array.from({ length: count }, () => createVoice(overrides));
};

export const createOpenAIVoices = (): Array<Required<VoiceFactoryData>> => {
  const openaiVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  return openaiVoices.map((voiceId, index) =>
    createVoice({
      provider: 'openai',
      providerVoiceId: voiceId,
      name: voiceId.charAt(0).toUpperCase() + voiceId.slice(1),
      id: `openai-${voiceId}`,
      gender: index % 2 === 0 ? 'female' : index % 3 === 0 ? 'male' : 'neutral',
    })
  );
};

export const createGoogleVoices = (): Array<Required<VoiceFactoryData>> => {
  const googleVoices = [
    { id: 'en-US-Standard-A', name: 'Standard A' },
    { id: 'en-US-Standard-B', name: 'Standard B' },
    { id: 'en-US-Standard-C', name: 'Standard C' },
    { id: 'en-US-Wavenet-A', name: 'WaveNet A' },
    { id: 'en-US-Wavenet-B', name: 'WaveNet B' },
  ];

  return googleVoices.map((voice, index) =>
    createVoice({
      provider: 'google',
      providerVoiceId: voice.id,
      name: voice.name,
      id: `google-${voice.id.replace(/[^\dA-Za-z]/g, '-')}`,
      gender: index % 2 === 0 ? 'female' : 'male',
    })
  );
};

export const createVoicesByLanguage = (
  language: string,
  count = 5
): Array<Required<VoiceFactoryData>> => {
  return createVoices(count, { language });
};

export const createVoicesByProvider = (
  provider: VoiceFactoryData['provider'],
  count = 5
): Array<Required<VoiceFactoryData>> => {
  return createVoices(count, { provider });
};

export const createVoicesByGender = (
  gender: VoiceFactoryData['gender'],
  count = 5
): Array<Required<VoiceFactoryData>> => {
  return createVoices(count, { gender });
};
