import { Room, LiturgicalBlock } from '../../types/liturgy';

export interface RoomSyncResult {
  id: string;
  code: string;
  title: string;
  version: number;
  active_alert: string | null;
  current_page: number;
  blocks?: LiturgicalBlock[];
  hasChanged: boolean;
}

export interface JoinRoomApiResponse {
  success: boolean;
  room?: Room;
  blocks?: LiturgicalBlock[];
  sessionToken?: string;
  error?: string;
}

export interface CreateRoomApiResponse {
  room: Room;
  blocks: LiturgicalBlock[];
  sessionToken?: string;
}

export interface OverwriteRoomApiResponse {
  success: boolean;
  sessionToken?: string;
  error?: string;
}
