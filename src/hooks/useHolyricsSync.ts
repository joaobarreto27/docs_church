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

export function useHolyricsSync(holyricsUrl?: string | null): UseHolyricsSyncReturn {
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
    const cleanBase = sanitizeHolyricsBaseUrl(holyricsUrl || '');

    if (!cleanBase) {
      setSlide(null);
      setIsProjecting(false);
      setIsMinimized(false);
      setIsConnected(false);
      return;
    }

    const separator = cleanBase.includes('?') ? '&' : '?';
    const fetchUrl = `${cleanBase}/view/text.json${separator}ngrok-skip-browser-warning=true`;

    const poll = async () => {
      if (!isMountedRef.current || isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        clearTimeout(tid);

        if (res.ok) {
          const data = await res.json();
          if (isMountedRef.current) {
            handleIncomingData(data);
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
    const intervalMs = typeof document !== 'undefined' && document.hidden ? 5000 : 1200;
    pollIntervalRef.current = setInterval(poll, intervalMs);

    const handleVisibilityChange = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      const newInterval = document.hidden ? 5000 : 1200;
      pollIntervalRef.current = setInterval(poll, newInterval);
      if (!document.hidden) poll();
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
  }, [holyricsUrl, handleIncomingData]);

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
