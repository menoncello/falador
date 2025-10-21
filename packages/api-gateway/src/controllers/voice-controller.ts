/**
 * Voice Controller
 * REST API endpoints for voice management
 */

import type { VoiceManagementUseCase } from '@falador/application/use-cases/voice-management.js';
import type { Voice, ValidationError } from '@falador/core-domain';
import type { Elysia } from 'elysia';
import { injectable, inject } from 'tsyringe';

export interface VoiceResponse {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
  isDefault: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

/**
 *
 */
@injectable()
export class VoiceController {
  /**
   *
   * @param voiceUseCase
   */
  constructor(
    @inject('VoiceManagementUseCase')
    private voiceUseCase: VoiceManagementUseCase
  ) {}

  /**
   *
   * @param app
   */
  registerRoutes(app: Elysia): void {
    // GET /api/voices - Get all available voices
    app.get('/api/voices', async ({ query, set }) => {
      try {
        const language = query.language as string;
        const voices = await this.voiceUseCase.getAvailableVoices(language);
        return voices.map((voice) => this.mapVoiceToResponse(voice));
      } catch {
        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to get voices',
        } as ErrorResponse;
      }
    });

    // GET /api/voices/:voiceId - Get voice by ID
    app.get('/api/voices/:voiceId', async ({ params, set }) => {
      try {
        const voice = await this.voiceUseCase.getVoiceById(params.voiceId);

        if (!voice) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: 'Voice not found',
          } as ErrorResponse;
        }

        return this.mapVoiceToResponse(voice);
      } catch (error) {
        if (error instanceof ValidationError) {
          set.status = 400;
          return {
            error: 'Validation Error',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to get voice',
        } as ErrorResponse;
      }
    });

    // POST /api/voices/:voiceId/validate - Validate voice
    app.post('/api/voices/:voiceId/validate', async ({ params, set }) => {
      try {
        const isValid = await this.voiceUseCase.validateVoice(params.voiceId);

        return {
          voiceId: params.voiceId,
          isValid,
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          set.status = 400;
          return {
            error: 'Validation Error',
            message: error.message,
            code: error.code,
          } as ErrorResponse;
        }

        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to validate voice',
        } as ErrorResponse;
      }
    });

    // GET /api/voices/default - Get default voice
    app.get('/api/voices/default', async ({ query, set }) => {
      try {
        const language = query.language as string;
        const voice = await this.voiceUseCase.getDefaultVoice(language);

        if (!voice) {
          set.status = 404;
          return {
            error: 'Not Found',
            message: 'No default voice found',
          } as ErrorResponse;
        }

        return this.mapVoiceToResponse(voice);
      } catch {
        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to get default voice',
        } as ErrorResponse;
      }
    });

    // POST /api/voices/sync - Sync voices from provider
    app.post('/api/voices/sync', async ({ set }) => {
      try {
        const voices = await this.voiceUseCase.syncVoicesFromProvider();
        return {
          synced: voices.length,
          voices: voices.map((voice) => this.mapVoiceToResponse(voice)),
        };
      } catch {
        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Failed to sync voices',
        } as ErrorResponse;
      }
    });
  }

  /**
   *
   * @param voice
   */
  private mapVoiceToResponse(voice: Voice): VoiceResponse {
    return {
      id: voice.id,
      name: voice.name,
      language: voice.language,
      gender: voice.gender,
      provider: voice.provider,
      isDefault: voice.isDefault,
    };
  }
}
