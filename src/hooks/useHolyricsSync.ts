import { useState, useEffect, useCallback, useRef } from 'react';
import { HolyricsSlide } from '../types/holyrics';
import { normalizeWebSocketUrl, parseHolyricsSlide } from '../components/holyrics/utils/holyricsParser';

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

  const activeWsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const reconnectTimeoutRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

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
      setIsMinimized(false); // Reseta automaticamente quando o operador limpa o slide (F5)
    }
    setError(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const cleanUrl = String(holyricsUrl || '').trim();

    if (!cleanUrl) {
      setSlide(null);
      setIsProjecting(false);
      setIsMinimized(false);
      setIsConnected(false);
      return;
    }

    let wsDelay = 3000;
    let wsFailedCount = 0;

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const startPollingFallback = () => {
      stopPolling();
      const poll = async () => {
        if (!isMountedRef.current) return;
        try {
          const separator = cleanUrl.includes('?') ? '&' : '?';
          const fetchUrl = `${cleanUrl}/stage_view_data${separator}ngrok-skip-browser-warning=true`;
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(fetchUrl, { signal: controller.signal });
          clearTimeout(tid);

          if (res.ok) {
            const data = await res.json();
            if (isMountedRef.current) {
              handleIncomingData(data);
              setIsConnected(true);
            }
          }
        } catch (_) {
          if (isMountedRef.current) setIsConnected(false);
        }
      };

      poll();
      pollIntervalRef.current = setInterval(poll, 4000); // Polling espaçado anti-WAF
    };

    const connectWebSocket = () => {
      if (!isMountedRef.current) return;
      try {
        const wsUrl = normalizeWebSocketUrl(cleanUrl);
        const ws = new WebSocket(wsUrl);
        activeWsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setIsConnected(true);
          wsDelay = 3000;
          wsFailedCount = 0;
          stopPolling();
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            handleIncomingData(data);
          } catch (_) {}
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);
          wsFailedCount += 1;

          if (wsFailedCount >= 2) {
            startPollingFallback();
          }

          reconnectTimeoutRef.current = setTimeout(connectWebSocket, wsDelay);
          wsDelay = Math.min(wsDelay * 1.5, 30000); // Backoff exponencial anti-bloqueio
        };

        ws.onerror = () => {
          if (ws) {
            try { ws.close(); } catch (_) {}
          }
        };
      } catch (_) {
        startPollingFallback();
      }
    };

    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (activeWsRef.current) {
        try { activeWsRef.current.close(); } catch (_) {}
        activeWsRef.current = null;
      }
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
