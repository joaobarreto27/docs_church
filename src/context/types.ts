import { Room, LiturgicalBlock, UserRole } from '../types/liturgy';

export interface RoomContextType {
  room: Room | null;
  blocks: LiturgicalBlock[];
  role: UserRole | null;
  isConnected: boolean;
  isColdStarting: boolean;
  isFastSync: boolean;
  hasFreshUpdates: boolean;
  error: string | null;
  joinRoom: (code: string, role: UserRole, pin?: string) => Promise<{ success: boolean; error?: string }>;
  startNewService: (title: string, pin: string, preferredCode?: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  overwriteExistingService: (roomId: string, code: string, title: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  updateBlock: (blockId: string, newContent: any) => Promise<void>;
  appendItemsToBlock: (blockId: string, newItems: any[]) => Promise<void>;
  removeItemFromBlock: (blockId: string, itemId: string) => Promise<void>;
  sendAlert: (text: string | null) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  resetCurrentService: (newTitle: string) => Promise<void>;
  refreshData: () => Promise<void>;
  updateTitle: (newTitle: string) => Promise<void>;
  updateCode: (newCode: string) => Promise<{ success: boolean; error?: string }>;
  isPulpitPreviewActive: boolean;
  setPulpitPreviewActive: (active: boolean) => void;
}
