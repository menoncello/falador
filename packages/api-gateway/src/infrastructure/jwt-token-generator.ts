/**
 * JWT-like Token Generator Implementation
 *
 * Implements the TokenGenerator interface using crypto for token generation
 */

import { randomBytes } from 'crypto';
import { TokenGenerator } from '@falador/core-domain';
import { CONFIG } from '../config.js';

/**
 *
 */
export class JwtTokenGenerator implements TokenGenerator {
  private jwtSecret: string;

  /**
   *
   * @param jwtSecret
   */
  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  /**
   * Generate JWT-like token
   * @returns A JWT-like token string
   */
  generate(): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' })
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iat: Date.now(),
        exp: Date.now() + CONFIG.TOKEN_EXPIRY_MS,
      })
    ).toString('base64url');
    const signature = randomBytes(CONFIG.SIGNATURE_BYTES).toString('base64url');
    return `${header}.${payload}.${signature}`;
  }
}
