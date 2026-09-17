import { Room, LiturgicalBlock } from '../../types/liturgy';
import { getRoomByCode, getBlocksByRoomId } from '../../services/neon';
import { getStoredSession, saveStoredSession } from '../storage';

export interface FetchRoomCallbacks {
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  setIsConnected: (connected: boolean) => void;
  setIsColdStarting: (cold: boolean) => void;
  setError: (error: string | null) => void;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
  loadFromCache: (code: string) => boolean;
}

export async function fetchRoomWithCache(
  codeOrId: string,
  isInitial: boolean,
  callbacks: FetchRoomCallbacks
): Promise<boolean> {
  const { setRoom, setBlocks, setIsConnected, setIsColdStarting, setError, saveToCache, loadFromCache } = callbacks;

  if (isInitial) setIsColdStarting(true);

  try {
    const foundRoom = await getRoomByCode(codeOrId);
    if (!foundRoom) {
      setError('Culto não encontrado com este código.');
      setIsColdStarting(false);
      return false;
    }

    const foundBlocks = await getBlocksByRoomId(foundRoom.id);
    setRoom(foundRoom);
    setBlocks(foundBlocks);
    setIsConnected(true);
    setError(null);
    saveToCache(foundRoom, foundBlocks);

    const active = getStoredSession();
    if (active) {
      saveStoredSession({
        ...active,
        code: foundRoom.code,
        roomId: foundRoom.id,
      });
    }
    return true;
  } catch (err: any) {
    console.warn('Erro ao conectar ao Neon:', err);
    if (loadFromCache(codeOrId)) {
      setIsConnected(false);
      return true;
    }
    setError('Falha ao conectar à sala. Tentando novamente...');
    setIsConnected(false);
    return false;
  } finally {
    setIsColdStarting(false);
  }
}
