import { useEffect } from 'react';
import { Room, LiturgicalBlock, UserRole } from '../../types/liturgy';
import { getBlocksByRoomId, getRoomMeta } from '../../services/neon';
import { getStoredSession, saveStoredSession } from '../storage';

export interface SessionRevalidationParams {
  room: Room | null;
  blocks: LiturgicalBlock[];
  initialCache: { room: Room; blocks: LiturgicalBlock[] } | null;
  blocksRef: React.MutableRefObject<LiturgicalBlock[]>;
  joinRoom: (code: string, role: UserRole, pin?: string) => Promise<{ success: boolean; error?: string }>;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  setIsConnected: (connected: boolean) => void;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
}

export function useSessionRevalidation({
  room,
  blocks,
  initialCache,
  blocksRef,
  joinRoom,
  setRoom,
  setBlocks,
  setIsConnected,
  saveToCache,
}: SessionRevalidationParams) {
  useEffect(() => {
    const activeSession = getStoredSession();
    if (!activeSession) return;

    const lookupKey = activeSession.roomId || initialCache?.room?.id || room?.id || activeSession.code;

    if (!room || blocks.length === 0) {
      joinRoom(lookupKey, activeSession.role, activeSession.pin);
    } else {
      getRoomMeta(lookupKey)
        .then(async (meta) => {
          if (meta) {
            setIsConnected(true);
            const codeChanged = Boolean(meta.code && meta.code !== room.code);
            const titleChanged = Boolean(meta.title && meta.title !== room.title);
            const versionChanged = meta.version !== room.version;

            if (versionChanged) {
              const updatedBlocks = await getBlocksByRoomId(meta.id || room.id);
              setBlocks(updatedBlocks);
              const nextRoom: Room = {
                ...room,
                code: meta.code || room.code,
                title: meta.title || room.title,
                version: meta.version,
                active_alert: meta.active_alert,
                current_page: meta.current_page,
              };
              setRoom(nextRoom);
              saveToCache(nextRoom, updatedBlocks);
            } else if (codeChanged || titleChanged) {
              setRoom((prev) => (prev ? { ...prev, code: meta.code, title: meta.title } : null));
              saveToCache({ ...room, code: meta.code, title: meta.title }, blocksRef.current);
            }

            if (codeChanged || activeSession.code !== meta.code || !activeSession.roomId) {
              saveStoredSession({
                ...activeSession,
                code: meta.code,
                roomId: meta.id,
              });
            }
          }
        })
        .catch(() => {
          setIsConnected(false);
        });
    }
  }, []);
}
