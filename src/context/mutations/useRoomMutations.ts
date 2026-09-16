import { useRef, useEffect, useCallback } from 'react';
import { Room, LiturgicalBlock } from '../../types/liturgy';
import { updateBlockContent, appendBlockContent } from '../../services/neon';
import {
  getPendingAppends,
  savePendingAppends,
  queuePendingBlockUpdate,
  removePendingBlockUpdate,
} from '../storage';

export interface UseRoomMutationsProps {
  room: Room | null;
  blocks: LiturgicalBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  sessionToken?: string;
  broadcastLocalChange: () => void;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
  setIsConnected: (connected: boolean) => void;
}

export function useRoomMutations({
  room,
  blocks,
  setBlocks,
  sessionToken,
  broadcastLocalChange,
  saveToCache,
  setIsConnected,
}: UseRoomMutationsProps) {
  const blocksRef = useRef<LiturgicalBlock[]>(blocks);
  const pendingMutationsCountRef = useRef<number>(0);
  const lastMutationTimeRef = useRef<number>(0);
  const blockMutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const updateBlock = useCallback(
    async (blockId: string, newContent: any) => {
      if (!room) return;

      blocksRef.current = blocksRef.current.map((b) =>
        b.id === blockId ? { ...b, content: newContent } : b
      );
      setBlocks(blocksRef.current);
      saveToCache(room, blocksRef.current);
      pendingMutationsCountRef.current += 1;
      lastMutationTimeRef.current = Date.now();

      blockMutationQueueRef.current = blockMutationQueueRef.current
        .then(async () => {
          const block = blocksRef.current.find((b) => b.id === blockId);
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
    },
    [room, sessionToken, broadcastLocalChange, saveToCache, setBlocks, setIsConnected]
  );

  const removeItemFromBlock = useCallback(
    async (blockId: string, itemId: string) => {
      if (!room) return;

      let updatedContent: any[] = [];
      const nextBlocks = blocksRef.current.map((b) => {
        if (b.id === blockId) {
          const current = (b.content || []) as any[];
          updatedContent = current.filter((item) => item.id !== itemId);
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
          const block = blocksRef.current.find((b) => b.id === blockId);
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
    },
    [room, sessionToken, broadcastLocalChange, saveToCache, setBlocks, setIsConnected]
  );

  const appendItemsToBlock = useCallback(
    async (blockId: string, newItems: any[]) => {
      if (!room || !newItems || newItems.length === 0) return;

      blocksRef.current = blocksRef.current.map((b) => {
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
              timestamp: Date.now(),
            });
            savePendingAppends(pending);
          }
        })
        .finally(() => {
          pendingMutationsCountRef.current = Math.max(0, pendingMutationsCountRef.current - 1);
        });

      await blockMutationQueueRef.current;
    },
    [room, broadcastLocalChange, saveToCache, setBlocks, setIsConnected]
  );

  return {
    blocksRef,
    pendingMutationsCountRef,
    lastMutationTimeRef,
    blockMutationQueueRef,
    updateBlock,
    removeItemFromBlock,
    appendItemsToBlock,
  };
}
