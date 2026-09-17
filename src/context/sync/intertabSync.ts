export const BROADCAST_SYNC_KEY = 'docs_church_intertab_sync';

/**
 * Transmite aviso imediato para outras abas na mesma máquina (0ms).
 * Possui fallback com localStorage para compatibilidade garantida com Android 4.4.4 KitKat.
 */
export function broadcastLocalChange(): void {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_SYNC_KEY);
      channel.postMessage({ type: 'CHANGE_OCCURRED', timestamp: Date.now() });
      channel.close();
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BROADCAST_SYNC_KEY, String(Date.now()));
    }
  } catch {}
}

/**
 * Escuta notificações de sincronização disparadas por outras abas da mesma sala.
 * Suporta BroadcastChannel moderno e fallback via storage event para Android 4.4.4 KitKat.
 */
export function subscribeToIntertabChanges(onSyncNotice: () => void): () => void {
  let channel: BroadcastChannel | null = null;

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(BROADCAST_SYNC_KEY);
      channel.onmessage = (e) => {
        if (e.data && e.data.type === 'CHANGE_OCCURRED') {
          onSyncNotice();
        }
      };
    } catch {}
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === BROADCAST_SYNC_KEY) {
      onSyncNotice();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
