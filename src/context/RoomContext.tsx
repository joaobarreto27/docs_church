import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Room, LiturgicalBlock, UserRole } from '../types/liturgy';
import { 
  getRoomByCode, 
  getBlocksByRoomId, 
  getRoomMeta, 
  syncRoomState,
  updateBlockContent,
  appendBlockContent,
  setRoomAlert, 
  setRoomCurrentPage, 
  archiveAndResetRoom,
  createRoom,
  verifyControllerPin,
  overwriteExistingRoom,
  updateRoomTitle,
  updateRoomCode,
  formatRoomCodeMask 
} from '../services/neon';

interface RoomContextType {
  room: Room | null;
  blocks: LiturgicalBlock[];
  role: UserRole | null;
  isConnected: boolean;
  isColdStarting: boolean;
  isFastSync: boolean;
  hasFreshUpdates: boolean;
  error: string | null;
  joinRoom: (code: string, role: UserRole, pin?: string) => Promise<{ success: boolean; error?: string }>;
  startNewService: (title: string, pin: string, preferredCode?: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  overwriteExistingService: (roomId: string, code: string, title: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  updateBlock: (blockId: string, newContent: any) => Promise<void>;
  appendItemsToBlock: (blockId: string, newItems: any[]) => Promise<void>;
  sendAlert: (text: string | null) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  resetCurrentService: (newTitle: string) => Promise<void>;
  refreshData: () => Promise<void>;
  updateTitle: (newTitle: string) => Promise<void>;
  updateCode: (newCode: string) => Promise<{ success: boolean; error?: string }>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const CACHE_PREFIX = 'docs_church_cache_';
const SESSION_KEY = 'docs_church_session';
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const FAST_SYNC_THRESHOLD_MS = 2.5 * 60 * 1000; // 150.000 ms = 2,5 minutos de modo rápido
const BROADCAST_SYNC_KEY = 'docs_church_intertab_sync';

interface StoredSession {
  code: string;
  role: UserRole;
  pin?: string;
  expiresAt: number;
}

function getStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: StoredSession = JSON.parse(raw);
    const now = Date.now();
    // Se a sessão expirou (mais de 3 horas), remove imediatamente
    if (parsed.expiresAt && now > parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (parsed.code && parsed.role) {
      return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler sessionStorage:', e);
  }
  return null;
}

function getStoredCache(code: string): { room: Room; blocks: LiturgicalBlock[] } | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${code}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.room && parsed.blocks) {
        return { room: parsed.room, blocks: parsed.blocks };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache local:', e);
  }
  return null;
}

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização síncrona imediata para evitar qualquer piscada de tela ao dar refresh
  const [initialSession] = useState<StoredSession | null>(getStoredSession);
  const initialCache = initialSession?.code ? getStoredCache(initialSession.code) : null;

  const [room, setRoom] = useState<Room | null>(initialCache?.room || null);
  const [blocks, setBlocks] = useState<LiturgicalBlock[]>(initialCache?.blocks || []);
  const [role, setRole] = useState<UserRole | null>(initialSession?.role || null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isColdStarting, setIsColdStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isFastSync, setIsFastSync] = useState<boolean>(false);
  const [hasFreshUpdates, setHasFreshUpdates] = useState<boolean>(false);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const pollRef = useRef<() => Promise<void>>(async () => {});

