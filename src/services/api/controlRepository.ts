import { postApi, withRetry } from './httpClient';

/**
 * Repositório para comandos remotos pastorais e de controle de culto
 */
export const controlRepository = {
  async setRoomAlert(roomId: string, alertText: string | null, token?: string): Promise<void> {
    await withRetry(async () => {
      await postApi('/api/room', {
        action: 'send-alert',
        roomId,
        alert: alertText,
        message: alertText,
        sessionToken: token,
      }, token);
    });
  },

  async setRoomCurrentPage(roomId: string, page: number, token?: string): Promise<void> {
    await withRetry(async () => {
      await postApi('/api/room', {
        action: 'set-page',
        roomId,
        page,
        sessionToken: token,
      }, token);
    });
  },

  async updateRoomTitle(roomId: string, newTitle: string, token?: string): Promise<void> {
    await withRetry(async () => {
      await postApi('/api/room', {
        action: 'update-title',
        roomId,
        title: newTitle,
        sessionToken: token,
      }, token);
    });
  },

  async updateRoomCode(roomId: string, newCode: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await postApi<{ success: boolean; error?: string }>('/api/room', {
        action: 'update-code',
        roomId,
        newCode,
        sessionToken: token,
      }, token);
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao atualizar código.' };
    }
  },

  async archiveAndResetRoom(roomId: string, newTitle: string, token?: string): Promise<void> {
    await withRetry(async () => {
      await postApi('/api/room', {
        action: 'reset-service',
        roomId,
        title: newTitle,
        sessionToken: token,
      }, token);
    });
  },

  async updateRoomHolyricsUrl(roomId: string, url: string | null, token?: string): Promise<{ success: boolean; holyrics_url?: string | null; error?: string }> {
    try {
      return await postApi<{ success: boolean; holyrics_url?: string | null; error?: string }>('/api/room', {
        action: 'update-holyrics-url',
        roomId,
        url,
        sessionToken: token,
      }, token);
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao atualizar URL do Holyrics.' };
    }
  }
};
