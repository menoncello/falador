/**
 * Mock TTS Engine Tests
 * Testing external service implementation
 */

import 'reflect-metadata';
import type { Voice } from '@falador/core-domain';
import { describe, it, expect, beforeEach } from 'bun:test';
import { MockTTSEngine } from './tts-engine.js';

describe('MockTTSEngine', () => {
  let ttsEngine: MockTTSEngine;

  beforeEach(() => {
    ttsEngine = new MockTTSEngine();
  });

  describe('generate', () => {
    it('should generate audio buffer for text', async () => {
      const text = 'Hello world';
      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'female',
        provider: 'mock-tts',
        isDefault: false,
      };

      const audioBuffer = await ttsEngine.generate(text, voice);

      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
    });

    it('should generate different buffer sizes for different text lengths', async () => {
      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'female',
        provider: 'mock-tts',
        isDefault: false,
      };

      const shortText = 'Short';
      const longText =
        'This is a much longer text that should generate a larger audio buffer';

      const shortBuffer = await ttsEngine.generate(shortText, voice);
      const longBuffer = await ttsEngine.generate(longText, voice);

      expect(longBuffer.byteLength).toBeGreaterThan(shortBuffer.byteLength);
    });

    it('should simulate processing time', async () => {
      const text = 'Test text';
      const voice: Voice = {
        id: 'voice-123',
        name: 'Test Voice',
        language: 'en-US',
        gender: 'female',
        provider: 'mock-tts',
        isDefault: false,
      };

      const startTime = Date.now();
      await ttsEngine.generate(text, voice);
      const endTime = Date.now();

      // Should take at least 1 second (simulated processing time)
      expect(endTime - startTime).toBeGreaterThanOrEqual(900); // Allow some tolerance
    });
  });

  describe('getVoices', () => {
    it('should return array of voices', async () => {
      const voices = await ttsEngine.getVoices();

      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);
    });

    it('should return voices with required properties', async () => {
      const voices = await ttsEngine.getVoices();

      for (const voice of voices) {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('language');
        expect(voice).toHaveProperty('gender');
        expect(voice).toHaveProperty('provider');
        expect(voice).toHaveProperty('isDefault');
        expect(typeof voice.id).toBe('string');
        expect(typeof voice.name).toBe('string');
        expect(typeof voice.language).toBe('string');
        expect(['male', 'female', 'neutral']).toContain(voice.gender);
        expect(typeof voice.provider).toBe('string');
        expect(typeof voice.isDefault).toBe('boolean');
      }
    });

    it('should include Brazilian Portuguese voices', async () => {
      const voices = await ttsEngine.getVoices();
      const ptBrVoices = voices.filter((voice) => voice.language === 'pt-BR');

      expect(ptBrVoices.length).toBeGreaterThan(0);
    });

    it('should have exactly one default voice for supported languages', async () => {
      const voices = await ttsEngine.getVoices();
      const languages = [...new Set(voices.map((v) => v.language))];

      // Check that pt-BR has exactly one default voice
      const ptBrVoices = voices.filter((v) => v.language === 'pt-BR');
      const ptBrDefaultVoices = ptBrVoices.filter((v) => v.isDefault);
      expect(ptBrDefaultVoices.length).toBe(1);

      // Check that en-US has at most one default voice (may have zero)
      const enUsVoices = voices.filter((v) => v.language === 'en-US');
      const enUsDefaultVoices = enUsVoices.filter((v) => v.isDefault);
      expect(enUsDefaultVoices.length).toBeLessThanOrEqual(1);

      // Check that no language has more than one default voice
      for (const language of languages) {
        const languageVoices = voices.filter((v) => v.language === language);
        const defaultVoices = languageVoices.filter((v) => v.isDefault);
        expect(defaultVoices.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('validateVoice', () => {
    it('should return true for valid voice IDs', async () => {
      const voices = await ttsEngine.getVoices();
      const validVoiceId = voices[0].id;

      const isValid = await ttsEngine.validateVoice(validVoiceId);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid voice IDs', async () => {
      const invalidVoiceId = 'non-existent-voice-id';

      const isValid = await ttsEngine.validateVoice(invalidVoiceId);

      expect(isValid).toBe(false);
    });

    it('should return false for empty voice ID', async () => {
      const isValid = await ttsEngine.validateVoice('');

      expect(isValid).toBe(false);
    });

    it('should validate all returned voices', async () => {
      const voices = await ttsEngine.getVoices();

      for (const voice of voices) {
        const isValid = await ttsEngine.validateVoice(voice.id);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('voice data consistency', () => {
    it('should return consistent voice data across calls', async () => {
      const voices1 = await ttsEngine.getVoices();
      const voices2 = await ttsEngine.getVoices();

      expect(voices1).toEqual(voices2);
      expect(voices1.length).toBe(voices2.length);

      // Verify all voice IDs match
      const ids1 = voices1.map((v) => v.id).sort();
      const ids2 = voices2.map((v) => v.id).sort();
      expect(ids1).toEqual(ids2);
    });

    it('should include specific expected voices', async () => {
      const voices = await ttsEngine.getVoices();
      const voiceNames = voices.map((v) => v.name);

      expect(voiceNames).toContain('Ana');
      expect(voiceNames).toContain('Carlos');
      expect(voiceNames).toContain('Maria');
    });
  });
});
