import { Room, LiturgicalBlock } from '../../types/liturgy';
import { RoomSyncResult, getBlocksByRoomId } from '../../services/neon';
import { saveStoredSession, getStoredSession } from '../storage';

export interface ReconcileParams {
  syncResult: RoomSyncResult;
  room: Room;
  blocksRef: React.MutableRefObject<LiturgicalBlock[]>;
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
  onFreshUpdate: () => void;
}

export async function reconcileSyncResult({
  syncResult,
  room,
  blocksRef,
  setBlocks,
  setRoom,
  saveToCache,
  onFreshUpdate,
}: ReconcileParams): Promise<void> {
  const codeChanged = Boolean(syncResult.code && syncResult.code !== room.code);
  const titleChanged = Boolean(syncResult.title && syncResult.title !== room.title);

  if (codeChanged || titleChanged) {
    const active = getStoredSession();
    if (active) {
      saveStoredSession({
        ...active,
        code: syncResult.code,
        roomId: syncResult.id || room.id,
      });
    }
  }

  if (syncResult.hasChanged) {
    onFreshUpdate();

    let updatedBlocks = syncResult.blocks;
    if (!updatedBlocks || updatedBlocks.length === 0) {
      updatedBlocks = await getBlocksByRoomId(room.id);
    }
    setBlocks(updatedBlocks);
    const updatedRoom: Room = {
      ...room,
      code: syncResult.code || room.code,
      title: syncResult.title || room.title,
      version: syncResult.version,
      active_alert: syncResult.active_alert,
      current_page: syncResult.current_page,
    };
    setRoom(updatedRoom);
    saveToCache(updatedRoom, updatedBlocks);
  } else if (
    syncResult.active_alert !== room.active_alert ||
    syncResult.current_page !== room.current_page ||
    codeChanged ||
    titleChanged
  ) {
    const partialRoom: Room = {
      ...room,
      code: syncResult.code || room.code,
      title: syncResult.title || room.title,
      active_alert: syncResult.active_alert,
      current_page: syncResult.current_page,
    };
    setRoom(partialRoom);
    saveToCache(partialRoom, blocksRef.current);
  }
}
