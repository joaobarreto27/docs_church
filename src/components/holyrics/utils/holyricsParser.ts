import { HolyricsSlide } from '../../../types/holyrics';

export function sanitizeHolyricsBaseUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  url = url.replace(/\/view\/text(\.json)?$/, '');
  url = url.replace(/\/view\/widescreen$/, '');
  url = url.replace(/\/view$/, '');
  return url;
}

/**
 * Decodifica entidades HTML comuns — executa ANTES de qualquer regex de tags.
 * Isso garante que &lt;ctt&gt; vire <ctt> para os regex funcionarem.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Remove tags HTML preservando conteúdo textual.
 */
function stripHtmlTags(str: string): string {
  return str.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * Pipeline robusto de limpeza do HTML bruto que o Holyrics envia.
 * 1. Decodifica entidades HTML (para que &lt;ctt&gt; vire <ctt>).
 * 2. Remove spans com visibility:hidden ou display:none.
 * 3. Remove spans de versão bíblica (font-size:33% e font-size:50%).
 * 4. Extrai conteúdo dentro de <ctt>...</ctt> se presente.
 * 5. Remove todas as tags HTML restantes.
 */
function cleanHolyricsHtml(rawText: string): { text: string; hasCttTag: boolean } {
  if (!rawText) return { text: '', hasCttTag: false };

  // PASSO 1: Decodifica entidades PRIMEIRO
  let clean = decodeHtmlEntities(rawText);

  // PASSO 2: Remove spans ocultos (controle interno do Holyrics)
  clean = clean.replace(/<span[^>]*visibility:\s*hidden[^>]*>[\s\S]*?<\/span>/gi, '');
  clean = clean.replace(/<span[^>]*display:\s*none[^>]*>[\s\S]*?<\/span>/gi, '');

  // PASSO 3: Remove spans de versão bíblica (tamanhos pequenos, indesejados)
  clean = clean.replace(/<span[^>]*font-size:\s*(33|50)%[^>]*>[\s\S]*?<\/span>/gi, '');

  // PASSO 4: Detecta e extrai conteúdo <ctt>
  const hasCttTag = /<ctt>/i.test(clean);
  if (hasCttTag) {
    const cttMatch = clean.match(/<ctt>([\s\S]*?)<\/ctt>/i);
    if (cttMatch) {
      clean = cttMatch[1];
    }
  }

  // PASSO 5: Remove todas as tags HTML restantes
  const text = stripHtmlTags(clean).trim();
  return { text, hasCttTag };
}

export function parseHolyricsSlide(payload: any): HolyricsSlide | null {
  if (!payload || typeof payload !== 'object') return null;
  const target = payload.map && typeof payload.map === 'object' ? payload.map : payload;
  const rawText = String(target.text || '').trim();
  if (!rawText) return null;

  // Limpa o HTML e detecta presença de <ctt> (indicador de Bíblia)
  const { text: cleanText, hasCttTag } = cleanHolyricsHtml(rawText);
  if (!cleanText) return null;

  // Tipo: usa o campo "type" se fornecido, senão detecta pela presença de <ctt>
  const rawType = String(target.type || '').toUpperCase();
  const isBible = rawType === 'BIBLE' || hasCttTag;
  const slideType = isBible ? 'bible' : rawType === 'MUSIC' ? 'music' : 'text';

  // Referência bíblica (header limpo)
  const bibleReference = target.header
    ? stripHtmlTags(decodeHtmlEntities(String(target.header))).trim()
    : '';

  // Versão bíblica (extrai sigla entre parênteses do texto bruto)
  const versionMatch = rawText.match(/\(([A-Z0-9_\-]+)\)/);
  const version = versionMatch ? versionMatch[1] : '';

  let title = target.music_title || target.text_title || target.title || target.item_name || undefined;
  let author = target.music_author || target.music_artist || target.author || undefined;

  if (isBible) {
    title = bibleReference || 'Bíblia Sagrada';
    author = version ? `Bíblia Sagrada (${version})` : 'Bíblia Sagrada';
  }

  return {
    text: cleanText,
    title,
    author,
    slide_number: target.slide_number ? Number(target.slide_number) : undefined,
    total_slides: target.total_slides ? Number(target.total_slides) : undefined,
    type: slideType,
    updated_at: Date.now()
  };
}
