import React from 'react';
import { PrayerItem } from '../../../types/liturgy';
import { Youtube } from 'lucide-react';

export interface PulpitYoutubePrayersProps {
  youtube: PrayerItem[];
}

export const PulpitYoutubePrayers: React.FC<PulpitYoutubePrayersProps> = ({ youtube }) => {
  if (youtube.length === 0) return null;

  return (
    <article className="bg-red-50/75 border-2 border-red-200 rounded-xl p-2.5 sm:p-3 space-y-2 shrink-0 shadow-2xs">
      <header className="flex items-center justify-between border-b border-red-200/70 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
            <Youtube className="w-4 h-4 text-red-600 shrink-0" />
            <span>Pedido de Oração Youtube ({youtube.length})</span>
          </h3>
        </div>
        <span className="text-[10px] font-title font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
          Ao Vivo
        </span>
      </header>

      <ul className="space-y-1.5 list-disc list-inside">
        {youtube.map((p, i) => (
          <li key={p.id || i} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-relaxed">
            {p.urgent && (
              <span className="inline-block px-2 py-0.5 mr-1.5 rounded-md bg-red-200 text-red-900 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-300">
                Urgente
              </span>
            )}
            <span className="text-red-950">{p.description}</span>
            {p.image_data && (
              <div className="mt-2 ml-4 rounded-lg overflow-hidden border border-red-200 bg-white p-1 max-w-[280px] shadow-2xs">
                <img
                  src={p.image_data}
                  alt="Print do chat YouTube"
                  className="w-full h-auto max-h-32 object-contain rounded"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
};
