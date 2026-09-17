import { Room, LiturgicalBlock, UserRole } from '../../types/liturgy';

export interface StoredSession {
  code: string;
  roomId?: string;
  role: UserRole;
  pin?: string;
  sessionToken?: string;
  expiresAt: number;
}

export interface PendingAppend {
  id: string;
  blockId: string;
  roomId: string;
  newItems: any[];
  timestamp: number;
}

export interface PendingBlockUpdate {
  blockId: string;
  roomId: string;
  content: any;
  timestamp: number;
}

export interface RoomCacheData {
  room: Room;
  blocks: LiturgicalBlock[];
  timestamp?: number;
}
