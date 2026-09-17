import React from 'react';
import { OpportunityItem } from '../../../types/liturgy';
import { CheckCircle2 } from 'lucide-react';

export interface PulpitOpportunitiesListProps {
  opps: OpportunityItem[];
}

export const PulpitOpportunitiesList: React.FC<PulpitOpportunitiesListProps> = ({ opps }) => {
  return (
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
        <ul
          className={`gap-x-4 gap-y-1 sm:gap-y-1.5 ${
            opps.length > 2 ? 'grid grid-cols-1 sm:grid-cols-2' : 'space-y-1 sm:space-y-1.5 list-disc list-inside'
          }`}
        >
          {opps.map((op, i) => {
            const isReady = op.status === 'ready';
            const isDone = op.status === 'done';
            return (
              <li
                key={op.id || i}
                className={`font-bold text-sm sm:text-base font-sans leading-snug break-inside-avoid flex items-center justify-between gap-2 px-2 py-1 rounded-lg ${
                  isReady
                    ? 'bg-amber-100/90 text-amber-950 border border-amber-300'
                    : isDone
                    ? 'bg-emerald-50/70 text-emerald-900 line-through border border-emerald-200 opacity-80'
                    : 'text-church-charcoal'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={
                      isReady
                        ? 'text-amber-600 font-bold mr-1'
                        : isDone
                        ? 'text-emerald-600 font-bold mr-1'
                        : 'text-church-gold font-bold mr-1'
                    }
                  >
                    •
                  </span>
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
  );
};
