// Detecção precisa e estrita de smartphone vs tablet/desktop.
// Totalmente segura para Android 4.4.4 (KitKat - SM-T560), Galaxy Tab A9, iPads e navegadores legados.
export const isSmartphoneDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const w = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
  const h = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
  const minDim = Math.min(w, h);

  // Tablets como o Samsung Galaxy Tab E SM-T560 (Android 4.4.4) e Galaxy Tab A9 têm lado menor >= 534px a 800px.
  // Se a menor dimensão for >= 520px, é com certeza um Tablet ou Desktop.
  if (minDim >= 520) {
    return false;
  }

  // Se a menor dimensão for < 520px, diferencia smartphone de tablet:
  // - No Android: celulares trazem 'Android' E 'Mobile'. Tablets Android (SM-T560, Tab A9) NÃO trazem 'Mobile'.
  // - No iOS: iPhones trazem 'iPhone' ou 'iPod'. iPads trazem 'iPad'.
  const ua = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
  const isAndroidPhone = /Android/i.test(ua) && /Mobile/i.test(ua);
  const isIPhone = /iPhone|iPod/i.test(ua);

  return isAndroidPhone || isIPhone || minDim < 480;
};

/**
 * Particiona uma lista para exibição em colunas no púlpito:
 * Popula toda a coluna da esquerda primeiro (até a capacidade de 10 itens).
 * Somente quando ultrapassar a capacidade da esquerda, passa a preencher a coluna da direita.
 * Se a lista for superior a 20 itens, distribui equilibradamente entre as duas colunas.
 */
export function partitionSequentialColumns<T>(items: T[], capacity: number = 10) {
  if (!items || items.length === 0) {
    return { left: [] as T[], right: [] as T[], splitIdx: 0 };
  }
  if (items.length <= capacity) {
    return { left: items, right: [] as T[], splitIdx: items.length };
  }
  const splitIdx = items.length <= capacity * 2 ? capacity : Math.ceil(items.length / 2);

  return {
    left: items.slice(0, splitIdx),
    right: items.slice(splitIdx),
    splitIdx,
  };
}

// Funções de rolagem seguras com fallback para navegadores antigos (Android 4.4 / KitKat)
export const safeScrollBy = (el: HTMLElement | null, deltaY: number) => {
  if (!el) return;
  try {
    if (typeof el.scrollBy === 'function') {
      el.scrollBy({ top: deltaY, behavior: 'smooth' });
    } else {
      el.scrollTop += deltaY;
    }
  } catch {
    el.scrollTop += deltaY;
  }
};

export const safeScrollToTop = (el: HTMLElement | null) => {
  if (!el) return;
  try {
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      el.scrollTop = 0;
    }
  } catch {
    el.scrollTop = 0;
  }
};
