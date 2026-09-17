import React from 'react';
import { PrayerItem } from '../../../../types/liturgy';
import { Youtube } from 'lucide-react';

export interface PulpitPrayersTabProps {
  prayers: PrayerItem[];
  youtube: PrayerItem[];
  fourViewsPrayersLeft: PrayerItem[];
  fourViewsPrayersRight: PrayerItem[];
  prayersSplitIdx: number;
  fourViewsYoutubeLeft: PrayerItem[];
  fourViewsYoutubeRight: PrayerItem[];
  youtubeSplitIdx: number;
}

export const PulpitPrayersTab: React.FC<PulpitPrayersTabProps> = ({
  prayers,
  youtube,
  fourViewsPrayersLeft,
  fourViewsPrayersRight,
  prayersSplitIdx,
  fourViewsYoutubeLeft,
  fourViewsYoutubeRight,
  youtubeSplitIdx,
}) => {
  return (
    <div className="space-y-5">
      <div className="border-b border-church-sand pb-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">Tema do Culto</span>
          <h2 className="text-base sm:text-xl font-title font-extrabold text-church-charcoal uppercase">
            Pedidos de Oração do Culto
          </h2>
        </div>
        <span className="text-xs font-title font-bold px-2.5 py-1 rounded-full bg-church-gold/15 text-church-gold-dark">
          Total: {prayers.length + youtube.length}
        </span>
      </div>

      {/* Presenciais */}
      <div>
        <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold-dark mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-church-gold" />
          Pedidos Presenciais da Igreja ({prayers.length})
        </h3>
        {prayers.length === 0 ? (
          <p className="font-serif italic text-church-muted text-sm p-2">Nenhum pedido presencial registrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
            <ul className="space-y-1.5 sm:space-y-2">
              {fourViewsPrayersLeft.map((p, idx) => (
                <li
                  key={p.id || idx}
                  className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex items-start gap-1.5"
                >
                  <span className="text-church-gold font-bold mr-0.5">•</span>
                  <span className="font-mono text-xs font-bold text-church-gold-dark shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    {p.urgent && (
                      <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                        Urgente
                      </span>
                    )}
                    <span className={p.urgent ? 'text-red-950 font-black' : 'text-church-charcoal'}>
                      {p.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {fourViewsPrayersRight.length > 0 && (
              <ul className="space-y-1.5 sm:space-y-2">
                {fourViewsPrayersRight.map((p, idx) => (
                  <li
                    key={p.id || idx}
                    className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex items-start gap-1.5"
                  >
                    <span className="text-church-gold font-bold mr-0.5">•</span>
                    <span className="font-mono text-xs font-bold text-church-gold-dark shrink-0 mt-0.5">
                      {prayersSplitIdx + idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      {p.urgent && (
                        <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-200">
                          Urgente
                        </span>
                      )}
                      <span className={p.urgent ? 'text-red-950 font-black' : 'text-church-charcoal'}>
                        {p.description}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Transmissão / YouTube */}
      <div className="pt-3 border-t border-church-sand/60">
        <h3 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-700 mb-2 flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-600" />
          Pedidos do Chat ao Vivo / YouTube ({youtube.length})
        </h3>
        {youtube.length === 0 ? (
          <p className="font-serif italic text-church-muted text-sm p-2">Nenhum pedido do YouTube recebido.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
            <ul className="space-y-1.5 sm:space-y-2">
              {fourViewsYoutubeLeft.map((p, idx) => (
                <li key={p.id || idx} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex flex-col gap-1">
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold mr-0.5">•</span>
                    <span className="font-mono text-xs font-bold text-red-600 shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-church-charcoal">{p.description}</span>
                    </div>
                  </div>
                  {p.image_data && (
                    <div className="ml-5 rounded-lg overflow-hidden border border-red-200 bg-white max-w-xs">
                      <img src={p.image_data} alt="Print YouTube" className="w-full h-auto max-h-36 object-contain" />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {fourViewsYoutubeRight.length > 0 && (
              <ul className="space-y-1.5 sm:space-y-2">
                {fourViewsYoutubeRight.map((p, idx) => (
                  <li key={p.id || idx} className="font-bold text-sm sm:text-base font-sans text-church-charcoal leading-snug break-inside-avoid flex flex-col gap-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold mr-0.5">•</span>
                      <span className="font-mono text-xs font-bold text-red-600 shrink-0 mt-0.5">
                        {youtubeSplitIdx + idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-church-charcoal">{p.description}</span>
                      </div>
                    </div>
                    {p.image_data && (
                      <div className="ml-5 rounded-lg overflow-hidden border border-red-200 bg-white max-w-xs">
                        <img src={p.image_data} alt="Print YouTube" className="w-full h-auto max-h-36 object-contain" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
