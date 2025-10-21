import type { Voice, VoiceRepository } from '@falador/core-domain';

/**
 * In-memory implementation of VoiceRepository for testing and development
 */
export class InMemoryVoiceRepository implements VoiceRepository {
  private voices: Map<string, Voice> = new Map();

  constructor() {
    this.seedInitialData();
  }

  async findById(id: string): Promise<Voice | null> {
    return this.voices.get(id) || null;
  }

  async findAll(): Promise<Voice[]> {
    return Array.from(this.voices.values());
  }

  async findByProvider(provider: string): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(
      (voice) => voice.provider === provider
    );
  }

  async findAvailable(): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(
      (voice) => voice.isAvailable
    );
  }

  async save(voice: Voice): Promise<Voice> {
    const now = new Date();
    const updatedVoice: Voice = {
      ...voice,
      updatedAt: now,
    };

    this.voices.set(updatedVoice.id, updatedVoice);
    return updatedVoice;
  }

  async delete(id: string): Promise<boolean> {
    return this.voices.delete(id);
  }

  async update(id: string, updates: Partial<Voice>): Promise<Voice | null> {
    const existingVoice = this.voices.get(id);
    if (!existingVoice) {
      return null;
    }

    const updatedVoice: Voice = {
      ...existingVoice,
      ...updates,
      updatedAt: new Date(),
    };

    this.voices.set(id, updatedVoice);
    return updatedVoice;
  }

  async findByLanguage(language: string): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(
      (voice) => voice.language === language
    );
  }

  async findDefault(): Promise<Voice | null> {
    const defaultVoices = Array.from(this.voices.values()).filter(
      (voice) => voice.isDefault
    );
    return defaultVoices.length > 0 ? defaultVoices[0] : null;
  }

  /**
   * Seeds the repository with initial voice data
   */
  private seedInitialData(): void {
    this.createInitialVoices().forEach(voice => {
      this.voices.set(voice.id, voice);
    });
  }

  /**
   * Creates initial voice data for seeding the repository
   */
  private createInitialVoices(): Voice[] {
    const now = new Date();
    const voiceData = this.getInitialVoiceData();

    return voiceData.map((voice, index) => ({
      ...voice,
      id: `voice-${index + 1}`,
      createdAt: now,
      updatedAt: now,
    }));
  }

  /**
   * Returns the initial voice configuration data
   */
  private getInitialVoiceData(): Omit<Voice, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        name: 'Alice',
        language: 'en-US',
        gender: 'female',
        provider: 'openai',
        isAvailable: true,
        isDefault: true,
      },
      {
        name: 'Bob',
        language: 'en-US',
        gender: 'male',
        provider: 'openai',
        isAvailable: true,
        isDefault: false,
      },
      {
        name: 'Maria',
        language: 'es-ES',
        gender: 'female',
        provider: 'openai',
        isAvailable: true,
        isDefault: false,
      },
      {
        name: 'Pierre',
        language: 'fr-FR',
        gender: 'male',
        provider: 'openai',
        isAvailable: true,
        isDefault: false,
      },
      {
        name: 'Yuki',
        language: 'ja-JP',
        gender: 'female',
        provider: 'openai',
        isAvailable: false,
        isDefault: false,
      },
    ];
  }

  /**
   * Clears all voice data from the repository
   */
  clear(): void {
    this.voices.clear();
  }

  /**
   * Returns the number of voices in the repository
   */
  size(): number {
    return this.voices.size;
  }
}