import { Room, LiturgicalBlock } from '../../types/liturgy';
import { updateRoomCode, formatRoomCodeMask } from '../../services/neon';
import { getStoredSession, saveStoredSession } from '../storage';

export async function executeRoomCodeUpdate(
  room: Room | null,
  newCode: string,
  sessionToken: string | undefined,
  blocksRef: React.MutableRefObject<LiturgicalBlock[]>,
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>,
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void,
  broadcastLocalChange: () => void
): Promise<{ success: boolean; error?: string }> {
  if (!room) return { success: false, error: 'Nenhuma sala ativa.' };
  const formatted = formatRoomCodeMask(newCode);
  const withoutHyphen = formatted.replace(/-/g, '');
  if (withoutHyphen.length < 6) {
    return { success: false, error: 'O código deve conter 6 caracteres no formato XXX-XXX.' };
  }
  try {
    const res = await updateRoomCode(room.id, formatted, sessionToken);
    if (res.success) {
      setRoom((prev) => (prev ? { ...prev, code: formatted } : null));
      const active = getStoredSession();
      if (active) {
        saveStoredSession({
          ...active,
          code: formatted,
          roomId: room.id,
          sessionToken,
        });
      }
      saveToCache({ ...room, code: formatted }, blocksRef.current);
      broadcastLocalChange();
    }
    return res;
  } catch (err: any) {
    console.warn('Erro ao atualizar código da sala:', err);
    return { success: false, error: 'Falha ao atualizar o código no banco.' };
  }
}
