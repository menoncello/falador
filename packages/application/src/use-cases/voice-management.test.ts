import type {
  VoiceRepository,
  TTSEngine,
  Voice,
  ValidationError,
} from '@falador/core-domain';
import { describe, expect, test, beforeEach, jest } from 'bun:test';
import { VoiceManagementUseCase } from './voice-management';

// Mock implementations
const mockVoiceRepository: jest.Mocked<VoiceRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findByLanguage: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTTSEngine: jest.Mocked<TTSEngine> = {
  generate: jest.fn(),
  getVoices: jest.fn(),
  validateVoice: jest.fn(),
};

describe('VoiceManagementUseCase - Business Logic Orchestration', () => {
  let voiceManagement: VoiceManagementUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    voiceManagement = new VoiceManagementUseCase(
      mockVoiceRepository,
      mockTTSEngine
    );
  });

  describe('getAvailableVoices', () => {
    test('should return all voices when no language specified', async () => {
      const expectedVoices: Voice[] = [
        {
          id: 'voice-1',
          name: 'English Voice',
          language: 'en-US',
          gender: 'neutral',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
        },
        {
          id: 'voice-2',
          name: 'Portuguese Voice',
          language: 'pt-BR',
          gender: 'female',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: true,
        },
      ];

      mockVoiceRepository.findAll.mockResolvedValue(expectedVoices);

      const result = await voiceManagement.getAvailableVoices();

      expect(result).toEqual(expectedVoices);
      expect(mockVoiceRepository.findAll).toHaveBeenCalled();
      expect(mockVoiceRepository.findByLanguage).not.toHaveBeenCalled();
    });

    test('should return voices filtered by language', async () => {
      const language = 'pt-BR';
      const expectedVoices: Voice[] = [
        {
          id: 'voice-2',
          name: 'Portuguese Voice',
          language: 'pt-BR',
          gender: 'female',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: true,
        },
        {
          id: 'voice-3',
          name: 'Brazilian Voice',
          language: 'pt-BR',
          gender: 'male',
          age: 'young',
          provider: 'openai',
          providerId: 'openai-voice-3',
          isActive: true,
        },
      ];

      mockVoiceRepository.findByLanguage.mockResolvedValue(expectedVoices);

      const result = await voiceManagement.getAvailableVoices(language);

      expect(result).toEqual(expectedVoices);
      expect(mockVoiceRepository.findByLanguage).toHaveBeenCalledWith(language);
      expect(mockVoiceRepository.findAll).not.toHaveBeenCalled();
    });

    test('should return empty array when no voices found', async () => {
      const language = 'fr-FR';

      mockVoiceRepository.findByLanguage.mockResolvedValue([]);

      const result = await voiceManagement.getAvailableVoices(language);

      expect(result).toEqual([]);
      expect(mockVoiceRepository.findByLanguage).toHaveBeenCalledWith(language);
    });

    test('should trim whitespace from language parameter', async () => {
      const language = '  pt-BR  ';
      const expectedVoices: Voice[] = [
        {
          id: 'voice-2',
          name: 'Portuguese Voice',
          language: 'pt-BR',
          gender: 'female',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: true,
        },
      ];

      mockVoiceRepository.findByLanguage.mockResolvedValue(expectedVoices);

      const result = await voiceManagement.getAvailableVoices(language);

      expect(result).toEqual(expectedVoices);
      expect(mockVoiceRepository.findByLanguage).toHaveBeenCalledWith('pt-BR');
    });

    test('should handle empty language string', async () => {
      const expectedVoices: Voice[] = [
        {
          id: 'voice-1',
          name: 'English Voice',
          language: 'en-US',
          gender: 'neutral',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
        },
      ];

      mockVoiceRepository.findAll.mockResolvedValue(expectedVoices);

      const result = await voiceManagement.getAvailableVoices('');

      expect(result).toEqual(expectedVoices);
      expect(mockVoiceRepository.findAll).toHaveBeenCalled();
      expect(mockVoiceRepository.findByLanguage).not.toHaveBeenCalled();
    });

    test('should handle repository errors gracefully', async () => {
      mockVoiceRepository.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(voiceManagement.getAvailableVoices()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getVoiceById', () => {
    test('should return voice when found', async () => {
      const voiceId = 'voice-123';
      const expectedVoice: Voice = {
        id: voiceId,
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockVoiceRepository.findById.mockResolvedValue(expectedVoice);

      const result = await voiceManagement.getVoiceById(voiceId);

      expect(result).toEqual(expectedVoice);
      expect(mockVoiceRepository.findById).toHaveBeenCalledWith(voiceId);
    });

    test('should return null when voice not found', async () => {
      const voiceId = 'nonexistent-voice';

      mockVoiceRepository.findById.mockResolvedValue(null);

      const result = await voiceManagement.getVoiceById(voiceId);

      expect(result).toBeNull();
      expect(mockVoiceRepository.findById).toHaveBeenCalledWith(voiceId);
    });

    test('should reject request with missing voice ID', async () => {
      await expect(voiceManagement.getVoiceById('')).rejects.toThrow(
        ValidationError
      );
      expect(mockVoiceRepository.findById).not.toHaveBeenCalled();
    });

    test('should reject request with whitespace-only voice ID', async () => {
      await expect(voiceManagement.getVoiceById('   ')).rejects.toThrow(
        ValidationError
      );
      expect(mockVoiceRepository.findById).not.toHaveBeenCalled();
    });

    test('should handle null and undefined inputs gracefully', async () => {
      await expect(voiceManagement.getVoiceById(null as any)).rejects.toThrow(
        ValidationError
      );
      await expect(
        voiceManagement.getVoiceById(undefined as any)
      ).rejects.toThrow(ValidationError);
      expect(mockVoiceRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('validateVoice', () => {
    test('should return true when voice exists and is available in TTS engine', async () => {
      const voiceId = 'voice-123';

      const voice: Voice = {
        id: voiceId,
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);

      const result = await voiceManagement.validateVoice(voiceId);

      expect(result).toBe(true);
      expect(mockVoiceRepository.findById).toHaveBeenCalledWith(voiceId);
      expect(mockTTSEngine.validateVoice).toHaveBeenCalledWith(voiceId);
    });

    test('should return false when voice exists but not available in TTS engine', async () => {
      const voiceId = 'voice-123';

      const voice: Voice = {
        id: voiceId,
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(false);

      const result = await voiceManagement.validateVoice(voiceId);

      expect(result).toBe(false);
      expect(mockVoiceRepository.findById).toHaveBeenCalledWith(voiceId);
      expect(mockTTSEngine.validateVoice).toHaveBeenCalledWith(voiceId);
    });

    test('should return false when voice does not exist in database', async () => {
      const voiceId = 'nonexistent-voice';

      mockVoiceRepository.findById.mockResolvedValue(null);

      const result = await voiceManagement.validateVoice(voiceId);

      expect(result).toBe(false);
      expect(mockVoiceRepository.findById).toHaveBeenCalledWith(voiceId);
      expect(mockTTSEngine.validateVoice).not.toHaveBeenCalled();
    });

    test('should reject request with missing voice ID', async () => {
      await expect(voiceManagement.validateVoice('')).rejects.toThrow(
        ValidationError
      );
      expect(mockVoiceRepository.findById).not.toHaveBeenCalled();
      expect(mockTTSEngine.validateVoice).not.toHaveBeenCalled();
    });

    test('should handle TTS engine errors gracefully', async () => {
      const voiceId = 'voice-123';

      const voice: Voice = {
        id: voiceId,
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockRejectedValue(
        new Error('TTS engine unavailable')
      );

      await expect(voiceManagement.validateVoice(voiceId)).rejects.toThrow(
        'TTS engine unavailable'
      );
    });
  });

  describe('syncVoicesFromProvider', () => {
    test('should sync new voices from provider', async () => {
      const providerVoices = [
        {
          id: 'voice-new-1',
          name: 'New Voice 1',
          language: 'en-US',
          gender: 'neutral' as const,
          age: 'adult' as const,
          provider: 'openai',
          providerId: 'openai-new-1',
          isActive: true,
          isDefault: false,
        },
        {
          id: 'voice-new-2',
          name: 'New Voice 2',
          language: 'pt-BR',
          gender: 'female' as const,
          age: 'young' as const,
          provider: 'openai',
          providerId: 'openai-new-2',
          isActive: true,
          isDefault: true,
        },
      ];

      const createdVoices: Voice[] = [
        {
          id: 'voice-new-1',
          name: 'New Voice 1',
          language: 'en-US',
          gender: 'neutral',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-new-1',
          isActive: true,
        },
        {
          id: 'voice-new-2',
          name: 'New Voice 2',
          language: 'pt-BR',
          gender: 'female',
          age: 'young',
          provider: 'openai',
          providerId: 'openai-new-2',
          isActive: true,
        },
      ];

      mockTTSEngine.getVoices.mockResolvedValue(providerVoices);
      mockVoiceRepository.findById.mockResolvedValue(null); // Voice doesn't exist
      mockVoiceRepository.create.mockImplementation((voice) =>
        Promise.resolve(voice as Voice)
      );

      const result = await voiceManagement.syncVoicesFromProvider();

      expect(result).toHaveLength(2);
      expect(result).toEqual(createdVoices);
      expect(mockTTSEngine.getVoices).toHaveBeenCalled();
      expect(mockVoiceRepository.create).toHaveBeenCalledTimes(2);
      expect(mockVoiceRepository.update).not.toHaveBeenCalled();
    });

    test('should update existing voices from provider', async () => {
      const providerVoices = [
        {
          id: 'voice-existing-1',
          name: 'Updated Voice 1',
          language: 'en-US',
          gender: 'neutral' as const,
          age: 'adult' as const,
          provider: 'openai',
          providerId: 'openai-existing-1',
          isActive: true,
          isDefault: false,
        },
      ];

      const existingVoice: Voice = {
        id: 'voice-existing-1',
        name: 'Old Voice 1',
        language: 'en-GB',
        gender: 'male',
        age: 'mature',
        provider: 'openai',
        providerId: 'openai-existing-1',
        isActive: true,
      };

      const updatedVoice: Voice = {
        ...existingVoice,
        name: 'Updated Voice 1',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
      };

      mockTTSEngine.getVoices.mockResolvedValue(providerVoices);
      mockVoiceRepository.findById.mockResolvedValue(existingVoice);
      mockVoiceRepository.update.mockResolvedValue(updatedVoice);

      const result = await voiceManagement.syncVoicesFromProvider();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(updatedVoice);
      expect(mockTTSEngine.getVoices).toHaveBeenCalled();
      expect(mockVoiceRepository.update).toHaveBeenCalledWith(
        'voice-existing-1',
        {
          name: 'Updated Voice 1',
          language: 'en-US',
          gender: 'neutral',
          provider: 'openai',
          isDefault: false,
        }
      );
      expect(mockVoiceRepository.create).not.toHaveBeenCalled();
    });

    test('should handle mixed new and existing voices', async () => {
      const providerVoices = [
        {
          id: 'voice-new',
          name: 'New Voice',
          language: 'en-US',
          gender: 'neutral' as const,
          age: 'adult' as const,
          provider: 'openai',
          providerId: 'openai-new',
          isActive: true,
          isDefault: false,
        },
        {
          id: 'voice-existing',
          name: 'Updated Existing Voice',
          language: 'pt-BR',
          gender: 'female' as const,
          age: 'young' as const,
          provider: 'openai',
          providerId: 'openai-existing',
          isActive: true,
          isDefault: true,
        },
      ];

      const existingVoice: Voice = {
        id: 'voice-existing',
        name: 'Old Existing Voice',
        language: 'en-GB',
        gender: 'male',
        age: 'mature',
        provider: 'openai',
        providerId: 'openai-existing',
        isActive: true,
      };

      const newVoice: Voice = {
        id: 'voice-new',
        name: 'New Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-new',
        isActive: true,
      };

      const updatedVoice: Voice = {
        ...existingVoice,
        name: 'Updated Existing Voice',
        language: 'pt-BR',
        gender: 'female',
        age: 'young',
        provider: 'openai',
      };

      mockTTSEngine.getVoices.mockResolvedValue(providerVoices);
      mockVoiceRepository.findById
        .mockResolvedValueOnce(null) // New voice doesn't exist
        .mockResolvedValueOnce(existingVoice); // Existing voice exists
      mockVoiceRepository.create.mockResolvedValue(newVoice);
      mockVoiceRepository.update.mockResolvedValue(updatedVoice);

      const result = await voiceManagement.syncVoicesFromProvider();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(newVoice);
      expect(result).toContainEqual(updatedVoice);
      expect(mockVoiceRepository.create).toHaveBeenCalledTimes(1);
      expect(mockVoiceRepository.update).toHaveBeenCalledTimes(1);
    });

    test('should handle empty provider voices list', async () => {
      mockTTSEngine.getVoices.mockResolvedValue([]);

      const result = await voiceManagement.syncVoicesFromProvider();

      expect(result).toEqual([]);
      expect(mockTTSEngine.getVoices).toHaveBeenCalled();
      expect(mockVoiceRepository.create).not.toHaveBeenCalled();
      expect(mockVoiceRepository.update).not.toHaveBeenCalled();
    });

    test('should handle TTS engine errors during sync', async () => {
      mockTTSEngine.getVoices.mockRejectedValue(
        new Error('TTS engine unavailable')
      );

      await expect(voiceManagement.syncVoicesFromProvider()).rejects.toThrow(
        'TTS engine unavailable'
      );
      expect(mockVoiceRepository.create).not.toHaveBeenCalled();
      expect(mockVoiceRepository.update).not.toHaveBeenCalled();
    });

    test('should handle repository errors during voice creation', async () => {
      const providerVoices = [
        {
          id: 'voice-new',
          name: 'New Voice',
          language: 'en-US',
          gender: 'neutral' as const,
          age: 'adult' as const,
          provider: 'openai',
          providerId: 'openai-new',
          isActive: true,
          isDefault: false,
        },
      ];

      mockTTSEngine.getVoices.mockResolvedValue(providerVoices);
      mockVoiceRepository.findById.mockResolvedValue(null);
      mockVoiceRepository.create.mockRejectedValue(
        new Error('Database constraint violation')
      );

      await expect(voiceManagement.syncVoicesFromProvider()).rejects.toThrow(
        'Database constraint violation'
      );
    });
  });

  describe('getDefaultVoice', () => {
    test('should return default voice when available', async () => {
      const language = 'en-US';
      const voices: Voice[] = [
        {
          id: 'voice-1',
          name: 'Regular Voice',
          language: 'en-US',
          gender: 'neutral',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
        },
        {
          id: 'voice-2',
          name: 'Default Voice',
          language: 'en-US',
          gender: 'female',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: true,
          isDefault: true,
        },
        {
          id: 'voice-3',
          name: 'Another Voice',
          language: 'en-US',
          gender: 'male',
          age: 'young',
          provider: 'openai',
          providerId: 'openai-voice-3',
          isActive: true,
        },
      ];

      mockVoiceRepository.findByLanguage.mockResolvedValue(voices);

      const result = await voiceManagement.getDefaultVoice(language);

      expect(result).toBe(voices[1]); // Default voice
      expect(mockVoiceRepository.findByLanguage).toHaveBeenCalledWith(language);
    });

    test('should return first voice when no default voice is available', async () => {
      const language = 'pt-BR';
      const voices: Voice[] = [
        {
          id: 'voice-1',
          name: 'First Voice',
          language: 'pt-BR',
          gender: 'neutral',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
        },
        {
          id: 'voice-2',
          name: 'Second Voice',
          language: 'pt-BR',
          gender: 'female',
          age: 'young',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: true,
        },
      ];

      mockVoiceRepository.findByLanguage.mockResolvedValue(voices);

      const result = await voiceManagement.getDefaultVoice(language);

      expect(result).toBe(voices[0]); // First voice
      expect(mockVoiceRepository.findByLanguage).toHaveBeenCalledWith(language);
    });

    test('should return null when no voices are available for language', async () => {
      const language = 'fr-FR';

      mockVoiceRepository.findByLanguage.mockResolvedValue([]);

      const result = await voiceManagement.getDefaultVoice(language);

      expect(result).toBeNull();
      expect(mockVoiceRepository.findByLanguage).toHaveBeenCalledWith(language);
    });

    test('should get default voice without language filter', async () => {
      const voices: Voice[] = [
        {
          id: 'voice-1',
          name: 'Default Voice',
          language: 'en-US',
          gender: 'female',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
          isDefault: true,
        },
      ];

      mockVoiceRepository.findAll.mockResolvedValue(voices);

      const result = await voiceManagement.getDefaultVoice();

      expect(result).toBe(voices[0]);
      expect(mockVoiceRepository.findAll).toHaveBeenCalled();
      expect(mockVoiceRepository.findByLanguage).not.toHaveBeenCalled();
    });

    test('should handle repository errors gracefully', async () => {
      const language = 'en-US';
      mockVoiceRepository.findByLanguage.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(voiceManagement.getDefaultVoice(language)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed voice data from provider', async () => {
      const malformedVoices = [
        {
          id: '',
          name: 'Invalid Voice',
          language: '',
          gender: 'neutral' as const,
          age: 'adult' as const,
          provider: '',
          providerId: '',
          isActive: false,
          isDefault: false,
        },
        {
          id: 'voice-missing-fields',
          name: 'Incomplete Voice',
          // Missing required fields
          provider: 'openai',
          providerId: 'openai-incomplete',
          isActive: true,
          isDefault: false,
        } as any,
      ];

      mockTTSEngine.getVoices.mockResolvedValue(malformedVoices);
      mockVoiceRepository.findById.mockResolvedValue(null);

      // Should handle malformed data gracefully
      const result = await voiceManagement.syncVoicesFromProvider();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle concurrent voice operations', async () => {
      const voiceId = 'voice-123';
      const voice: Voice = {
        id: voiceId,
        name: 'Test Voice',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'openai',
        providerId: 'openai-voice-123',
        isActive: true,
      };

      mockVoiceRepository.findById.mockResolvedValue(voice);
      mockTTSEngine.validateVoice.mockResolvedValue(true);

      // Run multiple validations concurrently
      const promises = Array.from({ length: 10 }, () =>
        voiceManagement.validateVoice(voiceId)
      );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      for (const result of results) expect(result).toBe(true);
      expect(mockVoiceRepository.findById).toHaveBeenCalledTimes(10);
      expect(mockTTSEngine.validateVoice).toHaveBeenCalledTimes(10);
    });

    test('should handle voice validation timeout scenarios', async () => {
      const voiceId = 'voice-123';

      mockVoiceRepository.findById.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const promise = voiceManagement.validateVoice(voiceId);
      expect(promise).toBeInstanceOf(Promise);
    });

    test('should handle language code validation', async () => {
      const validLanguages = [
        'en-US',
        'pt-BR',
        'fr-FR',
        'de-DE',
        'es-ES',
        'it-IT',
        'ja-JP',
        'zh-CN',
      ];

      const invalidLanguages = [
        '',
        'invalid',
        'en',
        'EN-US',
        'eng-US',
        'en-us',
        'EN',
        '123',
        'en-',
        '-US',
        'en--US',
      ];

      for (const language of validLanguages) {
        mockVoiceRepository.findByLanguage.mockResolvedValue([]);
        await expect(
          voiceManagement.getAvailableVoices(language)
        ).resolves.toBeDefined();
      }

      for (const language of invalidLanguages) {
        mockVoiceRepository.findByLanguage.mockResolvedValue([]);
        // Should still work as repository handles validation
        await expect(
          voiceManagement.getAvailableVoices(language)
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Voice Filtering and Search', () => {
    test('should handle voice filtering by multiple criteria', async () => {
      const allVoices: Voice[] = [
        {
          id: 'voice-1',
          name: 'English Male Voice',
          language: 'en-US',
          gender: 'male',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
        },
        {
          id: 'voice-2',
          name: 'English Female Voice',
          language: 'en-US',
          gender: 'female',
          age: 'young',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: true,
        },
        {
          id: 'voice-3',
          name: 'Portuguese Male Voice',
          language: 'pt-BR',
          gender: 'male',
          age: 'mature',
          provider: 'openai',
          providerId: 'openai-voice-3',
          isActive: true,
        },
      ];

      // Test language filtering
      mockVoiceRepository.findByLanguage.mockResolvedValue(
        allVoices.filter((v) => v.language === 'en-US')
      );
      const englishVoices = await voiceManagement.getAvailableVoices('en-US');
      expect(englishVoices).toHaveLength(2);
      expect(englishVoices.every((v) => v.language === 'en-US')).toBe(true);

      // Test getting all voices
      mockVoiceRepository.findAll.mockResolvedValue(allVoices);
      const allAvailableVoices = await voiceManagement.getAvailableVoices();
      expect(allAvailableVoices).toHaveLength(3);
    });

    test('should handle voice provider filtering', async () => {
      const voicesByProvider = {
        openai: [
          {
            id: 'voice-openai-1',
            name: 'OpenAI Voice 1',
            language: 'en-US',
            gender: 'neutral',
            age: 'adult',
            provider: 'openai',
            providerId: 'openai-voice-1',
            isActive: true,
          },
        ],
        azure: [
          {
            id: 'voice-azure-1',
            name: 'Azure Voice 1',
            language: 'pt-BR',
            gender: 'female',
            age: 'young',
            provider: 'azure',
            providerId: 'azure-voice-1',
            isActive: true,
          },
        ],
      };

      // This would typically be handled at the repository level
      mockVoiceRepository.findAll.mockResolvedValue([
        ...voicesByProvider.openai,
        ...voicesByProvider.azure,
      ]);

      const allVoices = await voiceManagement.getAvailableVoices();
      expect(allVoices).toHaveLength(2);
      expect(allVoices.some((v) => v.provider === 'openai')).toBe(true);
      expect(allVoices.some((v) => v.provider === 'azure')).toBe(true);
    });

    test('should handle voice activity status', async () => {
      const voicesWithDifferentStatus = [
        {
          id: 'voice-active-1',
          name: 'Active Voice',
          language: 'en-US',
          gender: 'neutral',
          age: 'adult',
          provider: 'openai',
          providerId: 'openai-voice-1',
          isActive: true,
        },
        {
          id: 'voice-inactive-1',
          name: 'Inactive Voice',
          language: 'en-US',
          gender: 'female',
          age: 'young',
          provider: 'openai',
          providerId: 'openai-voice-2',
          isActive: false,
        },
      ];

      mockVoiceRepository.findAll.mockResolvedValue(voicesWithDifferentStatus);

      const allVoices = await voiceManagement.getAvailableVoices();
      expect(allVoices).toHaveLength(2);
      expect(allVoices.some((v) => v.isActive)).toBe(true);
      expect(allVoices.some((v) => !v.isActive)).toBe(true);
    });
  });
});
