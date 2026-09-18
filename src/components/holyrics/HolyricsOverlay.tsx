import React from 'react';
import { Minimize2, Music, BookOpen } from 'lucide-react';
import { HolyricsSlide } from '../../types/holyrics';
import { getSlideTypographyClasses } from './utils/fontScaling';

export interface HolyricsOverlayProps {
  slide: HolyricsSlide;
  onMinimize: () => void;
}

export const HolyricsOverlay: React.FC<HolyricsOverlayProps> = ({ slide, onMinimize }) => {
  const { fontSizeClass, lineHeightClass, containerClass } = getSlideTypographyClasses(slide.text);

  const isMusic = slide.type === 'music';
  const isBible = slide.type === 'bible';
  const badgeLabel = isBible ? 'BÍBLIA SAGRADA' : isMusic ? 'LOUVOR' : 'TELÃO OFICIAL';

  const subtitle = slide.author
    ? `${slide.author}${slide.slide_number ? ` • Slide ${slide.slide_number}${slide.total_slides ? ` de ${slide.total_slides}` : ''}` : ''}`
    : slide.slide_number
    ? `Slide ${slide.slide_number}${slide.total_slides ? ` de ${slide.total_slides}` : ''}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D12] bg-gradient-to-b from-[#11131A] via-[#0B0D12] to-[#07080B] text-[#F8FAFC] flex flex-col justify-between p-5 sm:p-8 md:p-10 select-none animate-fadeIn overflow-hidden">
      {/* Halo de Luz Dourada Solene no Topo Central (Atmosfera Sagrada / Púlpito Zen) */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(197, 155, 75, 0.14) 0%, rgba(11, 13, 18, 0) 75%)'
        }}
        aria-hidden="true"
      />

      {/* Topo: Logotipo Oficial (Esquerda) + Identificação Centralizada + Botão Ver Roteiro (Direita) */}
      <header className="relative z-10 flex items-center justify-between pb-3 gap-2 border-b border-stone-800/40">
        {/* Logotipo Oficial no Canto Superior Esquerdo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/assets/logo-adutinga-horizontal.png"
            alt="A.D. Utinga"
            className="h-6 sm:h-8 md:h-9 w-auto object-contain brightness-110 drop-shadow-sm"
          />
        </div>

        {/* Centro do Topo: Título da Bíblia ou Indicador Discreto de Louvor */}
        <div className="flex-1 flex flex-col items-center text-center px-2">
          {slide.title ? (
            <>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <h2 className="font-title text-2xl sm:text-3xl md:text-4xl font-bold text-[#D4AF37] tracking-tight drop-shadow-sm">
                  {slide.title}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-title font-bold bg-[#C59B4B]/20 text-[#D4AF37] border border-[#C59B4B]/35 shadow-sm">
                  {badgeLabel}
                </span>
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-stone-400 font-sans mt-1 tracking-wide">
                  {subtitle}
                </p>
              )}
            </>
          ) : isMusic ? (
            /* Louvor sem título cadastrado no slide: indicador solene e discreto */
            <div className="flex flex-col items-center gap-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C59B4B]/10 border border-[#C59B4B]/30 text-[#D4AF37] shadow-sm">
                <Music className="w-3.5 h-3.5 text-[#C59B4B]" />
                <span className="font-title text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Projeção de Louvor
                </span>
                {subtitle && (
                  <span className="text-xs text-stone-400 font-sans border-l border-stone-700/80 pl-2 ml-1">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Telão Oficial genérico */
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800/60 border border-stone-700/60 text-stone-300">
              <BookOpen className="w-3.5 h-3.5 text-[#C59B4B]" />
              <span className="font-title text-xs uppercase tracking-wider font-semibold">
                Telão Oficial
              </span>
            </div>
          )}
        </div>

        {/* Botão Ver Roteiro — Única forma de minimizar a projeção */}
        <button
          type="button"
          onClick={onMinimize}
          className="relative z-20 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-stone-200 hover:text-white border border-[#C59B4B]/35 hover:border-[#C59B4B]/60 transition-colors active:scale-95 cursor-pointer shadow-lg shadow-black/50 shrink-0 ml-2"
          title="Ver o roteiro do culto"
          aria-label="Minimizar projeção e ver roteiro do culto"
        >
          <Minimize2 className="w-4 h-4 text-[#C59B4B]" />
          <span className="font-title text-xs font-bold uppercase tracking-wider">
            Ver Roteiro
          </span>
        </button>
      </header>

      {/* Área Central: Versículo / Letra 100% Centralizado (Horizontal e Vertical) */}
      <main className={`relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 my-auto mx-auto w-full ${containerClass}`}>
        <p className={`font-sans font-medium sm:font-semibold ${fontSizeClass} ${lineHeightClass} text-white whitespace-pre-line tracking-normal sm:tracking-wide drop-shadow-md text-center max-w-full`}>
          {slide.text}
        </p>
      </main>

      {/* Rodapé Institucional Solene */}
      <footer className="relative z-10 flex items-center justify-between border-t border-stone-800/40 pt-3 text-xs text-stone-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" />
          <span className="font-sans font-medium text-stone-300">Projeção Sincronizada • Holyrics</span>
        </span>
        <span className="text-stone-400 font-title font-semibold tracking-wide text-[11px] sm:text-xs">
          A.D. Utinga — PNO
        </span>
      </footer>
    </div>
  );
};
