import React from 'react';
import { UserPlus, HeartHandshake, Mic2, Users } from 'lucide-react';
import { UserRole } from '../../../types/liturgy';
import { ObreiroSectionKey } from '../hooks';

interface ObreiroSectionNavProps {
  activeSection: ObreiroSectionKey;
  onSelectSection: (id: string, sectionKey: ObreiroSectionKey) => void;
  visitorsCount: number;
  prayersCount: number;
  oppsCount: number;
  choirsCount: number;
  role?: UserRole | null;
}

export const ObreiroSectionNav: React.FC<ObreiroSectionNavProps> = ({
  activeSection,
  onSelectSection,
  visitorsCount,
  prayersCount,
  oppsCount,
  choirsCount,
  role,
}) => {
  return (
    <nav
      aria-label="Navegação rápida do formulário"
      className="sticky top-0 z-30 bg-church-parchment/95 backdrop-blur-md py-2 px-1 -mx-2 sm:-mx-4 border-b border-church-sand/80 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2 max-w-4xl mx-auto w-full">
        {/* 1. Visitantes */}
        <button
          type="button"
          onClick={() => onSelectSection('section-visitors', 'visitors')}
          className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
            activeSection === 'visitors'
              ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
              : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
          }`}
        >
          <UserPlus
            className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              activeSection === 'visitors' ? 'text-white' : 'text-church-gold-dark'
            }`}
          />
          <span className="truncate">Visitantes</span>
          <span
            className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
              activeSection === 'visitors' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
            }`}
          >
            {visitorsCount}
          </span>
          {activeSection === 'visitors' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
          )}
        </button>

        {/* 2. Pedidos de Oração */}
        <button
          type="button"
          onClick={() => onSelectSection('section-prayers', 'prayers')}
          className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
            activeSection === 'prayers'
              ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
              : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
          }`}
        >
          <HeartHandshake
            className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              activeSection === 'prayers' ? 'text-white' : 'text-church-gold-dark'
            }`}
          />
          <span className="truncate">Orações</span>
          <span
            className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
              activeSection === 'prayers' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
            }`}
          >
            {prayersCount}
          </span>
          {activeSection === 'prayers' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
          )}
        </button>

        {/* 3. Oportunidades e Louvores */}
        <button
          type="button"
          onClick={() => onSelectSection('section-opportunities', 'opps')}
          className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
            activeSection === 'opps'
              ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
              : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
          }`}
        >
          <Mic2
            className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${
              activeSection === 'opps' ? 'text-white' : 'text-church-gold-dark'
            }`}
          />
          <span className="truncate">Louvores</span>
          <span
            className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
              activeSection === 'opps' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
            }`}
          >
            {oppsCount}
          </span>
          {activeSection === 'opps' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
          )}
        </button>

        {/* 4. Departamentos (Controlador) */}
        {role === 'controlador' && (
          <button
            type="button"
            onClick={() => onSelectSection('section-choirs', 'choirs')}
            className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
              activeSection === 'choirs'
                ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
                : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
            }`}
          >
            <Users
              className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                activeSection === 'choirs' ? 'text-white' : 'text-church-gold-dark'
              }`}
            />
            <span className="truncate">Grupos</span>
            <span
              className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
                activeSection === 'choirs' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}
            >
              {choirsCount}
            </span>
            {activeSection === 'choirs' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
};
