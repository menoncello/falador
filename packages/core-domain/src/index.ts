/**
 * Core Domain Module
 * Contains domain entities and business logic
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  gender: string;
  userId: string;
  createdAt: Date;
}

export interface AudioFile {
  id: string;
  filename: string;
  size: number;
  duration?: number;
  projectId: string;
  createdAt: Date;
}