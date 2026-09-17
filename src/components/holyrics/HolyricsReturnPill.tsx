import React from 'react';
import { Maximize2 } from 'lucide-react';
import { HolyricsSlide } from '../../types/holyrics';

export interface HolyricsReturnPillProps {
  slide: HolyricsSlide;
  onRestore: () => void;
}

export const HolyricsReturnPill: React.FC<HolyricsReturnPillProps> = ({ slide, onRestore }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fadeIn select-none shadow-2xl">
      <div className="bg-[#111319] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-full border border-[#C59B4B] flex items-center gap-3 sm:gap-4 shadow-soft-gold">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="text-[11px] sm:text-xs text-stone-300 hidden sm:inline">Telão Ativo:</span>
          <span className="font-bold text-[#C59B4B] text-xs truncate max-w-[140px] sm:max-w-[220px]">
            {slide.title || 'Louvor / Versículo'}
          </span>
        </div>

        <div className="h-4 w-px bg-stone-700 shrink-0"></div>

        <button
          type="button"
          onClick={onRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C59B4B] hover:bg-[#D4AF37] text-black font-title text-xs font-black uppercase tracking-wider transition-colors active:scale-95 cursor-pointer shadow-sm shrink-0"
          title="Reabrir projeção em tela cheia"
          aria-label="Voltar para a projeção do telão em tela cheia"
        >
          <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Voltar ao Telão</span>
        </button>
      </div>
    </div>
  );
};
