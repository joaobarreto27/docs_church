import React from 'react';
import { VisitorItem, PrayerItem } from '../../../types/liturgy';
import { ChevronDown, ChevronUp, Youtube } from 'lucide-react';

export interface PulpitSheetOneProps {
  roomTitle: string;
  visitors: VisitorItem[];
  sheet1Prayers: PrayerItem[];
  overflowPresencialCount: number;
  youtubeCount: number;
  totalPrayersCount: number;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  hasMore: boolean;
  isScrolled: boolean;
  onScrollDown: () => void;
  onScrollUp: () => void;
}

export const PulpitSheetOne: React.FC<PulpitSheetOneProps> = ({
  roomTitle,
  visitors,
  sheet1Prayers,
  overflowPresencialCount,
  youtubeCount,
  totalPrayersCount,
  scrollRef,
  onScroll,
  hasMore,
  isScrolled,
  onScrollDown,
  onScrollUp,
}) => {
  return (
    <section className="paper-sheet rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 md:p-4 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
      {/* Cabeçalho Compacto da Folha 1 */}
      <div className="border-b border-church-sand pb-1.5 mb-1.5 sm:pb-2 sm:mb-2 flex items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col">
          <span className="font-title text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
            Tema do Culto
          </span>
          <h2 className="font-title text-sm sm:text-base md:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
            {roomTitle}
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
        ref={scrollRef}
        onScroll={onScroll}
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
            <ul
              className={`gap-x-4 gap-y-1 sm:gap-y-1.5 ${
                visitors.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2' : 'space-y-1 sm:space-y-1.5 list-disc list-inside'
              }`}
            >
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

        {/* Bloco de Pedidos de Oração Presenciais */}
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
            {(overflowPresencialCount > 0 || youtubeCount > 0) && (
              <p className="font-serif italic text-xs text-church-gold-dark mt-2 flex items-center gap-1.5 flex-wrap">
                <span>* Continuação na Folha 2 à direita ➔</span>
                {youtubeCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-sans font-bold text-[10px] uppercase border border-red-200">
                    <Youtube className="w-3 h-3 text-red-600" />
                    {youtubeCount} YouTube
                  </span>
                )}
              </p>
            )}
          </article>
        )}

        {sheet1Prayers.length === 0 && totalPrayersCount > 0 && (
          <p className="font-serif italic text-xs text-church-gold-dark mt-1.5 flex items-center gap-1.5 shrink-0">
            <span>* Pedidos de oração e intercessão na Folha 2 ➔</span>
          </p>
        )}
      </div>

      {/* BOTÃO VISÍVEL DE ROLAGEM / AVISO PARA IDOSOS (FOLHA 1) */}
      {hasMore ? (
        <button
          type="button"
          onClick={onScrollDown}
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
      ) : isScrolled ? (
        <button
          type="button"
          onClick={onScrollUp}
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
  );
};
