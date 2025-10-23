/**
 * Falador CLI
 * Command-line interface for audiobook generation
 */

export const version = '0.0.1';

/**
 * Main CLI entry point
 */
export function main(): void {
  const version = '0.0.1';
  const message = 'Coming soon...';

  console.log(`Falador CLI v${version}`);
  console.log(message);
}

// Run CLI if executed directly
if (import.meta.main) {
  main();
}
