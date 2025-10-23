import jwt from 'jsonwebtoken';
import type { TokenGenerator } from '../../../core-domain/src/index.js';

/**
 * JWT Token Generator Implementation
 */
export class JWTTokenGenerator implements TokenGenerator {
  private readonly secret = process.env['JWT_SECRET'] || 'test-secret-key';
  private readonly expiresIn = '24h';

  /**
   *
   * @param payload
   */
  generate(payload?: Record<string, unknown>): string {
    return jwt.sign(payload || {}, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   *
   * @param token
   */
  verify(token: string): Record<string, unknown> | null {
    try {
      return jwt.verify(token, this.secret) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   *
   * @param token
   */
  decode(token: string): Record<string, unknown> | null {
    try {
      return jwt.decode(token) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
