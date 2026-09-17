import React from 'react';
import { VisitorItem, PrayerItem, OpportunityItem, ChoirItem } from '../../../types/liturgy';
import { PulpitYoutubePrayers } from './PulpitYoutubePrayers';
import { PulpitOpportunitiesList } from './PulpitOpportunitiesList';
import { PulpitChoirsList } from './PulpitChoirsList';

export interface PulpitSingleSheetViewProps {
  roomTitle: string;
  fontScale: number;
  visitors: VisitorItem[];
  prayers: PrayerItem[];
  youtube: PrayerItem[];
  opps: OpportunityItem[];
  choirs: ChoirItem[];
}

export const PulpitSingleSheetView: React.FC<PulpitSingleSheetViewProps> = ({
  roomTitle,
  fontScale,
  visitors,
  prayers,
  youtube,
  opps,
  choirs,
}) => {
  return (
    <div
      className="flex-1 overflow-y-auto p-2.5 sm:p-4 min-h-0 scrollbar-thin"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
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
              {roomTitle}
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

        {/* Seção 2: Pedidos de Oração Presenciais */}
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

        {/* Seção 3: Transmissão YouTube */}
        <PulpitYoutubePrayers youtube={youtube} />

        {/* Seção 4: Oportunidades do Culto */}
        <PulpitOpportunitiesList opps={opps} />

        {/* Seção 5: Departamentos do Culto */}
        <PulpitChoirsList choirs={choirs} />

        {/* Rodapé da Folha Mobile */}
        <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center">
          <span className="font-serif italic">{roomTitle}</span>
          <span className="font-mono">Página Única Contínua</span>
        </div>
      </div>
    </div>
  );
};
