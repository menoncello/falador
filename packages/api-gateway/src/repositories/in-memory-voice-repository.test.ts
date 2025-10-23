import { describe, it, expect, beforeEach } from 'bun:test';
import type { Voice } from '../../../core-domain/src/index';
import { InMemoryVoiceRepository } from './in-memory-voice-repository';

describe('InMemoryVoiceRepository', () => {
  let repository: InMemoryVoiceRepository;

  beforeEach(() => {
    repository = new InMemoryVoiceRepository();
  });

  describe('initialization', () => {
    it('should seed initial voice data on construction', async () => {
      const voices = await repository.findAll();

      expect(voices).toBeDefined();
      expect(voices.length).toBeGreaterThan(0);
      expect(voices.length).toBe(5); // Based on DEFAULT_VOICE_CONFIGS
    });

    it('should have default voice configured', async () => {
      const defaultVoice = await repository.findDefault();

      expect(defaultVoice).toBeDefined();
      expect(defaultVoice?.isDefault).toBe(true);
      expect(defaultVoice?.name).toBe('Alice');
    });
  });

  describe('findById', () => {
    it('should find voice by id', async () => {
      const voiceId = 'voice-1';

      const result = await repository.findById(voiceId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(voiceId);
      expect(result?.name).toBe('Alice');
    });

    it('should return null for non-existent voice', async () => {
      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should find voice with correct structure', async () => {
      const result = await repository.findById('voice-2');

      expect(result).toBeDefined();
      expect(result?.id).toBeDefined();
      expect(result?.name).toBeDefined();
      expect(result?.language).toBeDefined();
      expect(result?.gender).toBeDefined();
      expect(result?.age).toBeDefined();
      expect(result?.provider).toBeDefined();
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return all voices', async () => {
      const result = await repository.findAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it('should return voices with different attributes', async () => {
      const result = await repository.findAll();

      const names = result.map((v) => v.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
      expect(names).toContain('Maria');
      expect(names).toContain('Pierre');
      expect(names).toContain('Yuki');
    });
  });

  describe('findByProvider', () => {
    it('should find voices by provider', async () => {
      const result = await repository.findByProvider('openai');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5); // All seeded voices use 'openai'
      expect(result.every((v) => v.provider === 'openai')).toBe(true);
    });

    it('should return empty array for non-existent provider', async () => {
      const result = await repository.findByProvider('google');

      expect(result).toEqual([]);
    });

    it('should handle case-sensitive provider names', async () => {
      const result = await repository.findByProvider('OpenAI');

      expect(result).toEqual([]);
    });
  });

  describe('findAvailable', () => {
    it('should find only available voices', async () => {
      const result = await repository.findAvailable();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.every((v) => v.isAvailable === true)).toBe(true);
      expect(result.length).toBe(4); // Yuki is not available
    });

    it('should exclude unavailable voices', async () => {
      const result = await repository.findAvailable();

      const yukiIncluded = result.some((v) => v.name === 'Yuki');
      expect(yukiIncluded).toBe(false);
    });
  });

  describe('save', () => {
    it('should save new voice', async () => {
      const newVoice: Voice = {
        id: 'voice-new',
        name: 'NewVoice',
        language: 'de-DE',
        gender: 'male',
        age: 'adult',
        provider: 'openai',
        providerId: 'voice-new',
        isActive: true,
        isAvailable: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.save(newVoice);

      expect(result).toEqual(newVoice);
      expect(repository.size()).toBe(6);
    });

    it('should update existing voice when saving with same id', async () => {
      const existingVoice = await repository.findById('voice-1');
      expect(existingVoice).toBeDefined();

      const updatedVoice: Voice = {
        ...existingVoice!,
        name: 'UpdatedAlice',
      };

      await repository.save(updatedVoice);
      const result = await repository.findById('voice-1');

      expect(result?.name).toBe('UpdatedAlice');
      expect(repository.size()).toBe(5); // Size shouldn't change
    });
  });

  describe('delete', () => {
    it('should delete voice by id', async () => {
      const initialSize = repository.size();
      const result = await repository.delete('voice-1');

      expect(result).toBe(true);
      expect(repository.size()).toBe(initialSize - 1);
    });

    it('should return false for non-existent voice', async () => {
      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should verify voice is deleted', async () => {
      await repository.delete('voice-2');
      const result = await repository.findById('voice-2');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update voice', async () => {
      const voiceId = 'voice-1';
      const updates = { name: 'Alice Updated', age: 'mature' as const };

      const result = await repository.update(voiceId, updates);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Alice Updated');
      expect(result?.age).toBe('mature');
      expect(result?.id).toBe(voiceId);
    });

    it('should return null for non-existent voice', async () => {
      const result = await repository.update('non-existent', { name: 'Test' });

      expect(result).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const before = new Date();
      const result = await repository.update('voice-1', { name: 'Updated' });

      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
    });

    it('should preserve unmodified fields', async () => {
      const original = await repository.findById('voice-1');
      const result = await repository.update('voice-1', {
        name: 'Updated Name',
      });

      expect(result?.id).toBe(original?.id);
      expect(result?.language).toBe(original?.language);
      expect(result?.gender).toBe(original?.gender);
      expect(result?.provider).toBe(original?.provider);
    });
  });

  describe('findByLanguage', () => {
    it('should find voices by exact language match', async () => {
      const result = await repository.findByLanguage('en-US');

      expect(result).toBeDefined();
      expect(result.length).toBe(2); // Alice and Bob
      expect(result.every((v) => v.language === 'en-US')).toBe(true);
    });

    it('should find voices by partial language match', async () => {
      const result = await repository.findByLanguage('en');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((v) => v.language.includes('en'))).toBe(true);
    });

    it('should return empty array for non-matching language', async () => {
      const result = await repository.findByLanguage('pt-BR');

      expect(result).toEqual([]);
    });

    it('should handle case-sensitive language codes', async () => {
      const result = await repository.findByLanguage('EN-US');

      expect(result).toEqual([]);
    });
  });

  describe('findDefault', () => {
    it('should find default voice', async () => {
      const result = await repository.findDefault();

      expect(result).toBeDefined();
      expect(result?.isDefault).toBe(true);
      expect(result?.id).toBe('voice-1');
    });

    it('should return null when no default voice exists', async () => {
      // Remove default flag from all voices
      await repository.update('voice-1', { isDefault: false });

      const result = await repository.findDefault();

      expect(result).toBeNull();
    });

    it('should return first default voice when multiple exist', async () => {
      await repository.update('voice-2', { isDefault: true });

      const result = await repository.findDefault();

      expect(result).toBeDefined();
      expect(result?.isDefault).toBe(true);
      // Should return voice-1 as it's the first one
      expect(result?.id).toBe('voice-1');
    });
  });

  describe('clear', () => {
    it('should clear all voices', () => {
      repository.clear();

      expect(repository.size()).toBe(0);
    });

    it('should allow adding voices after clear', async () => {
      repository.clear();

      const newVoice: Voice = {
        id: 'voice-test',
        name: 'Test',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'test',
        providerId: 'test-1',
        isActive: true,
        isAvailable: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await repository.save(newVoice);

      expect(repository.size()).toBe(1);
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      const result = repository.size();

      expect(result).toBe(5);
    });

    it('should update size after operations', async () => {
      const initialSize = repository.size();

      await repository.delete('voice-1');
      expect(repository.size()).toBe(initialSize - 1);

      const newVoice: Voice = {
        id: 'voice-new',
        name: 'New',
        language: 'en-US',
        gender: 'neutral',
        age: 'adult',
        provider: 'test',
        providerId: 'test',
        isActive: true,
        isAvailable: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await repository.save(newVoice);
      expect(repository.size()).toBe(initialSize);
    });
  });
});
