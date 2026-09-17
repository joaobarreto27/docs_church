import React from 'react';
import { ChoirItem } from '../../../types/liturgy';
import { CheckCircle2, Clock, CheckSquare } from 'lucide-react';

export interface PulpitChoirsListProps {
  choirs: ChoirItem[];
}

export const PulpitChoirsList: React.FC<PulpitChoirsListProps> = ({ choirs }) => {
  const checkedChoirs = choirs.filter((ch) => ch.checked);

  return (
    <article className="pt-2.5 border-t border-church-sand/60 shrink-0">
      <header className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-church-gold" />
        <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark">
          Departamentos
        </h3>
      </header>
      <div className="flex flex-wrap gap-2">
        {checkedChoirs.map((ch, i) => {
          const isReady = ch.status === 'ready';
          const isDone = ch.status === 'done';
          return (
            <span
              key={ch.id || i}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm border-2 shadow-xs tracking-wide transition-all ${
                isReady
                  ? 'bg-amber-100 text-amber-950 border-church-gold ring-2 ring-church-gold/30'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 line-through opacity-85'
                  : 'bg-church-gold/20 text-church-charcoal border-church-gold/40'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 stroke-[2.5]" />
              ) : isReady ? (
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 stroke-[2.5]" />
              ) : (
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold-dark shrink-0 stroke-[2.5]" />
              )}
              <span>{ch.name}</span>
              {isDone && (
                <span className="text-[10px] font-title uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1 rounded ml-1">
                  OK
                </span>
              )}
            </span>
          );
        })}
        {checkedChoirs.length === 0 && (
          <span className="font-serif italic text-church-muted text-sm">Nenhum departamento escalado</span>
        )}
      </div>
    </article>
  );
};
