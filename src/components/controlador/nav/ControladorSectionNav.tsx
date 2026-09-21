import React from 'react';
import { UserPlus, HeartHandshake, Youtube, Mic2 } from 'lucide-react';

export type ControladorSectionKey = 'visitors' | 'prayers' | 'youtube' | 'music';

interface ControladorSectionNavProps {
  activeSection: ControladorSectionKey;
  onSelectSection: (id: string, key: ControladorSectionKey) => void;
  visitorsCount: number;
  prayersCount: number;
  youtubeCount: number;
  musicCount: number;
}

interface NavSectionItem {
  key: ControladorSectionKey;
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isYoutube?: boolean;
}

const SECTIONS: NavSectionItem[] = [
  { key: 'visitors', id: 'section-visitors', label: 'Visitantes', shortLabel: 'Visitantes', icon: UserPlus },
  { key: 'prayers', id: 'section-prayers', label: 'Orações', shortLabel: 'Orações', icon: HeartHandshake },
  { key: 'youtube', id: 'section-youtube', label: 'YouTube Live', shortLabel: 'YouTube', icon: Youtube, isYoutube: true },
  { key: 'music', id: 'section-music', label: 'Louvores & Grupos', shortLabel: 'Louvores', icon: Mic2 },
];

export const ControladorSectionNav: React.FC<ControladorSectionNavProps> = ({
  activeSection,
  onSelectSection,
  visitorsCount,
  prayersCount,
  youtubeCount,
  musicCount,
}) => {
  const counts: Record<ControladorSectionKey, number> = {
    visitors: visitorsCount,
    prayers: prayersCount,
    youtube: youtubeCount,
    music: musicCount,
  };

  return (
    <nav
      aria-label="Navegação rápida do painel da cabine"
      className="sticky top-0 z-30 bg-church-parchment/95 backdrop-blur-md border-b border-church-sand/80 shadow-2xs py-1.5 px-2.5 sm:py-2 sm:px-6"
    >
      {/* 1. VERSÃO MOBILE: Grid 4 Colunas (Estilo Dock Cápsula, sem corte nem rolagem) */}
      <div className="sm:hidden grid grid-cols-4 gap-1 p-1 rounded-xl bg-church-parchment/90 border border-church-sand shadow-2xs text-center w-full">
        {SECTIONS.map(({ key, id, shortLabel, icon: Icon, isYoutube }) => {
          const isActive = activeSection === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectSection(id, key)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[9px] font-title font-bold uppercase tracking-tighter transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? isYoutube ? 'bg-red-600 text-white shadow-xs' : 'bg-church-gold text-white shadow-xs'
                  : 'text-church-charcoal hover:bg-white'
              }`}
              title={`Ir para ${shortLabel}`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isYoutube ? 'text-red-600' : 'text-church-gold-dark'}`} />
                <span className={`px-1 py-0.2 rounded-full text-[8px] font-mono font-bold ${
                  isActive ? 'bg-black/20 text-white' : 'bg-black/10 text-church-charcoal'
                }`}>
                  {count}
                </span>
              </div>
              <span className="truncate w-full text-center">{shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 2. VERSÃO DESKTOP: Barra Centrada em Pílulas */}
      <div className="hidden sm:flex max-w-5xl mx-auto items-center justify-center gap-2">
        {SECTIONS.map(({ key, id, label, icon: Icon, isYoutube }) => {
          const isActive = activeSection === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectSection(id, key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer min-h-[40px] border whitespace-nowrap active:scale-[0.98] ${
                isActive
                  ? isYoutube
                    ? 'bg-red-600 text-white border-red-700 shadow-sm'
                    : 'bg-church-gold text-white border-church-gold-dark shadow-sm'
                  : 'bg-white text-church-charcoal border-church-sand hover:bg-church-sand/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${!isActive && isYoutube ? 'text-red-600' : ''}`} />
              <span>{label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/10">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
