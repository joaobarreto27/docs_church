import { HolyricsSlide } from '../../../types/holyrics';

export const MOCK_HOLYRICS_SLIDES: Record<string, HolyricsSlide> = {
  louvor: {
    title: 'Mensageiros do Senhor',
    author: 'Harpa Cristã',
    text: 'E depois, saíram pelo mundo\nComo mensageiros do Senhor\nCom coragem e amor profundo\nProclamando Cristo, o Salvador',
    slide_number: 2,
    total_slides: 4,
    type: 'music',
    updated_at: Date.now()
  },
  louvor_sem_titulo: {
    text: 'E depois, saíram pelo mundo\nComo mensageiros do Senhor\nCom coragem e amor profundo\nProclamando Cristo, o Salvador',
    type: 'music',
    updated_at: Date.now()
  },
  biblia: {
    title: 'João 3:16',
    author: 'Bíblia Sagrada (ARC)',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    type: 'bible',
    updated_at: Date.now()
  },
  biblia_longa: {
    title: '1 Coríntios 13:4-7',
    author: 'Bíblia Sagrada (ARC)',
    text: 'O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbe.\nNão se porta com indecência, não busca os seus interesses, não se irrita, não suspeita mal;\nNão folga com a injustiça, mas folga com a verdade;\nTudo sofre, tudo crê, tudo espera, tudo suporta.',
    type: 'bible',
    updated_at: Date.now()
  }
};

export function getMockHolyricsSlide(key: string): HolyricsSlide | null {
  const normalized = String(key || '').trim().toLowerCase();
  if (normalized === 'off' || normalized === 'false' || normalized === '0') return null;
  if (normalized === 'music' || normalized === 'louvor') return MOCK_HOLYRICS_SLIDES.louvor;
  if (normalized === 'music_notitle' || normalized === 'louvor_sem_titulo') return MOCK_HOLYRICS_SLIDES.louvor_sem_titulo;
  if (normalized === 'bible' || normalized === 'biblia') return MOCK_HOLYRICS_SLIDES.biblia;
  if (normalized === 'bible_long' || normalized === 'biblia_longa') return MOCK_HOLYRICS_SLIDES.biblia_longa;
  return MOCK_HOLYRICS_SLIDES[normalized] || null;
}

export function getActiveMockParam(): string | null {
  if (typeof window === 'undefined') return null;
  const urlParam = new URLSearchParams(window.location.search).get('mock_holyrics');
  const storageParam = localStorage.getItem('docs_church_mock_holyrics');
  return urlParam || storageParam || null;
}

export function registerMockHolyricsListener(onSlide: (slide: HolyricsSlide | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  (window as any).simulateHolyrics = (type: string) => {
    if (!type || type === 'off') {
      localStorage.removeItem('docs_church_mock_holyrics');
      window.dispatchEvent(new CustomEvent('holyrics_mock_change', { detail: null }));
    } else {
      localStorage.setItem('docs_church_mock_holyrics', type);
      window.dispatchEvent(new CustomEvent('holyrics_mock_change', { detail: type }));
    }
  };

  const handler = (e: any) => {
    const detail = e.detail;
    onSlide(detail ? getMockHolyricsSlide(detail) : null);
  };

  window.addEventListener('holyrics_mock_change', handler);
  return () => window.removeEventListener('holyrics_mock_change', handler);
}

