import { updateBlockContent, appendBlockContent } from '../../services/neon';
import {
  getPendingAppends,
  savePendingAppends,
  getPendingBlockUpdates,
  removePendingBlockUpdate,
  PendingAppend,
} from '../storage';

export async function flushPendingOffline(sessionToken?: string): Promise<boolean> {
  // 1. Descarrega blocos corrigidos ou com itens excluídos offline
  const pendingUpdates = getPendingBlockUpdates();
  const pendingUpdateKeys = Object.keys(pendingUpdates);
  if (pendingUpdateKeys.length > 0) {
    for (const bId of pendingUpdateKeys) {
      const item = pendingUpdates[bId];
      try {
        await updateBlockContent(item.blockId, item.content, item.roomId, sessionToken);
        removePendingBlockUpdate(bId);
      } catch {
        return false;
      }
    }
  }

  // 2. Descarrega itens adicionados offline na fila local
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
      return false;
    }
  }

  return true;
}
