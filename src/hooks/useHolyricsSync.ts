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
  const pollTimeoutRef = useRef<any>(null);
  const isFetchingRef = useRef<boolean>(false);
  const isProjectingRef = useRef<boolean>(false);

  const dismiss = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);

  const handleIncomingData = useCallback((payload: any) => {
    const parsed = parseHolyricsSlide(payload);
    if (parsed) {
      setSlide(parsed);
      setIsProjecting(true);
      isProjectingRef.current = true;
    } else {
      setSlide(null);
      setIsProjecting(false);
      isProjectingRef.current = false;
      setIsMinimized(false);
    }
    setError(null);
    return Boolean(parsed);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const target = (roomIdOrUrl || '').trim();

    if (!target || hasHolyricsFlag === false) {
      setSlide(null);
      setIsProjecting(false);
      isProjectingRef.current = false;
      setIsMinimized(false);
      setIsConnected(false);
      return;
    }

    const isDirectUrl = target.startsWith('http://') || target.startsWith('https://');
    const fetchUrl = isDirectUrl
      ? `/api/holyrics?url=${encodeURIComponent(sanitizeHolyricsBaseUrl(target))}`
      : `/api/holyrics?roomId=${encodeURIComponent(target)}`;

    const scheduleNext = (delayMs: number) => {
      if (!isMountedRef.current) return;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = setTimeout(poll, delayMs);
    };

    const poll = async () => {
      if (!isMountedRef.current || isFetchingRef.current) return;
      isFetchingRef.current = true;
      let hadActiveSlide = isProjectingRef.current;
      let requestSuccess = false;

      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(fetchUrl, { signal: controller.signal });
        clearTimeout(tid);

        if (res.ok) {
          const data = await res.json();
          if (isMountedRef.current) {
            hadActiveSlide = handleIncomingData(data);
            setIsConnected(true);
            requestSuccess = true;
          }
        } else if (res.status === 204) {
          // 204: Sem projeção ativa
          if (isMountedRef.current) {
            handleIncomingData(null);
            setIsConnected(true);
            requestSuccess = true;
          }
        } else {
          if (isMountedRef.current) setIsConnected(false);
        }
      } catch (_) {
        if (isMountedRef.current) setIsConnected(false);
      } finally {
        isFetchingRef.current = false;
        if (isMountedRef.current) {
          const isHidden = typeof document !== 'undefined' && document.hidden;
          let nextDelay = 3500;
          if (isHidden) {
            nextDelay = 6000;
          } else if (!requestSuccess) {
            nextDelay = 4000; // Backoff anti-sobrecarga em caso de falha de conexão
          } else if (hadActiveSlide) {
            nextDelay = 1400; // Polling ágil durante o louvor com cache no servidor
          }
          scheduleNext(nextDelay);
        }
      }
    };

    poll();

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        // Ao voltar à aba, consulta imediatamente
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        poll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
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
