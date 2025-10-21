import type { PasswordHasher } from '@falador/core-domain';
import bcrypt from 'bcrypt';

/**
 * Bcrypt Password Hasher Implementation
 */
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 12;

  /**
   *
   * @param password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
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
