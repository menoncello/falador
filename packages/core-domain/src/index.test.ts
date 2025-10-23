import { describe, expect, test } from 'bun:test';
import { version } from './index';

describe('1.1-UNIT-Domain: Core Domain', () => {
  test('1.1-UNIT-DOM-001 [P2]: should export version', () => {
    expect(version).toBe('0.0.1');
  });
});
