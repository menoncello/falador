import { injectable } from 'tsyringe';
import type { Voice, VoiceRepository } from '../../../core-domain/src/index.js';

/**
 * Configuration interface for creating voices
 */
interface VoiceConfig {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'mature';
  isDefault?: boolean;
  isAvailable?: boolean;
}

/**
 * Default voice configurations for seeding the repository
 */
const DEFAULT_VOICE_CONFIGS: VoiceConfig[] = [
  {
    id: 'voice-1',
    name: 'Alice',
    language: 'en-US',
    gender: 'female',
    age: 'adult',
    isDefault: true,
  },
  {
    id: 'voice-2',
    name: 'Bob',
    language: 'en-US',
    gender: 'male',
    age: 'adult',
  },
  {
    id: 'voice-3',
    name: 'Maria',
    language: 'es-ES',
    gender: 'female',
    age: 'adult',
  },
  {
    id: 'voice-4',
    name: 'Pierre',
    language: 'fr-FR',
    gender: 'male',
    age: 'adult',
  },
  {
    id: 'voice-5',
    name: 'Yuki',
    language: 'ja-JP',
    gender: 'female',
    age: 'young',
    isAvailable: false,
  },
];

/**
 * In-Memory Voice Repository Implementation
 *
 * This is a temporary implementation for development and testing.
 * In production, this would be replaced with a database implementation.
 */
@injectable()
export class InMemoryVoiceRepository implements VoiceRepository {
  private readonly voices: Map<string, Voice> = new Map();

  /**
   * Initialize the repository with default voice data
   */
  constructor() {
    this.seedInitialData();
  }

  /**
   * Find a voice by its ID
   * @param id - The voice ID to search for
   * @returns Promise<Voice | null> - The voice if found, null otherwise
   */
  async findById(id: string): Promise<Voice | null> {
    return this.voices.get(id) ?? null;
  }

  /**
   * Get all voices in the repository
   * @returns Promise<Voice[]> - Array of all voices
   */
  async findAll(): Promise<Voice[]> {
    return Array.from(this.voices.values());
  }

  /**
   * Find voices by provider
   * @param provider - The provider name to filter by
   * @returns Promise<Voice[]> - Array of voices from the specified provider
   */
  async findByProvider(provider: string): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(
      (voice: Voice): boolean => voice.provider === provider
    );
  }

  /**
   * Find all available voices
   * @returns Promise<Voice[]> - Array of available voices
   */
  async findAvailable(): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(
      (voice: Voice): boolean => voice.isAvailable
    );
  }

  /**
   * Save a voice to the repository
   * @param voice - The voice to save
   * @returns Promise<Voice> - The saved voice
   */
  async save(voice: Voice): Promise<Voice> {
    this.voices.set(voice.id, voice);
    return voice;
  }

  /**
   * Delete a voice by its ID
   * @param id - The voice ID to delete
   * @returns Promise<boolean> - True if the voice was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    return this.voices.delete(id);
  }

  /**
   * Update a voice with partial data
   * @param id - The voice ID to update
   * @param updates - Partial voice data to merge
   * @returns Promise<Voice | null> - The updated voice if found, null otherwise
   */
  async update(id: string, updates: Partial<Voice>): Promise<Voice | null> {
    const voice = this.voices.get(id);
    if (!voice) {
      return null;
    }

    const updatedVoice: Voice = {
      ...voice,
      ...updates,
      updatedAt: new Date(),
    };

    this.voices.set(id, updatedVoice);
    return updatedVoice;
  }

  /**
   * Find voices by language (exact match or partial match)
   * @param language - The language code to search for
   * @returns Promise<Voice[]> - Array of voices matching the language
   */
  async findByLanguage(language: string): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter(
      (voice: Voice): boolean =>
        voice.language === language || voice.language.includes(language)
    );
  }

  /**
   * Find the default voice
   * @returns Promise<Voice | null> - The default voice if found, null otherwise
   */
  async findDefault(): Promise<Voice | null> {
    const defaultVoices = Array.from(this.voices.values()).filter(
      (voice: Voice): boolean => voice.isDefault
    );

    return defaultVoices.length > 0 ? (defaultVoices[0] ?? null) : null;
  }

  /**
   * Seed the repository with initial voice data
   */
  private seedInitialData(): void {
    const voices = DEFAULT_VOICE_CONFIGS.map(
      (config: VoiceConfig): Voice => this.createVoiceFromConfig(config)
    );

    for (const voice of voices) {
      this.voices.set(voice.id, voice);
    }
  }

  /**
   * Create a voice object from configuration
   * @param config - Voice configuration
   * @returns Voice - Created voice object
   */
  private createVoiceFromConfig(config: VoiceConfig): Voice {
    const now = new Date();
    return {
      id: config.id,
      name: config.name,
      language: config.language,
      gender: config.gender,
      age: config.age,
      provider: 'openai',
      providerId: config.id,
      isActive: true,
      isAvailable: config.isAvailable ?? true,
      isDefault: config.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.voices.clear();
  }

  /**
   * Get current data size
   * @returns number - Number of voices in the repository
   */
  size(): number {
    return this.voices.size;
  }
}
