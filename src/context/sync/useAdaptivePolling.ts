import { useEffect, useRef } from 'react';
import { Room, LiturgicalBlock, UserRole } from '../../types/liturgy';
import { syncRoomState } from '../../services/neon';
import {
  getStoredSession,
  getPendingAppends,
  getPendingBlockUpdates,
} from '../storage';
import { subscribeToIntertabChanges } from './intertabSync';
import { calculatePollingInterval, getBackoffInterval } from './pollingInterval';
import { flushPendingOffline } from './flushPendingOffline';
import { reconcileSyncResult } from './reconcileSyncResult';

export interface UseAdaptivePollingProps {
  room: Room | null;
  role: UserRole | null;
  sessionToken?: string;
  isPulpitPreviewActive: boolean;
  blocksRef: React.MutableRefObject<LiturgicalBlock[]>;
  pendingMutationsCountRef: React.MutableRefObject<number>;
  lastMutationTimeRef: React.MutableRefObject<number>;
  lastActivityTimeRef: React.MutableRefObject<number>;
  setRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  setBlocks: React.Dispatch<React.SetStateAction<LiturgicalBlock[]>>;
  setIsConnected: (connected: boolean) => void;
  setIsFastSync: (fast: boolean) => void;
  setHasFreshUpdates: (fresh: boolean) => void;
  saveToCache: (roomData: Room, blocksData: LiturgicalBlock[]) => void;
  leaveRoom: () => void;
}

export function useAdaptivePolling({
  room,
  role,
  sessionToken,
  isPulpitPreviewActive,
  blocksRef,
  pendingMutationsCountRef,
  lastMutationTimeRef,
  lastActivityTimeRef,
  setRoom,
  setBlocks,
  setIsConnected,
  setIsFastSync,
  setHasFreshUpdates,
  saveToCache,
  leaveRoom,
}: UseAdaptivePollingProps) {
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const pollRef = useRef<() => Promise<void>>(async () => {});
  const isPulpitPreviewActiveRef = useRef<boolean>(isPulpitPreviewActive);
  isPulpitPreviewActiveRef.current = isPulpitPreviewActive;

  useEffect(() => {
    return subscribeToIntertabChanges(() => {
      lastActivityTimeRef.current = Date.now();
      setIsFastSync(true);
      if (pollRef.current) pollRef.current();
    });
  }, [lastActivityTimeRef, setIsFastSync]);

  useEffect(() => {
    if (!room) return;

    const getDynamicInterval = (): number => {
      const res = calculatePollingInterval({
        role,
        isPulpitPreviewActive: isPulpitPreviewActiveRef.current,
        lastActivityTime: lastActivityTimeRef.current,
      });
      setIsFastSync(res.isFast);
      return res.interval;
    };

    const scheduleNextPoll = (customDelayMs?: number) => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = setTimeout(poll, customDelayMs ?? getDynamicInterval());
    };

    const poll = async () => {
      if (isPollingRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      if (!getStoredSession()) {
        leaveRoom();
        return;
      }

      isPollingRef.current = true;
      try {
        const flushed = await flushPendingOffline(sessionToken);
        if (!flushed) return;

        const syncResult = await syncRoomState(room.id, room.code, room.version);
        if (syncResult) {
          setIsConnected(true);
          const hasLocalPending =
            pendingMutationsCountRef.current > 0 ||
            Date.now() - lastMutationTimeRef.current < 2500 ||
            Object.keys(getPendingBlockUpdates()).length > 0 ||
            getPendingAppends().length > 0;

          if (syncResult.hasChanged && hasLocalPending) return;

          await reconcileSyncResult({
            syncResult,
            room,
            blocksRef,
            setBlocks,
            setRoom,
            saveToCache,
            onFreshUpdate: () => {
              lastActivityTimeRef.current = Date.now();
              setIsFastSync(true);
              setHasFreshUpdates(true);
              setTimeout(() => setHasFreshUpdates(false), 3500);
            },
          });
        }
      } catch {
        setIsConnected(false);
        scheduleNextPoll(getBackoffInterval(role));
        return;
      } finally {
        isPollingRef.current = false;
        scheduleNextPoll();
      }
    };

    pollRef.current = poll;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') poll();
      else if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const handleOnline = () => {
      setIsConnected(true);
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      poll();
    };

    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibility);
    if (typeof window !== 'undefined') window.addEventListener('online', handleOnline);
    scheduleNextPoll();

    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibility);
      if (typeof window !== 'undefined') window.removeEventListener('online', handleOnline);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [
    room,
    role,
    sessionToken,
    saveToCache,
    leaveRoom,
    isPulpitPreviewActive,
    blocksRef,
    lastActivityTimeRef,
    lastMutationTimeRef,
    pendingMutationsCountRef,
    setBlocks,
    setHasFreshUpdates,
    setIsConnected,
    setIsFastSync,
    setRoom,
  ]);
}
