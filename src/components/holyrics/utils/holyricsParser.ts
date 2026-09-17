import { HolyricsSlide } from '../../../types/holyrics';

export function normalizeWebSocketUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.startsWith('https://')) return url.replace('https://', 'wss://') + '/ws';
  if (url.startsWith('http://')) return url.replace('http://', 'ws://') + '/ws';
  return `ws://${url}/ws`;
}

export function parseHolyricsSlide(payload: any): HolyricsSlide | null {
  if (!payload || typeof payload !== 'object') return null;
  const text = String(payload.text || '').trim();
  if (!text) return null;

  return {
    text,
    title: payload.title || payload.item_name || undefined,
    author: payload.author || payload.category || undefined,
    slide_number: payload.slide_number ? Number(payload.slide_number) : undefined,
    total_slides: payload.total_slides ? Number(payload.total_slides) : undefined,
    type: payload.type || (payload.title ? 'music' : 'text'),
    updated_at: Date.now()
  };
}
