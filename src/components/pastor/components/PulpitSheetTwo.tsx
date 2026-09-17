import React from 'react';
import { PrayerItem, OpportunityItem, ChoirItem } from '../../../types/liturgy';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PulpitYoutubePrayers } from './PulpitYoutubePrayers';
import { PulpitOpportunitiesList } from './PulpitOpportunitiesList';
import { PulpitChoirsList } from './PulpitChoirsList';

export interface PulpitSheetTwoProps {
  sheet2Items: PrayerItem[];
  overflowPresencial: PrayerItem[];
  sheet1PrayersCount: number;
  youtube: PrayerItem[];
  opps: OpportunityItem[];
  choirs: ChoirItem[];
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  hasMore: boolean;
  isScrolled: boolean;
  onScrollDown: () => void;
  onScrollUp: () => void;
}

export const PulpitSheetTwo: React.FC<PulpitSheetTwoProps> = ({
  sheet2Items,
  overflowPresencial,
  sheet1PrayersCount,
  youtube,
  opps,
  choirs,
  scrollRef,
  onScroll,
  hasMore,
  isScrolled,
  onScrollDown,
  onScrollUp,
}) => {
  return (
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
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 flex flex-col scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* 1. PEDIDOS DE ORAÇÃO PRESENCIAIS */}
        {overflowPresencial.length > 0 && (
          <article className="shrink-0">
            <header className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-church-gold" />
              <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
                {sheet1PrayersCount === 0
                  ? `Pedidos de Oração Presenciais (${overflowPresencial.length})`
                  : `Pedidos Presenciais — Continuação (${overflowPresencial.length})`}
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

        {/* 2. PEDIDOS DA TRANSMISSÃO AO VIVO (YOUTUBE) */}
        <PulpitYoutubePrayers youtube={youtube} />

        {youtube.length === 0 && overflowPresencial.length === 0 && (
          <div className="py-3 flex flex-col items-center justify-center text-center text-church-muted space-y-1">
            <p className="font-serif italic text-sm text-church-charcoal">
              "Orai sem cessar. Em tudo dai graças."
            </p>
            <span className="text-[11px] font-title font-bold text-church-gold uppercase">1 Tessalonicenses 5:17</span>
          </div>
        )}

        {/* 3. OPORTUNIDADES DO CULTO */}
        <PulpitOpportunitiesList opps={opps} />

        {/* 4. DEPARTAMENTOS DO CULTO */}
        <PulpitChoirsList choirs={choirs} />
      </div>

      {/* BOTÃO VISÍVEL DE ROLAGEM / AVISO PARA IDOSOS (FOLHA 2) */}
      {hasMore ? (
        <button
          type="button"
          onClick={onScrollDown}
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

      {/* Rodapé da Folha 2 */}
      <div className="pt-1.5 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
        <span className="font-serif italic">Folha 2 (Orações & Departamentos)</span>
        <span className="font-mono">Página 2</span>
      </div>
    </section>
  );
};
