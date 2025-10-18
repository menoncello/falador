import { db } from '../database';

/**
 * Extract user from Authorization header
 * @param authHeader - The Authorization header value
 * @returns User object if authenticated, null otherwise
 */
export function extractAuthUser(authHeader: string | null): {
  id: string;
  email: string;
  name: string;
  tier: string;
} | null {
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const user = db.getUserByToken(token) || db.getUserByApiKey(token);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
  };
}
