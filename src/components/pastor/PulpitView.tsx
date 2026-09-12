import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../../context/RoomContext';
import { 
  VisitorItem, 
  PrayerItem, 
  ChoirItem, 
  OpportunityItem 
} from '../../types/liturgy';
import { 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  CheckSquare, 
  LogOut,
  ChevronDown,
  ChevronUp,
  Youtube,
  X,
  BookOpen,
  FileText,
  LayoutList,
  Heart,
  Mic2,
  Users,
  Bell,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { LoadingScreen } from '../common/LoadingScreen';

// Detecção precisa e estrita de smartphone vs tablet/desktop.
// Totalmente segura para Android 4.4.4 (KitKat - SM-T560), Galaxy Tab A9, iPads e navegadores legados.
const isSmartphoneDevice = (): boolean => {
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
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
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
function partitionSequentialColumns<T>(items: T[], capacity: number = 10) {
  if (!items || items.length === 0) {
    return { left: [] as T[], right: [] as T[], splitIdx: 0 };
  }
  if (items.length <= capacity) {
    return { left: items, right: [] as T[], splitIdx: items.length };
  }
  const splitIdx = items.length <= capacity * 2 
    ? capacity 
    : Math.ceil(items.length / 2);

  return {
    left: items.slice(0, splitIdx),
    right: items.slice(splitIdx),
    splitIdx
  };
}

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, isFastSync, hasFreshUpdates, leaveRoom } = useRoom();

  // Escala de fonte e zoom para pregadores idosos (padrão: 100% ~ 1.0)
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pulpit_font_scale_v2');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.7 && val <= 1.8) return val;
      }
    } catch (e) {}
    return 1.0;
  });

  const handleFontChange = (delta: number) => {
    setFontScale(prev => {
      const next = Math.max(0.7, Math.min(1.8, Number((prev + delta).toFixed(2))));
      try {
        localStorage.setItem('pulpit_font_scale_v2', next.toString());
      } catch (e) {}
      return next;
    });
  };

  // Detecção reativa de smartphone (atualiza ao rotacionar a tela ou redimensionar)
  const [isMobilePhone, setIsMobilePhone] = useState<boolean>(isSmartphoneDevice);

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePhone(isSmartphoneDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Modo de visualização de folhas: 'four-views' (4 visões focadas com abas) vs 'two-sheets' (pasta aberta) vs 'single-sheet' (folha única)
  const [sheetLayout, setSheetLayout] = useState<'four-views' | 'two-sheets' | 'single-sheet'>(() => {
    try {
      const saved = localStorage.getItem('pulpit_sheet_layout');
      if (saved === 'four-views' || saved === 'two-sheets' || saved === 'single-sheet') return saved as any;
      // Detecção automática para telas em pé/verticais: inicia em 4 visões focadas
      if (typeof window !== 'undefined') {
        if (window.innerHeight > window.innerWidth) {
          return 'four-views';
        }
      }
    } catch (e) {}
    return 'four-views';
  });

  // Aba ativa dentro do modo 'four-views': 1. orações, 2. oportunidades, 3. visitantes, 4. avisos
  const [activeTab, setActiveTab] = useState<'prayers' | 'opps' | 'visitors' | 'alerts'>('prayers');

  const handleToggleSheetLayout = (mode: 'four-views' | 'two-sheets' | 'single-sheet') => {
    setSheetLayout(mode);
    try {
      localStorage.setItem('pulpit_sheet_layout', mode);
    } catch (e) {}
  };

  // Em smartphones pequenos, se for two-sheets faz fallback para four-views, permitindo que o idoso use 4 visões ou folha única
  const effectiveLayout = (isMobilePhone && sheetLayout === 'two-sheets') ? 'four-views' : sheetLayout;

  // Estados de detecção de overflow e rolagem fácil para idosos
  const [hasMoreSheet1, setHasMoreSheet1] = useState(false);
  const [isSheet1Scrolled, setIsSheet1Scrolled] = useState(false);
  const sheet1ScrollRef = useRef<HTMLDivElement>(null);

  const [hasMoreSheet2, setHasMoreSheet2] = useState(false);
  const [isSheet2Scrolled, setIsSheet2Scrolled] = useState(false);
  const sheet2ScrollRef = useRef<HTMLDivElement>(null);

  // Confirmação para evitar que idosos saiam do púlpito por engano
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!room) return <LoadingScreen />;

  // Extração de dados estruturados
  const visitorsBlock = blocks.find(b => b.block_type === 'visitors');
  const prayerBlock = blocks.find(b => b.block_type === 'prayer');
  const youtubeBlock = blocks.find(b => b.block_type === 'youtube');
  const oppBlock = blocks.find(b => b.block_type === 'opportunities');
  const choirsBlock = blocks.find(b => b.block_type === 'choirs');

  const visitors = (visitorsBlock?.content || []) as VisitorItem[];
  const prayers = (prayerBlock?.content || []) as PrayerItem[];
  const youtube = (youtubeBlock?.content || []) as PrayerItem[];
  const opps = (oppBlock?.content || []) as OpportunityItem[];
  const choirs = (choirsBlock?.content || []) as ChoirItem[];

  // Divisão sequencial vertical para o modo 4 Visões:
  // Popula toda a coluna da esquerda primeiro (até 10 itens) antes de ir para a coluna da direita (evita o 2x2 prematuro)
  const { left: fourViewsPrayersLeft, right: fourViewsPrayersRight, splitIdx: prayersSplitIdx } = partitionSequentialColumns(prayers, 10);
  const { left: fourViewsYoutubeLeft, right: fourViewsYoutubeRight, splitIdx: youtubeSplitIdx } = partitionSequentialColumns(youtube, 10);
  const { left: fourViewsVisitorsLeft, right: fourViewsVisitorsRight, splitIdx: visitorsSplitIdx } = partitionSequentialColumns(visitors, 10);

  // BALANCEAMENTO DINÂMICO INTELIGENTE ENTRE AS DUAS FOLHAS (PASTA ABERTA):
  // Popula toda a Folha 1 (esquerda) primeiro antes de mandar itens para a Folha 2 (direita).
  // A Folha 1 cabe em média 12 a 14 linhas. Visitantes ocupam metade das linhas no grid-cols-2 quando > 4.
  const visitorRows = visitors.length > 4 ? Math.ceil(visitors.length / 2) : visitors.length;
  const maxSheet1Prayers = Math.max(0, 12 - visitorRows);
  const sheet1Prayers = prayers.slice(0, maxSheet1Prayers);
  const overflowPresencial = prayers.slice(maxSheet1Prayers);
  const sheet2Items: PrayerItem[] = [...overflowPresencial, ...youtube];

  // Monitora se há conteúdo oculto que requer rolagem em cada folha
  const checkScrollState = () => {
    if (sheet1ScrollRef.current) {
      const el = sheet1ScrollRef.current;
      const hasOverflow = el.scrollHeight > el.clientHeight + 25;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 25;
      setHasMoreSheet1(hasOverflow && !isAtBottom);
      setIsSheet1Scrolled(el.scrollTop > 30);
    }
    if (sheet2ScrollRef.current) {
      const el = sheet2ScrollRef.current;
      const hasOverflow = el.scrollHeight > el.clientHeight + 25;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 25;
      setHasMoreSheet2(hasOverflow && !isAtBottom);
      setIsSheet2Scrolled(el.scrollTop > 30);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScrollState, 200);
    window.addEventListener('resize', checkScrollState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [visitors, prayers, youtube, fontScale, opps, choirs, effectiveLayout]);

  // Funções de rolagem seguras com fallback para navegadores antigos (Android 4.4 / KitKat)
  const safeScrollBy = (el: HTMLElement | null, deltaY: number) => {
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

  const safeScrollToTop = (el: HTMLElement | null) => {
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

  const handleScrollSheet1Down = () => {
    safeScrollBy(sheet1ScrollRef.current, 220);
  };

  const handleScrollSheet1Up = () => {
    safeScrollToTop(sheet1ScrollRef.current);
  };

  const handleScrollSheet2Down = () => {
    safeScrollBy(sheet2ScrollRef.current, 220);
  };

  const handleScrollSheet2Up = () => {
    safeScrollToTop(sheet2ScrollRef.current);
  };

  return (
    <div className="h-full w-full flex flex-col bg-church-parchment select-none overflow-hidden relative min-h-0">
      {/* ⚠️ FAIXA DE ALERTA NO TOPO - EMPURRA SUAVEMENTE AS FOLHAS */}
      {room.active_alert && (
        <aside 
          aria-live="assertive"
          className="w-full bg-alert-bg border-b-2 border-alert-border px-4 py-2 flex items-center justify-center gap-3 shadow-md animate-slideDown shrink-0"
        >
          <AlertCircle className="w-5 h-5 text-alert-text shrink-0 animate-bounce" />
          <p className="font-title text-sm sm:text-base font-bold text-alert-text uppercase tracking-wide text-center">
            {room.active_alert}
          </p>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* CORPO DO PÚLPITO: 1 FOLHA CONTÍNUA vs 2 FOLHAS (PASTA ABERTA) */}
      {/* ========================================================================= */}
      <main 
        className="flex-1 overflow-hidden h-full max-h-full min-h-0 flex flex-col"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {/* ================= 0. VISUALIZAÇÃO EM 4 VISÕES FOCADAS (FAIXA NO TOPO - ADAPTADA PARA IDOSOS) ================= */}
        {effectiveLayout === 'four-views' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
            {/* FAIXA NO TOPO: 4 ABAS MODERNAS E CLARAS COM ALTO CONTRASTE */}
            <header className="bg-white border-b-2 border-church-sand px-2 sm:px-4 py-2 sm:py-2.5 shrink-0 shadow-xs">
              <div className="max-w-6xl 2xl:max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
                {/* Título da Visão no Canto Superior Esquerdo */}
                <div className="hidden lg:flex flex-col pr-3 border-r border-church-sand/80 shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">
                    Púlpito do Pastor
                  </span>
                  <span className="text-xs font-title font-extrabold text-church-charcoal uppercase truncate max-w-[150px]">
                    {activeTab === 'prayers' && '1. Pedidos de Oração'}
                    {activeTab === 'visitors' && '2. Visitantes'}
                    {activeTab === 'opps' && '3. Oportunidades'}
                    {activeTab === 'alerts' && '4. Avisos da Cabine'}
                  </span>
                </div>

                {/* 4 Botões da Faixa Superior com Altura Tátil Confortável (≥50px) e Destaque Evidente */}
                <nav className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-center sm:justify-start" aria-label="Abas do Púlpito">
                  {/* 1. Pedidos de Oração */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('prayers')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-title font-black uppercase tracking-wider transition-all cursor-pointer min-h-[46px] sm:min-h-[50px] select-none ${
                      activeTab === 'prayers'
                        ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                        : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
                    }`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'prayers' ? 'text-white' : 'text-church-gold-dark'}`} />
                    <span>Orações</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold ${
                      activeTab === 'prayers' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
                    }`}>
                      {prayers.length + youtube.length}
                    </span>
                    {activeTab === 'prayers' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
                    )}
                  </button>

                  {/* 2. Visitantes (Agora em 2ª posição a pedido do pastor) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('visitors')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-title font-black uppercase tracking-wider transition-all cursor-pointer min-h-[46px] sm:min-h-[50px] select-none ${
                      activeTab === 'visitors'
                        ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                        : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
                    }`}
                  >
                    <Users className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'visitors' ? 'text-white' : 'text-church-gold-dark'}`} />
                    <span>Visitantes</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold ${
                      activeTab === 'visitors' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
                    }`}>
                      {visitors.length}
                    </span>
                    {activeTab === 'visitors' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
                    )}
                  </button>

                  {/* 3. Oportunidades & Louvores */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('opps')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-title font-black uppercase tracking-wider transition-all cursor-pointer min-h-[46px] sm:min-h-[50px] select-none ${
                      activeTab === 'opps'
                        ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                        : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
                    }`}
                  >
                    <Mic2 className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'opps' ? 'text-white' : 'text-church-gold-dark'}`} />
                    <span>Oportunidades</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold ${
                      activeTab === 'opps' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
                    }`}>
                      {opps.length + choirs.filter(c => c.checked).length}
                    </span>
                    {activeTab === 'opps' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
                    )}
                  </button>

                  {/* 4. Avisos */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('alerts')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-title font-black uppercase tracking-wider transition-all cursor-pointer min-h-[46px] sm:min-h-[50px] relative select-none ${
                      activeTab === 'alerts'
                        ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                        : room.active_alert
                          ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold animate-pulse'
                          : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
                    }`}
                  >
                    <Bell className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeTab === 'alerts' ? 'text-white' : room.active_alert ? 'text-amber-700' : 'text-church-gold-dark'}`} />
                    <span>Avisos</span>
                    {activeTab === 'alerts' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
                    )}
                    {room.active_alert && activeTab !== 'alerts' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping absolute top-2 right-2" />
                    )}
                  </button>
                </nav>

                <img 
                  src="/assets/logo-adutinga-horizontal.png" 
                  alt="A.D. Utinga" 
                  className="h-6 sm:h-7 w-auto object-contain hidden md:block shrink-0"
                />
              </div>
            </header>

            {/* CORPO DA SESSÃO SELECIONADA */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 min-h-0 scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div 
                className="max-w-6xl 2xl:max-w-7xl w-full mx-auto paper-sheet rounded-2xl p-4 sm:p-7 border border-church-sand shadow-sheet space-y-4 transition-[zoom] duration-150"
                style={{ zoom: fontScale }}
              >
                
                {/* 1. VISÃO DE ORAÇÕES */}
                {activeTab === 'prayers' && (
                  <div className="space-y-5">
                    <div className="border-b border-church-sand pb-3 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">Tema do Culto</span>
                        <h2 className="text-base sm:text-xl font-title font-extrabold text-church-charcoal uppercase">
                          Pedidos de Oração do Culto
                        </h2>
                      </div>
                      <span className="text-xs font-title font-bold px-2.5 py-1 rounded-full bg-church-gold/15 text-church-gold-dark">
                        Total: {prayers.length + youtube.length}
                      </span>
                    </div>

                    {/* Presenciais */}
                    <div>
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-church-gold" />
                        Pedidos Presenciais da Igreja ({prayers.length})
                      </h3>
                      {prayers.length === 0 ? (
                        <p className="font-serif italic text-church-muted text-sm p-2">Nenhum pedido presencial registrado ainda.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
                          {/* Coluna 1: Começando primeiro na esquerda */}
                          <ul className="space-y-1.5 sm:space-y-2">
                            {fourViewsPrayersLeft.map((p, idx) => (
                              <li 
                                key={p.id || idx}
                                className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex items-start gap-1.5"
                              >
                                <span className="text-church-gold font-bold mr-0.5">•</span>
                                <span className="font-mono text-xs font-bold text-church-gold-dark shrink-0 mt-0.5">
                                  {idx + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                  {p.urgent && (
                                    <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                                      Urgente
                                    </span>
                                  )}
                                  <span className={p.urgent ? 'text-red-950 font-black' : 'text-church-charcoal'}>
                                    {p.description}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {/* Coluna 2: Continuação sequencial na direita */}
                          {fourViewsPrayersRight.length > 0 && (
                            <ul className="space-y-1.5 sm:space-y-2">
                              {fourViewsPrayersRight.map((p, idx) => (
                                <li 
                                  key={p.id || idx}
                                  className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex items-start gap-1.5"
                                >
                                  <span className="text-church-gold font-bold mr-0.5">•</span>
                                  <span className="font-mono text-xs font-bold text-church-gold-dark shrink-0 mt-0.5">
                                    {prayersSplitIdx + idx + 1}.
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    {p.urgent && (
                                      <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                                        Urgente
                                      </span>
                                    )}
                                    <span className={p.urgent ? 'text-red-950 font-black' : 'text-church-charcoal'}>
                                      {p.description}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Transmissão / YouTube */}
                    <div className="pt-3 border-t border-church-sand/60">
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-700 mb-2 flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-600" />
                        Pedidos do Chat ao Vivo / YouTube ({youtube.length})
                      </h3>
                      {youtube.length === 0 ? (
                        <p className="font-serif italic text-church-muted text-sm p-2">Nenhum pedido do YouTube recebido.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
                          {/* Coluna 1 YouTube */}
                          <ul className="space-y-1.5 sm:space-y-2">
                            {fourViewsYoutubeLeft.map((p, idx) => (
                              <li key={p.id || idx} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex flex-col gap-1">
                                <div className="flex items-start gap-1.5">
                                  <span className="text-red-500 font-bold mr-0.5">•</span>
                                  <span className="font-mono text-xs font-bold text-red-600 shrink-0 mt-0.5">
                                    {idx + 1}.
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-church-charcoal">
                                      {p.description}
                                    </span>
                                  </div>
                                </div>
                                {p.image_data && (
                                  <div className="ml-5 rounded-lg overflow-hidden border border-red-200 bg-white max-w-xs">
                                    <img 
                                      src={p.image_data} 
                                      alt="Print YouTube" 
                                      className="w-full h-auto max-h-36 object-contain"
                                    />
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>

                          {/* Coluna 2 YouTube */}
                          {fourViewsYoutubeRight.length > 0 && (
                            <ul className="space-y-1.5 sm:space-y-2">
                              {fourViewsYoutubeRight.map((p, idx) => (
                                <li key={p.id || idx} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex flex-col gap-1">
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-red-500 font-bold mr-0.5">•</span>
                                    <span className="font-mono text-xs font-bold text-red-600 shrink-0 mt-0.5">
                                      {youtubeSplitIdx + idx + 1}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-church-charcoal">
                                        {p.description}
                                      </span>
                                    </div>
                                  </div>
                                  {p.image_data && (
                                    <div className="ml-5 rounded-lg overflow-hidden border border-red-200 bg-white max-w-xs">
                                      <img 
                                        src={p.image_data} 
                                        alt="Print YouTube" 
                                        className="w-full h-auto max-h-36 object-contain"
                                      />
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. VISÃO DE VISITANTES (Agora 2ª posição) */}
                {activeTab === 'visitors' && (
                  <div className="space-y-4">
                    <div className="border-b border-church-sand pb-3 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">Tema do Culto</span>
                        <h2 className="text-base sm:text-xl font-title font-extrabold text-church-charcoal uppercase">
                          Visitantes do Culto
                        </h2>
                      </div>
                      <span className="text-xs font-title font-bold px-2.5 py-1 rounded-full bg-church-gold/15 text-church-gold-dark">
                        Total: {visitors.length}
                      </span>
                    </div>

                    {visitors.length === 0 ? (
                      <p className="font-serif italic text-church-muted text-base p-4 text-center">
                        Nenhum visitante registrado para o culto de hoje ainda.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 sm:gap-y-2.5">
                        {/* Coluna 1: Começando primeiro na esquerda */}
                        <ul className="space-y-2 sm:space-y-2.5">
                          {fourViewsVisitorsLeft.map((v, idx) => (
                            <li 
                              key={v.id || idx}
                              className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex items-start gap-1.5"
                            >
                              <span className="text-church-gold font-bold mr-0.5">•</span>
                              <span className="font-mono text-xs font-bold text-church-gold-dark shrink-0 mt-0.5">
                                {idx + 1}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-church-charcoal font-bold text-base sm:text-lg">{v.name}</span>
                                {v.church && (
                                  <span className="font-semibold text-church-muted text-xs sm:text-sm"> ({v.church})</span>
                                )}
                                {v.invited_by && (
                                  <span className="font-semibold text-church-muted text-xs sm:text-sm"> — Por: {v.invited_by}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>

                        {/* Coluna 2: Continuação sequencial na direita */}
                        {fourViewsVisitorsRight.length > 0 && (
                          <ul className="space-y-2 sm:space-y-2.5">
                            {fourViewsVisitorsRight.map((v, idx) => (
                              <li 
                                key={v.id || idx}
                                className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex items-start gap-1.5"
                              >
                                <span className="text-church-gold font-bold mr-0.5">•</span>
                                <span className="font-mono text-xs font-bold text-church-gold-dark shrink-0 mt-0.5">
                                  {visitorsSplitIdx + idx + 1}.
                                </span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-church-charcoal font-bold text-base sm:text-lg">{v.name}</span>
                                  {v.church && (
                                    <span className="font-semibold text-church-muted text-xs sm:text-sm"> ({v.church})</span>
                                  )}
                                  {v.invited_by && (
                                    <span className="font-semibold text-church-muted text-xs sm:text-sm"> — Por: {v.invited_by}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. VISÃO DE OPORTUNIDADES & DEPARTAMENTOS */}
                {activeTab === 'opps' && (
                  <div className="space-y-6">
                    <div className="border-b border-church-sand pb-3 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">Tema do Culto</span>
                        <h2 className="text-base sm:text-xl font-title font-extrabold text-church-charcoal uppercase">
                          Oportunidades & Louvores
                        </h2>
                      </div>
                    </div>

                    {/* Cantores / Oportunidades Cadastradas */}
                    <div>
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark mb-2.5 flex items-center gap-2">
                        <Mic2 className="w-4 h-4 text-church-gold" />
                        Oportunidades Individuais / Cantores ({opps.length})
                      </h3>
                      {opps.length === 0 ? (
                        <p className="font-serif italic text-church-muted text-sm p-2">Nenhuma oportunidade escalada ainda.</p>
                      ) : (
                        <ul className="space-y-1.5 sm:space-y-2">
                          {opps.map((op, i) => {
                            const isReady = op.status === 'ready';
                            const isDone = op.status === 'done';
                            return (
                              <li 
                                key={op.id || i}
                                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                  isReady 
                                    ? 'bg-amber-100/90 border-2 border-amber-400 text-amber-950 font-bold shadow-xs' 
                                    : isDone 
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 opacity-85' 
                                      : 'bg-white border-church-sand text-church-charcoal'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`font-mono text-xs sm:text-sm font-bold ${isReady ? 'text-amber-700' : isDone ? 'text-emerald-700' : 'text-church-gold-dark'}`}>
                                    {i + 1}.
                                  </span>
                                  <span className={`font-sans text-base sm:text-lg font-bold truncate ${isReady ? 'text-amber-950 font-black' : isDone ? 'line-through text-emerald-900' : 'text-church-charcoal'}`}>
                                    {op.name}
                                  </span>
                                </div>
                                <div className="shrink-0 flex items-center">
                                  {isReady && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" title="Vai Cantar" />
                                  )}
                                  {isDone && (
                                    <span title="Já cantou">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Departamentos da Igreja */}
                    <div className="pt-4 border-t border-church-sand/60">
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark mb-2.5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-church-gold" />
                        Departamentos Escalados ({choirs.filter(c => c.checked).length})
                      </h3>
                      {choirs.filter(c => c.checked).length === 0 ? (
                        <p className="font-serif italic text-church-muted text-sm p-2">Nenhum departamento escalado no momento.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {choirs.filter(c => c.checked).map((ch, i) => {
                            const isReady = ch.status === 'ready';
                            const isDone = ch.status === 'done';
                            return (
                              <div 
                                key={ch.id || i}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-extrabold border-2 shadow-xs transition-all ${
                                  isReady 
                                    ? 'bg-amber-100 text-amber-950 border-church-gold ring-2 ring-church-gold/30 scale-[1.02]' 
                                    : isDone 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 line-through opacity-85' 
                                      : 'bg-church-gold/20 text-church-charcoal border-church-gold/40'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                ) : isReady ? (
                                  <Clock className="w-4 h-4 text-amber-700 stroke-[2.5]" />
                                ) : (
                                  <CheckSquare className="w-4 h-4 text-church-gold-dark stroke-[2.5]" />
                                )}
                                <span>{ch.name}</span>
                                {isDone && (
                                  <span className="text-[10px] font-title uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ml-1">
                                    Já Louvou
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. VISÃO DE AVISOS */}
                {activeTab === 'alerts' && (
                  <div className="space-y-4">
                    <div className="border-b border-church-sand pb-3">
                      <span className="text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">Tema do Culto</span>
                      <h2 className="text-base sm:text-xl font-title font-extrabold text-church-charcoal uppercase">
                        Avisos da Direção & Cabine
                      </h2>
                    </div>

                    {room.active_alert ? (
                      <div className="p-6 sm:p-8 rounded-2xl bg-alert-bg border-3 border-alert-border text-alert-text shadow-md space-y-4 animate-fadeIn text-center">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-alert-text animate-bounce" />
                          <span className="text-xs font-title font-extrabold uppercase tracking-widest bg-amber-200/80 px-3 py-1 rounded-full">
                            Aviso Urgente Ativo
                          </span>
                        </div>
                        <p className="font-title text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wide leading-relaxed">
                          "{room.active_alert}"
                        </p>
                        <p className="text-xs font-serif italic text-amber-900/80">
                          Transmitido pela equipe da cabine de som e apoio.
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-white border border-church-sand text-center space-y-2">
                        <Bell className="w-10 h-10 text-church-muted/50 mx-auto" />
                        <h4 className="font-title text-base font-bold text-church-charcoal uppercase">
                          Nenhum Aviso no Momento
                        </h4>
                        <p className="font-serif italic text-sm text-church-muted max-w-md mx-auto">
                          Quando a cabine de som ou o obreiro transmitir um aviso de emergência ou orientação, ele aparecerá aqui com destaque para leitura no púlpito.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ================= 1. VISUALIZAÇÃO EM FOLHA ÚNICA (PÁGINA CONTÍNUA ESTILO GOOGLE DOCS) ================= */}
        {effectiveLayout === 'single-sheet' && (
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 min-h-0 scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div 
              className="max-w-4xl 2xl:max-w-5xl w-full mx-auto paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 border border-church-sand shadow-sheet transition-[zoom] duration-150"
              style={{ zoom: fontScale }}
            >
              {/* Cabeçalho Oficial da Página */}
              <div className="border-b border-church-sand pb-2.5 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Tema do Culto
                  </span>
                  <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    {room.title}
                  </h2>
                </div>
                <img 
                  src="/assets/logo-adutinga-horizontal.png" 
                  alt="A.D. Utinga" 
                  className="h-7 sm:h-8 w-auto object-contain shrink-0"
                />
              </div>

              {/* Seção 1: Visitantes do Culto */}
              <article className="pb-3 border-b border-church-sand/60">
                <header className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                    Visitantes do Culto ({visitors.length})
                  </h3>
                </header>
                {visitors.length === 0 ? (
                  <p className="font-serif italic text-church-muted/70 text-sm">Nenhum visitante registrado ainda.</p>
                ) : (
                  <ul className="space-y-1.5 list-disc list-inside">
                    {visitors.map((v, i) => (
                      <li key={v.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug">
                        <span>{v.name}</span>
                        {v.church && <span className="font-semibold text-church-muted text-xs sm:text-sm"> ({v.church})</span>}
                        {v.invited_by && <span className="font-semibold text-church-muted text-xs sm:text-sm"> — Por: {v.invited_by}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              {/* Seção 2: Pedidos de Oração Presenciais (SEMPRE PRIMEIRO) */}
              <article className="pb-3 border-b border-church-sand/60">
                <header className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                    Pedidos de Oração Presenciais ({prayers.length})
                  </h3>
                </header>
                {prayers.length === 0 ? (
                  <p className="font-serif italic text-church-muted/70 text-sm">Nenhum pedido presencial registrado.</p>
                ) : (
                  <ul className="space-y-1.5 list-disc list-inside">
                    {prayers.map((p, i) => (
                      <li key={p.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug">
                        {p.urgent && (
                          <span className="inline-block px-2 py-0.5 mr-1.5 rounded-md bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                            Urgente
                          </span>
                        )}
                        <span>{p.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              {/* Seção 3: Transmissão YouTube (SEMPRE APÓS PRESENCIAIS) */}
              {youtube.length > 0 && (
                <article className="bg-red-50/75 border-2 border-red-200 rounded-xl p-3 space-y-2 shrink-0 shadow-2xs">
                  <header className="flex items-center justify-between border-b border-red-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                        <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Pedido de Oração Youtube ({youtube.length})</span>
                      </h3>
                    </div>
                    <span className="text-[10px] font-title font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
                      Ao Vivo
                    </span>
                  </header>

                  <ul className="space-y-2 list-disc list-inside">
                    {youtube.map((p, i) => (
                      <li key={p.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-relaxed">
                        {p.urgent && (
                          <span className="inline-block px-2 py-0.5 mr-1.5 rounded-md bg-red-200 text-red-900 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-300">
                            Urgente
                          </span>
                        )}
                        <span className="text-red-950">{p.description}</span>
                        {p.image_data && (
                          <div className="mt-2 ml-4 rounded-lg overflow-hidden border border-red-200 bg-white p-1 max-w-[280px] shadow-2xs">
                            <img 
                              src={p.image_data} 
                              alt="Print do chat YouTube" 
                              className="w-full h-auto max-h-36 object-contain rounded"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              )}

              {/* Seção 4: Oportunidades do Culto (AMPLIADO PARA VISÃO DO PÚLPITO) */}
              <article className="pb-3 border-b border-church-sand/60">
                <header className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                    Oportunidades ({opps.length})
                  </h3>
                </header>
                {opps.length === 0 ? (
                  <p className="font-serif italic text-church-muted text-sm">Nenhuma oportunidade adicionada.</p>
                ) : (
                  <ul className={`gap-x-4 gap-y-1 sm:gap-y-1.5 ${
                    opps.length > 2 
                      ? 'grid grid-cols-1 sm:grid-cols-2' 
                      : 'space-y-1 sm:space-y-1.5 list-disc list-inside'
                  }`}>
                    {opps.map((op, i) => {
                      const isReady = op.status === 'ready';
                      const isDone = op.status === 'done';
                      return (
                        <li key={op.id || i} className={`font-bold text-sm sm:text-base font-sans leading-snug break-inside-avoid flex items-center justify-between gap-2 px-2 py-1 rounded-lg ${
                          isReady 
                            ? 'bg-amber-100/90 text-amber-950 border border-amber-300' 
                            : isDone 
                              ? 'bg-emerald-50/70 text-emerald-900 line-through border border-emerald-200 opacity-80' 
                              : 'text-church-charcoal'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={isReady ? 'text-amber-600 font-bold mr-1' : isDone ? 'text-emerald-600 font-bold mr-1' : 'text-church-gold font-bold mr-1'}>•</span>
                            <span className="truncate">{op.name}</span>
                          </div>
                          {isReady && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Vai Cantar" />}
                          {isDone && (
                            <span title="Já Cantou">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>

              {/* Seção 5: Departamentos do Culto (AMPLIADO PARA VISÃO DO PÚLPITO) */}
              <article className="pb-1">
                <header className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                    Departamentos
                  </h3>
                </header>
                <div className="flex flex-wrap gap-2">
                  {choirs.filter(ch => ch.checked).map((ch, i) => {
                    const isReady = ch.status === 'ready';
                    const isDone = ch.status === 'done';
                    return (
                      <span 
                        key={ch.id || i}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm border-2 shadow-xs tracking-wide transition-all ${
                          isReady 
                            ? 'bg-amber-100 text-amber-950 border-church-gold ring-2 ring-church-gold/30' 
                            : isDone 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 line-through opacity-85' 
                              : 'bg-church-gold/20 text-church-charcoal border-church-gold/40'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 stroke-[2.5]" />
                        ) : isReady ? (
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0 stroke-[2.5]" />
                        ) : (
                          <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold-dark shrink-0 stroke-[2.5]" />
                        )}
                        <span>{ch.name}</span>
                        {isDone && <span className="text-[10px] font-title uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1 rounded ml-1">OK</span>}
                      </span>
                    );
                  })}
                  {choirs.filter(ch => ch.checked).length === 0 && (
                    <span className="font-serif italic text-church-muted text-sm">Nenhum departamento escalado</span>
                  )}
                </div>
              </article>

              {/* Rodapé da Folha Mobile */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center">
                <span className="font-serif italic">{room.title}</span>
                <span className="font-mono">Página Única Contínua</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. VISUALIZAÇÃO TABLET / DESKTOP (PASTA ABERTA EM 2 COLUNAS) ================= */}
        {effectiveLayout === 'two-sheets' && (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 flex-1 p-2 sm:p-3 md:p-3.5 overflow-hidden h-full max-h-full min-h-0 transition-[zoom] duration-150"
            style={{ zoom: fontScale }}
          >
            {/* ================= FOLHA 1 (ESQUERDA) - ZERO SCROLL ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 md:p-4 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho Compacto da Folha 1 */}
              <div className="border-b border-church-sand pb-1.5 mb-1.5 sm:pb-2 sm:mb-2 flex items-center justify-between gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="font-title text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Tema do Culto
                  </span>
                  <h2 className="font-title text-sm sm:text-base md:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    {room.title}
                  </h2>
                </div>
                <img 
                  src="/assets/logo-adutinga-horizontal.png" 
                  alt="A.D. Utinga" 
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </div>

              {/* Conteúdo Dinâmico da Folha 1 - Otimizado para Zero-Scroll */}
              <div 
                ref={sheet1ScrollRef}
                onScroll={checkScrollState}
                className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1 flex flex-col scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Bloco de Visitantes com Sub-colunas Inteligentes */}
                <article className={`shrink-0 ${sheet1Prayers.length > 0 ? 'pb-2 border-b border-church-sand/50' : 'flex-1'}`}>
                  <header className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                      Visitantes do Culto ({visitors.length})
                    </h3>
                  </header>
                  {visitors.length === 0 ? (
                    <p className="font-serif italic text-church-muted/70 text-sm">Nenhum visitante registrado ainda.</p>
                  ) : (
                    <ul className={`gap-x-4 gap-y-1 sm:gap-y-1.5 ${
                      visitors.length > 4 
                        ? 'grid grid-cols-1 sm:grid-cols-2' 
                        : 'space-y-1 sm:space-y-1.5 list-disc list-inside'
                    }`}>
                      {visitors.map((v, i) => (
                        <li key={v.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid">
                          {visitors.length > 4 && <span className="text-church-gold font-bold mr-1">•</span>}
                          <span>{v.name}</span>
                          {v.church && <span className="font-semibold text-church-muted text-xs sm:text-sm"> ({v.church})</span>}
                          {v.invited_by && <span className="font-semibold text-church-muted text-xs sm:text-sm"> — Por: {v.invited_by}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                {/* Bloco de Pedidos de Oração Presenciais (Aparece na Folha 1 apenas se houver pouquíssimos visitantes) */}
                {sheet1Prayers.length > 0 && (
                  <article className="flex-1">
                    <header className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-church-gold" />
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                        Pedidos de Oração ({sheet1Prayers.length})
                      </h3>
                    </header>
                    <ul className="space-y-1 sm:space-y-1.5 list-disc list-inside">
                      {sheet1Prayers.map((p, i) => (
                        <li key={p.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug">
                          {p.urgent && (
                            <span className="inline-block px-2 py-0.5 mr-1.5 rounded-md bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                              Urgente
                            </span>
                          )}
                          <span>{p.description}</span>
                        </li>
                      ))}
                    </ul>
                    {(overflowPresencial.length > 0 || youtube.length > 0) && (
                      <p className="font-serif italic text-xs text-church-gold-dark mt-2 flex items-center gap-1.5 flex-wrap">
                        <span>* Continuação na Folha 2 à direita ➔</span>
                        {youtube.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-sans font-bold text-[10px] uppercase border border-red-200">
                            <Youtube className="w-3 h-3 text-red-600" />
                            {youtube.length} YouTube
                          </span>
                        )}
                      </p>
                    )}
                  </article>
                )}

                {sheet1Prayers.length === 0 && (prayers.length > 0 || youtube.length > 0) && (
                  <p className="font-serif italic text-xs text-church-gold-dark mt-1.5 flex items-center gap-1.5 shrink-0">
                    <span>* Pedidos de oração e intercessão na Folha 2 ➔</span>
                  </p>
                )}
              </div>

              {/* BOTÃO VISÍVEL DE ROLAGEM / AVISO PARA IDOSOS (FOLHA 1) */}
              {hasMoreSheet1 ? (
                <button
                  type="button"
                  onClick={handleScrollSheet1Down}
                  className="w-full py-1 px-3 my-1 rounded-xl bg-amber-100/90 hover:bg-amber-200 border-2 border-amber-400 text-amber-950 flex items-center justify-between text-xs sm:text-sm font-title font-extrabold shadow-sm active:scale-98 transition-all shrink-0 cursor-pointer animate-pulse"
                  title="Toque aqui para descer e ver mais itens"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronDown className="w-4 h-4 text-amber-800 animate-bounce" />
                    <span>Há mais itens abaixo</span>
                  </span>
                  <span className="bg-amber-300/90 text-amber-950 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider">
                    Toque para descer ⬇
                  </span>
                </button>
              ) : isSheet1Scrolled ? (
                <button
                  type="button"
                  onClick={handleScrollSheet1Up}
                  className="w-full py-1 px-3 my-1 rounded-xl bg-white hover:bg-church-parchment border border-church-sand text-church-charcoal flex items-center justify-center gap-1.5 text-xs font-title font-bold shadow-2xs active:scale-98 transition-all shrink-0 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-church-gold-dark" />
                  <span>Voltar ao topo</span>
                </button>
              ) : null}

              {/* Rodapé da Folha 1 */}
              <div className="pt-1.5 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 1 (Visitantes)</span>
                <span className="font-mono">Página 1</span>
              </div>
            </section>

            {/* ================= FOLHA 2 (DIREITA) ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 md:p-4 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho da Folha 2 */}
              <div className="border-b border-church-sand pb-1.5 mb-1.5 sm:pb-2 sm:mb-2 flex items-center justify-between gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="font-title text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Intercessão & Escala
                  </span>
                  <h2 className="font-title text-sm sm:text-base md:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    {sheet2Items.length > 0 ? 'Orações & Transmissão' : 'Escala do Culto'}
                  </h2>
                </div>
                <span className="font-serif italic text-xs text-church-muted">
                  "Aqui chegamos pela fé!"
                </span>
              </div>

              {/* Conteúdo Dinâmico de Orações, Oportunidades e Departamentos da Folha 2 */}
              <div 
                ref={sheet2ScrollRef}
                onScroll={checkScrollState}
                className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 flex flex-col scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* 1. PEDIDOS DE ORAÇÃO PRESENCIAIS (SEMPRE PRIMEIRO) */}
                {overflowPresencial.length > 0 && (
                  <article className="shrink-0">
                    <header className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-church-gold" />
                      <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                        {sheet1Prayers.length === 0 ? `Pedidos de Oração Presenciais (${overflowPresencial.length})` : `Pedidos Presenciais — Continuação (${overflowPresencial.length})`}
                      </h3>
                    </header>
                    <ul className="space-y-1.5 list-disc list-inside">
                      {overflowPresencial.map((p, i) => (
                        <li key={p.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug">
                          {p.urgent && (
                            <span className="inline-block px-2 py-0.5 mr-1.5 rounded-md bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                              Urgente
                            </span>
                          )}
                          <span>{p.description}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                )}

                {/* 2. PEDIDOS DA TRANSMISSÃO AO VIVO (YOUTUBE) (SEMPRE APÓS PRESENCIAIS) */}
                {youtube.length > 0 && (
                  <article className="bg-red-50/75 border-2 border-red-200 rounded-xl p-2.5 sm:p-3 space-y-2 shrink-0 shadow-2xs">
                    <header className="flex items-center justify-between border-b border-red-200/70 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                        <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                          <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Pedido de Oração Youtube ({youtube.length})</span>
                        </h3>
                      </div>
                      <span className="text-[10px] font-title font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
                        Ao Vivo
                      </span>
                    </header>

                    <ul className="space-y-1.5 list-disc list-inside">
                      {youtube.map((p, i) => (
                        <li key={p.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-relaxed">
                          {p.urgent && (
                            <span className="inline-block px-2 py-0.5 mr-1.5 rounded-md bg-red-200 text-red-900 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-300">
                              Urgente
                            </span>
                          )}
                          <span className="text-red-950">{p.description}</span>
                          {p.image_data && (
                            <div className="mt-2 ml-4 rounded-lg overflow-hidden border border-red-200 bg-white p-1 max-w-[280px] shadow-2xs">
                              <img 
                                src={p.image_data} 
                                alt="Print do chat YouTube" 
                                className="w-full h-auto max-h-28 object-contain rounded"
                              />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </article>
                )}

                {/* Caso não haja nenhum pedido de oração nesta folha */}
                {youtube.length === 0 && overflowPresencial.length === 0 && (
                  <div className="py-3 flex flex-col items-center justify-center text-center text-church-muted space-y-1">
                    <p className="font-serif italic text-sm text-church-charcoal">
                      "Orai sem cessar. Em tudo dai graças."
                    </p>
                    <span className="text-[11px] font-title font-bold text-church-gold uppercase">1 Tessalonicenses 5:17</span>
                  </div>
                )}

                {/* 3. OPORTUNIDADES DO CULTO (AMPLIADO PARA O PÚLPITO) */}
                <article className="pt-2.5 border-t border-church-sand/60 shrink-0">
                  <header className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                      Oportunidades ({opps.length})
                    </h3>
                  </header>
                  {opps.length === 0 ? (
                    <p className="font-serif italic text-church-muted text-sm">Nenhuma oportunidade adicionada.</p>
                  ) : (
                    <ul className={`gap-x-4 gap-y-1 sm:gap-y-1.5 ${
                      opps.length > 2 
                        ? 'grid grid-cols-1 sm:grid-cols-2' 
                        : 'space-y-1 sm:space-y-1.5 list-disc list-inside'
                    }`}>
                      {opps.map((op, i) => {
                        const isReady = op.status === 'ready';
                        const isDone = op.status === 'done';
                        return (
                          <li key={op.id || i} className={`font-bold text-sm sm:text-base font-sans leading-snug break-inside-avoid flex items-center justify-between gap-2 px-2 py-1 rounded-lg ${
                            isReady 
                              ? 'bg-amber-100/90 text-amber-950 border border-amber-300' 
                              : isDone 
                                ? 'bg-emerald-50/70 text-emerald-900 line-through border border-emerald-200 opacity-80' 
                                : 'text-church-charcoal'
                          }`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={isReady ? 'text-amber-600 font-bold mr-1' : isDone ? 'text-emerald-600 font-bold mr-1' : 'text-church-gold font-bold mr-1'}>•</span>
                              <span className="truncate">{op.name}</span>
                            </div>
                            {isReady && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Vai Cantar" />}
                            {isDone && (
                              <span title="Já Cantou">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>

                {/* 4. DEPARTAMENTOS DO CULTO (AMPLIADO PARA O PÚLPITO) */}
                <article className="pt-2.5 border-t border-church-sand/60 shrink-0">
                  <header className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                      Departamentos
                    </h3>
                  </header>
                  <div className="flex flex-wrap gap-2">
                    {choirs.filter(ch => ch.checked).map((ch, i) => {
                      const isReady = ch.status === 'ready';
                      const isDone = ch.status === 'done';
                      return (
                        <span 
                          key={ch.id || i}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm border-2 shadow-xs tracking-wide transition-all ${
                            isReady 
                              ? 'bg-amber-100 text-amber-950 border-church-gold ring-2 ring-church-gold/30' 
                              : isDone 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 line-through opacity-85' 
                                : 'bg-church-gold/20 text-church-charcoal border-church-gold/40'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 stroke-[2.5]" />
                          ) : isReady ? (
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 stroke-[2.5]" />
                          ) : (
                            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold-dark shrink-0 stroke-[2.5]" />
                          )}
                          <span>{ch.name}</span>
                          {isDone && <span className="text-[10px] font-title uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1 rounded ml-1">OK</span>}
                        </span>
                      );
                    })}
                    {choirs.filter(ch => ch.checked).length === 0 && (
                      <span className="font-serif italic text-church-muted text-sm">Nenhum departamento escalado</span>
                    )}
                  </div>
                </article>
              </div>

              {/* BOTÃO VISÍVEL DE ROLAGEM / AVISO PARA IDOSOS (FOLHA 2) */}
              {hasMoreSheet2 ? (
                <button
                  type="button"
                  onClick={handleScrollSheet2Down}
                  className="w-full py-1 px-3 my-1 rounded-xl bg-amber-100/90 hover:bg-amber-200 border-2 border-amber-400 text-amber-950 flex items-center justify-between text-xs sm:text-sm font-title font-extrabold shadow-sm active:scale-98 transition-all shrink-0 cursor-pointer animate-pulse"
                  title="Toque aqui para descer e ver mais pedidos"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronDown className="w-4 h-4 text-amber-800 animate-bounce" />
                    <span>Há mais pedidos abaixo</span>
                  </span>
                  <span className="bg-amber-300/90 text-amber-950 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider">
                    Toque para descer ⬇
                  </span>
                </button>
              ) : isSheet2Scrolled ? (
                <button
                  type="button"
                  onClick={handleScrollSheet2Up}
                  className="w-full py-1 px-3 my-1 rounded-xl bg-white hover:bg-church-parchment border border-church-sand text-church-charcoal flex items-center justify-center gap-1.5 text-xs font-title font-bold shadow-2xs active:scale-98 transition-all shrink-0 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-church-gold-dark" />
                  <span>Voltar ao topo</span>
                </button>
              ) : null}

              {/* Rodapé da Folha 2 */}
              <div className="pt-1.5 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 2 (Orações & Departamentos)</span>
                <span className="font-mono">Página 2</span>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR DISCRETA DE ZOOM, ALTERNÂNCIA DE FOLHAS E STATUS DO PÚLPITO */}
      {/* ========================================================================= */}
      <footer className="bg-church-parchment/90 border-t border-church-sand/70 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs text-church-muted shrink-0 gap-2">
        {/* Esquerda: Status de Conexão Silencioso */}
        <div className="flex items-center gap-2 shrink-0">
          <span 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              !isConnected 
                ? 'bg-amber-500 pulse-status' 
                : hasFreshUpdates 
                  ? 'bg-church-gold ring-4 ring-church-gold/40 scale-125' 
                  : isFastSync 
                    ? 'bg-emerald-500 animate-pulse' 
                    : 'bg-emerald-500'
            }`}
            title={
              !isConnected 
                ? 'Modo offline resiliente (conteúdo salvo localmente)' 
                : isFastSync 
                  ? 'Sincronização Rápida Ativa (2s) - Novidades recentes no culto' 
                  : 'Conectado em tempo real (Modo Econômico)'
            }
          />
          <span className="text-[11px] font-sans whitespace-nowrap hidden sm:inline">
            {!isConnected ? 'Offline (Seguro)' : hasFreshUpdates ? 'Atualizado!' : isFastSync ? 'Ao vivo ⚡ (2s)' : 'Sincronizado'}
          </span>
        </div>

        {/* Centro: Seletor de Visualização com '4 Visões' em 1º com destaque forte */}
        <div className="flex items-center gap-1 bg-white/95 p-1 rounded-xl border border-church-sand shadow-2xs">
          {/* 1º BOTÃO: 4 VISÕES (Novo modo, agora em primeiro) */}
          <button
            type="button"
            onClick={() => handleToggleSheetLayout('four-views')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
              effectiveLayout === 'four-views'
                ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30'
                : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
            }`}
            title="Visualização em 4 Visões Focadas com Abas (Orações, Oportunidades, Visitantes, Avisos)"
          >
            <LayoutList className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'four-views' ? 'text-white' : 'text-church-gold-dark'}`} />
            <span>4 Visões</span>
            {effectiveLayout === 'four-views' && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30 ml-0.5">
                {activeTab === 'prayers' ? 'Orações' : activeTab === 'visitors' ? 'Visitantes' : activeTab === 'opps' ? 'Oportunidades' : 'Avisos'}
              </span>
            )}
          </button>

          {/* 2º BOTÃO: PASTA ABERTA (2 folhas lado a lado) */}
          {!isMobilePhone && (
            <button
              type="button"
              onClick={() => handleToggleSheetLayout('two-sheets')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
                effectiveLayout === 'two-sheets'
                  ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
                  : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
              }`}
              title="Visualização em Pasta Aberta (2 folhas lado a lado, estilo pasta de couro do púlpito)"
            >
              <BookOpen className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'two-sheets' ? 'text-white' : 'text-church-gold-dark'}`} />
              <span className="hidden xs:inline">Pasta Aberta</span>
            </button>
          )}

          {/* 3º BOTÃO: FOLHA ÚNICA (contínua) */}
          <button
            type="button"
            onClick={() => handleToggleSheetLayout('single-sheet')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
              effectiveLayout === 'single-sheet'
                ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
                : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
            }`}
            title="Visualização em Folha Única (leitura contínua vertical, ideal para tablet em pé)"
          >
            <FileText className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'single-sheet' ? 'text-white' : 'text-church-gold-dark'}`} />
            <span className="hidden xs:inline">Folha Única</span>
          </button>
        </div>

        {/* Direita: Controles de zoom, Nome do Culto e Botão Sair do Púlpito */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Nome do Culto com Destaque e Elegância Clássica (font-serif italic) */}
          <span 
            className="text-xs sm:text-sm md:text-base font-serif italic font-semibold text-church-charcoal bg-white/95 px-3 py-1 rounded-lg border border-church-sand shadow-2xs truncate max-w-[170px] sm:max-w-[320px] md:max-w-[440px]"
            title={room.title}
          >
            {room.title}
          </span>
          {/* Ajuste de Tamanho da Letra para Pregadores Idosos (Zoom em passos de 10%) */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-church-sand px-1.5 sm:px-2 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleFontChange(-0.1)}
              className="p-1 sm:p-1.5 hover:text-church-charcoal active:scale-90 cursor-pointer"
              title="Diminuir tamanho da letra (Zoom -10%)"
              aria-label="Diminuir tamanho da letra"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[10px] sm:text-xs font-title font-bold px-1 text-church-charcoal tabular-nums min-w-[36px] text-center">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleFontChange(0.1)}
              className="p-1 sm:p-1.5 hover:text-church-charcoal active:scale-90 cursor-pointer"
              title="Aumentar tamanho da letra (Zoom +10%)"
              aria-label="Aumentar tamanho da letra"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Botão Sair Discreto do Púlpito para Voltar à Tela Inicial */}
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white border border-transparent hover:border-church-sand transition-colors text-[11px] font-title font-medium uppercase tracking-wider cursor-pointer"
            title="Sair do Púlpito e voltar à tela inicial"
          >
            <LogOut className="w-3.5 h-3.5 text-church-muted" />
            <span>Sair</span>
          </button>
        </div>
      </footer>

      {/* MODAL DE CONFIRMAÇÃO DE SAÍDA DO PÚLPITO (PROTEÇÃO PARA O IDOSO) */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-church-parchment border border-church-sand flex items-center justify-center text-church-charcoal shrink-0">
                <LogOut className="w-5 h-5 text-church-charcoal" />
              </div>
              <div>
                <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
                  Deseja Sair do Púlpito?
                </h3>
                <p className="font-sans text-xs text-church-muted mt-0.5">
                  Voltar para a tela inicial do culto
                </p>
              </div>
            </div>

            <div className="p-3 bg-church-parchment/70 border border-church-sand rounded-xl text-xs text-church-charcoal leading-relaxed">
              <p className="font-medium">
                Você sairá da visualização do Púlpito e retornará à tela de entrada.
              </p>
              <p className="mt-1 text-[11px] text-church-muted">
                As anotações e pedidos continuam salvos com segurança no sistema.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-church-sand/50">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-title text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 border border-red-700"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Cancelar / Ficar no Púlpito</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  leaveRoom();
                }}
                className="px-4 py-2.5 rounded-xl border border-church-sand text-church-charcoal hover:bg-church-parchment font-title text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-church-muted" />
                <span>Sim, Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
