import { HolyricsSlide } from '../../../types/holyrics';

export function sanitizeHolyricsBaseUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  url = url.replace(/\/view\/text(\.json)?$/, '');
  url = url.replace(/\/view\/widescreen$/, '');
  url = url.replace(/\/view$/, '');
  return url;
}

export function parseHolyricsSlide(payload: any): HolyricsSlide | null {
  if (!payload || typeof payload !== 'object') return null;
  const target = payload.map && typeof payload.map === 'object' ? payload.map : payload;
  const text = String(target.text || '').trim();
  if (!text) return null;

  const rawType = String(target.type || '').toUpperCase();
  const slideType = rawType === 'BIBLE' ? 'bible' : rawType === 'MUSIC' ? 'music' : 'text';

  return {
    text,
    title: target.music_title || target.text_title || target.title || target.item_name || undefined,
    author: target.music_author || target.music_artist || target.author || undefined,
    slide_number: target.slide_number ? Number(target.slide_number) : undefined,
    total_slides: target.total_slides ? Number(target.total_slides) : undefined,
    type: slideType,
    updated_at: Date.now()
  };
}
