import React, { useState, useEffect } from 'react';
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
  ChevronLeft, 
  ChevronRight,
  Calendar
} from 'lucide-react';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, setPage, leaveRoom } = useRoom();

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

  if (!room) return null;

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

  // Particionamento inteligente dos pedidos de oração e live
  // Folha 1: balanceia visitantes e pedidos para nada ser cortado
  const maxSheet1Prayers = visitors.length <= 3 ? 6 : (visitors.length <= 6 ? 4 : 3);
  const sheet1Prayers = prayers.slice(0, maxSheet1Prayers);
  const overflowPresencial = prayers.slice(maxSheet1Prayers);
  const overflowItems: PrayerItem[] = [...overflowPresencial, ...youtube];

  // Capacidade generosa da Folha 2:
  // Itens de texto têm peso 1; itens com imagem (print do YouTube) têm peso 3.
  // A Folha 2 comporta confortavelmente até 8 pontos de peso acima do bloco de Participação e Louvor.
  const sheet2Items: PrayerItem[] = [];
  const spread2Queue: PrayerItem[] = [];
  let folha2Weight = 0;
  const MAX_FOLHA_2_WEIGHT = 8;

  for (const item of overflowItems) {
    const itemWeight = item.image_data ? 3 : 1;
    if (folha2Weight + itemWeight <= MAX_FOLHA_2_WEIGHT) {
      sheet2Items.push(item);
      folha2Weight += itemWeight;
    } else {
      spread2Queue.push(item);
    }
  }

  // Apenas cria o Spread 2 (Página 3/4) se os pedidos realmente excederem a capacidade da Folha 2
  // ou se o controlador navegou manualmente para a página 2
  const needsSecondSpread = spread2Queue.length > 0 || room.current_page === 2;

  const totalSpreads = needsSecondSpread ? 2 : 1;
  const currentSpread = Math.min(room.current_page || 1, totalSpreads);

  // Navegação de páginas
  const handlePrevSpread = () => {
    if (currentSpread > 1) {
      setPage(currentSpread - 1);
    }
  };

  const handleNextSpread = () => {
    if (currentSpread < totalSpreads) {
      setPage(currentSpread + 1);
    }
  };

  // Suporte a teclas de seta para virar folha no púlpito
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (currentSpread < totalSpreads) setPage(currentSpread + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentSpread > 1) setPage(currentSpread - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpread, totalSpreads, setPage]);

  // Itens na Folha 3 (Spread 2): continuação do que não coube na Folha 2
  const sheet3Items = totalSpreads > 1 ? spread2Queue.slice(0, 8) : [];
  // Itens na Folha 4 (Spread 2): se houver mais de 8 no spread 2
  const sheet4Items = totalSpreads > 1 ? spread2Queue.slice(8) : [];

  // Componente Reutilizável de Participação e Louvor Final (Sempre Ancorado no Canto Inferior Direito)
  const ParticipacaoELouvorAnchor = () => (
    <div className="mt-auto pt-3 border-t-2 border-church-sand/60 bg-church-parchment/50 rounded-xl p-3 space-y-2.5 shrink-0 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Participação (Oportunidades) */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-church-gold-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
            <h4 className="font-title text-[11px] font-bold uppercase tracking-wider">
              Participação ({opps.length})
            </h4>
          </div>
          {opps.length === 0 ? (
            <p className="font-serif italic text-church-muted text-xs">Nenhuma escalada.</p>
          ) : (
            <ul className="space-y-1 text-xs font-sans text-church-charcoal">
              {opps.map((op, i) => (
                <li key={op.id || i} className="font-semibold truncate">
                  • {op.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Louvor Final (Conjuntos) */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-church-gold-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
            <h4 className="font-title text-[11px] font-bold uppercase tracking-wider">
              Louvor Final
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {choirs.filter(ch => ch.checked).map((ch, i) => (
              <span 
                key={ch.id || i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-church-gold/15 text-church-charcoal font-bold text-[10px]"
              >
                <CheckSquare className="w-3 h-3 text-church-gold-dark" />
                {ch.name}
              </span>
            ))}
            {choirs.filter(ch => ch.checked).length === 0 && (
              <span className="font-serif italic text-church-muted text-xs">Nenhum escalado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-church-parchment select-none overflow-hidden relative">
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

      {/* ÁREA DE TOQUE LATERAL ESQUERDA (VIRAR FOLHA ANTERIOR) */}
      {currentSpread > 1 && (
        <button
          type="button"
          onClick={handlePrevSpread}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-14 h-40 flex items-center justify-center bg-church-charcoal/5 hover:bg-church-gold/20 rounded-r-2xl transition-all opacity-40 hover:opacity-100 cursor-pointer"
          title="Voltar para as folhas anteriores"
          aria-label="Folhas anteriores"
        >
          <ChevronLeft className="w-8 h-8 text-church-charcoal" />
        </button>
      )}

      {/* ÁREA DE TOQUE LATERAL DIREITA (VIRAR PRÓXIMA FOLHA) */}
      {currentSpread < totalSpreads && (
        <button
          type="button"
          onClick={handleNextSpread}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 sm:w-14 h-40 flex items-center justify-center bg-church-charcoal/5 hover:bg-church-gold/20 rounded-l-2xl transition-all opacity-40 hover:opacity-100 cursor-pointer"
          title="Avançar para as próximas folhas"
          aria-label="Próximas folhas"
        >
          <ChevronRight className="w-8 h-8 text-church-charcoal" />
        </button>
      )}

      {/* ========================================================================= */}
      {/* ÁREA PRINCIPAL: DUAS FOLHAS LADO A LADO EM MODO PAISAGEM (ZERO SCROLL) */}
      {/* ========================================================================= */}
      <main 
        className="flex-1 p-2 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden h-full max-h-full"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {currentSpread === 1 ? (
          <>
            {/* ================= FOLHA 1 (ESQUERDA) ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho da Folha 1 */}
              <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
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

              {/* Conteúdo Dinâmico da Folha 1 */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1 flex flex-col scrollbar-thin">
                {/* Bloco de Visitantes */}
                <article className="pb-3 border-b border-church-sand/50 shrink-0">
                  <header className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                      Visitantes da Noite ({visitors.length})
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
                  {overflowItems.length > 0 && (
                    <p className="font-serif italic text-xs text-church-gold-dark mt-3">
                      * Mais pedidos de oração na Folha 2 à direita ➔
                    </p>
                  )}
                </article>
              </div>

              {/* Rodapé da Folha 1 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 1 (Recepção & Orações)</span>
                <span className="font-mono">Página 1 de {totalSpreads * 2}</span>
              </div>
            </section>

            {/* ================= FOLHA 2 (DIREITA) ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho da Folha 2 */}
              <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
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

              {/* Corpo da Folha 2: Transbordamento das Orações + Prints */}
              <div className="flex-1 space-y-3 overflow-hidden flex flex-col">
                {sheet2Items.length > 0 ? (
                  <article className="flex-1 overflow-hidden">
                    <header className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                      <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                        Mais Pedidos de Oração ({sheet2Items.length})
                      </h3>
                    </header>
                    <ul className="space-y-2.5">
                      {sheet2Items.map((p, i) => (
                        <li key={p.id || i} className="font-sans text-church-charcoal text-xs sm:text-sm leading-snug">
                          <div className="flex items-start gap-1.5">
                            <span className="text-church-gold shrink-0">•</span>
                            {p.urgent && (
                              <span className="inline-block px-1.5 py-0.2 shrink-0 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                Urgente
                              </span>
                            )}
                            <span className="font-medium text-church-charcoal">{p.description}</span>
                          </div>
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
                    {totalSpreads > 1 && spread2Queue.length > 0 && (
                      <p className="font-serif italic text-xs text-church-gold-dark mt-2">
                        * Mais pedidos na Folha 3 (Próxima página) ➔
                      </p>
                    )}
                  </article>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-church-muted space-y-1">
                    <p className="font-serif italic text-sm text-church-charcoal">
                      "Orai sem cessar. Em tudo dai graças."
                    </p>
                    <span className="text-[11px] font-title font-bold text-church-gold uppercase">1 Tessalonicenses 5:17</span>
                  </div>
                )}

                {/* BLOCO ANCORADO NO CANTO INFERIOR DIREITO */}
                <ParticipacaoELouvorAnchor />
              </div>

              {/* Rodapé da Folha 2 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 2 (Orações & Escala)</span>
                <span className="font-mono">Página 2 de {totalSpreads * 2}</span>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* ================= SPREAD 2: FOLHA 3 (ESQUERDA) ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho da Folha 3 */}
              <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col">
                  <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
                    Intercessão & Transmissão
                  </span>
                  <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    Pedidos de Oração (Continuação)
                  </h2>
                </div>
                <img 
                  src="/assets/logo-adutinga-horizontal.png" 
                  alt="A.D. Utinga" 
                  className="h-7 sm:h-9 w-auto object-contain"
                />
              </div>

              {/* Conteúdo da Folha 3 */}
              <div className="flex-1 space-y-3 overflow-hidden flex flex-col">
                <header className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <h3 className="font-title text-xs font-bold uppercase tracking-wider text-red-700">
                    Orações da Transmissão e Congregação ({sheet3Items.length})
                  </h3>
                </header>

                <ul className="space-y-2.5 flex-1 overflow-hidden">
                  {sheet3Items.map((p, i) => (
                    <li key={p.id || i} className="font-sans text-church-charcoal text-xs sm:text-sm leading-snug">
                      <div className="flex items-start gap-1.5">
                        <span className="text-church-gold shrink-0">•</span>
                        {p.urgent && (
                          <span className="inline-block px-1.5 py-0.2 shrink-0 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                            Urgente
                          </span>
                        )}
                        <span className="font-medium text-church-charcoal">{p.description}</span>
                      </div>
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
              </div>

              {/* Rodapé da Folha 3 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 3 (Orações & Live)</span>
                <span className="font-mono">Página 3 de 4</span>
              </div>
            </section>

            {/* ================= SPREAD 2: FOLHA 4 (DIREITA) ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho da Folha 4 */}
              <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col">
                  <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Edificação & Escala
                  </span>
                  <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    Programação & Liturgia
                  </h2>
                </div>
                <span className="font-serif italic text-xs text-church-muted">
                  "Aqui chegamos pela fé!"
                </span>
              </div>

              {/* Conteúdo da Folha 4 */}
              <div className="flex-1 space-y-3 overflow-hidden flex flex-col justify-between">
                {sheet4Items.length > 0 ? (
                  <div className="space-y-2">
                    <header className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                      <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                        Mais Pedidos ({sheet4Items.length})
                      </h3>
                    </header>
                    <ul className="space-y-1.5 text-xs font-sans">
                      {sheet4Items.map((p, i) => (
                        <li key={p.id || i} className="font-medium text-church-charcoal">
                          • {p.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  /* Agenda Semanal */
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-1 text-church-charcoal">
                      <Calendar className="w-3.5 h-3.5 text-church-gold" />
                      <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                        Programação Semanal
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-sans">
                      <div className="p-2 rounded-lg bg-church-parchment/60 border border-church-sand">
                        <span className="font-semibold text-church-charcoal block">Terça (19h30)</span>
                        <span className="text-church-muted text-[10px]">Culto de Doutrina</span>
                      </div>
                      <div className="p-2 rounded-lg bg-church-parchment/60 border border-church-sand">
                        <span className="font-semibold text-church-charcoal block">Quinta (14h30)</span>
                        <span className="text-church-muted text-[10px]">Círculo de Oração</span>
                      </div>
                      <div className="p-2 rounded-lg bg-church-parchment/60 border border-church-sand">
                        <span className="font-semibold text-church-charcoal block">Sábado (08h00)</span>
                        <span className="text-church-muted text-[10px]">Consagração</span>
                      </div>
                      <div className="p-2 rounded-lg bg-church-parchment/60 border border-church-sand">
                        <span className="font-semibold text-church-charcoal block">Domingo (18h30)</span>
                        <span className="text-church-muted text-[10px]">Culto da Família</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* BLOCO ANCORADO NO CANTO INFERIOR DIREITO (IDÊNTICO AO DA FOLHA 2) */}
                <ParticipacaoELouvorAnchor />
              </div>

              {/* Rodapé da Folha 4 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 4 (Avisos & Escala)</span>
                <span className="font-mono">Página 4 de 4</span>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BARRA INFERIOR DISCRETA DE NAVEGAÇÃO, ZOOM E STATUS DO PÚLPITO */}
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

        {/* Centro: Navegação de Folhas (Spread 1 vs Spread 2) */}
        <div className="flex items-center gap-2">
          {totalSpreads > 1 && (
            <button
              type="button"
              disabled={currentSpread <= 1}
              onClick={handlePrevSpread}
              className="px-2.5 py-1 rounded-lg bg-white border border-church-sand text-church-charcoal text-[11px] font-title font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-church-parchment active:scale-95 transition-all"
              title="Folhas Anteriores"
            >
              ◀ Folhas 1-2
            </button>
          )}
          <span className="font-mono text-[11px] font-bold text-church-charcoal px-1">
            Folhas {currentSpread === 1 ? '1-2' : '3-4'} de {totalSpreads * 2}
          </span>
          {totalSpreads > 1 && (
            <button
              type="button"
              disabled={currentSpread >= totalSpreads}
              onClick={handleNextSpread}
              className="px-2.5 py-1 rounded-lg bg-white border border-church-sand text-church-charcoal text-[11px] font-title font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-church-parchment active:scale-95 transition-all"
              title="Próximas Folhas"
            >
              Folhas 3-4 ▶
            </button>
          )}
        </div>

        {/* Direita: Controles de zoom e Botão Sair do Púlpito */}
        <div className="flex items-center gap-3">
          {/* Ajuste de Tamanho da Letra para Terceira Idade */}
          <div className="flex items-center gap-1.5 bg-white rounded-lg border border-church-sand px-2 py-0.5">
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
