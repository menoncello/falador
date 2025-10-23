import bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../../core-domain/src/index.js';

/**
 * Bcrypt Password Hasher Implementation
 */
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly SALT_ROUNDS = 12; // eslint-disable-line no-magic-numbers

  /**
   *
   * @param password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   *
   * @param password
   * @param hashedPassword
   */
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
