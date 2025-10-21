/**
 * TTS Engine Implementation
 * Mock implementation for development/testing
 */

import type { TTSEngine, Voice } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class MockTTSEngine implements TTSEngine {
  private availableVoices: Voice[] = [];

  /**
   *
   */
  constructor() {
    this.initializeMockVoices();
  }

  /**
   *
   * @param text
   * @param voice
   */
  async generate(text: string, voice: Voice): Promise<ArrayBuffer> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create mock audio data (silence)
    const sampleRate = 22050;
    const duration = text.length * 0.1; // Rough estimation
    const numberOfSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(numberOfSamples * 2); // 16-bit audio
    const view = new Int16Array(buffer);

    // Generate simple sine wave for demonstration
    for (let i = 0; i < numberOfSamples; i++) {
      const frequency = 440; // A4 note
      const amplitude = 0.1 * 32767; // 10% of max amplitude
      view[i] = Math.floor(
        amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate)
      );
    }

    return buffer;
  }

  /**
   *
   */
  async getVoices(): Promise<Voice[]> {
    return [...this.availableVoices];
  }

  /**
   *
   * @param voiceId
   */
  async validateVoice(voiceId: string): Promise<boolean> {
    return this.availableVoices.some((voice) => voice.id === voiceId);
  }

  /**
   *
   */
  private initializeMockVoices(): void {
    this.availableVoices = [
      {
        id: 'voice-ana-female-pt-BR',
        name: 'Ana',
        language: 'pt-BR',
        gender: 'female',
        provider: 'mock-tts',
      },
      {
        id: 'voice-carlos-male-pt-BR',
        name: 'Carlos',
        language: 'pt-BR',
        gender: 'male',
        provider: 'mock-tts',
      },
      {
        id: 'voice-maria-female-pt-BR',
        name: 'Maria',
        language: 'pt-BR',
        gender: 'female',
        provider: 'mock-tts',
      },
      {
        id: 'voice-john-male-en-US',
        name: 'John',
        language: 'en-US',
        gender: 'male',
        provider: 'mock-tts',
      },
    ];
  }
}
