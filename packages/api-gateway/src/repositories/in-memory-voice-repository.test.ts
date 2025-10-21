import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryVoiceRepository } from './in-memory-voice-repository';
import type { Voice } from '@falador/core-domain';

describe('InMemoryVoiceRepository', () => {
  let repository: InMemoryVoiceRepository;

  beforeEach(() => {
    repository = new InMemoryVoiceRepository();
  });

  describe('Basic CRUD Operations', () => {
    it('should create a repository with initial data', () => {
      const voices = repository.findAll();
      expect(voices).toHaveLength(5); // Initial seed data
    });

    it('should find a voice by ID', async () => {
      const voices = await repository.findAll();
      const firstVoice = voices[0];

      const found = await repository.findById(firstVoice.id);
      expect(found).toEqual(firstVoice);
    });

    it('should return null when voice not found', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should find all voices', async () => {
      const voices = await repository.findAll();
      expect(voices).toHaveLength(5);

      // Verify structure of initial voices
      voices.forEach(voice => {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('language');
        expect(voice).toHaveProperty('gender');
        expect(voice).toHaveProperty('provider');
        expect(voice).toHaveProperty('isAvailable');
        expect(voice).toHaveProperty('isDefault');
        expect(voice).toHaveProperty('createdAt');
        expect(voice).toHaveProperty('updatedAt');
      });
    });

    it('should save a new voice', async () => {
      const newVoice: Voice = {
        id: 'custom-voice-1',
        name: 'Custom Voice',
        language: 'en-GB',
        gender: 'male',
        provider: 'custom',
        isAvailable: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const saved = await repository.save(newVoice);
      expect(saved).toEqual(newVoice);

      const found = await repository.findById(newVoice.id);
      expect(found).toEqual(newVoice);
    });

    it('should update an existing voice', async () => {
      const voices = await repository.findAll();
      const voiceToUpdate = voices[0];

      const updates = {
        name: 'Updated Name',
        isAvailable: false,
      };

      const updated = await repository.update(voiceToUpdate.id, updates);

      expect(updated).not.toBeNull();
      expect(updated!.id).toBe(voiceToUpdate.id);
      expect(updated!.name).toBe(updates.name);
      expect(updated!.isAvailable).toBe(updates.isAvailable);
      expect(updated!.updatedAt).not.toEqual(voiceToUpdate.updatedAt);
    });

    it('should return null when updating non-existent voice', async () => {
      const updated = await repository.update('non-existent-id', { name: 'Test' });
      expect(updated).toBeNull();
    });

    it('should delete a voice', async () => {
      const voices = await repository.findAll();
      const voiceToDelete = voices[0];

      const deleted = await repository.delete(voiceToDelete.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(voiceToDelete.id);
      expect(found).toBeNull();

      const remainingVoices = await repository.findAll();
      expect(remainingVoices).toHaveLength(4);
    });

    it('should return false when deleting non-existent voice', async () => {
      const deleted = await repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Query Methods', () => {
    it('should find voices by provider', async () => {
      const openaiVoices = await repository.findByProvider('openai');
      expect(openaiVoices).toHaveLength(5);

      openaiVoices.forEach(voice => {
        expect(voice.provider).toBe('openai');
      });

      const customVoices = await repository.findByProvider('non-existent');
      expect(customVoices).toHaveLength(0);
    });

    it('should find available voices', async () => {
      const availableVoices = await repository.findAvailable();
      expect(availableVoices.length).toBeGreaterThan(0);

      availableVoices.forEach(voice => {
        expect(voice.isAvailable).toBe(true);
      });

      // Mark one voice as unavailable
      const voices = await repository.findAll();
      const voiceToUpdate = voices[0];
      await repository.update(voiceToUpdate.id, { isAvailable: false });

      const updatedAvailable = await repository.findAvailable();
      expect(updatedAvailable.length).toBe(availableVoices.length - 1);
    });

    it('should find voices by language', async () => {
      const englishVoices = await repository.findByLanguage('en-US');
      expect(englishVoices.length).toBeGreaterThan(0);

      englishVoices.forEach(voice => {
        expect(voice.language).toBe('en-US');
      });

      const spanishVoices = await repository.findByLanguage('es-ES');
      expect(spanishVoices.length).toBe(1);
      expect(spanishVoices[0].name).toBe('Maria');
    });

    it('should find default voice', async () => {
      const defaultVoice = await repository.findDefault();
      expect(defaultVoice).not.toBeNull();
      expect(defaultVoice!.isDefault).toBe(true);
      expect(defaultVoice!.name).toBe('Alice');
    });

    it('should return null when no default voice exists', async () => {
      // Remove default flag from all voices
      const voices = await repository.findAll();
      for (const voice of voices) {
        await repository.update(voice.id, { isDefault: false });
      }

      const defaultVoice = await repository.findDefault();
      expect(defaultVoice).toBeNull();
    });
  });

  describe('Data Management', () => {
    it('should clear all data', () => {
      repository.clear();

      const voices = repository.findAll();
      expect(voices).toHaveLength(0);
    });

    it('should report correct size', () => {
      expect(repository.size()).toBe(5);

      repository.clear();
      expect(repository.size()).toBe(0);
    });

    it('should handle multiple operations correctly', async () => {
      // Add multiple voices
      const newVoices: Voice[] = [
        {
          id: 'voice-6',
          name: 'Test Voice 6',
          language: 'de-DE',
          gender: 'female',
          provider: 'test',
          isAvailable: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'voice-7',
          name: 'Test Voice 7',
          language: 'it-IT',
          gender: 'male',
          provider: 'test',
          isAvailable: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const voice of newVoices) {
        await repository.save(voice);
      }

      expect(repository.size()).toBe(7);

      // Verify all voices are findable
      for (const voice of newVoices) {
        const found = await repository.findById(voice.id);
        expect(found).toEqual(voice);
      }

      // Update voices
      await repository.update('voice-6', { isAvailable: false });
      const updated = await repository.findById('voice-6');
      expect(updated!.isAvailable).toBe(false);

      // Delete some voices
      await repository.delete('voice-7');
      expect(repository.size()).toBe(6);
      expect(await repository.findById('voice-7')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty repository operations', async () => {
      repository.clear();

      expect(await repository.findAll()).toHaveLength(0);
      expect(await repository.findById('any-id')).toBeNull();
      expect(await repository.findByProvider('any-provider')).toHaveLength(0);
      expect(await repository.findAvailable()).toHaveLength(0);
      expect(await repository.findByLanguage('any-lang')).toHaveLength(0);
      expect(await repository.findDefault()).toBeNull();
    });

    it('should handle voice with all properties', async () => {
      const completeVoice: Voice = {
        id: 'complete-voice',
        name: 'Complete Voice',
        language: 'fr-FR',
        gender: 'female',
        provider: 'complete-provider',
        isAvailable: true,
        isDefault: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
      };

      await repository.save(completeVoice);
      const found = await repository.findById(completeVoice.id);

      expect(found).toEqual(completeVoice);
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const voice: Voice = {
          id: `concurrent-${i}`,
          name: `Concurrent Voice ${i}`,
          language: 'en-US',
          gender: i % 2 === 0 ? 'male' : 'female',
          provider: 'concurrent',
          isAvailable: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return repository.save(voice);
      });

      await Promise.all(promises);

      expect(repository.size()).toBe(15); // 5 initial + 10 concurrent

      // Verify all concurrent voices were saved
      for (let i = 0; i < 10; i++) {
        const found = await repository.findById(`concurrent-${i}`);
        expect(found).not.toBeNull();
        expect(found!.name).toBe(`Concurrent Voice ${i}`);
      }
    });
  });

  describe('Initial Data Validation', () => {
    it('should have valid initial voice data', async () => {
      const voices = await repository.findAll();

      // Check expected initial voices
      const voiceNames = voices.map(v => v.name);
      expect(voiceNames).toContain('Alice');
      expect(voiceNames).toContain('Bob');
      expect(voiceNames).toContain('Maria');
      expect(voiceNames).toContain('Pierre');
      expect(voiceNames).toContain('Yuki');

      // Verify Alice is the default voice
      const alice = voices.find(v => v.name === 'Alice');
      expect(alice).toBeDefined();
      expect(alice!.isDefault).toBe(true);
      expect(alice!.isAvailable).toBe(true);

      // Verify Yuki is unavailable
      const yuki = voices.find(v => v.name === 'Yuki');
      expect(yuki).toBeDefined();
      expect(yuki!.isAvailable).toBe(false);

      // Verify all voices have required properties
      voices.forEach(voice => {
        expect(voice.id).toBeTruthy();
        expect(voice.name).toBeTruthy();
        expect(voice.language).toBeTruthy();
        expect(['male', 'female', 'neutral']).toContain(voice.gender);
        expect(voice.provider).toBeTruthy();
        expect(typeof voice.isAvailable).toBe('boolean');
        expect(typeof voice.isDefault).toBe('boolean');
        expect(voice.createdAt).toBeInstanceOf(Date);
        expect(voice.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should have different languages represented', async () => {
      const voices = await repository.findAll();
      const languages = [...new Set(voices.map(v => v.language))];

      expect(languages).toContain('en-US');
      expect(languages).toContain('es-ES');
      expect(languages).toContain('fr-FR');
      expect(languages).toContain('ja-JP');
    });

    it('should have both genders represented', async () => {
      const voices = await repository.findAll();
      const genders = [...new Set(voices.map(v => v.gender))];

      expect(genders).toContain('male');
      expect(genders).toContain('female');
    });
  });
});