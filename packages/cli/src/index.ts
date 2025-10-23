/**
 * CLI Module
 * Command line interface for the application
 */

export class CLI {
  async run(args: string[]): Promise<void> {
    console.log('Falador CLI - Audio Book Generator');
    console.log('Arguments:', args);
  }
}

export default CLI;