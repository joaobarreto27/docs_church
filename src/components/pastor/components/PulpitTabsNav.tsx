import React from 'react';
import { Heart, Users, Mic2, Bell } from 'lucide-react';
import { PulpitActiveTab } from '../hooks';

export interface PulpitTabsNavProps {
  activeTab: PulpitActiveTab;
  setActiveTab: (tab: PulpitActiveTab) => void;
  prayersCount: number;
  visitorsCount: number;
  opportunitiesCount: number;
  activeAlert: string | null;
}

export const PulpitTabsNav: React.FC<PulpitTabsNavProps> = ({
  activeTab,
  setActiveTab,
  prayersCount,
  visitorsCount,
  opportunitiesCount,
  activeAlert,
}) => {
  return (
    <header className="bg-white border-b-2 border-church-sand px-1.5 sm:px-4 py-1.5 sm:py-2.5 shrink-0 shadow-xs select-none">
      <div className="max-w-6xl 2xl:max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-3">
        {/* Título da Visão no Canto Superior Esquerdo */}
        <div className="hidden lg:flex flex-col pr-3 border-r border-church-sand/80 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">
            Púlpito do Pastor
          </span>
          <span className="text-xs font-title font-extrabold text-church-charcoal uppercase truncate max-w-[150px]">
            {activeTab === 'prayers' && '1. Pedidos de Oração'}
            {activeTab === 'visitors' && '2. Visitantes'}
            {activeTab === 'opps' && '3. Oportunidades'}
            {activeTab === 'alerts' && '4. Avisos da Cabine'}
          </span>
        </div>

        {/* 4 Botões da Faixa Superior (tamanho reduzido no mobile estilo WhatsApp sem scroll) */}
        <nav
          className="flex items-center gap-1 sm:gap-2 flex-1 justify-between sm:justify-start w-full"
          aria-label="Abas do Púlpito"
        >
          {/* 1. Pedidos de Oração */}
          <button
            type="button"
            onClick={() => setActiveTab('prayers')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] xs:text-[11px] sm:text-sm font-title font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[50px] select-none ${
              activeTab === 'prayers'
                ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
            }`}
          >
            <Heart
              className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 shrink-0 ${
                activeTab === 'prayers' ? 'text-white' : 'text-church-gold-dark'
              }`}
            />
            <span className="truncate">Orações</span>
            <span
              className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold leading-none ${
                activeTab === 'prayers' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}
            >
              {prayersCount}
            </span>
            {activeTab === 'prayers' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
            )}
          </button>

          {/* 2. Visitantes */}
          <button
            type="button"
            onClick={() => setActiveTab('visitors')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] xs:text-[11px] sm:text-sm font-title font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[50px] select-none ${
              activeTab === 'visitors'
                ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
            }`}
          >
            <Users
              className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 shrink-0 ${
                activeTab === 'visitors' ? 'text-white' : 'text-church-gold-dark'
              }`}
            />
            <span className="truncate">Visitantes</span>
            <span
              className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold leading-none ${
                activeTab === 'visitors' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}
            >
              {visitorsCount}
            </span>
            {activeTab === 'visitors' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
            )}
          </button>

          {/* 3. Oportunidades & Louvores */}
          <button
            type="button"
            onClick={() => setActiveTab('opps')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] xs:text-[11px] sm:text-sm font-title font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[50px] select-none ${
              activeTab === 'opps'
                ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
            }`}
          >
            <Mic2
              className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 shrink-0 ${
                activeTab === 'opps' ? 'text-white' : 'text-church-gold-dark'
              }`}
            />
            <span className="truncate">Oportunidades</span>
            <span
              className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold leading-none ${
                activeTab === 'opps' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}
            >
              {opportunitiesCount}
            </span>
            {activeTab === 'opps' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
            )}
          </button>

          {/* 4. Avisos */}
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] xs:text-[11px] sm:text-sm font-title font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[50px] relative select-none ${
              activeTab === 'alerts'
                ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/40 scale-[1.02]'
                : activeAlert
                ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold animate-pulse'
                : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
            }`}
          >
            <Bell
              className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 shrink-0 ${
                activeTab === 'alerts' ? 'text-white' : activeAlert ? 'text-amber-700' : 'text-church-gold-dark'
              }`}
            />
            <span className="truncate">Avisos</span>
            {activeTab === 'alerts' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
            )}
            {activeAlert && activeTab !== 'alerts' && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </nav>

        <img
          src="/assets/logo-adutinga-horizontal.png"
          alt="A.D. Utinga"
          className="h-6 sm:h-7 w-auto object-contain hidden md:block shrink-0"
        />
      </div>
    </header>
  );
};
