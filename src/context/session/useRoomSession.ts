import { useCallback } from 'react';
import { Room, LiturgicalBlock, UserRole } from '../../types/liturgy';
import {
  joinRoomApi,
  createRoom,
  overwriteExistingRoom,
  getRoomByCode,
  getBlocksByRoomId,
} from '../../services/neon';
import {
  THREE_HOURS_MS,
  saveStoredSession,
  clearStoredSession,
} from '../storage';
import { useSessionRevalidation } from './useSessionRevalidation';

export interface UseRoomSessionProps {
  room: Room | null;
  blocks: LiturgicalBlock[];
  initialCache: { room: Room; blocks: LiturgicalBlock[] } | null;
  blocksRef: React.MutableRefObject<LiturgicalBlock[]>;
  sessionToken?: string;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  setRole: React.Dispatch<React.SetStateAction<UserRole | null>>;
  setSessionToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsConnected: (connected: boolean) => void;
  setIsColdStarting: (cold: boolean) => void;
  setError: (error: string | null) => void;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
}

export function useRoomSession({
  room,
  blocks,
  initialCache,
  blocksRef,
  sessionToken,
  setRoom,
  setBlocks,
  setRole,
  setSessionToken,
  setIsConnected,
  setIsColdStarting,
  setError,
  saveToCache,
}: UseRoomSessionProps) {
  const joinRoom = useCallback(
    async (code: string, selectedRole: UserRole, pin?: string): Promise<{ success: boolean; error?: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode.length < 3) {
        return { success: false, error: 'Digite um código válido (mínimo 3 caracteres).' };
      }

      setIsColdStarting(true);
      try {
        const res = await joinRoomApi(cleanCode, selectedRole, pin ? pin.trim() : undefined);
        if (!res.success || !res.room) {
          setIsColdStarting(false);
          return { success: false, error: res.error || 'Código de culto não encontrado ou inativo.' };
        }

        const foundRoom = res.room;
        const foundBlocks = res.blocks || [];
        setRoom(foundRoom);
        setBlocks(foundBlocks);
        setRole(selectedRole);
        setSessionToken(res.sessionToken);
        setIsConnected(true);
        setError(null);
        saveToCache(foundRoom, foundBlocks);

        saveStoredSession({
          code: foundRoom.code,
          roomId: foundRoom.id,
          role: selectedRole,
          pin: pin || undefined,
          sessionToken: res.sessionToken,
          expiresAt: Date.now() + THREE_HOURS_MS,
        });

        return { success: true };
      } catch (err: any) {
        console.error('Erro ao conectar:', err);
        setIsColdStarting(false);
        return { success: false, error: 'Não foi possível conectar ao servidor. Verifique a conexão.' };
      } finally {
        setIsColdStarting(false);
      }
    },
    [saveToCache, setBlocks, setError, setIsColdStarting, setIsConnected, setRole, setRoom, setSessionToken]
  );

  const startNewService = useCallback(
    async (title: string, pin: string, preferredCode?: string): Promise<{ success: boolean; code?: string; error?: string }> => {
      setIsColdStarting(true);
      try {
        const { room: newRoom, blocks: newBlocks, sessionToken: newToken } = await createRoom(title, pin, preferredCode);
        setRoom(newRoom);
        setBlocks(newBlocks);
        setRole('controlador');
        setSessionToken(newToken);
        setIsConnected(true);
        setError(null);
        saveToCache(newRoom, newBlocks);

        saveStoredSession({
          code: newRoom.code,
          roomId: newRoom.id,
          role: 'controlador',
          pin,
          sessionToken: newToken,
          expiresAt: Date.now() + THREE_HOURS_MS,
        });

        return { success: true, code: newRoom.code };
      } catch (err: any) {
        console.error('Erro ao criar sala:', err);
        return { success: false, error: err.message || 'Erro ao criar nova sala no servidor.' };
      } finally {
        setIsColdStarting(false);
      }
    },
    [saveToCache, setBlocks, setError, setIsColdStarting, setIsConnected, setRole, setRoom, setSessionToken]
  );

  const overwriteExistingService = useCallback(
    async (roomId: string, code: string, title: string, pin: string): Promise<{ success: boolean; error?: string }> => {
      setIsColdStarting(true);
      try {
        const res = await overwriteExistingRoom(roomId, title, pin, sessionToken);
        const foundRoom = await getRoomByCode(code);
        if (!foundRoom) throw new Error('Sala não encontrada após substituição.');
        const foundBlocks = await getBlocksByRoomId(roomId);

        setRoom(foundRoom);
        setBlocks(foundBlocks);
        setRole('controlador');
        setSessionToken(res.sessionToken);
        setIsConnected(true);
        setError(null);
        saveToCache(foundRoom, foundBlocks);

        saveStoredSession({
          code: foundRoom.code,
          roomId: foundRoom.id,
          role: 'controlador',
          pin,
          sessionToken: res.sessionToken,
          expiresAt: Date.now() + THREE_HOURS_MS,
        });

        return { success: true };
      } catch (err: any) {
        console.error('Erro ao substituir sala:', err);
        return { success: false, error: err.message || 'Erro ao substituir o culto existente.' };
      } finally {
        setIsColdStarting(false);
      }
    },
    [saveToCache, sessionToken, setBlocks, setError, setIsColdStarting, setIsConnected, setRole, setRoom, setSessionToken]
  );

  const leaveRoom = useCallback(() => {
    setRoom(null);
    setBlocks([]);
    setRole(null);
    setSessionToken(undefined);
    setError(null);
    clearStoredSession();
  }, [setBlocks, setError, setRole, setRoom, setSessionToken]);

  useSessionRevalidation({
    room,
    blocks,
    initialCache,
    blocksRef,
    joinRoom,
    setRoom,
    setBlocks,
    setIsConnected,
    saveToCache,
  });

  return {
    joinRoom,
    startNewService,
    overwriteExistingService,
    leaveRoom,
  };
}
