import { PendingAppend, PendingBlockUpdate } from './types';

export const PENDING_APPENDS_KEY = 'docs_church_pending_appends';
export const PENDING_BLOCK_UPDATES_KEY = 'docs_church_pending_block_updates';

export function getPendingAppends(): PendingAppend[] {
  try {
    const raw = localStorage.getItem(PENDING_APPENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingAppends(items: PendingAppend[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(PENDING_APPENDS_KEY);
    } else {
      localStorage.setItem(PENDING_APPENDS_KEY, JSON.stringify(items));
    }
  } catch {}
}

export function getPendingBlockUpdates(): Record<string, PendingBlockUpdate> {
  try {
    const raw = localStorage.getItem(PENDING_BLOCK_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePendingBlockUpdates(updates: Record<string, PendingBlockUpdate>): void {
  try {
    if (Object.keys(updates).length === 0) {
      localStorage.removeItem(PENDING_BLOCK_UPDATES_KEY);
    } else {
      localStorage.setItem(PENDING_BLOCK_UPDATES_KEY, JSON.stringify(updates));
    }
  } catch {}
}

export function queuePendingBlockUpdate(blockId: string, roomId: string, content: any): void {
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

export function removePendingBlockUpdate(blockId: string): void {
  const all = getPendingBlockUpdates();
  if (all[blockId]) {
    delete all[blockId];
    savePendingBlockUpdates(all);
  }
}
