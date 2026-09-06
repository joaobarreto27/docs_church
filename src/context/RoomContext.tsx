import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Room, LiturgicalBlock, UserRole } from '../types/liturgy';
import { 
  getRoomByCode, 
  getBlocksByRoomId, 
  getRoomMeta, 
  updateBlockContent, 
  setRoomAlert, 
  setRoomCurrentPage, 
  archiveAndResetRoom,
  createRoom 
} from '../services/neon';

interface RoomContextType {
  room: Room | null;
  blocks: LiturgicalBlock[];
  role: UserRole | null;
  isConnected: boolean;
  isColdStarting: boolean;
  error: string | null;
  joinRoom: (code: string, role: UserRole, pin?: string) => Promise<{ success: boolean; error?: string }>;
  startNewService: (title: string, pin: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  leaveRoom: () => void;
  updateBlock: (blockId: string, newContent: any) => Promise<void>;
  sendAlert: (text: string | null) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  resetCurrentService: (newTitle: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const CACHE_PREFIX = 'docs_church_cache_';
const SESSION_KEY = 'docs_church_session';

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [blocks, setBlocks] = useState<LiturgicalBlock[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isColdStarting, setIsColdStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  // Salva no localStorage sempre que receber novos dados
  const saveToCache = useCallback((roomData: Room, blocksData: LiturgicalBlock[]) => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${roomData.code}`, JSON.stringify({
        room: roomData,
        blocks: blocksData,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Erro ao gravar cache local:', e);
    }
  }, []);

  // Carrega do cache se a rede falhar
  const loadFromCache = useCallback((code: string): boolean => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${code}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.room && parsed.blocks) {
          setRoom(parsed.room);
          setBlocks(parsed.blocks);
          return true;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler cache local:', e);
    }
    return false;
  }, []);

  // Busca dados completos da sala
  const fetchFullRoom = useCallback(async (code: string, isInitial: boolean = false) => {
    if (isInitial) {
      setIsColdStarting(true);
    }

    try {
      const foundRoom = await getRoomByCode(code);
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
      return true;
    } catch (err: any) {
      console.warn('Erro ao conectar ao Neon:', err);
      // Se tiver cache local, usa imediatamente
      const hasCached = loadFromCache(code);
      if (hasCached) {
        setIsConnected(false); // Avisa que está operando offline
        return true;
      }
      setError('Falha ao conectar à sala. Tentando novamente...');
      setIsConnected(false);
      return false;
    } finally {
      setIsColdStarting(false);
    }
  }, [loadFromCache, saveToCache]);

  // Entra na sala
  const joinRoom = useCallback(async (code: string, selectedRole: UserRole, pin?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 3) {
      return { success: false, error: 'Digite um código válido (Ex: ADU-PNO).' };
    }

    setIsColdStarting(true);
    try {
      const foundRoom = await getRoomByCode(cleanCode);
      if (!foundRoom) {
        setIsColdStarting(false);
        return { success: false, error: 'Código de culto não encontrado ou inativo.' };
      }

      // Valida PIN de 4 dígitos para o papel de Controlador
      if (selectedRole === 'controlador') {
        if (!pin || pin !== foundRoom.controller_pin) {
          setIsColdStarting(false);
          return { success: false, error: 'PIN do Controlador incorreto (4 dígitos).' };
        }
      }

      const foundBlocks = await getBlocksByRoomId(foundRoom.id);
      setRoom(foundRoom);
      setBlocks(foundBlocks);
      setRole(selectedRole);
      setIsConnected(true);
      setError(null);
      saveToCache(foundRoom, foundBlocks);

      // Salva sessão no sessionStorage para reabertura de aba
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ code: cleanCode, role: selectedRole }));
      } catch (e) {}

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao conectar:', err);
      setIsColdStarting(false);
      return { success: false, error: 'Não foi possível conectar ao servidor. Verifique a conexão.' };
    } finally {
      setIsColdStarting(false);
    }
  }, [saveToCache]);

  // Cria uma nova sala
  const startNewService = useCallback(async (title: string, pin: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    setIsColdStarting(true);
    try {
      const { room: newRoom, blocks: newBlocks } = await createRoom(title, pin);
      setRoom(newRoom);
      setBlocks(newBlocks);
      setRole('controlador');
      setIsConnected(true);
      setError(null);
      saveToCache(newRoom, newBlocks);
      return { success: true, code: newRoom.code };
    } catch (err: any) {
      console.error('Erro ao criar sala:', err);
      return { success: false, error: 'Erro ao criar nova sala no Neon.' };
    } finally {
      setIsColdStarting(false);
    }
  }, [saveToCache]);

  // Sai da sala
  const leaveRoom = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    setRoom(null);
    setBlocks([]);
    setRole(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }, []);

  // Atualiza bloco de liturgia
  const updateBlock = useCallback(async (blockId: string, newContent: any) => {
    if (!room) return;
    
    // Atualização otimista na UI imediata
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b));
    
    try {
      await updateBlockContent(blockId, newContent, room.id);
      setIsConnected(true);
    } catch (err) {
      console.warn('Erro ao atualizar bloco no Neon:', err);
      setIsConnected(false);
    }
  }, [room]);

  // Dispara ou limpa alerta
  const sendAlert = useCallback(async (text: string | null) => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, active_alert: text } : null);
    try {
      await setRoomAlert(room.id, text);
      setIsConnected(true);
    } catch (err) {
      console.warn('Erro ao enviar alerta:', err);
      setIsConnected(false);
    }
  }, [room]);

  // Atualiza página ativa
  const setPage = useCallback(async (page: number) => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, current_page: page } : null);
    try {
      await setRoomCurrentPage(room.id, page);
      setIsConnected(true);
    } catch (err) {
      console.warn('Erro ao mudar página:', err);
      setIsConnected(false);
    }
  }, [room]);

  // Reseta culto para uma nova reunião
  const resetCurrentService = useCallback(async (newTitle: string) => {
    if (!room) return;
    setIsColdStarting(true);
    try {
      await archiveAndResetRoom(room.id, newTitle);
      await fetchFullRoom(room.code);
    } catch (err) {
      console.error('Erro ao reiniciar culto:', err);
    } finally {
      setIsColdStarting(false);
    }
  }, [room, fetchFullRoom]);

  // Loop de Smart-Polling leve (a cada 2 segundos)
  useEffect(() => {
    if (!room) return;

    const poll = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const meta = await getRoomMeta(room.code);
        if (meta) {
          setIsConnected(true);

          // Se a versão mudou, busca blocos atualizados
          if (meta.version !== room.version) {
            const updatedBlocks = await getBlocksByRoomId(room.id);
            setBlocks(updatedBlocks);
            setRoom(prev => prev ? { 
              ...prev, 
              version: meta.version,
              active_alert: meta.active_alert,
              current_page: meta.current_page 
            } : null);
            saveToCache({ ...room, ...meta }, updatedBlocks);
          } else if (meta.active_alert !== room.active_alert || meta.current_page !== room.current_page) {
            // Atualiza alerta e página mesmo se versão for igual
            setRoom(prev => prev ? { 
              ...prev, 
              active_alert: meta.active_alert,
              current_page: meta.current_page 
            } : null);
          }
        }
      } catch (err) {
        // Falha silenciosa de rede: continua exibindo a tela sem erros bloqueantes
        setIsConnected(false);
      } finally {
        isPollingRef.current = false;
      }
    };

    pollTimerRef.current = setInterval(poll, 2000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [room, saveToCache]);

  return (
    <RoomContext.Provider value={{
      room,
      blocks,
      role,
      isConnected,
      isColdStarting,
      error,
      joinRoom,
      startNewService,
      leaveRoom,
      updateBlock,
      sendAlert,
      setPage,
      resetCurrentService,
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom deve ser utilizado dentro de um RoomProvider');
  }
  return context;
};
