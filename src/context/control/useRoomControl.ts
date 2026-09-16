import { useCallback } from 'react';
import { Room, LiturgicalBlock } from '../../types/liturgy';
import {
  setRoomAlert,
  setRoomCurrentPage,
  archiveAndResetRoom,
  updateRoomTitle,
  updateRoomCode,
  formatRoomCodeMask,
} from '../../services/neon';
import { getStoredSession, saveStoredSession } from '../storage';
import { fetchRoomWithCache } from './fetchRoomService';

export interface UseRoomControlProps {
  room: Room | null;
  sessionToken?: string;
  blocksRef: React.MutableRefObject<LiturgicalBlock[]>;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  setIsConnected: (connected: boolean) => void;
  setIsColdStarting: (cold: boolean) => void;
  setError: (error: string | null) => void;
  broadcastLocalChange: () => void;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
  loadFromCache: (code: string) => boolean;
}

export function useRoomControl({
  room,
  sessionToken,
  blocksRef,
  setRoom,
  setBlocks,
  setIsConnected,
  setIsColdStarting,
  setError,
  broadcastLocalChange,
  saveToCache,
  loadFromCache,
}: UseRoomControlProps) {
  const fetchFullRoom = useCallback(
    async (codeOrId: string, isInitial: boolean = false) => {
      return fetchRoomWithCache(codeOrId, isInitial, {
        setRoom,
        setBlocks,
        setIsConnected,
        setIsColdStarting,
        setError,
        saveToCache,
        loadFromCache,
      });
    },
    [loadFromCache, saveToCache, setBlocks, setError, setIsColdStarting, setIsConnected, setRoom]
  );

  const sendAlert = useCallback(
    async (text: string | null) => {
      if (!room) return;
      setRoom((prev) => (prev ? { ...prev, active_alert: text } : null));
      try {
        await setRoomAlert(room.id, text, sessionToken);
        setIsConnected(true);
        broadcastLocalChange();
      } catch (err) {
        console.warn('Erro ao enviar alerta:', err);
        setIsConnected(false);
      }
    },
    [room, sessionToken, broadcastLocalChange, setIsConnected, setRoom]
  );

  const setPage = useCallback(
    async (page: number) => {
      if (!room) return;
      setRoom((prev) => (prev ? { ...prev, current_page: page } : null));
      try {
        await setRoomCurrentPage(room.id, page, sessionToken);
        setIsConnected(true);
        broadcastLocalChange();
      } catch (err) {
        console.warn('Erro ao mudar página:', err);
        setIsConnected(false);
      }
    },
    [room, sessionToken, broadcastLocalChange, setIsConnected, setRoom]
  );

  const resetCurrentService = useCallback(
    async (newTitle: string) => {
      if (!room) return;
      setIsColdStarting(true);
      try {
        await archiveAndResetRoom(room.id, newTitle, sessionToken);
        await fetchFullRoom(room.id || room.code);
        broadcastLocalChange();
      } catch (err) {
        console.error('Erro ao reiniciar culto:', err);
      } finally {
        setIsColdStarting(false);
      }
    },
    [room, sessionToken, fetchFullRoom, broadcastLocalChange, setIsColdStarting]
  );

  const refreshData = useCallback(async () => {
    if (!room) return;
    await fetchFullRoom(room.id || room.code);
  }, [room, fetchFullRoom]);

  const updateTitle = useCallback(
    async (newTitle: string) => {
      if (!room) return;
      const clean = newTitle.trim();
      if (!clean) return;
      setRoom((prev) => (prev ? { ...prev, title: clean } : null));
      try {
        await updateRoomTitle(room.id, clean, sessionToken);
        setIsConnected(true);
        broadcastLocalChange();
      } catch (err) {
        console.warn('Erro ao atualizar título do culto:', err);
      }
    },
    [room, sessionToken, broadcastLocalChange, setIsConnected, setRoom]
  );

  const updateCode = useCallback(
    async (newCode: string): Promise<{ success: boolean; error?: string }> => {
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
    },
    [room, sessionToken, blocksRef, saveToCache, broadcastLocalChange, setRoom]
  );

  return {
    fetchFullRoom,
    sendAlert,
    setPage,
    resetCurrentService,
    refreshData,
    updateTitle,
    updateCode,
  };
}
