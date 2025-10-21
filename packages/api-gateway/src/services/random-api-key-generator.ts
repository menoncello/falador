import crypto from 'crypto';
import type { ApiKeyGenerator } from '@falador/core-domain';

/**
 * Random API Key Generator Implementation
 */
export class RandomApiKeyGenerator implements ApiKeyGenerator {
  /**
   *
   */
  generate(): string {
    const prefix = 'fk_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  /**
   *
   * @param apiKey
   */
  validate(apiKey: string): boolean {
    // Basic validation: check prefix and length
    return apiKey.startsWith('fk_') && apiKey.length === 65; // 3 chars prefix + 32 bytes (64 hex chars)
  }
}
