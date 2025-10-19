/**
 * Falador Core Domain
 * Business logic and domain entities
 */

export const version = '0.0.1';

// Domain entities will be defined here
export interface Project {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
