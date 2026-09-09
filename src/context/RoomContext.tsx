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
  overwriteExistingRoom,
  updateRoomTitle,
  updateRoomCode,
  formatRoomCodeMask,
  joinRoomApi
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
  removeItemFromBlock: (blockId: string, itemId: string) => Promise<void>;
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
  roomId?: string;
  role: UserRole;
  pin?: string;
  sessionToken?: string;
  expiresAt: number;
}



const PENDING_APPENDS_KEY = 'docs_church_pending_appends';
const PENDING_BLOCK_UPDATES_KEY = 'docs_church_pending_block_updates';

interface PendingAppend {
  id: string;
  blockId: string;
  roomId: string;
  newItems: any[];
  timestamp: number;
}

interface PendingBlockUpdate {
  blockId: string;
  roomId: string;
  content: any;
  timestamp: number;
}

function getPendingAppends(): PendingAppend[] {
  try {
    const raw = localStorage.getItem(PENDING_APPENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingAppends(items: PendingAppend[]) {
  try {
    if (items.length === 0) {
      localStorage.removeItem(PENDING_APPENDS_KEY);
    } else {
      localStorage.setItem(PENDING_APPENDS_KEY, JSON.stringify(items));
    }
  } catch {}
}

function getPendingBlockUpdates(): Record<string, PendingBlockUpdate> {
  try {
    const raw = localStorage.getItem(PENDING_BLOCK_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePendingBlockUpdates(updates: Record<string, PendingBlockUpdate>) {
  try {
    if (Object.keys(updates).length === 0) {
      localStorage.removeItem(PENDING_BLOCK_UPDATES_KEY);
    } else {
      localStorage.setItem(PENDING_BLOCK_UPDATES_KEY, JSON.stringify(updates));
    }
  } catch {}
}

function queuePendingBlockUpdate(blockId: string, roomId: string, content: any) {
  const all = getPendingBlockUpdates();
  all[blockId] = {
    blockId,
    roomId,
    content,
    timestamp: Date.now()
  };
  savePendingBlockUpdates(all);

  // Como o bloco inteiro já está salvo com o estado mais recente (incluindo adições),
  // remove appends pendentes deste mesmo bloco para evitar duplicação ao reconectar
  const appends = getPendingAppends();
  const filteredAppends = appends.filter(a => a.blockId !== blockId);
  if (filteredAppends.length !== appends.length) {
    savePendingAppends(filteredAppends);
  }
}

function removePendingBlockUpdate(blockId: string) {
  const all = getPendingBlockUpdates();
  if (all[blockId]) {
    delete all[blockId];
    savePendingBlockUpdates(all);
  }
}

function saveStoredSession(session: StoredSession) {
  try {
    const raw = JSON.stringify(session);
    sessionStorage.setItem(SESSION_KEY, raw);
    localStorage.setItem(SESSION_KEY, raw);
    localStorage.setItem('docs_church_last_code', session.code);
    localStorage.setItem('docs_church_last_role', session.role);
  } catch (e) {}
}

function clearStoredSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

function getStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: StoredSession = JSON.parse(raw);
    const now = Date.now();
    // Se a sessão expirou (mais de 3 horas), remove imediatamente
    if (parsed.expiresAt && now > parsed.expiresAt) {
      clearStoredSession();
      return null;
    }
    if (parsed.code && parsed.role) {
      return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler sessionStorage/localStorage:', e);
  }
  return null;
}

function getStoredCache(codeOrId: string): { room: Room; blocks: LiturgicalBlock[] } | null {
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

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização síncrona imediata para evitar qualquer piscada de tela ao dar refresh
  const [initialSession] = useState<StoredSession | null>(getStoredSession);
  const initialCache = initialSession ? getStoredCache(initialSession.roomId || initialSession.code) : null;

  const [room, setRoom] = useState<Room | null>(initialCache?.room || null);
  const [blocks, setBlocks] = useState<LiturgicalBlock[]>(initialCache?.blocks || []);
  const [role, setRole] = useState<UserRole | null>(initialSession?.role || null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(initialSession?.sessionToken);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isColdStarting, setIsColdStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isFastSync, setIsFastSync] = useState<boolean>(false);
  const [hasFreshUpdates, setHasFreshUpdates] = useState<boolean>(false);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const pollRef = useRef<() => Promise<void>>(async () => {});

  // Refs para controle síncrono atômico de exclusões consecutivas sem race conditions
  const blocksRef = useRef<LiturgicalBlock[]>(blocks);
  const pendingMutationsCountRef = useRef<number>(0);
  const lastMutationTimeRef = useRef<number>(0);
  const blockMutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Mantém blocksRef sempre atualizado com o estado mais recente
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

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
  const fetchFullRoom = useCallback(async (codeOrId: string, isInitial: boolean = false) => {
    if (isInitial) {
      setIsColdStarting(true);
    }

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

      // Sincroniza sessão
      const active = getStoredSession();
      if (active) {
        saveStoredSession({
          ...active,
          code: foundRoom.code,
          roomId: foundRoom.id
        });
      }

      return true;
    } catch (err: any) {
      console.warn('Erro ao conectar ao Neon:', err);
      // Se tiver cache local, usa imediatamente
      const hasCached = loadFromCache(codeOrId);
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

  // Entra na sala com autenticação no servidor
  const joinRoom = useCallback(async (code: string, selectedRole: UserRole, pin?: string): Promise<{ success: boolean; error?: string }> => {
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

      // Salva sessão resiliente (3 horas) persistida para resistir a refresh e hibernação
      saveStoredSession({ 
        code: foundRoom.code, 
        roomId: foundRoom.id,
        role: selectedRole,
        pin: pin || undefined,
        sessionToken: res.sessionToken,
        expiresAt: Date.now() + THREE_HOURS_MS
      });

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
      const { room: newRoom, blocks: newBlocks, sessionToken: newToken } = await createRoom(title, pin, preferredCode);
      setRoom(newRoom);
      setBlocks(newBlocks);
      setRole('controlador');
      setSessionToken(newToken);
      setIsConnected(true);
      setError(null);
      saveToCache(newRoom, newBlocks);

      // Salva sessão resiliente
      saveStoredSession({ 
        code: newRoom.code, 
        roomId: newRoom.id,
        role: 'controlador',
        pin,
        sessionToken: newToken,
        expiresAt: Date.now() + THREE_HOURS_MS
      });

      return { success: true, code: newRoom.code };
    } catch (err: any) {
      console.error('Erro ao criar sala:', err);
      return { success: false, error: err.message || 'Erro ao criar nova sala no servidor.' };
    } finally {
      setIsColdStarting(false);
    }
  }, [saveToCache]);

  // Substitui uma sala existente com folha limpa e novo PIN
  const overwriteExistingService = useCallback(async (roomId: string, code: string, title: string, pin: string): Promise<{ success: boolean; error?: string }> => {
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
        expiresAt: Date.now() + THREE_HOURS_MS
      });

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao substituir sala:', err);
      return { success: false, error: err.message || 'Erro ao substituir o culto existente.' };
    } finally {
      setIsColdStarting(false);
    }
  }, [saveToCache, sessionToken]);

  // Revalida em segundo plano caso exista sessão ativa restaurada
  useEffect(() => {
    const activeSession = getStoredSession();
    if (!activeSession) return;

    // Se temos roomId salvo na sessão ou no cache inicial, usamos prioritariamente para suportar renomeação de chave
    const lookupKey = activeSession.roomId || initialCache?.room?.id || room?.id || activeSession.code;

    // Se não tínhamos cache local dos blocos, busca completo
    if (!room || blocks.length === 0) {
      joinRoom(lookupKey, activeSession.role, activeSession.pin);
    } else {
      // Já tínhamos cache: revalidação silenciosa em background com o Neon
      getRoomMeta(lookupKey).then(async (meta) => {
        if (meta) {
          setIsConnected(true);
          const codeChanged = Boolean(meta.code && meta.code !== room.code);
          const titleChanged = Boolean(meta.title && meta.title !== room.title);
          const versionChanged = meta.version !== room.version;

          if (versionChanged) {
            const updatedBlocks = await getBlocksByRoomId(meta.id || room.id);
            setBlocks(updatedBlocks);
            setRoom(prev => prev ? { 
              ...prev, 
              code: meta.code || prev.code,
              title: meta.title || prev.title,
              version: meta.version,
              active_alert: meta.active_alert,
              current_page: meta.current_page 
            } : null);
            saveToCache({ 
              ...room, 
              code: meta.code || room.code,
              title: meta.title || room.title,
              version: meta.version,
              active_alert: meta.active_alert,
              current_page: meta.current_page 
            }, updatedBlocks);
          } else if (codeChanged || titleChanged) {
            setRoom(prev => prev ? { ...prev, code: meta.code, title: meta.title } : null);
            saveToCache({ ...room, code: meta.code, title: meta.title }, blocksRef.current);
          }

          // Se a chave da sala foi alterada pelo controlador, atualiza a sessão resiliente
          if (codeChanged || activeSession.code !== meta.code || !activeSession.roomId) {
            saveStoredSession({
              ...activeSession,
              code: meta.code,
              roomId: meta.id
            });
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
    setSessionToken(undefined);
    setError(null);
    clearStoredSession();
  }, []);

  // Atualiza bloco de liturgia (substituição integral sequencial com contingência offline)
  const updateBlock = useCallback(async (blockId: string, newContent: any) => {
    if (!room) return;
    
    // Atualização otimista na UI imediata e no ref síncrono
    blocksRef.current = blocksRef.current.map(b => b.id === blockId ? { ...b, content: newContent } : b);
    setBlocks(blocksRef.current);
    saveToCache(room, blocksRef.current);
    pendingMutationsCountRef.current += 1;
    lastMutationTimeRef.current = Date.now();
    
    blockMutationQueueRef.current = blockMutationQueueRef.current
      .then(async () => {
        const block = blocksRef.current.find(b => b.id === blockId);
        const payload = block ? block.content : newContent;
        try {
          await updateBlockContent(blockId, payload, room.id, sessionToken);
          removePendingBlockUpdate(blockId);
          setIsConnected(true);
          broadcastLocalChange();
        } catch (err) {
          console.warn('Erro ao atualizar bloco no Neon (enfileirando offline):', err);
          setIsConnected(false);
          queuePendingBlockUpdate(blockId, room.id, payload);
        }
      })
      .finally(() => {
        pendingMutationsCountRef.current = Math.max(0, pendingMutationsCountRef.current - 1);
      });

    await blockMutationQueueRef.current;
  }, [room, sessionToken, broadcastLocalChange, saveToCache]);

  // Remoção atômica de item (blindagem absoluta contra cliques rápidos consecutivos e contingência offline)
  const removeItemFromBlock = useCallback(async (blockId: string, itemId: string) => {
    if (!room) return;

    // Atualiza imediatamente a referência interna síncrona para que cliques em sequência (1ms) já leiam sem o item
    let updatedContent: any[] = [];
    const nextBlocks = blocksRef.current.map(b => {
      if (b.id === blockId) {
        const current = (b.content || []) as any[];
        updatedContent = current.filter(item => item.id !== itemId);
        return { ...b, content: updatedContent };
      }
      return b;
    });

    blocksRef.current = nextBlocks;
    setBlocks(nextBlocks);
    saveToCache(room, nextBlocks);
    pendingMutationsCountRef.current += 1;
    lastMutationTimeRef.current = Date.now();

    blockMutationQueueRef.current = blockMutationQueueRef.current
      .then(async () => {
        // Envia SEMPRE o estado mais fresco do bloco no momento da execução
        const block = blocksRef.current.find(b => b.id === blockId);
        const payload = block ? block.content : updatedContent;
        try {
          await updateBlockContent(blockId, payload, room.id, sessionToken);
          removePendingBlockUpdate(blockId);
          setIsConnected(true);
          broadcastLocalChange();
        } catch (err) {
          console.warn('Erro ao remover item no Neon (enfileirando offline):', err);
          setIsConnected(false);
          queuePendingBlockUpdate(blockId, room.id, payload);
        }
      })
      .finally(() => {
        pendingMutationsCountRef.current = Math.max(0, pendingMutationsCountRef.current - 1);
      });

    await blockMutationQueueRef.current;
  }, [room, sessionToken, broadcastLocalChange, saveToCache]);

  // Concatenação atômica de itens a um bloco (blindagem total contra concorrência entre múltiplos obreiros e fila offline)
  const appendItemsToBlock = useCallback(async (blockId: string, newItems: any[]) => {
    if (!room || !newItems || newItems.length === 0) return;

    // Atualização otimista imediata na UI local e no ref síncrono
    blocksRef.current = blocksRef.current.map(b => {
      if (b.id === blockId) {
        const current = (b.content || []) as any[];
        return { ...b, content: [...current, ...newItems] };
      }
      return b;
    });
    setBlocks(blocksRef.current);
    saveToCache(room, blocksRef.current);
    pendingMutationsCountRef.current += 1;
    lastMutationTimeRef.current = Date.now();

    blockMutationQueueRef.current = blockMutationQueueRef.current
      .then(async () => {
        try {
          await appendBlockContent(blockId, newItems, room.id);
          setIsConnected(true);
          broadcastLocalChange();
        } catch (err) {
          console.warn('Erro ao concatenar itens no Neon (enfileirando offline):', err);
          setIsConnected(false);
          const pending = getPendingAppends();
          pending.push({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            blockId,
            roomId: room.id,
            newItems,
            timestamp: Date.now()
          });
          savePendingAppends(pending);
        }
      })
      .finally(() => {
        pendingMutationsCountRef.current = Math.max(0, pendingMutationsCountRef.current - 1);
      });

    await blockMutationQueueRef.current;
  }, [room, broadcastLocalChange, saveToCache]);

  // Dispara ou limpa alerta
  const sendAlert = useCallback(async (text: string | null) => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, active_alert: text } : null);
    try {
      await setRoomAlert(room.id, text, sessionToken);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao enviar alerta:', err);
      setIsConnected(false);
    }
  }, [room, sessionToken, broadcastLocalChange]);

  // Atualiza página ativa
  const setPage = useCallback(async (page: number) => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, current_page: page } : null);
    try {
      await setRoomCurrentPage(room.id, page, sessionToken);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao mudar página:', err);
      setIsConnected(false);
    }
  }, [room, sessionToken, broadcastLocalChange]);

  // Reseta culto para uma nova reunião
  const resetCurrentService = useCallback(async (newTitle: string) => {
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
  }, [room, sessionToken, fetchFullRoom, broadcastLocalChange]);

  // Força sincronização manual dos dados da sala
  const refreshData = useCallback(async () => {
    if (!room) return;
    await fetchFullRoom(room.id || room.code);
  }, [room, fetchFullRoom]);

  // Atualiza o nome/título do culto
  const updateTitle = useCallback(async (newTitle: string) => {
    if (!room) return;
    const clean = newTitle.trim();
    if (!clean) return;
    setRoom(prev => prev ? { ...prev, title: clean } : null);
    try {
      await updateRoomTitle(room.id, clean, sessionToken);
      setIsConnected(true);
      broadcastLocalChange();
    } catch (err) {
      console.warn('Erro ao atualizar título do culto:', err);
    }
  }, [room, sessionToken, broadcastLocalChange]);

  // Atualiza o código/chave da sala no formato padrão XXX-XXX
  const updateCode = useCallback(async (newCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!room) return { success: false, error: 'Nenhuma sala ativa.' };
    const formatted = formatRoomCodeMask(newCode);
    const withoutHyphen = formatted.replace(/-/g, '');
    if (withoutHyphen.length < 6) {
      return { success: false, error: 'O código deve conter 6 caracteres no formato XXX-XXX.' };
    }
    try {
      const res = await updateRoomCode(room.id, formatted, sessionToken);
      if (res.success) {
        setRoom(prev => prev ? { ...prev, code: formatted } : null);
        const active = getStoredSession();
        if (active) {
          saveStoredSession({
            ...active,
            code: formatted,
            roomId: room.id,
            sessionToken
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
  }, [room, sessionToken, saveToCache, broadcastLocalChange]);

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

      // Se a sessão de 3 horas expirou, encerra polling e volta ao login
      const currentSession = getStoredSession();
      if (!currentSession) {
        leaveRoom();
        return;
      }

      isPollingRef.current = true;

      try {
        // 1. Se houver blocos corrigidos ou com itens excluídos offline, descarrega primeiro no Neon
        const pendingUpdates = getPendingBlockUpdates();
        const pendingUpdateKeys = Object.keys(pendingUpdates);
        if (pendingUpdateKeys.length > 0) {
          for (const bId of pendingUpdateKeys) {
            const item = pendingUpdates[bId];
            try {
              await updateBlockContent(item.blockId, item.content, item.roomId, sessionToken);
              removePendingBlockUpdate(bId);
            } catch {
              // Se ainda não conseguiu enviar todos por falta de sinal, adia o poll
              return;
            }
          }
        }

        // 2. Se houver itens adicionados offline na fila local, descarrega no Neon
        const pending = getPendingAppends();
        if (pending.length > 0) {
          const remaining: PendingAppend[] = [];
          for (const item of pending) {
            try {
              await appendBlockContent(item.blockId, item.newItems, item.roomId);
            } catch {
              remaining.push(item);
            }
          }
          savePendingAppends(remaining);
          if (remaining.length > 0) {
            // Se ainda não conseguiu enviar todos por falta de sinal, adia o poll
            return;
          }
        }

        // Sincronização inteligente em 1 viagem só: busca versão, código, título e blocos se houver mudança
        const syncResult = await syncRoomState(room.id, room.code, room.version);
        if (syncResult) {
          setIsConnected(true);

          const codeChanged = Boolean(syncResult.code && syncResult.code !== room.code);
          const titleChanged = Boolean(syncResult.title && syncResult.title !== room.title);

          // Se a chave ou o título da sala mudou, sincroniza imediatamente a sessão do obreiro/pulpito
          if (codeChanged || titleChanged) {
            const active = getStoredSession();
            if (active) {
              saveStoredSession({
                ...active,
                code: syncResult.code,
                roomId: syncResult.id || room.id
              });
            }
          }

          if (syncResult.hasChanged) {
            // Se houver mutações locais em andamento ou pendentes na fila offline, não sobrescreve com snapshot antigo
            const hasPendingUpdates = Object.keys(getPendingBlockUpdates()).length > 0;
            const hasPendingAppends = getPendingAppends().length > 0;
            if (
              pendingMutationsCountRef.current > 0 || 
              (Date.now() - lastMutationTimeRef.current < 2500) ||
              hasPendingUpdates ||
              hasPendingAppends
            ) {
              return;
            }

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
              code: syncResult.code || prev.code,
              title: syncResult.title || prev.title,
              version: syncResult.version, 
              active_alert: syncResult.active_alert, 
              current_page: syncResult.current_page 
            } : null);
            saveToCache(
              { 
                ...room, 
                code: syncResult.code || room.code,
                title: syncResult.title || room.title,
                version: syncResult.version, 
                active_alert: syncResult.active_alert, 
                current_page: syncResult.current_page 
              },
              updatedBlocks
            );
          } else if (
            syncResult.active_alert !== room.active_alert || 
            syncResult.current_page !== room.current_page ||
            codeChanged ||
            titleChanged
          ) {
            // Atualiza alerta, página, código ou título mesmo se versão dos blocos for igual
            setRoom(prev => prev ? { 
              ...prev, 
              code: syncResult.code || prev.code,
              title: syncResult.title || prev.title,
              active_alert: syncResult.active_alert, 
              current_page: syncResult.current_page 
            } : null);
            saveToCache(
              {
                ...room,
                code: syncResult.code || room.code,
                title: syncResult.title || room.title,
                active_alert: syncResult.active_alert,
                current_page: syncResult.current_page
              },
              blocksRef.current
            );
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

    const handleOnline = () => {
      setIsConnected(true);
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      poll(); // Sincronização imediata assim que o Wi-Fi/4G reconectar
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }
    scheduleNextPoll();

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [room, role, sessionToken, saveToCache, leaveRoom]);

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
      removeItemFromBlock,
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
