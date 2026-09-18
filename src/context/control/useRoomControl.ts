import { useCallback } from 'react';
import { Room, LiturgicalBlock } from '../../types/liturgy';
import {
  setRoomAlert,
  setRoomCurrentPage,
  archiveAndResetRoom,
  updateRoomTitle,
  updateRoomHolyricsUrl,
} from '../../services/neon';
import { fetchRoomWithCache } from './fetchRoomService';
import { executeRoomCodeUpdate } from './roomCodeHelper';

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
      return executeRoomCodeUpdate(
        room,
        newCode,
        sessionToken,
        blocksRef,
        setRoom,
        saveToCache,
        broadcastLocalChange
      );
    },
    [room, sessionToken, blocksRef, saveToCache, broadcastLocalChange, setRoom]
  );

  const updateHolyricsUrl = useCallback(
    async (newUrl: string | null, adminKey: string): Promise<{ success: boolean; error?: string }> => {
      if (!room) return { success: false, error: 'Nenhuma sala ativa.' };
      try {
        const res = await updateRoomHolyricsUrl(room.id, newUrl, adminKey, sessionToken);
        if (res.success) {
          setRoom((prev) => (prev ? { ...prev, has_holyrics: res.has_holyrics ?? false } : null));
          broadcastLocalChange();
          return { success: true };
        }
        return { success: false, error: res.error || 'Falha ao salvar URL.' };
      } catch (err: any) {
        return { success: false, error: err.message || 'Erro de conexão.' };
      }
    },
    [room, sessionToken, broadcastLocalChange, setRoom]
  );

  return {
    fetchFullRoom,
    sendAlert,
    setPage,
    resetCurrentService,
    refreshData,
    updateTitle,
    updateCode,
    updateHolyricsUrl,
  };
}
