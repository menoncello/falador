import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { Voice } from '../../../core-domain/src/index';
import { OpenAITTSEngine } from './openai-tts-engine';

describe('OpenAITTSEngine', () => {
  let engine: OpenAITTSEngine;
  let mockVoice: Voice;

  beforeEach(() => {
    engine = new OpenAITTSEngine();
    mockVoice = {
      id: 'test-voice',
      name: 'Test Voice',
      language: 'en-US',
      gender: 'neutral',
      age: 'adult',
      provider: 'openai',
      providerId: 'test-voice',
      isActive: true,
      isAvailable: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('generate', () => {
    it('should generate audio from text', async () => {
      const text = 'Hello, world!';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should return non-empty audio buffer', async () => {
      const text = 'Test audio generation';

      const result = await engine.generate(text, mockVoice);

      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should handle short text', async () => {
      const text = 'Hi';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should handle long text', async () => {
      const text = 'This is a very long text '.repeat(100);

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle empty text', async () => {
      const text = '';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      const text = 'Test delay';

      await engine.generate(text, mockVoice);

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeGreaterThanOrEqual(90); // At least 90ms (close to 100ms)
    });

    it('should work with different voice objects', async () => {
      const voice1 = { ...mockVoice, id: 'voice1', name: 'Voice 1' };
      const voice2 = { ...mockVoice, id: 'voice2', name: 'Voice 2' };

      const result1 = await engine.generate('Text 1', voice1);
      const result2 = await engine.generate('Text 2', voice2);

      expect(result1).toBeInstanceOf(ArrayBuffer);
      expect(result2).toBeInstanceOf(ArrayBuffer);
    });

    it('should encode text to mock audio data', async () => {
      const text = 'Test encoding';

      const result = await engine.generate(text, mockVoice);
      const view = new Uint8Array(result);
      const decoder = new TextDecoder();
      const decoded = decoder.decode(view);

      expect(decoded).toBe('mock-audio-data');
    });

    it('should handle special characters in text', async () => {
      const text = 'Special: !@#$%^&*()';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle unicode characters', async () => {
      const text = 'Unicode: 你好世界 🌍';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('getVoices', () => {
    it('should return array of voices', async () => {
      const voices = await engine.getVoices();

      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);
    });

    it('should return 6 default voices', async () => {
      const voices = await engine.getVoices();

      expect(voices.length).toBe(6);
    });

    it('should return voices with correct structure', async () => {
      const voices = await engine.getVoices();
      const firstVoice = voices[0];

      expect(firstVoice).toHaveProperty('id');
      expect(firstVoice).toHaveProperty('name');
      expect(firstVoice).toHaveProperty('language');
      expect(firstVoice).toHaveProperty('gender');
      expect(firstVoice).toHaveProperty('age');
      expect(firstVoice).toHaveProperty('provider');
      expect(firstVoice).toHaveProperty('providerId');
      expect(firstVoice).toHaveProperty('isActive');
      expect(firstVoice).toHaveProperty('isAvailable');
      expect(firstVoice).toHaveProperty('isDefault');
      expect(firstVoice).toHaveProperty('createdAt');
      expect(firstVoice).toHaveProperty('updatedAt');
    });

    it('should include Alloy voice', async () => {
      const voices = await engine.getVoices();

      const alloy = voices.find((v) => v.id === 'alloy');

      expect(alloy).toBeDefined();
      expect(alloy?.name).toBe('Alloy');
    });

    it('should include Echo voice', async () => {
      const voices = await engine.getVoices();

      const echo = voices.find((v) => v.id === 'echo');

      expect(echo).toBeDefined();
      expect(echo?.name).toBe('Echo');
    });

    it('should include Fable voice', async () => {
      const voices = await engine.getVoices();

      const fable = voices.find((v) => v.id === 'fable');

      expect(fable).toBeDefined();
      expect(fable?.name).toBe('Fable');
    });

    it('should include Onyx voice', async () => {
      const voices = await engine.getVoices();

      const onyx = voices.find((v) => v.id === 'onyx');

      expect(onyx).toBeDefined();
      expect(onyx?.name).toBe('Onyx');
    });

    it('should include Nova voice', async () => {
      const voices = await engine.getVoices();

      const nova = voices.find((v) => v.id === 'nova');

      expect(nova).toBeDefined();
      expect(nova?.name).toBe('Nova');
    });

    it('should include Shimmer voice', async () => {
      const voices = await engine.getVoices();

      const shimmer = voices.find((v) => v.id === 'shimmer');

      expect(shimmer).toBeDefined();
      expect(shimmer?.name).toBe('Shimmer');
    });

    it('should set all voices as active', async () => {
      const voices = await engine.getVoices();

      expect(voices.every((v) => v.isActive)).toBe(true);
    });

    it('should set all voices as available', async () => {
      const voices = await engine.getVoices();

      expect(voices.every((v) => v.isAvailable)).toBe(true);
    });

    it('should set provider to openai', async () => {
      const voices = await engine.getVoices();

      expect(voices.every((v) => v.provider === 'openai')).toBe(true);
    });

    it('should set language to en-US', async () => {
      const voices = await engine.getVoices();

      expect(voices.every((v) => v.language === 'en-US')).toBe(true);
    });

    it('should set Alloy as default voice', async () => {
      const voices = await engine.getVoices();

      const alloy = voices.find((v) => v.id === 'alloy');

      expect(alloy?.isDefault).toBe(true);
    });

    it('should set other voices as non-default', async () => {
      const voices = await engine.getVoices();

      const nonDefaultVoices = voices.filter((v) => v.id !== 'alloy');

      expect(nonDefaultVoices.every((v) => v.isDefault === false)).toBe(true);
    });

    it('should set providerId same as id', async () => {
      const voices = await engine.getVoices();

      expect(voices.every((v) => v.providerId === v.id)).toBe(true);
    });

    it('should have valid timestamps', async () => {
      const voices = await engine.getVoices();
      const firstVoice = voices[0];

      expect(firstVoice.createdAt).toBeInstanceOf(Date);
      expect(firstVoice.updatedAt).toBeInstanceOf(Date);
    });

    it('should have matching created and updated timestamps', async () => {
      const voices = await engine.getVoices();
      const firstVoice = voices[0];

      expect(firstVoice.createdAt.getTime()).toBe(
        firstVoice.updatedAt.getTime()
      );
    });

    it('should return voices with correct genders', async () => {
      const voices = await engine.getVoices();

      const alloy = voices.find((v) => v.id === 'alloy');
      const echo = voices.find((v) => v.id === 'echo');
      const nova = voices.find((v) => v.id === 'nova');

      expect(alloy?.gender).toBe('neutral');
      expect(echo?.gender).toBe('male');
      expect(nova?.gender).toBe('female');
    });

    it('should return voices with correct ages', async () => {
      const voices = await engine.getVoices();

      const alloy = voices.find((v) => v.id === 'alloy');
      const onyx = voices.find((v) => v.id === 'onyx');
      const shimmer = voices.find((v) => v.id === 'shimmer');

      expect(alloy?.age).toBe('adult');
      expect(onyx?.age).toBe('mature');
      expect(shimmer?.age).toBe('young');
    });
  });

  describe('validateVoice', () => {
    it('should return true for valid voice ID', async () => {
      const result = await engine.validateVoice('alloy');

      expect(result).toBe(true);
    });

    it('should return true for echo voice', async () => {
      const result = await engine.validateVoice('echo');

      expect(result).toBe(true);
    });

    it('should return true for fable voice', async () => {
      const result = await engine.validateVoice('fable');

      expect(result).toBe(true);
    });

    it('should return true for onyx voice', async () => {
      const result = await engine.validateVoice('onyx');

      expect(result).toBe(true);
    });

    it('should return true for nova voice', async () => {
      const result = await engine.validateVoice('nova');

      expect(result).toBe(true);
    });

    it('should return true for shimmer voice', async () => {
      const result = await engine.validateVoice('shimmer');

      expect(result).toBe(true);
    });

    it('should return false for invalid voice ID', async () => {
      const result = await engine.validateVoice('invalid-voice');

      expect(result).toBe(false);
    });

    it('should return false for empty string', async () => {
      const result = await engine.validateVoice('');

      expect(result).toBe(false);
    });

    it('should return false for non-existent voice', async () => {
      const result = await engine.validateVoice('non-existent');

      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const result = await engine.validateVoice('ALLOY');

      expect(result).toBe(false);
    });

    it('should handle special characters in voice ID', async () => {
      const result = await engine.validateVoice('voice@123');

      expect(result).toBe(false);
    });
  });

  describe('createVoice (via getVoices)', () => {
    it('should handle config with isDefault true', async () => {
      const voices = await engine.getVoices();
      const defaultVoice = voices.find((v) => v.isDefault);

      expect(defaultVoice).toBeDefined();
      expect(defaultVoice?.isDefault).toBe(true);
    });

    it('should handle config with isDefault undefined', async () => {
      const voices = await engine.getVoices();
      const nonDefaultVoices = voices.filter((v) => !v.isDefault);

      expect(nonDefaultVoices.length).toBe(5); // 6 total - 1 default
    });

    it('should handle config without isDefault property', async () => {
      const voices = await engine.getVoices();
      const echo = voices.find((v) => v.id === 'echo');

      // Echo config doesn't have isDefault, should default to false
      expect(echo?.isDefault).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should generate audio with validated voice', async () => {
      const isValid = await engine.validateVoice('alloy');
      expect(isValid).toBe(true);

      const voices = await engine.getVoices();
      const alloyVoice = voices.find((v) => v.id === 'alloy');

      if (alloyVoice) {
        const audio = await engine.generate('Test text', alloyVoice);
        expect(audio).toBeInstanceOf(ArrayBuffer);
      }
    });

    it('should handle multiple generate calls', async () => {
      const voices = await engine.getVoices();
      const voice = voices[0];

      const audio1 = await engine.generate('Text 1', voice);
      const audio2 = await engine.generate('Text 2', voice);

      expect(audio1).toBeInstanceOf(ArrayBuffer);
      expect(audio2).toBeInstanceOf(ArrayBuffer);
    });

    it('should work with all available voices', async () => {
      const voices = await engine.getVoices();

      for (const voice of voices) {
        const isValid = await engine.validateVoice(voice.id);
        expect(isValid).toBe(true);

        const audio = await engine.generate('Test', voice);
        expect(audio).toBeInstanceOf(ArrayBuffer);
      }
    });

    it('should handle concurrent generation requests', async () => {
      const voices = await engine.getVoices();
      const voice = voices[0];

      const promises = Array.from({ length: 5 }, (_, i) =>
        engine.generate(`Text ${i}`, voice)
      );

      const results = await Promise.all(promises);

      expect(results.every((r) => r instanceof ArrayBuffer)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle newlines in text', async () => {
      const text = 'Line 1\nLine 2\nLine 3';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle tabs in text', async () => {
      const text = 'Column1\tColumn2\tColumn3';

      const result = await engine.generate(text, mockVoice);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle mixed case voice IDs in validation', async () => {
      const lowerCase = await engine.validateVoice('alloy');
      const mixedCase = await engine.validateVoice('Alloy');
      const upperCase = await engine.validateVoice('ALLOY');

      expect(lowerCase).toBe(true);
      expect(mixedCase).toBe(false);
      expect(upperCase).toBe(false);
    });
  });
});
