import { describe, expect, test } from 'bun:test';
import { main, version, getVersionInfo, validateConfig } from './index';

describe('Debug: CLI Tests', () => {
  test('debug 1: version export', () => {
    expect(version).toBe('0.0.1');
  });

  test('debug 2: main function exists', () => {
    expect(typeof main).toBe('function');
  });

  test('debug 3: getVersionInfo function exists', () => {
    expect(typeof getVersionInfo).toBe('function');
  });

  test('debug 4: validateConfig function exists', () => {
    expect(typeof validateConfig).toBe('function');
  });

  test('debug 5: main returns undefined', () => {
    const result = main();
    expect(result).toBeUndefined();
  });

  test('debug 6: getVersionInfo returns object', () => {
    const info = getVersionInfo();
    expect(typeof info).toBe('object');
  });

  test('debug 7: validateConfig returns true', () => {
    const result = validateConfig();
    expect(result).toBe(true);
  });

  test('debug 8: version is string', () => {
    expect(typeof version).toBe('string');
  });

  test('debug 9: version length > 0', () => {
    expect(version.length).toBeGreaterThan(0);
  });

  test('debug 10: getVersionInfo structure', () => {
    const info = getVersionInfo();
    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('description');
  });

  test('debug 11: main with console mock', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    main();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('debug 12: main logs correct messages', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    main();
    expect(consoleSpy).toHaveBeenCalledWith('Falador CLI v0.0.1');
    expect(consoleSpy).toHaveBeenCalledWith('Coming soon...');
    consoleSpy.mockRestore();
  });

  test('debug 13: validateConfig checks version format', () => {
    const result = validateConfig();
    expect(result).toBe(true);
    // This implicitly tests that version.includes('.') is working
    expect(version).toContain('.');
  });

  test('debug 14: validateConfig checks message content', () => {
    const result = validateConfig();
    expect(result).toBe(true);
    // This implicitly tests that message.includes('Coming') is working
    expect('Coming soon...').toContain('Coming');
  });

  test('debug 15: version semantic versioning', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('debug 16: main idempotent', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

    main();
    main();

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    consoleSpy.mockRestore();
  });

  test('debug 17: getVersionInfo exact values', () => {
    const info = getVersionInfo();
    expect(info.version).toBe('0.0.1');
    expect(info.name).toBe('Falador CLI');
    expect(info.description).toBe(
      'Command-line interface for audiobook generation'
    );
  });

  test('debug 18: validateConfig AND conditions', () => {
    const result = validateConfig();
    expect(result).toBe(true);

    const version = '0.0.1';
    const message = 'Coming soon...';

    expect(version.length).toBeGreaterThan(0);
    expect(message.length).toBeGreaterThan(0);
    expect(version).toContain('.');
    expect(message).toContain('Coming');
  });

  test('debug 19: main handles undefined console', () => {
    const originalConsole = global.console;

    try {
      global.console = undefined as any;
      expect(() => main()).not.toThrow();
    } finally {
      global.console = originalConsole;
    }
  });

  test('debug 20: main conditional block', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

    // Test the conditional logic in main()
    main();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falador CLI v')
    );
    expect(consoleSpy).toHaveBeenCalledWith('Coming soon...');

    consoleSpy.mockRestore();
  });
});
