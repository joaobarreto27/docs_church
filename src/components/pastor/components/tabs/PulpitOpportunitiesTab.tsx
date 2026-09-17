import React from 'react';
import { OpportunityItem, ChoirItem } from '../../../../types/liturgy';
import { Mic2, Users, CheckCircle2, Clock, CheckSquare } from 'lucide-react';

export interface PulpitOpportunitiesTabProps {
  opps: OpportunityItem[];
  choirs: ChoirItem[];
}

export const PulpitOpportunitiesTab: React.FC<PulpitOpportunitiesTabProps> = ({ opps, choirs }) => {
  return (
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
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold ${
                        isReady ? 'text-amber-700' : isDone ? 'text-emerald-700' : 'text-church-gold-dark'
                      }`}
                    >
                      {i + 1}.
                    </span>
                    <span
                      className={`font-sans text-base sm:text-lg font-bold truncate ${
                        isReady ? 'text-amber-950 font-black' : isDone ? 'line-through text-emerald-900' : 'text-church-charcoal'
                      }`}
                    >
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
          Departamentos Escalados ({choirs.filter((c) => c.checked).length})
        </h3>
        {choirs.filter((c) => c.checked).length === 0 ? (
          <p className="font-serif italic text-church-muted text-sm p-2">Nenhum departamento escalado no momento.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {choirs
              .filter((c) => c.checked)
              .map((ch, i) => {
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
  );
};
