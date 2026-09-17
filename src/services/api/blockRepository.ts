import { Room, LiturgicalBlock } from '../../types/liturgy';
import { postApi, withRetry } from './httpClient';

/**
 * Repositório para mutações e consultas de Blocos Litúrgicos
 */
export const blockRepository = {
  async getBlocksByRoomId(roomId: string): Promise<LiturgicalBlock[]> {
    try {
      const data = await postApi<{ room: Room; blocks: LiturgicalBlock[] }>('/api/room', {
        action: 'lookup',
        id: roomId,
      });
      return data.blocks || [];
    } catch {
      return [];
    }
  },

  async updateBlockContent(blockId: string, content: any, roomId: string, token?: string): Promise<void> {
    await withRetry(async () => {
      await postApi('/api/block', {
        action: 'update',
        blockId,
        roomId,
        content,
      }, token);
    });
  },

  async appendBlockContent(blockId: string, newItems: any[], roomId: string): Promise<void> {
    if (!newItems || newItems.length === 0) return;
    await withRetry(async () => {
      await postApi('/api/block', {
        action: 'append',
        blockId,
        roomId,
        newItems,
      });
    });
  }
};
