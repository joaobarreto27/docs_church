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
  ChevronUp 
} from 'lucide-react';
import { LoadingScreen } from '../common/LoadingScreen';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, leaveRoom } = useRoom();

  // Escala de fonte para pregadores idosos (padrão aumentado em 2 níveis: 1.22 ~ 122%)
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pulpit_font_scale');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.9 && val <= 1.6) return val;
      }
    } catch (e) {}
    return 1.22;
  });

  const handleFontChange = (delta: number) => {
    setFontScale(prev => {
      const next = Math.max(0.9, Math.min(1.6, Number((prev + delta).toFixed(2))));
      try {
        localStorage.setItem('pulpit_font_scale', next.toString());
      } catch (e) {}
      return next;
    });
  };

  // Estados de detecção de overflow e rolagem fácil para idosos
  const [hasMoreSheet1, setHasMoreSheet1] = useState(false);
  const [isSheet1Scrolled, setIsSheet1Scrolled] = useState(false);
  const sheet1ScrollRef = useRef<HTMLDivElement>(null);

  const [hasMoreSheet2, setHasMoreSheet2] = useState(false);
  const [isSheet2Scrolled, setIsSheet2Scrolled] = useState(false);
  const sheet2ScrollRef = useRef<HTMLDivElement>(null);

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

  // OPÇÃO 1: PASTA ABERTA EM 2 FOLHAS (SEM VIRADA DE PÁGINA)
  // Balanceamento dinâmico para preenchimento harmônico da Folha 1 (eliminando espaço em branco vazio):
  // 8 visitantes ocupam linhas curtas, permitindo 6 a 7 pedidos na Folha 1 antes de transbordar para a Folha 2.
  const maxSheet1Prayers = visitors.length <= 3 
    ? 8 
    : visitors.length <= 6 
      ? 7 
      : visitors.length <= 10 
        ? 6 
        : visitors.length <= 14 
          ? 4 
          : 3;
  const sheet1Prayers = prayers.slice(0, maxSheet1Prayers);
  const overflowPresencial = prayers.slice(maxSheet1Prayers);
  const sheet2Items: PrayerItem[] = [...overflowPresencial, ...youtube];

  // Monitora se há conteúdo oculto que requer rolagem em cada folha
  const checkScrollState = () => {
    if (sheet1ScrollRef.current) {
      const el = sheet1ScrollRef.current;
      const hasOverflow = el.scrollHeight > el.clientHeight + 15;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
      setHasMoreSheet1(hasOverflow && !isAtBottom);
      setIsSheet1Scrolled(el.scrollTop > 30);
    }
    if (sheet2ScrollRef.current) {
      const el = sheet2ScrollRef.current;
      const hasOverflow = el.scrollHeight > el.clientHeight + 15;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
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
  }, [visitors, prayers, youtube, fontScale, opps, choirs]);

  const handleScrollSheet1Down = () => {
    if (sheet1ScrollRef.current) {
      sheet1ScrollRef.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  const handleScrollSheet1Up = () => {
    if (sheet1ScrollRef.current) {
      sheet1ScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollSheet2Down = () => {
    if (sheet2ScrollRef.current) {
      sheet2ScrollRef.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  const handleScrollSheet2Up = () => {
    if (sheet2ScrollRef.current) {
      sheet2ScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Componente de Oportunidades e Departamentos (Sempre Visível no Rodapé da Folha 2)
  const DepartamentosEOportunidadesAnchor = () => (
    <div className="pt-3 border-t-2 border-church-sand/80 bg-church-parchment/80 rounded-xl p-3 sm:p-4 space-y-2 shrink-0 shadow-xs border border-church-sand">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Oportunidades */}
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-church-gold-dark">
            <span className="w-2 h-2 rounded-full bg-church-gold shrink-0" />
            <h4 className="font-title text-xs sm:text-sm font-bold uppercase tracking-wider">
              Oportunidades ({opps.length})
            </h4>
          </div>
          {opps.length === 0 ? (
            <p className="font-serif italic text-church-muted text-xs sm:text-sm">Nenhuma oportunidade adicionada.</p>
          ) : (
            <ul className="space-y-1 text-xs sm:text-sm font-sans text-church-charcoal">
              {opps.map((op, i) => (
                <li key={op.id || i} className="font-semibold flex items-center gap-1.5 leading-snug">
                  <span className="text-church-gold font-bold">•</span>
                  <span>{op.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Departamentos */}
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-church-gold-dark">
            <span className="w-2 h-2 rounded-full bg-church-gold shrink-0" />
            <h4 className="font-title text-xs sm:text-sm font-bold uppercase tracking-wider">
              Departamentos
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {choirs.filter(ch => ch.checked).map((ch, i) => (
              <span 
                key={ch.id || i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-church-gold/15 text-church-charcoal font-bold text-xs sm:text-sm border border-church-gold/30"
              >
                <CheckSquare className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
                <span>{ch.name}</span>
              </span>
            ))}
            {choirs.filter(ch => ch.checked).length === 0 && (
              <span className="font-serif italic text-church-muted text-xs sm:text-sm">Nenhum departamento escalado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col bg-church-parchment select-none overflow-hidden relative min-h-0">
      {/* ⚠️ FAIXA DE ALERTA NO TOPO - EMPURRA SUAVEMENTE AS FOLHAS */}
      {room.active_alert && (
        <aside 
          aria-live="assertive"
          className="w-full bg-alert-bg border-b-2 border-alert-border px-4 py-2.5 flex items-center justify-center gap-3 shadow-md animate-slideDown shrink-0"
        >
          <AlertCircle className="w-5 h-5 text-alert-text shrink-0 animate-bounce" />
          <p className="font-title text-sm sm:text-base font-bold text-alert-text uppercase tracking-wide text-center">
            {room.active_alert}
          </p>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* OPÇÃO 1: DUAS FOLHAS LADO A LADO EM MODO PAISAGEM COM ROLAGEM VERTICAL SUAVE */}
      {/* ========================================================================= */}
      <main 
        className="flex-1 p-2 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden h-full max-h-full min-h-0"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {/* ================= FOLHA 1 (ESQUERDA) ================= */}
        <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
          {/* Cabeçalho da Folha 1 */}
          <div className="border-b border-church-sand pb-3 mb-3 flex items-center justify-between gap-4 shrink-0">
            <div className="flex flex-col">
              <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                Liturgia & Recepção
              </span>
              <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                {room.title}
              </h2>
            </div>
            <img 
              src="/assets/logo-adutinga-horizontal.png" 
              alt="A.D. Utinga" 
              className="h-7 sm:h-9 w-auto object-contain"
            />
          </div>

          {/* Conteúdo Dinâmico da Folha 1 com Rolagem Vertical Suave */}
          <div 
            ref={sheet1ScrollRef}
            onScroll={checkScrollState}
            className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-2 flex flex-col scrollbar-thin"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Bloco de Visitantes */}
            <article className="pb-3 border-b border-church-sand/50 shrink-0">
              <header className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                  Visitantes do Culto ({visitors.length})
                </h3>
              </header>
              {visitors.length === 0 ? (
                <p className="font-serif italic text-church-muted/70 text-sm">Nenhum visitante registrado ainda.</p>
              ) : (
                <ul className="space-y-1.5 list-disc list-inside">
                  {visitors.map((v, i) => (
                    <li key={v.id || i} className="font-sans text-church-charcoal leading-snug">
                      <strong className="font-semibold">{v.name}</strong>
                      {v.church && <span className="text-church-muted"> ({v.church})</span>}
                      {v.invited_by && <span className="text-church-muted text-xs"> — Por: {v.invited_by}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            {/* Bloco de Pedidos de Oração Presenciais */}
            <article className="flex-1">
              <header className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                  Pedidos de Oração ({sheet1Prayers.length})
                </h3>
              </header>
              {sheet1Prayers.length === 0 ? (
                <p className="font-serif italic text-church-muted/70 text-sm">Nenhum pedido de oração inserido.</p>
              ) : (
                <ul className="space-y-2 list-disc list-inside">
                  {sheet1Prayers.map((p, i) => (
                    <li key={p.id || i} className="font-sans text-church-charcoal leading-relaxed">
                      {p.urgent && (
                        <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                          Urgente
                        </span>
                      )}
                      <span className="font-medium">{p.description}</span>
                    </li>
                  ))}
                </ul>
              )}
              {sheet2Items.length > 0 && (
                <p className="font-serif italic text-xs text-church-gold-dark mt-3">
                  * Mais pedidos de oração na Folha 2 à direita ➔
                </p>
              )}
            </article>
          </div>

          {/* BOTÃO VISÍVEL DE ROLAGEM / AVISO PARA IDOSOS (FOLHA 1) */}
          {hasMoreSheet1 ? (
            <button
              type="button"
              onClick={handleScrollSheet1Down}
              className="w-full py-1.5 px-3 my-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 border-2 border-amber-400 text-amber-950 flex items-center justify-between text-xs sm:text-sm font-title font-extrabold shadow-sm active:scale-98 transition-all shrink-0 cursor-pointer animate-pulse"
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
          <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
            <span className="font-serif italic">Folha 1 (Recepção & Orações)</span>
            <span className="font-mono">Página 1</span>
          </div>
        </section>

        {/* ================= FOLHA 2 (DIREITA) ================= */}
        <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
          {/* Cabeçalho da Folha 2 */}
          <div className="border-b border-church-sand pb-3 mb-3 flex items-center justify-between gap-4 shrink-0">
            <div className="flex flex-col">
              <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                Intercessão & Escala
              </span>
              <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                {sheet2Items.length > 0 ? 'Orações & Transmissão' : 'Escala do Culto'}
              </h2>
            </div>
            <span className="font-serif italic text-xs text-church-muted">
              "Aqui chegamos pela fé!"
            </span>
          </div>

          {/* Conteúdo Dinâmico de Orações da Folha 2 (Apenas esta área rola!) */}
          <div 
            ref={sheet2ScrollRef}
            onScroll={checkScrollState}
            className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 flex flex-col scrollbar-thin"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {sheet2Items.length > 0 ? (
              <article className="flex-1">
                <header className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                    Mais Pedidos de Oração ({sheet2Items.length})
                  </h3>
                </header>
                {/* Lista de Orações da Folha 2 com o EXATO mesmo tamanho e estilo da Folha 1 */}
                <ul className="space-y-2 list-disc list-inside">
                  {sheet2Items.map((p, i) => (
                    <li key={p.id || i} className="font-sans text-church-charcoal leading-relaxed">
                      {p.urgent && (
                        <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                          Urgente
                        </span>
                      )}
                      <span className="font-medium">{p.description}</span>
                      {/* Print do chat do YouTube inline sem popup gigante */}
                      {p.image_data && (
                        <div className="mt-1.5 ml-4 rounded-lg overflow-hidden border border-church-sand bg-white p-1 max-w-[260px] shadow-2xs">
                          <img 
                            src={p.image_data} 
                            alt="Print do chat" 
                            className="w-full h-auto max-h-24 object-contain rounded"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-church-muted space-y-1">
                <p className="font-serif italic text-sm text-church-charcoal">
                  "Orai sem cessar. Em tudo dai graças."
                </p>
                <span className="text-[11px] font-title font-bold text-church-gold uppercase">1 Tessalonicenses 5:17</span>
              </div>
            )}
          </div>

          {/* BOTÃO VISÍVEL DE ROLAGEM / AVISO PARA IDOSOS (FOLHA 2) */}
          {hasMoreSheet2 ? (
            <button
              type="button"
              onClick={handleScrollSheet2Down}
              className="w-full py-1.5 px-3 my-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 border-2 border-amber-400 text-amber-950 flex items-center justify-between text-xs sm:text-sm font-title font-extrabold shadow-sm active:scale-98 transition-all shrink-0 cursor-pointer animate-pulse"
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

          {/* BLOCO FIXO ANCORADO NO RODAPÉ DA FOLHA 2: OPORTUNIDADES E DEPARTAMENTOS */}
          {/* SEMPRE VISÍVEL! NUNCA FICA ESCONDIDO LÁ EMBAIXO! */}
          <DepartamentosEOportunidadesAnchor />

          {/* Rodapé da Folha 2 */}
          <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
            <span className="font-serif italic">Folha 2 (Orações & Departamentos)</span>
            <span className="font-mono">Página 2</span>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR DISCRETA DE ZOOM E STATUS DO PÚLPITO (SEM BOTÕES DE VIRAR PÁGINA) */}
      {/* ========================================================================= */}
      <footer className="bg-church-parchment/80 border-t border-church-sand/60 px-4 py-1.5 flex items-center justify-between text-xs text-church-muted shrink-0">
        {/* Status de Conexão Silencioso */}
        <div className="flex items-center gap-2">
          <span 
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 pulse-status'}`}
            title={isConnected ? 'Conectado em tempo real' : 'Modo offline resiliente (conteúdo salvo localmente)'}
          />
          <span className="text-[11px] font-sans">
            {isConnected ? 'Sincronizado' : 'Offline (Seguro)'}
          </span>
        </div>

        {/* Centro: Indicador de Pasta Aberta (Sem Virada de Página) */}
        <div className="flex items-center gap-2">
          <span className="font-title text-[11px] font-bold uppercase tracking-wider text-church-charcoal/80 bg-white/70 px-3 py-1 rounded-full border border-church-sand shadow-2xs">
            Pasta Aberta • Folhas 1 e 2
          </span>
        </div>

        {/* Direita: Controles de zoom e Botão Sair do Púlpito */}
        <div className="flex items-center gap-3">
          {/* Ajuste de Tamanho da Letra para Pregadores Idosos */}
          <div className="flex items-center gap-1.5 bg-white rounded-lg border border-church-sand px-2 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleFontChange(-0.08)}
              className="p-1 hover:text-church-charcoal active:scale-90 cursor-pointer"
              title="Diminuir tamanho da letra"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-title font-bold px-1 text-church-charcoal">
              A {Math.round(fontScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleFontChange(0.08)}
              className="p-1 hover:text-church-charcoal active:scale-90 cursor-pointer"
              title="Aumentar tamanho da letra"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão Sair Discreto do Púlpito para Voltar à Tela Inicial */}
          <button
            type="button"
            onClick={leaveRoom}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white border border-transparent hover:border-church-sand transition-colors text-[11px] font-title font-medium uppercase tracking-wider"
            title="Sair do Púlpito e voltar à tela inicial"
          >
            <LogOut className="w-3.5 h-3.5 text-church-muted" />
            <span>Sair</span>
          </button>
        </div>
      </footer>
    </div>
  );
};


