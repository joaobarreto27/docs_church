import React from 'react';
import { VisitorItem } from '../../../../types/liturgy';

export interface PulpitVisitorsTabProps {
  visitors: VisitorItem[];
  fourViewsVisitorsLeft: VisitorItem[];
  fourViewsVisitorsRight: VisitorItem[];
  visitorsSplitIdx: number;
}

export const PulpitVisitorsTab: React.FC<PulpitVisitorsTabProps> = ({
  visitors,
  fourViewsVisitorsLeft,
  fourViewsVisitorsRight,
  visitorsSplitIdx,
}) => {
  return (
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
  );
};
