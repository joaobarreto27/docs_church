import { Room, LiturgicalBlock } from '../../types/liturgy';
import { postApi, getApi } from './httpClient';
import { RoomSyncResult, JoinRoomApiResponse, CreateRoomApiResponse, OverwriteRoomApiResponse } from './types';

/**
 * Repositório para operações de ciclo de vida e consulta de Salas Litúrgicas
 */
export const roomRepository = {
  async getRoomByCode(code: string): Promise<Room | null> {
    try {
      const data = await postApi<{ room: Room; blocks: LiturgicalBlock[] }>('/api/room', {
        action: 'lookup',
        code,
      });
      return data.room || null;
    } catch {
      return null;
    }
  },

  async verifyControllerPin(code: string, pin: string): Promise<boolean> {
    try {
      const res = await postApi<{ success: boolean; sessionToken?: string }>('/api/room', {
        action: 'join',
        code,
        role: 'controlador',
        pin,
      });
      return Boolean(res && res.success);
    } catch {
      return false;
    }
  },

  async joinRoom(code: string, role: string, pin?: string): Promise<JoinRoomApiResponse> {
    try {
      return await postApi<JoinRoomApiResponse>('/api/room', {
        action: 'join',
        code,
        role,
        pin,
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao conectar à sala.' };
    }
  },

  async getRoomMeta(identifier: string): Promise<{ id: string; code: string; title: string; version: number; active_alert: string | null; current_page: number } | null> {
    try {
      return await getApi(`/api/sync?roomId=${encodeURIComponent(identifier)}`);
    } catch {
      return null;
    }
  },

  async syncRoomState(
    roomId: string,
    code: string,
    currentVersion: number
  ): Promise<RoomSyncResult | null> {
    try {
      return await postApi<RoomSyncResult>('/api/sync', {
        roomId,
        code,
        version: currentVersion,
      });
    } catch {
      return null;
    }
  },

  async createRoom(
    title: string = 'Culto de Celebração',
    controllerPin: string,
    preferredCode?: string
  ): Promise<CreateRoomApiResponse> {
    return await postApi<CreateRoomApiResponse>('/api/room', {
      action: 'create',
      title,
      pin: controllerPin,
      preferredCode,
    });
  },

  async overwriteExistingRoom(roomId: string, newTitle: string, newPin: string, token?: string): Promise<OverwriteRoomApiResponse> {
    return await postApi<OverwriteRoomApiResponse>('/api/room', {
      action: 'overwrite-service',
      roomId,
      title: newTitle,
      newPin,
      sessionToken: token,
    }, token);
  }
};
