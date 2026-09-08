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
  FileText
} from 'lucide-react';
import { LoadingScreen } from '../common/LoadingScreen';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, isFastSync, hasFreshUpdates, leaveRoom } = useRoom();

  // Escala de fonte para pregadores idosos (padrão solicitado: 96% ~ 0.96)
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pulpit_font_scale_v2');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.8 && val <= 1.6) return val;
      }
    } catch (e) {}
    return 0.96;
  });

  const handleFontChange = (delta: number) => {
    setFontScale(prev => {
      const next = Math.max(0.8, Math.min(1.6, Number((prev + delta).toFixed(2))));
      try {
        localStorage.setItem('pulpit_font_scale_v2', next.toString());
      } catch (e) {}
      return next;
    });
  };

  // Modo de visualização de folhas: 'two-sheets' (pasta aberta) vs 'single-sheet' (folha única contínua)
  const [sheetLayout, setSheetLayout] = useState<'two-sheets' | 'single-sheet'>(() => {
    try {
      const saved = localStorage.getItem('pulpit_sheet_layout');
      if (saved === 'two-sheets' || saved === 'single-sheet') return saved;
      // Detecção automática inteligente: em telas estreitas ou orientação retrato em tablet/mobile
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768 || window.innerHeight > window.innerWidth) {
          return 'single-sheet';
        }
      }
    } catch (e) {}
    return 'two-sheets';
  });

  const handleToggleSheetLayout = (mode: 'two-sheets' | 'single-sheet') => {
    setSheetLayout(mode);
    try {
      localStorage.setItem('pulpit_sheet_layout', mode);
    } catch (e) {}
  };

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

  // BALANCEAMENTO DINÂMICO INTELIGENTE ENTRE AS DUAS FOLHAS:
  // - 0 visitantes: Folha 1 puxa até 10 orações para não ficar com espaço vazio.
  // - 1 a 4 visitantes: Folha 1 puxa até 5 orações.
  // - 5 a 8 visitantes: Graças às sub-colunas em 2 lados (grid-cols-2), 8 visitantes ocupam
  //   apenas 4 linhas de altura! Isso deixa espaço de sobra para colocar até 4 orações na Folha 1.
  // - Mais de 8 visitantes (ex: 12 ou 16 visitantes): a Folha 1 é 100% dedicada aos visitantes (0 orações),
  //   garantindo zero scroll no Galaxy Tab E (SM-T560), Tab A9 e notebooks de 15".
  const maxSheet1Prayers = visitors.length === 0
    ? 10
    : visitors.length <= 4 
      ? 5 
      : visitors.length <= 8 
        ? 4 
        : 0;
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
  }, [visitors, prayers, youtube, fontScale, opps, choirs, sheetLayout]);

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
        {/* ================= 1. VISUALIZAÇÃO EM FOLHA ÚNICA (PÁGINA CONTÍNUA ESTILO GOOGLE DOCS) ================= */}
        {sheetLayout === 'single-sheet' && (
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 min-h-0 scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-3xl w-full mx-auto paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 border border-church-sand shadow-sheet">
              {/* Cabeçalho Oficial da Página */}
              <div className="border-b border-church-sand pb-2.5 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Liturgia do Culto
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
                    {opps.map((op, i) => (
                      <li key={op.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid">
                        {opps.length > 2 && <span className="text-church-gold font-bold mr-1">•</span>}
                        <span>{op.name}</span>
                      </li>
                    ))}
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
                  {choirs.filter(ch => ch.checked).map((ch, i) => (
                    <span 
                      key={ch.id || i}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-church-gold/20 text-church-charcoal font-black text-xs sm:text-sm border-2 border-church-gold/40 shadow-xs tracking-wide"
                    >
                      <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold-dark shrink-0 stroke-[2.5]" />
                      <span>{ch.name}</span>
                    </span>
                  ))}
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
        {sheetLayout === 'two-sheets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 flex-1 p-2 sm:p-3 md:p-3.5 overflow-hidden h-full max-h-full min-h-0">
            {/* ================= FOLHA 1 (ESQUERDA) - ZERO SCROLL ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 md:p-4 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho Compacto da Folha 1 */}
              <div className="border-b border-church-sand pb-1.5 mb-1.5 sm:pb-2 sm:mb-2 flex items-center justify-between gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="font-title text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Liturgia & Recepção
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
                      visitors.length > 1 
                        ? 'grid grid-cols-1 sm:grid-cols-2' 
                        : 'space-y-1 sm:space-y-1.5 list-disc list-inside'
                    }`}>
                      {visitors.map((v, i) => (
                        <li key={v.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid">
                          {visitors.length > 1 && <span className="text-church-gold font-bold mr-1">•</span>}
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
                <span className="font-serif italic">Folha 1 (Recepção & Visitantes)</span>
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
                      {opps.map((op, i) => (
                        <li key={op.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid">
                          {opps.length > 2 && <span className="text-church-gold font-bold mr-1">•</span>}
                          <span>{op.name}</span>
                        </li>
                      ))}
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
                    {choirs.filter(ch => ch.checked).map((ch, i) => (
                      <span 
                        key={ch.id || i}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-church-gold/20 text-church-charcoal font-black text-xs sm:text-sm border-2 border-church-gold/40 shadow-xs tracking-wide"
                      >
                        <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold-dark shrink-0 stroke-[2.5]" />
                        <span>{ch.name}</span>
                      </span>
                    ))}
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

        {/* Centro: Seletor Sutil e Discreto de Visualização (Pasta Aberta vs Folha Única) */}
        <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-church-sand shadow-2xs">
          <button
            type="button"
            onClick={() => handleToggleSheetLayout('two-sheets')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-title font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              sheetLayout === 'two-sheets'
                ? 'bg-church-gold/20 text-church-charcoal border border-church-gold/40 shadow-2xs'
                : 'text-church-muted hover:text-church-charcoal hover:bg-church-parchment/60'
            }`}
            title="Visualização em Pasta Aberta (2 folhas lado a lado, estilo pasta de couro do púlpito)"
          >
            <BookOpen className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
            <span className="hidden xs:inline">Pasta Aberta</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleSheetLayout('single-sheet')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-title font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              sheetLayout === 'single-sheet'
                ? 'bg-church-gold/20 text-church-charcoal border border-church-gold/40 shadow-2xs'
                : 'text-church-muted hover:text-church-charcoal hover:bg-church-parchment/60'
            }`}
            title="Visualização em Folha Única (leitura contínua vertical, ideal para tablet em pé)"
          >
            <FileText className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
            <span className="hidden xs:inline">Folha Única</span>
          </button>
        </div>

        {/* Direita: Controles de zoom e Botão Sair do Púlpito */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Ajuste de Tamanho da Letra para Pregadores Idosos */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-church-sand px-1.5 sm:px-2 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleFontChange(-0.04)}
              className="p-1 hover:text-church-charcoal active:scale-90 cursor-pointer"
              title="Diminuir tamanho da letra"
              aria-label="Diminuir tamanho da letra"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-title font-bold px-1 text-church-charcoal tabular-nums">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleFontChange(0.04)}
              className="p-1 hover:text-church-charcoal active:scale-90 cursor-pointer"
              title="Aumentar tamanho da letra"
              aria-label="Aumentar tamanho da letra"
            >
              <ZoomIn className="w-3.5 h-3.5" />
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
