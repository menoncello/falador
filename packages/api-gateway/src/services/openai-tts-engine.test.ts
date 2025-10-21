import { describe, it, expect, beforeEach } from 'bun:test';
import { OpenAITTSEngine } from './openai-tts-engine';
import type { Voice } from '@falador/core-domain';

describe('OpenAITTSEngine', () => {
  let engine: OpenAITTSEngine;

  beforeEach(() => {
    engine = new OpenAITTSEngine('test-api-key');
  });

  describe('Constructor', () => {
    it('should create engine with API key', () => {
      const testEngine = new OpenAITTSEngine('test-key');
      expect(testEngine).toBeDefined();
    });

    it('should create engine with custom base URL', () => {
      const testEngine = new OpenAITTSEngine('test-key', 'https://custom.openai.com/v1');
      expect(testEngine).toBeDefined();
    });

    it('should use default base URL when not specified', () => {
      const testEngine = new OpenAITTSEngine('test-key');
      expect(testEngine).toBeDefined();
    });
  });

  describe('getVoices', () => {
    it('should return available voices', async () => {
      const voices = await engine.getVoices();

      expect(voices).toHaveLength(6);
      expect(voices[0]).toHaveProperty('id');
      expect(voices[0]).toHaveProperty('name');
      expect(voices[0]).toHaveProperty('language');
      expect(voices[0]).toHaveProperty('gender');
      expect(voices[0]).toHaveProperty('age');
      expect(voices[0]).toHaveProperty('providerId');
      expect(voices[0]).toHaveProperty('isActive');
    });

    it('should return voices with correct provider', async () => {
      const voices = await engine.getVoices();

      voices.forEach(voice => {
        expect(voice.provider).toBe('openai');
        expect(voice.isActive).toBe(true);
      });
    });

    it('should return expected voice IDs', async () => {
      const voices = await engine.getVoices();
      const voiceIds = voices.map(v => v.id);

      expect(voiceIds).toContain('alloy');
      expect(voiceIds).toContain('echo');
      expect(voiceIds).toContain('fable');
      expect(voiceIds).toContain('onyx');
      expect(voiceIds).toContain('nova');
      expect(voiceIds).toContain('shimmer');
    });

    it('should return voices with correct properties', async () => {
      const voices = await engine.getVoices();

      // Check specific voice properties
      const alloy = voices.find(v => v.id === 'alloy');
      expect(alloy).toBeDefined();
      expect(alloy!.name).toBe('Alloy');
      expect(alloy!.language).toBe('en-US');
      expect(alloy!.gender).toBe('neutral');
      expect(alloy!.age).toBe('adult');
      expect(alloy!.providerId).toBe('alloy');

      const echo = voices.find(v => v.id === 'echo');
      expect(echo).toBeDefined();
      expect(echo!.name).toBe('Echo');
      expect(echo!.gender).toBe('male');

      const nova = voices.find(v => v.id === 'nova');
      expect(nova).toBeDefined();
      expect(nova!.name).toBe('Nova');
      expect(nova!.gender).toBe('female');

      const shimmer = voices.find(v => v.id === 'shimmer');
      expect(shimmer).toBeDefined();
      expect(shimmer!.age).toBe('young');
    });
  });

  describe('validateVoice', () => {
    it('should validate existing voice ID', async () => {
      const isValid = await engine.validateVoice('alloy');
      expect(isValid).toBe(true);
    });

    it('should validate all available voice IDs', async () => {
      const voices = await engine.getVoices();

      for (const voice of voices) {
        const isValid = await engine.validateVoice(voice.id);
        expect(isValid).toBe(true);
      }
    });

    it('should reject non-existent voice ID', async () => {
      const isValid = await engine.validateVoice('non-existent-voice');
      expect(isValid).toBe(false);
    });

    it('should reject empty voice ID', async () => {
      const isValid = await engine.validateVoice('');
      expect(isValid).toBe(false);
    });

    it('should reject null voice ID', async () => {
      // @ts-expect-error Testing null input
      const isValid = await engine.validateVoice(null);
      expect(isValid).toBe(false);
    });
  });

  describe('generateSpeech', () => {
    it('should generate speech for valid text and voice', async () => {
      const text = 'Hello, world!';
      const voiceId = 'alloy';

      const audioBuffer = await engine.generateSpeech(text, voiceId);

      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
    });

    it('should generate speech for all available voices', async () => {
      const voices = await engine.getVoices();
      const text = 'Test speech generation';

      for (const voice of voices) {
        const audioBuffer = await engine.generateSpeech(text, voice.id);
        expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
        expect(audioBuffer.byteLength).toBeGreaterThan(0);
      }
    });

    it('should handle empty text', async () => {
      const text = '';
      const voiceId = 'alloy';

      const audioBuffer = await engine.generateSpeech(text, voiceId);
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle long text', async () => {
      const text = 'This is a very long text for testing speech generation. '.repeat(10);
      const voiceId = 'alloy';

      const audioBuffer = await engine.generateSpeech(text, voiceId);
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const text = 'Hello, world! @#$%^&*()_+-=[]{}|;:,.<>?';
      const voiceId = 'alloy';

      const audioBuffer = await engine.generateSpeech(text, voiceId);
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
    });

    it('should handle Unicode characters', async () => {
      const text = 'Hello, 世界! ¡Hola! Bonjour! こんにちは!';
      const voiceId = 'alloy';

      const audioBuffer = await engine.generateSpeech(text, voiceId);
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('Mock Implementation Details', () => {
    it('should return consistent mock audio data', async () => {
      const text = 'Test text';
      const voiceId = 'alloy';

      const audioBuffer1 = await engine.generateSpeech(text, voiceId);
      const audioBuffer2 = await engine.generateSpeech(text, voiceId);

      expect(audioBuffer1).toEqual(audioBuffer2);
    });

    it('should return mock audio data that can be decoded', async () => {
      const text = 'Test';
      const voiceId = 'alloy';

      const audioBuffer = await engine.generateSpeech(text, voiceId);
      const decoder = new TextDecoder();
      const decoded = decoder.decode(audioBuffer);

      expect(decoded).toBe('mock-audio-data');
    });

    it('should return consistent voice data', async () => {
      const voices1 = await engine.getVoices();
      const voices2 = await engine.getVoices();

      expect(voices1).toEqual(voices2);
    });

    it('should maintain voice order across calls', async () => {
      const voices1 = await engine.getVoices();
      const voices2 = await engine.getVoices();

      expect(voices1.length).toBe(voices2.length);
      for (let i = 0; i < voices1.length; i++) {
        expect(voices1[i].id).toBe(voices2[i].id);
        expect(voices1[i].name).toBe(voices2[i].name);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid voice ID gracefully', async () => {
      const text = 'Test text';
      const invalidVoiceId = 'invalid-voice';

      // Should not throw an error even with invalid voice
      const audioBuffer = await engine.generateSpeech(text, invalidVoiceId);
      expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle null inputs gracefully', async () => {
      // @ts-expect-error Testing null inputs
      const audioBuffer1 = await engine.generateSpeech(null, 'alloy');
      expect(audioBuffer1).toBeInstanceOf(ArrayBuffer);

      // @ts-expect-error Testing null inputs
      const audioBuffer2 = await engine.generateSpeech('test', null);
      expect(audioBuffer2).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle undefined inputs gracefully', async () => {
      // @ts-expect-error Testing undefined inputs
      const audioBuffer1 = await engine.generateSpeech(undefined, 'alloy');
      expect(audioBuffer1).toBeInstanceOf(ArrayBuffer);

      // @ts-expect-error Testing undefined inputs
      const audioBuffer2 = await engine.generateSpeech('test', undefined);
      expect(audioBuffer2).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('Integration with Voice Interface', () => {
    it('should return voices that implement Voice interface', async () => {
      const voices = await engine.getVoices();

      voices.forEach(voice => {
        // Check all required Voice interface properties
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('language');
        expect(voice).toHaveProperty('gender');
        expect(voice).toHaveProperty('age');
        expect(voice).toHaveProperty('provider');
        expect(voice).toHaveProperty('providerId');
        expect(voice).toHaveProperty('isActive');

        // Check types
        expect(typeof voice.id).toBe('string');
        expect(typeof voice.name).toBe('string');
        expect(typeof voice.language).toBe('string');
        expect(['male', 'female', 'neutral']).toContain(voice.gender);
        expect(['adult', 'young', 'mature']).toContain(voice.age);
        expect(typeof voice.provider).toBe('string');
        expect(typeof voice.providerId).toBe('string');
        expect(typeof voice.isActive).toBe('boolean');
      });
    });

    it('should support all voice properties required by the domain', async () => {
      const voices = await engine.getVoices();

      // Ensure we have voices with different properties
      const hasMale = voices.some(v => v.gender === 'male');
      const hasFemale = voices.some(v => v.gender === 'female');
      const hasNeutral = voices.some(v => v.gender === 'neutral');

      expect(hasMale).toBe(true);
      expect(hasFemale).toBe(true);
      expect(hasNeutral).toBe(true);

      const hasAdult = voices.some(v => v.age === 'adult');
      const hasYoung = voices.some(v => v.age === 'young');
      const hasMature = voices.some(v => v.age === 'mature');

      expect(hasAdult).toBe(true);
      expect(hasYoung).toBe(true);
      expect(hasMature).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid calls', async () => {
      const promises = Array.from({ length: 10 }, () =>
        engine.getVoices()
      );

      const results = await Promise.all(promises);

      results.forEach(voices => {
        expect(voices).toHaveLength(6);
      });
    });

    it('should handle concurrent speech generation', async () => {
      const text = 'Concurrent test';
      const voiceId = 'alloy';

      const promises = Array.from({ length: 5 }, () =>
        engine.generateSpeech(text, voiceId)
      );

      const results = await Promise.all(promises);

      results.forEach(audioBuffer => {
        expect(audioBuffer).toBeInstanceOf(ArrayBuffer);
        expect(audioBuffer.byteLength).toBeGreaterThan(0);
      });
    });

    it('should complete operations quickly', async () => {
      const startTime = Date.now();

      await engine.getVoices();
      await engine.validateVoice('alloy');
      await engine.generateSpeech('Test', 'alloy');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All mock operations should complete very quickly
      expect(duration).toBeLessThan(100);
    });
  });
});