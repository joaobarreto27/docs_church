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
  Square, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Sparkles
} from 'lucide-react';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, setPage, leaveRoom } = useRoom();

  // Escala de fonte para pregadores idosos (1 = padrão 100%, 1.15 = grande, 1.3 = muito grande)
  const [fontScale, setFontScale] = useState<number>(1.05);

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

  // Determina se o volume de itens exige dividir em Spread 2 (Páginas 3-4) para garantir ZERO SCROLL
  const needsSecondSpread = 
    prayers.length + youtube.length > 6 || 
    youtube.length > 2 || 
    visitors.length + prayers.length > 7 ||
    room.current_page === 2;

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

  // Particionamento dos itens por spread para evitar scroll
  const spread1Prayers = totalSpreads > 1 ? prayers.slice(0, 5) : prayers;
  const spread2Prayers = totalSpreads > 1 ? prayers.slice(5) : [];

  return (
    <div className="h-screen w-screen flex flex-col bg-church-parchment select-none overflow-hidden relative">
      {/* ⚠️ FAIXA DE ALERTA NO TOPO (OPÇÃO A) - EMPURRA SUAVEMENTE AS FOLHAS */}
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
              {/* Cabeçalho da Folha 1 com Logotipo Horizontal Oficial */}
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
              <div className="flex-1 space-y-4 overflow-hidden">
                {/* Bloco de Visitantes */}
                <article className="pb-3 border-b border-church-sand/50">
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
                <article className="pb-2">
                  <header className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                      Pedidos de Oração ({spread1Prayers.length})
                    </h3>
                  </header>
                  {spread1Prayers.length === 0 ? (
                    <p className="font-serif italic text-church-muted/70 text-sm">Nenhum pedido de oração inserido.</p>
                  ) : (
                    <ul className="space-y-2 list-disc list-inside">
                      {spread1Prayers.map((p, i) => (
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
                  {totalSpreads > 1 && prayers.length > spread1Prayers.length && (
                    <p className="font-serif italic text-xs text-church-gold-dark mt-2">
                      * Mais {prayers.length - spread1Prayers.length} pedidos na Folha 3 ➔
                    </p>
                  )}
                </article>

                {/* Se só tem 1 spread e tem pedidos de YouTube, exibe aqui */}
                {totalSpreads === 1 && youtube.length > 0 && (
                  <article className="pt-2 border-t border-church-sand/50">
                    <header className="flex items-center gap-2 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      <h3 className="font-title text-xs font-bold uppercase tracking-wider text-red-700">
                        YouTube ao Vivo ({youtube.length})
                      </h3>
                    </header>
                    <ul className="space-y-1.5 list-disc list-inside">
                      {youtube.map((p, i) => (
                        <li key={p.id || i} className="font-sans text-church-charcoal text-sm leading-snug">
                          {p.description}
                        </li>
                      ))}
                    </ul>
                  </article>
                )}
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
                    Participações & Louvor
                  </span>
                  <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    Escala do Culto
                  </h2>
                </div>
                <span className="font-serif italic text-xs text-church-muted">
                  "Aqui chegamos pela fé!"
                </span>
              </div>

              {/* Conteúdo Dinâmico da Folha 2 */}
              <div className="flex-1 space-y-4 overflow-hidden">
                {/* Oportunidades */}
                <article className="pb-3 border-b border-church-sand/50">
                  <header className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                      Oportunidades do Culto ({opps.length})
                    </h3>
                  </header>
                  {opps.length === 0 ? (
                    <p className="font-serif italic text-church-muted/70 text-sm">Nenhuma oportunidade escalada.</p>
                  ) : (
                    <div className="space-y-2">
                      {opps.map((op, i) => (
                        <div key={op.id || i} className="flex items-center gap-2 p-2 rounded-lg bg-church-parchment/60 border border-church-sand">
                          <span className="w-2 h-2 rounded-full bg-church-gold" />
                          <span className="font-title text-sm font-semibold text-church-charcoal">{op.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                {/* Conjuntos */}
                <article>
                  <header className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                      Conjuntos da Igreja (Louvor)
                    </h3>
                  </header>
                  <div className="grid grid-cols-1 gap-2">
                    {choirs.map((ch, i) => (
                      <div 
                        key={ch.id || i} 
                        className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                          ch.checked 
                            ? 'bg-church-gold/10 border-church-gold/40 text-church-charcoal font-bold' 
                            : 'bg-white border-church-sand/80 text-church-muted'
                        }`}
                      >
                        {ch.checked ? (
                          <CheckSquare className="w-5 h-5 text-church-gold-dark shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-church-muted/50 shrink-0" />
                        )}
                        <span className="font-title text-sm tracking-wide">{ch.name}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              {/* Rodapé da Folha 2 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 2 (Conjuntos & Oportunidades)</span>
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
              <div className="flex-1 space-y-4 overflow-hidden">
                {/* Continuação dos Pedidos Presenciais */}
                {spread2Prayers.length > 0 && (
                  <article className="pb-3 border-b border-church-sand/50">
                    <header className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                      <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                        Mais Pedidos Presenciais ({spread2Prayers.length})
                      </h3>
                    </header>
                    <ul className="space-y-2 list-disc list-inside">
                      {spread2Prayers.map((p, i) => (
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
                  </article>
                )}

                {/* Pedidos do Chat do YouTube */}
                <article>
                  <header className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-red-700">
                      Pedidos do Chat do YouTube ({youtube.length})
                    </h3>
                  </header>
                  {youtube.length === 0 ? (
                    <p className="font-serif italic text-church-muted/70 text-sm">Nenhum pedido recebido pelo YouTube.</p>
                  ) : (
                    <ul className="space-y-2 list-disc list-inside">
                      {youtube.map((p, i) => (
                        <li key={p.id || i} className="font-sans text-church-charcoal leading-relaxed">
                          <span className="font-medium">{p.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>

              {/* Rodapé da Folha 3 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 3 (Orações YouTube & Adicionais)</span>
                <span className="font-mono">Página 3 de 4</span>
              </div>
            </section>

            {/* ================= SPREAD 2: FOLHA 4 (DIREITA) ================= */}
            <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
              {/* Cabeçalho da Folha 4 */}
              <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col">
                  <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                    Edificação & Avisos
                  </span>
                  <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                    Avisos Litúrgicos
                  </h2>
                </div>
                <span className="font-serif italic text-xs text-church-muted">
                  "Aqui chegamos pela fé!"
                </span>
              </div>

              {/* Conteúdo da Folha 4 */}
              <div className="flex-1 space-y-4 overflow-hidden flex flex-col justify-between">
                {/* Agenda Semanal */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2 text-church-charcoal">
                    <Calendar className="w-4 h-4 text-church-gold" />
                    <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                      Programação Semanal da Igreja
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs font-sans">
                    <div className="p-2.5 rounded-lg bg-church-parchment/60 border border-church-sand flex justify-between items-center">
                      <span className="font-semibold text-church-charcoal">Terça-feira (19h30)</span>
                      <span className="text-church-muted">Culto de Doutrina</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-church-parchment/60 border border-church-sand flex justify-between items-center">
                      <span className="font-semibold text-church-charcoal">Quinta-feira (14h30)</span>
                      <span className="text-church-muted">Círculo de Oração</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-church-parchment/60 border border-church-sand flex justify-between items-center">
                      <span className="font-semibold text-church-charcoal">Sábado (08h00)</span>
                      <span className="text-church-muted">Consagração dos Obreiros</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-church-parchment/60 border border-church-sand flex justify-between items-center">
                      <span className="font-semibold text-church-charcoal">Domingo (18h30)</span>
                      <span className="text-church-muted">Culto da Família</span>
                    </div>
                  </div>
                </div>

                {/* Versículo de Lema */}
                <div className="p-3.5 rounded-xl bg-church-gold/10 border border-church-gold/30 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-church-gold-dark">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-title text-[10px] font-bold uppercase tracking-widest">
                      Palavra de Edificação
                    </span>
                  </div>
                  <p className="font-serif italic text-sm text-church-charcoal leading-relaxed">
                    "Porque vivemos por fé, e não pelo que vemos."
                  </p>
                  <p className="font-title text-[10px] font-bold text-church-gold-dark uppercase tracking-wider">
                    2 Coríntios 5:7
                  </p>
                </div>
              </div>

              {/* Rodapé da Folha 4 */}
              <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
                <span className="font-serif italic">Folha 4 (Avisos Litúrgicos)</span>
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
              onClick={() => setFontScale(prev => Math.max(0.9, prev - 0.08))}
              className="p-1 hover:text-church-charcoal active:scale-90"
              title="Diminuir tamanho da letra"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-title font-bold px-1 text-church-charcoal">
              A {Math.round(fontScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setFontScale(prev => Math.min(1.45, prev + 0.08))}
              className="p-1 hover:text-church-charcoal active:scale-90"
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
