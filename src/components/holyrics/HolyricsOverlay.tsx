import React from 'react';
import { Minimize2 } from 'lucide-react';
import { HolyricsSlide } from '../../types/holyrics';
import { getSlideTypographyClasses, getHeaderTypographyClass } from './utils/fontScaling';

export interface HolyricsOverlayProps {
  slide: HolyricsSlide;
  onMinimize: () => void;
}

export const HolyricsOverlay: React.FC<HolyricsOverlayProps> = ({ slide, onMinimize }) => {
  const { fontSizeClass, lineHeightClass, containerClass } = getSlideTypographyClasses(slide.text);
  const headerFontClass = getHeaderTypographyClass(slide.text);

  const badgeLabel = slide.type === 'bible' ? 'BÍBLIA SAGRADA' : slide.type === 'music' ? 'LOUVOR' : 'TELÃO OFICIAL';
  const subtitle = slide.author
    ? `${slide.author}${slide.slide_number ? ` • Slide ${slide.slide_number}${slide.total_slides ? ` de ${slide.total_slides}` : ''}` : ''}`
    : slide.slide_number ? `Slide ${slide.slide_number}${slide.total_slides ? ` de ${slide.total_slides}` : ''}` : '';

  return (
    <div className="absolute inset-0 z-40 bg-[#0B0D13] text-[#F8FAFC] flex flex-col justify-between p-6 sm:p-10 select-none animate-fadeIn">
      {/* Botão Minimizar (canto superior direito, discreto) */}
      <header className="flex items-center justify-end pb-2">
        <button
          type="button"
          onClick={onMinimize}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700/80 transition-colors active:scale-95 cursor-pointer shadow-lg"
          title="Ver o roteiro do culto"
          aria-label="Minimizar projeção e ver roteiro do culto"
        >
          <Minimize2 className="w-4 h-4 text-[#C59B4B]" />
          <span className="font-title text-xs font-bold uppercase tracking-wider">
            Ver Roteiro
          </span>
        </button>
      </header>

      {/* Área Central: Referência + Texto (tudo centralizado e grande) */}
      <main
        onClick={onMinimize}
        className={`flex-1 flex flex-col items-center justify-center text-center px-4 mx-auto w-full cursor-pointer gap-4 sm:gap-6 ${containerClass}`}
        title="Toque para alternar para o roteiro"
      >
        {/* Referência / Título em fonte grande e centralizada */}
        {slide.title && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <h2 className={`font-title ${headerFontClass} font-bold text-[#D4AF37] tracking-tight drop-shadow-sm`}>
                {slide.title}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-title font-bold bg-[#C59B4B]/20 text-[#D4AF37] border border-[#C59B4B]/30">
                {badgeLabel}
              </span>
            </div>
            {subtitle && (
              <p className="text-sm sm:text-base text-stone-400 font-sans">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Versículo / Texto principal */}
        <p className={`font-serif ${fontSizeClass} ${lineHeightClass} text-white whitespace-pre-line tracking-wide drop-shadow-sm`}>
          {slide.text}
        </p>
      </main>

      {/* Rodapé Institucional Solene */}
      <footer className="flex items-center justify-between border-t border-stone-900 pt-3 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Projeção Sincronizada • Holyrics
        </span>
        <span className="font-title text-[11px] tracking-wider uppercase text-stone-400 hidden sm:inline">
          Toque na tela para voltar ao roteiro pastoral
        </span>
        <span className="text-stone-400 font-title font-semibold">
          A.D. Utinga — PNO
        </span>
      </footer>
    </div>
  );
};
