/**
 * Audio File Repository Implementation
 * In-memory implementation for development/testing
 */

import type { AudioFile, AudioFileRepository } from '@falador/core-domain';
import { injectable } from 'tsyringe';

/**
 *
 */
@injectable()
export class InMemoryAudioFileRepository implements AudioFileRepository {
  private audioFiles: Map<string, AudioFile> = new Map();

  /**
   *
   * @param audioFileData
   */
  async create(
    audioFileData: Omit<AudioFile, 'id' | 'createdAt'>
  ): Promise<AudioFile> {
    const id = this.generateId();
    const now = new Date();
    const audioFile: AudioFile = {
      id,
      ...audioFileData,
      createdAt: now,
    };

    this.audioFiles.set(id, audioFile);
    return audioFile;
  }

  /**
   *
   * @param id
   */
  async findById(id: string): Promise<AudioFile | null> {
    return this.audioFiles.get(id) || null;
  }

  /**
   *
   * @param projectId
   */
  async findByProjectId(projectId: string): Promise<AudioFile[]> {
    const projectAudioFiles: AudioFile[] = [];
    for (const audioFile of this.audioFiles.values()) {
      if (audioFile.projectId === projectId) {
        projectAudioFiles.push(audioFile);
      }
    }
    // Sort by creation date, newest first
    return projectAudioFiles.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   *
   * @param id
   */
  async delete(id: string): Promise<boolean> {
    return this.audioFiles.delete(id);
  }

  // Helper method for testing
  /**
   *
   */
  clear(): void {
    this.audioFiles.clear();
  }

  // Helper method for testing
  /**
   *
   */
  getAll(): AudioFile[] {
    return Array.from(this.audioFiles.values());
  }

  /**
   *
   */
  private generateId(): string {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
