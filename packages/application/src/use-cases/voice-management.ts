/**
 * Voice Management Use Cases
 */

import type {
  Voice,
  VoiceRepository,
  TTSEngine,
  ValidationError,
} from '@falador/core-domain';
import { injectable, inject } from 'tsyringe';

/**
 *
 */
@injectable()
export class VoiceManagementUseCase {
  /**
   *
   * @param voiceRepository
   * @param ttsEngine
   */
  constructor(
    @inject('VoiceRepository') private voiceRepository: VoiceRepository,
    @inject('TTSEngine') private ttsEngine: TTSEngine
  ) {}

  /**
   *
   * @param language
   */
  async getAvailableVoices(language?: string): Promise<Voice[]> {
    if (language?.trim()) {
      return await this.voiceRepository.findByLanguage(language.trim());
    }

    return await this.voiceRepository.findAll();
  }

  /**
   *
   * @param voiceId
   */
  async getVoiceById(voiceId: string): Promise<Voice | null> {
    if (!voiceId?.trim()) {
      throw new ValidationError('Voice ID is required');
    }

    return await this.voiceRepository.findById(voiceId);
  }

  /**
   *
   * @param voiceId
   */
  async validateVoice(voiceId: string): Promise<boolean> {
    if (!voiceId?.trim()) {
      throw new ValidationError('Voice ID is required');
    }

    // Check if voice exists in database
    const voice = await this.voiceRepository.findById(voiceId);
    if (!voice) {
      return false;
    }

    // Check if voice is available in TTS engine
    return await this.ttsEngine.validateVoice(voiceId);
  }

  /**
   *
   */
  async syncVoicesFromProvider(): Promise<Voice[]> {
    // Get voices from TTS engine
    const providerVoices = await this.ttsEngine.getVoices();

    const syncedVoices: Voice[] = [];

    for (const providerVoice of providerVoices) {
      // Check if voice already exists
      const existingVoice = await this.voiceRepository.findById(
        providerVoice.id
      );

      if (existingVoice) {
        // Update existing voice
        const updatedVoice = await this.voiceRepository.update(
          providerVoice.id,
          {
            name: providerVoice.name,
            language: providerVoice.language,
            gender: providerVoice.gender,
            provider: providerVoice.provider,
            isDefault: providerVoice.isDefault,
          }
        );
        syncedVoices.push(updatedVoice);
      } else {
        // Create new voice
        const newVoice = await this.voiceRepository.create({
          id: providerVoice.id,
          name: providerVoice.name,
          language: providerVoice.language,
          gender: providerVoice.gender,
          provider: providerVoice.provider,
          isDefault: providerVoice.isDefault,
        });
        syncedVoices.push(newVoice);
      }
    }

    return syncedVoices;
  }

  /**
   *
   * @param language
   */
  async getDefaultVoice(language?: string): Promise<Voice | null> {
    const voices = await this.getAvailableVoices(language);
    return voices.find((voice) => voice.isDefault) || voices[0] || null;
  }
}
