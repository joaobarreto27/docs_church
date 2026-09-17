import { useCallback } from 'react';
import { Room, LiturgicalBlock } from '../../types/liturgy';
import { getStoredCache, saveRoomCache } from './roomCacheStorage';

export function useRoomCache(
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>,
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>
) {
  const saveToCache = useCallback((roomData: Room, blocksData: LiturgicalBlock[]) => {
    saveRoomCache(roomData, blocksData);
  }, []);

  const loadFromCache = useCallback(
    (code: string): boolean => {
      const cached = getStoredCache(code);
      if (cached) {
        setRoom(cached.room);
        setBlocks(cached.blocks);
        return true;
      }
      return false;
    },
    [setBlocks, setRoom]
  );

  return { saveToCache, loadFromCache };
}
