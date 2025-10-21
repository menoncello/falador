import type { Voice, TTSEngine } from '@falador/core-domain';

/**
 * OpenAI TTS Engine implementation for text-to-speech conversion
 */
export class OpenAITTSEngine implements TTSEngine {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Converts text to speech using OpenAI's TTS API
   */
  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    // Mock implementation - in production, this would call OpenAI's API
    console.log(`Generating speech for text: "${text}" using voice: ${voiceId}`);

    // Return mock audio buffer as ArrayBuffer
    return new TextEncoder().encode('mock-audio-data').buffer;
  }

  /**
   * Returns available voices from OpenAI TTS service
   */
  async getVoices(): Promise<Voice[]> {
    return this.getOpenAIVoiceData().map(voice => ({
      ...voice,
      provider: 'openai',
      isActive: true,
    }));
  }

  /**
   * Returns OpenAI TTS voice configuration data
   */
  private getOpenAIVoiceData(): Omit<Voice, 'provider' | 'isActive'>[] {
    return [
      {
        id: 'alloy',
        name: 'Alloy',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        providerId: 'alloy',
      },
      {
        id: 'echo',
        name: 'Echo',
        language: 'en-US',
        gender: 'male',
        age: 'adult',
        providerId: 'echo',
      },
      {
        id: 'fable',
        name: 'Fable',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        providerId: 'fable',
      },
      {
        id: 'onyx',
        name: 'Onyx',
        language: 'en-US',
        gender: 'male',
        age: 'mature',
        providerId: 'onyx',
      },
      {
        id: 'nova',
        name: 'Nova',
        language: 'en-US',
        gender: 'female',
        age: 'adult',
        providerId: 'nova',
      },
      {
        id: 'shimmer',
        name: 'Shimmer',
        language: 'en-US',
        gender: 'female',
        age: 'young',
        providerId: 'shimmer',
      },
    ];
  }

  /**
   * Validates if a voice ID is supported by this TTS engine
   */
  async validateVoice(voiceId: string): Promise<boolean> {
    const availableVoices = await this.getVoices();
    return availableVoices.some((voice) => voice.id === voiceId);
  }
}