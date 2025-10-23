import crypto from 'crypto';
import type { ApiKeyGenerator } from '../../../core-domain/src/index.js';

/**
 * Random API Key Generator Implementation
 */
export class RandomApiKeyGenerator implements ApiKeyGenerator {
  private readonly API_KEY_PREFIX = 'fk_';
  private readonly RANDOM_BYTES_LENGTH = 32; // eslint-disable-line no-magic-numbers
  private readonly API_KEY_TOTAL_LENGTH = 65; // eslint-disable-line no-magic-numbers

  /**
   *
   */
  generate(): string {
    const randomBytes = crypto
      .randomBytes(this.RANDOM_BYTES_LENGTH)
      .toString('hex');
    return `${this.API_KEY_PREFIX}${randomBytes}`;
  }

  /**
   *
   * @param apiKey
   */
  validate(apiKey: string): boolean {
    // Basic validation: check prefix and length
    return (
      apiKey.startsWith(this.API_KEY_PREFIX) &&
      apiKey.length === this.API_KEY_TOTAL_LENGTH
    );
  }
}
