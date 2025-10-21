import jwt from 'jsonwebtoken';
import type { TokenGenerator } from '../../../core-domain/src/interfaces/index.js';

/**
 * JWT Token Generator Implementation
 */
export class JWTTokenGenerator implements TokenGenerator {
  private readonly secret = process.env['JWT_SECRET'] || 'test-secret-key';
  private readonly expiresIn = '24h';

  /**
   *
   */
  generate(): string {
    const payload = { iat: Date.now() };
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   *
   * @param token
   */
  verify(token: string): Record<string, any> | null {
    try {
      return jwt.verify(token, this.secret) as Record<string, any>;
    } catch {
      return null;
    }
  }

  /**
   *
   * @param token
   */
  decode(token: string): Record<string, any> | null {
    try {
      return jwt.decode(token) as Record<string, any>;
    } catch {
      return null;
    }
  }
}
