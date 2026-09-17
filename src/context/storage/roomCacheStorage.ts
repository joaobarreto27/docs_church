import { Room, LiturgicalBlock } from '../../types/liturgy';

export const CACHE_PREFIX = 'docs_church_cache_';

export function getStoredCache(codeOrId: string): { room: Room; blocks: LiturgicalBlock[] } | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${codeOrId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.room && parsed.blocks) {
        return { room: parsed.room, blocks: parsed.blocks };
      }
    }
    // Fallback resiliente: se a chave da sala mudou, busca por room.id ou room.code
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.room && (parsed.room.id === codeOrId || parsed.room.code === codeOrId)) {
              return { room: parsed.room, blocks: parsed.blocks };
            }
          }
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache local:', e);
  }
  return null;
}

export function saveRoomCache(roomData: Room, blocksData: LiturgicalBlock[]): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${roomData.code}`, JSON.stringify({
      room: roomData,
      blocks: blocksData,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Erro ao gravar cache local:', e);
  }
}

export function clearRoomCache(codeOrId: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${codeOrId}`);
  } catch {}
}
