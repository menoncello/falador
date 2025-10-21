/**
 * Voice Repository Implementation
 * In-memory implementation for development/testing
 */

import type { Voice, VoiceRepository } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryVoiceRepository implements VoiceRepository {
  private voices: Map<string, Voice> = new Map();

  /**
   *
   */
  constructor() {
    // Initialize with some default voices for testing
    this.seedDefaultVoices();
  }

  /**
   *
   * @param voiceData
   */
  async create(voiceData: Omit<Voice, 'id'>): Promise<Voice> {
    const id = this.generateId();
    const voice: Voice = {
      id,
      ...voiceData,
    };

    this.voices.set(id, voice);
    return voice;
  }

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<Voice | null> {
    return this.voices.get(id) || null;
  }

  /**
   *
   */
  async findAll(): Promise<Voice[]> {
    return Array.from(this.voices.values());
  }

  /**
   *
   * @param language
   */
  async findByLanguage(language: string): Promise<Voice[]> {
    const languageVoices: Voice[] = [];
    for (const voice of this.voices.values()) {
      if (voice.language === language) {
        languageVoices.push(voice);
      }
    }
    return languageVoices;
  }

  /**
   *
   * @param id
   * @param updates
   */
  async update(id: string, updates: Partial<Voice>): Promise<Voice> {
    const existingVoice = this.voices.get(id);
    if (!existingVoice) {
      throw new Error(`Voice with id ${id} not found`);
    }

    const updatedVoice: Voice = {
      ...existingVoice,
      ...updates,
    };

    this.voices.set(id, updatedVoice);
    return updatedVoice;
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.voices.delete(id);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.voices.clear();
  }

  /**
   *
   */
  private seedDefaultVoices(): void {
    const defaultVoices: Array<Omit<Voice, 'id'>> = [
      {
        name: 'Ana',
        language: 'pt-BR',
        gender: 'female',
        provider: 'kokoro',
      },
      {
        name: 'Carlos',
        language: 'pt-BR',
        gender: 'male',
        provider: 'kokoro',
      },
      {
        name: 'Maria',
        language: 'pt-BR',
        gender: 'female',
        provider: 'kokoro',
      },
    ];

    for (const voiceData of defaultVoices) {
      const id = this.generateId();
      const voice: Voice = { id, ...voiceData };
      this.voices.set(id, voice);
    }
  }

  /**
   *
   */
  private generateId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
