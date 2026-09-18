import { useState, useEffect, useCallback, useRef } from 'react';
import { HolyricsSlide } from '../types/holyrics';
import { sanitizeHolyricsBaseUrl, parseHolyricsSlide } from '../components/holyrics/utils/holyricsParser';

export interface UseHolyricsSyncReturn {
  slide: HolyricsSlide | null;
  isProjecting: boolean;
  isMinimized: boolean;
  isConnected: boolean;
  error: string | null;
  dismiss: () => void;
  restore: () => void;
}

export function useHolyricsSync(roomIdOrUrl?: string | null, hasHolyricsFlag?: boolean): UseHolyricsSyncReturn {
  const [slide, setSlide] = useState<HolyricsSlide | null>(null);
  const [isProjecting, setIsProjecting] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const pollIntervalRef = useRef<any>(null);
  const isFetchingRef = useRef<boolean>(false);

  const dismiss = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);

  const handleIncomingData = useCallback((payload: any) => {
    const parsed = parseHolyricsSlide(payload);
    if (parsed) {
      setSlide(parsed);
      setIsProjecting(true);
    } else {
      setSlide(null);
      setIsProjecting(false);
      setIsMinimized(false);
    }
    setError(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const target = (roomIdOrUrl || '').trim();

    if (!target || hasHolyricsFlag === false) {
      setSlide(null);
      setIsProjecting(false);
      setIsMinimized(false);
      setIsConnected(false);
      return;
    }

    const isDirectUrl = target.startsWith('http://') || target.startsWith('https://');
    const fetchUrl = isDirectUrl
      ? `/api/holyrics?url=${encodeURIComponent(sanitizeHolyricsBaseUrl(target))}`
      : `/api/holyrics?roomId=${encodeURIComponent(target)}`;

    const poll = async () => {
      if (!isMountedRef.current || isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2500);
        const cacheBuster = `&_t=${Date.now()}`;

        const res = await fetch(`${fetchUrl}${cacheBuster}`, {
          signal: controller.signal
        });
        clearTimeout(tid);

        if (res.ok) {
          const data = await res.json();
          if (isMountedRef.current) {
            handleIncomingData(data);
            setIsConnected(true);
          }
        } else if (res.status === 204) {
          if (isMountedRef.current) {
            handleIncomingData(null);
            setIsConnected(true);
          }
        } else {
          if (isMountedRef.current) setIsConnected(false);
        }
      } catch (_) {
        if (isMountedRef.current) setIsConnected(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    poll();
    const intervalMs = typeof document !== 'undefined' && document.hidden ? 4000 : 1100;
    pollIntervalRef.current = setInterval(poll, intervalMs);

    const handleVisibilityChange = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      const newInterval = typeof document !== 'undefined' && document.hidden ? 4000 : 1100;
      pollIntervalRef.current = setInterval(poll, newInterval);
      if (typeof document !== 'undefined' && !document.hidden) poll();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomIdOrUrl, hasHolyricsFlag, handleIncomingData]);

  return {
    slide,
    isProjecting,
    isMinimized,
    isConnected,
    error,
    dismiss,
    restore
  };
}
