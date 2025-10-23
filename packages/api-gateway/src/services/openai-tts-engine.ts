import type { Voice, TTSEngine } from '../../../core-domain/src/index.js';

// Constants to avoid magic numbers
const DEFAULT_MOCK_DELAY_MS = 100;

/**
 * Configuration for creating voice objects
 */
interface VoiceConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'mature';
  isDefault?: boolean;
}

/**
 * Default voice configurations for OpenAI TTS
 */
const DEFAULT_VOICE_CONFIGS: VoiceConfig[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    gender: 'neutral',
    age: 'adult',
    isDefault: true,
  },
  {
    id: 'echo',
    name: 'Echo',
    gender: 'male',
    age: 'adult',
  },
  {
    id: 'fable',
    name: 'Fable',
    gender: 'neutral',
    age: 'adult',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    gender: 'male',
    age: 'mature',
  },
  {
    id: 'nova',
    name: 'Nova',
    gender: 'female',
    age: 'adult',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    gender: 'female',
    age: 'young',
  },
];

/**
 * OpenAI Text-to-Speech Engine Implementation
 *
 * This is a mock implementation for testing purposes.
 * In production, this would integrate with the actual OpenAI API.
 */
export class OpenAITTSEngine implements TTSEngine {
  private readonly mockDelayMs = DEFAULT_MOCK_DELAY_MS;

  /**
   * Generate audio from text using the specified voice
   * @param text - The text to synthesize
   * @param voice - The voice to use for synthesis
   * @returns Promise<ArrayBuffer> - The generated audio data
   */
  async generate(text: string, voice: Voice): Promise<ArrayBuffer> {
    // Mock implementation - return empty buffer for testing
    // In production, this would call OpenAI's TTS API
    console.log(`[Mock TTS] Synthesizing "${text}" with voice "${voice.name}"`);

    // Simulate API delay
    await new Promise<void>((resolve: () => void): void => {
      setTimeout(resolve, this.mockDelayMs);
    });

    // Return mock audio buffer as ArrayBuffer
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode('mock-audio-data');
    const arrayBuffer = new ArrayBuffer(uint8Array.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(uint8Array);
    return arrayBuffer;
  }

  /**
   * Get available voices from OpenAI
   * @returns Promise<Voice[]> - Array of available voices
   */
  async getVoices(): Promise<Voice[]> {
    return DEFAULT_VOICE_CONFIGS.map(
      (config: VoiceConfig): Voice => this.createVoice(config)
    );
  }

  /**
   * Create a voice object from configuration
   * @param config - Voice configuration
   * @returns Voice - The created voice object
   */
  private createVoice(config: VoiceConfig): Voice {
    const now = new Date();
    return {
      id: config.id,
      name: config.name,
      language: 'en-US',
      gender: config.gender,
      age: config.age,
      provider: 'openai',
      providerId: config.id,
      isActive: true,
      isAvailable: true,
      isDefault: config.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Validate if a voice ID is available
   * @param voiceId - The voice ID to validate
   * @returns Promise<boolean> - True if the voice is available
   */
  async validateVoice(voiceId: string): Promise<boolean> {
    const availableVoices = await this.getVoices();
    return availableVoices.some(
      (voice: Voice): boolean => voice.id === voiceId
    );
  }
}
