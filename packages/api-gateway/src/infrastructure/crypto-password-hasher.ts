/**
 * Crypto-based Password Hasher Implementation
 *
 * Implements the PasswordHasher interface using Node.js crypto module
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { PasswordHasher } from '@falador/core-domain';
import { CONFIG } from '../config.js';

/**
 *
 */
export class CryptoPasswordHasher implements PasswordHasher {
  /**
   * Hash password using scrypt
   * @param password - The plaintext password to hash
   * @returns The hashed password in format "salt:hash"
   */
  hash(password: string): string {
    const salt = randomBytes(CONFIG.SALT_BYTES).toString('hex');
    const hash = scryptSync(password, salt, CONFIG.HASH_LENGTH).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   * @param password - The plaintext password to verify
   * @param storedHash - The stored hash in format "salt:hash"
   * @returns True if password matches, false otherwise
   */
  verify(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== CONFIG.PASSWORD_HASH_PARTS || !parts[0] || !parts[1]) {
      return false;
    }
    const salt = parts[0];
    const hash = parts[1];
    const hashToVerify = scryptSync(password, salt, CONFIG.HASH_LENGTH);
    const hashBuffer = Buffer.from(hash, 'hex');
    return timingSafeEqual(hashBuffer, hashToVerify);
  }
}
