/**
 * Crypto-based API Key Generator Implementation
 *
 * Implements the ApiKeyGenerator interface using Node.js crypto module
 */

import { randomBytes } from 'crypto';
import { ApiKeyGenerator } from '@falador/core-domain';
import { CONFIG } from '../config.js';

/**
 *
 */
export class CryptoApiKeyGenerator implements ApiKeyGenerator {
  /**
   * Generate API key
   * @returns A random base64url-encoded API key
   */
  generate(): string {
    return randomBytes(CONFIG.API_KEY_BYTES).toString('base64url');
  }
}
