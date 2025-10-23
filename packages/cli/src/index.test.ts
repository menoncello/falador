/**
 * CLI Module Tests
 */

import { CLI } from './index';

describe('CLI Module', () => {
  it('should create CLI instance', () => {
    const cli = new CLI();
    expect(cli).toBeInstanceOf(CLI);
  });

  it('should run CLI without errors', async () => {
    const cli = new CLI();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await cli.run(['test', 'args']);

    expect(consoleSpy).toHaveBeenCalledWith('Falador CLI - Audio Book Generator');
    expect(consoleSpy).toHaveBeenCalledWith('Arguments:', ['test', 'args']);

    consoleSpy.mockRestore();
  });
});