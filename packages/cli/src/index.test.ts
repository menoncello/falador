import { describe, expect, test, spyOn } from 'bun:test';
import { main, version } from './index';

describe('1.1-UNIT-CLI: CLI', () => {
  test('1.1-UNIT-CLI-001 [P2]: should export version', () => {
    expect(version).toBe('0.0.1');
  });

  test('1.1-UNIT-CLI-002 [P1]: should export main function', () => {
    expect(typeof main).toBe('function');
  });

  test('1.1-UNIT-CLI-003 [P1]: main should not throw', () => {
    expect(() => main()).not.toThrow();
  });

  test('1.1-UNIT-CLI-004 [P1]: main should log version and message', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith('Falador CLI v0.0.1');
    expect(consoleSpy).toHaveBeenCalledWith('Coming soon...');

    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-005 [P2]: version message should be specific', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    // Check that version appears in first log
    const firstCall = consoleSpy.mock.calls[0];
    expect(firstCall[0]).toContain('Falador CLI');
    expect(firstCall[0]).toContain('0.0.1');

    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-006 [P2]: status message should be specific', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    // Check that message appears in second log
    const secondCall = consoleSpy.mock.calls[1];
    expect(secondCall[0]).toBe('Coming soon...');

    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-007 [P1]: should handle multiple calls', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();
    main();

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenCalledWith('Falador CLI v0.0.1');
    expect(consoleSpy).toHaveBeenCalledWith('Coming soon...');
    expect(consoleSpy).toHaveBeenCalledWith('Falador CLI v0.0.1');
    expect(consoleSpy).toHaveBeenCalledWith('Coming soon...');

    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-008 [P2]: log messages should be strings', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    const calls = consoleSpy.mock.calls;
    for (const call of calls) {
      expect(typeof call[0]).toBe('string');
    }

    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-009 [P2]: version format should be correct', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    const versionCall = consoleSpy.mock.calls[0][0];
    expect(versionCall).toMatch(/Falador CLI v\d+\.\d+\.\d+/);

    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-010 [P2]: should verify exact version string', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    expect(consoleSpy).toHaveBeenCalledWith('Falador CLI v0.0.1');
    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-011 [P2]: should verify exact message string', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    expect(consoleSpy).toHaveBeenCalledWith('Coming soon...');
    consoleSpy.mockRestore();
  });

  test('1.1-UNIT-CLI-012 [P2]: version variable should be exactly "0.0.1"', () => {
    expect(version).toBe('0.0.1');
    expect(version).not.toBe('');
    expect(version).not.toBe('some-other-version');
  });

  test('1.1-UNIT-CLI-013 [P2]: message template should use version variable', () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation for console.log
    });

    main();

    const firstCall = consoleSpy.mock.calls[0][0];
    expect(firstCall).toContain(version);
    expect(firstCall).toContain('Falador CLI v');
    consoleSpy.mockRestore();
  });
});
