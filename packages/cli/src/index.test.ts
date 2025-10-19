import { describe, expect, test } from 'bun:test';
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
});