  // Transmite aviso imediato para outras abas na mesma máquina (0ms via BroadcastChannel ou localStorage)
  const broadcastLocalChange = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setIsFastSync(true);
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(BROADCAST_SYNC_KEY);
        channel.postMessage({ type: 'CHANGE_OCCURRED', timestamp: Date.now() });
        channel.close();
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BROADCAST_SYNC_KEY, String(Date.now()));
      }
    } catch (e) {}
  }, []);

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
    const cached = getStoredCache(code);
    if (cached) {
      setRoom(cached.room);
      setBlocks(cached.blocks);
      return true;
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
      return { success: false, error: 'Digite um código válido (mínimo 3 caracteres).' };
    }

    setIsColdStarting(true);
    try {
      const foundRoom = await getRoomByCode(cleanCode);
      if (!foundRoom) {
        setIsColdStarting(false);
        return { success: false, error: 'Código de culto não encontrado ou inativo.' };
      }

      // SEGURANÇA: Validação do PIN do Controlador diretamente no servidor Neon
      if (selectedRole === 'controlador') {
        if (!pin || pin.trim().length < 4) {
          setIsColdStarting(false);
          return { success: false, error: 'O papel de Controlador exige um PIN de pelo menos 4 dígitos.' };
        }
        const isValidPin = await verifyControllerPin(cleanCode, pin.trim());
        if (!isValidPin) {
          setIsColdStarting(false);
          return { success: false, error: 'PIN do Controlador incorreto.' };
        }
      }

      const foundBlocks = await getBlocksByRoomId(foundRoom.id);
      setRoom(foundRoom);
      setBlocks(foundBlocks);
      setRole(selectedRole);
      setIsConnected(true);
      setError(null);
      saveToCache(foundRoom, foundBlocks);

      // Salva sessão no sessionStorage com validade de 3 horas para resistir a refresh
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ 
          code: cleanCode, 
          role: selectedRole,
          pin: pin || undefined,
          expiresAt: Date.now() + THREE_HOURS_MS
        }));
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
  const startNewService = useCallback(async (title: string, pin: string, preferredCode?: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    setIsColdStarting(true);
    try {
      const { room: newRoom, blocks: newBlocks } = await createRoom(title, pin, preferredCode);
      setRoom(newRoom);
      setBlocks(newBlocks);
      setRole('controlador');
      setIsConnected(true);
      setError(null);
      saveToCache(newRoom, newBlocks);

      // Salva sessão de 3 horas no sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ 
          code: newRoom.code, 
          role: 'controlador',
          pin,
          expiresAt: Date.now() + THREE_HOURS_MS
        }));
      } catch (e) {}

      return { success: true, code: newRoom.code };
    } catch (err: any) {
      console.error('Erro ao criar sala:', err);
      return { success: false, error: 'Erro ao criar nova sala no Neon.' };
    } finally {
      setIsColdStarting(false);
    }
  }, [saveToCache]);

  // Substitui uma sala existente com folha limpa e novo PIN
  const overwriteExistingService = useCallback(async (roomId: string, code: string, title: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    setIsColdStarting(true);
    try {
      await overwriteExistingRoom(roomId, title, pin);
      const foundRoom = await getRoomByCode(code);
      if (!foundRoom) throw new Error('Sala não encontrada após substituição.');
      const foundBlocks = await getBlocksByRoomId(roomId);

      setRoom(foundRoom);
      setBlocks(foundBlocks);
      setRole('controlador');
      setIsConnected(true);
      setError(null);
      saveToCache(foundRoom, foundBlocks);

      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          code: foundRoom.code,
          role: 'controlador',
          pin,
          expiresAt: Date.now() + THREE_HOURS_MS
        }));
      } catch (e) {}

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao substituir sala:', err);
      return { success: false, error: 'Erro ao substituir o culto existente.' };
    } finally {
      setIsColdStarting(false);
    }
  }, [saveToCache]);

  // Revalida em segundo plano caso exista sessão ativa restaurada
  useEffect(() => {
    const activeSession = getStoredSession();
    if (!activeSession) return;

    // Se não tínhamos cache local dos blocos, busca completo
    if (!room || blocks.length === 0) {
      joinRoom(activeSession.code, activeSession.role, activeSession.pin);
    } else {
      // Já tínhamos cache: revalidação silenciosa em background com o Neon
      getRoomMeta(activeSession.code).then(async (meta) => {
        if (meta) {
          setIsConnected(true);
          if (meta.version !== room.version) {
            const updatedBlocks = await getBlocksByRoomId(room.id);
            setBlocks(updatedBlocks);
            setRoom(prev => prev ? { ...prev, ...meta } : null);
            saveToCache({ ...room, ...meta }, updatedBlocks);
          }
        }
      }).catch(() => {
        // Modo offline silencioso
        setIsConnected(false);
      });
    }
  }, []);

  // Sai da sala e limpa sessão
  const leaveRoom = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setRoom(null);
    setBlocks([]);
    setRole(null);
    setError(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }, []);

  // Atualiza bloco de liturgia (substituição integral)
  const updateBlock = useCallback(async (blockId: string, newContent: any) => {
    if (!room) return;
    
    // Atualização otimista na UI imediata
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b));
    
    try {
      await updateBlockContent(blockId, newContent, room.id);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao atualizar bloco no Neon:', err);
      setIsConnected(false);
    }
  }, [room, broadcastLocalChange]);

  // Concatenação atômica de itens a um bloco (blindagem total contra concorrência entre múltiplos obreiros)
  const appendItemsToBlock = useCallback(async (blockId: string, newItems: any[]) => {
    if (!room || !newItems || newItems.length === 0) return;

    // Atualização otimista imediata na UI local
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const current = (b.content || []) as any[];
        return { ...b, content: [...current, ...newItems] };
      }
      return b;
    }));

    try {
      await appendBlockContent(blockId, newItems, room.id);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao concatenar itens no Neon:', err);
      setIsConnected(false);
    }
  }, [room, broadcastLocalChange]);

  // Dispara ou limpa alerta
  const sendAlert = useCallback(async (text: string | null) => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, active_alert: text } : null);
    try {
      await setRoomAlert(room.id, text);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao enviar alerta:', err);
      setIsConnected(false);
    }
  }, [room, broadcastLocalChange]);

  // Atualiza página ativa
  const setPage = useCallback(async (page: number) => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, current_page: page } : null);
    try {
      await setRoomCurrentPage(room.id, page);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao mudar página:', err);
      setIsConnected(false);
    }
  }, [room, broadcastLocalChange]);

  // Reseta culto para uma nova reunião
  const resetCurrentService = useCallback(async (newTitle: string) => {
    if (!room) return;
    setIsColdStarting(true);
    try {
      await archiveAndResetRoom(room.id, newTitle);
      await fetchFullRoom(room.code);
      broadcastLocalChange();
    } catch (err) {
      console.error('Erro ao reiniciar culto:', err);
    } finally {
      setIsColdStarting(false);
    }
  }, [room, fetchFullRoom, broadcastLocalChange]);

  // Força sincronização manual dos dados da sala
  const refreshData = useCallback(async () => {
    if (!room) return;
    await fetchFullRoom(room.code);
  }, [room, fetchFullRoom]);

  // Atualiza o nome/título do culto
  const updateTitle = useCallback(async (newTitle: string) => {
    if (!room) return;
    const clean = newTitle.trim();
    if (!clean) return;
    setRoom(prev => prev ? { ...prev, title: clean } : null);
    try {
      await updateRoomTitle(room.id, clean);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao atualizar título do culto:', err);
    }
  }, [room, broadcastLocalChange]);

  // Atualiza o código/chave da sala no formato padrão XXX-XXX
  const updateCode = useCallback(async (newCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!room) return { success: false, error: 'Nenhuma sala ativa.' };
    const formatted = formatRoomCodeMask(newCode);
    const withoutHyphen = formatted.replace(/-/g, '');
    if (withoutHyphen.length < 6) {
      return { success: false, error: 'O código deve conter 6 caracteres no formato XXX-XXX.' };
    }
    try {
      const res = await updateRoomCode(room.id, formatted);
      if (res.success) {
        setRoom(prev => prev ? { ...prev, code: formatted } : null);
        try {
          const active = getStoredSession();
          if (active) {
            active.code = formatted;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(active));
          }
        } catch (e) {}
        broadcastLocalChange();
      }
      return res;
    } catch (err: any) {
      console.warn('Erro ao atualizar código da sala:', err);
      return { success: false, error: 'Falha ao atualizar o código no banco.' };
    }
  }, [room, broadcastLocalChange]);

  // Escuta avisos imediatos de outras abas na mesma máquina (0ms via BroadcastChannel ou storage)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSyncNotice = () => {
      lastActivityTimeRef.current = Date.now();
      setIsFastSync(true);
      if (pollRef.current) {
        pollRef.current();
      }
    };

    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(BROADCAST_SYNC_KEY);
        channel.onmessage = handleSyncNotice;
        return () => {
          try { channel.close(); } catch (e) {}
        };
      } catch (e) {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === BROADCAST_SYNC_KEY) {
        handleSyncNotice();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Loop de Smart-Polling Adaptativo (2,5 minutos de Modo Rápido + 0-waterfall sync)
  // - Púlpito: 2.0s no modo rápido / 6.0s no modo lento (após 2,5min sem alterações)
  // - Cabine: 2.5s no modo rápido / 6.0s no modo lento
  // - Obreiro: 30s (aparelho anotador antigo / KitKat)
  useEffect(() => {
    if (!room) return;

    const getDynamicPollingInterval = (): number => {
      if (role === 'obreiro') return 30000;
      const timeSinceLast = Date.now() - lastActivityTimeRef.current;
      const isFast = timeSinceLast < FAST_SYNC_THRESHOLD_MS;
      setIsFastSync(isFast);
      if (isFast) {
        return role === 'pastor' ? 2000 : 2500;
      }
      return 6000;
    };

    const scheduleNextPoll = (customDelayMs?: number) => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      const delay = customDelayMs ?? getDynamicPollingInterval();
      pollTimerRef.current = setTimeout(poll, delay);
    };

    const poll = async () => {
      if (isPollingRef.current) return;

      // Se a aba estiver minimizada ou tela desligada, economiza Neon e bateria
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      // Se a sessão de 3 horas na aba expirou, encerra polling e volta ao login para poupar Neon/Vercel
      const currentSession = getStoredSession();
      if (!currentSession) {
        leaveRoom();
        return;
      }

      isPollingRef.current = true;

      try {
        // Sincronização inteligente em 1 viagem só: busca versão e blocos se houver mudança
        const syncResult = await syncRoomState(room.id, room.code, room.version);
        if (syncResult) {
          setIsConnected(true);

          if (syncResult.hasChanged) {
            // Reinicia a janela de 2,5 minutos de modo rápido
            lastActivityTimeRef.current = Date.now();
            setIsFastSync(true);
            setHasFreshUpdates(true);
            setTimeout(() => setHasFreshUpdates(false), 3500);

            let updatedBlocks = syncResult.blocks;
            if (!updatedBlocks || updatedBlocks.length === 0) {
              updatedBlocks = await getBlocksByRoomId(room.id);
            }
            setBlocks(updatedBlocks);
            setRoom(prev => prev ? { 
              ...prev, 
              version: syncResult.version,
              active_alert: syncResult.active_alert,
              current_page: syncResult.current_page 
            } : null);
            saveToCache(
              { ...room, version: syncResult.version, active_alert: syncResult.active_alert, current_page: syncResult.current_page },
              updatedBlocks
            );
          } else if (syncResult.active_alert !== room.active_alert || syncResult.current_page !== room.current_page) {
            // Atualiza alerta ou página mesmo se versão dos blocos for igual
            setRoom(prev => prev ? { 
              ...prev, 
              active_alert: syncResult.active_alert,
              current_page: syncResult.current_page 
            } : null);
          }
        }
      } catch (err) {
        // Falha silenciosa de rede: continua exibindo a tela sem erros bloqueantes
        setIsConnected(false);
        const backoffInterval = role === 'obreiro' ? 45000 : 7000;
        scheduleNextPoll(backoffInterval);
        return;
      } finally {
        isPollingRef.current = false;
        scheduleNextPoll();
      }
    };

    pollRef.current = poll;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        poll(); // Sincronização imediata ao acordar a tela
      } else {
        if (pollTimerRef.current) {
          clearTimeout(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    scheduleNextPoll();

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [room, role, saveToCache, leaveRoom]);

  return (
    <RoomContext.Provider value={{
      room,
      blocks,
      role,
      isConnected,
      isColdStarting,
      isFastSync,
      hasFreshUpdates,
      error,
      joinRoom,
      startNewService,
      overwriteExistingService,
      leaveRoom,
      updateBlock,
      appendItemsToBlock,
      sendAlert,
      setPage,
      resetCurrentService,
      refreshData,
      updateTitle,
      updateCode,
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
