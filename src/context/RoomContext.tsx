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
  isPulpitPreviewActive: boolean;
  setPulpitPreviewActive: (active: boolean) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

import {
  StoredSession,
  PendingAppend,
  THREE_HOURS_MS,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  getStoredCache,
  saveRoomCache,
  getPendingAppends,
  savePendingAppends,
  getPendingBlockUpdates,
  queuePendingBlockUpdate,
  removePendingBlockUpdate
} from './storage';

import {
  broadcastLocalChange as triggerIntertabBroadcast,
  subscribeToIntertabChanges,
  calculatePollingInterval,
  getBackoffInterval
} from './sync';

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
  const [isPulpitPreviewActive, setIsPulpitPreviewActive] = useState<boolean>(false);
  const isPulpitPreviewActiveRef = useRef<boolean>(false);
  isPulpitPreviewActiveRef.current = isPulpitPreviewActive;
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
    triggerIntertabBroadcast();
  }, []);

  // Salva no localStorage sempre que receber novos dados
  const saveToCache = useCallback((roomData: Room, blocksData: LiturgicalBlock[]) => {
    saveRoomCache(roomData, blocksData);
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
    return subscribeToIntertabChanges(() => {
      lastActivityTimeRef.current = Date.now();
      setIsFastSync(true);
      if (pollRef.current) {
        pollRef.current();
      }
    });
  }, []);

  // Loop de Smart-Polling Adaptativo (2,5 minutos de Modo Rápido + 0-waterfall sync)
  // - Púlpito: 2.0s no modo rápido / 6.0s no modo lento (após 2,5min sem alterações)
  // - Cabine: 2.5s no modo rápido / 6.0s no modo lento
  // - Obreiro: 30s (aparelho anotador antigo / KitKat)
  useEffect(() => {
    if (!room) return;

    const getDynamicPollingInterval = (): number => {
      const result = calculatePollingInterval({
        role,
        isPulpitPreviewActive: isPulpitPreviewActiveRef.current,
        lastActivityTime: lastActivityTimeRef.current
      });
      setIsFastSync(result.isFast);
      return result.interval;
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
        const backoffInterval = getBackoffInterval(role);
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
  }, [room, role, sessionToken, saveToCache, leaveRoom, isPulpitPreviewActive]);

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
      isPulpitPreviewActive,
      setPulpitPreviewActive: setIsPulpitPreviewActive,
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
