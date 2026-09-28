import React from 'react';
import { Minimize2, Music, BookOpen } from 'lucide-react';
import { HolyricsSlide } from '../../types/holyrics';
import { getSlideTypographyClasses } from './utils/fontScaling';
import { PulpitClock } from '../pastor/components/PulpitClock';

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
    <div className="fixed inset-0 z-50 bg-[#0B0D12] bg-gradient-to-b from-[#11131A] via-[#0B0D12] to-[#07080B] text-[#F8FAFC] flex flex-col justify-between p-3.5 sm:p-6 md:p-8 select-none animate-fadeIn overflow-hidden">
      {/* Halo de Luz Dourada Solene no Topo Central (Atmosfera Sagrada / Púlpito Zen) */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(197, 155, 75, 0.14) 0%, rgba(11, 13, 18, 0) 75%)'
        }}
        aria-hidden="true"
      />

      {/* Topo: Logotipo Oficial (Esquerda) + Identificação Centralizada Livre de Botão Lateral */}
      <header className="relative z-10 flex items-center justify-between pb-2 sm:pb-2.5 gap-2 border-b border-stone-800/40 shrink-0">
        {/* Logotipo Oficial no Canto Superior Esquerdo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <img
            src="/assets/logo-adutinga-horizontal.png"
            alt="A.D. Utinga"
            className="h-6 sm:h-8 md:h-9 w-auto object-contain brightness-110 drop-shadow-sm"
          />
        </div>

        {/* Centro do Topo: Título da Bíblia ou Indicador Discreto de Louvor com Largura Total */}
        <div className="flex-1 min-w-0 flex flex-col items-center text-center px-1 sm:px-2">
          {slide.title ? (
            <>
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 max-w-full flex-wrap sm:flex-nowrap">
                <h2 className="font-title text-base sm:text-2xl md:text-3xl font-bold text-[#D4AF37] tracking-tight drop-shadow-sm">
                  {slide.title}
                </h2>
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-title font-bold bg-[#C59B4B]/20 text-[#D4AF37] border border-[#C59B4B]/35 shadow-sm shrink-0 whitespace-nowrap">
                  {badgeLabel}
                </span>
              </div>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-stone-400 font-sans mt-0.5 tracking-wide truncate max-w-full">
                  {subtitle}
                </p>
              )}
            </>
          ) : isMusic ? (
            /* Louvor sem título cadastrado no slide: indicador solene e discreto */
            <div className="flex flex-col items-center gap-1 max-w-full">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#C59B4B]/10 border border-[#C59B4B]/30 text-[#D4AF37] shadow-sm max-w-full">
                <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C59B4B] shrink-0" />
                <span className="font-title text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Projeção de Louvor
                </span>
                {subtitle && (
                  <span className="text-[10px] sm:text-xs text-stone-400 font-sans border-l border-stone-700/80 pl-1.5 sm:pl-2 ml-1 truncate">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Telão Oficial genérico */
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-stone-800/60 border border-stone-700/60 text-stone-300">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C59B4B] shrink-0" />
              <span className="font-title text-[10px] sm:text-xs uppercase tracking-wider font-semibold whitespace-nowrap">
                Telão Oficial
              </span>
            </div>
          )}
        </div>

        {/* Espaçador simétrico à direita para manter o título perfeitamente balanceado no centro */}
        <div className="w-10 sm:w-16 md:w-20 shrink-0 pointer-events-none" aria-hidden="true" />
      </header>

      {/* Área Central: Versículo / Letra 100% Centralizado com Quebras Fluidas e Destaque Visual */}
      <main className={`relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 my-auto mx-auto w-full overflow-y-auto py-2 sm:py-3 scrollbar-none ${containerClass}`}>
        <p className={`font-sans font-semibold sm:font-bold ${fontSizeClass} ${lineHeightClass} slide-text-responsive text-white whitespace-pre-line tracking-normal sm:tracking-wide drop-shadow-md text-center max-w-full my-auto`}>
          {slide.text}
        </p>
      </main>

      {/* Botão Ver Roteiro no Mobile (apenas em celulares na vertical, centralizado acima do relógio) */}
      <div className="relative z-20 flex sm:hidden justify-center mb-1.5 shrink-0">
        <button
          type="button"
          onClick={onMinimize}
          className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-b from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-stone-200 hover:text-white border border-[#C59B4B]/40 hover:border-[#C59B4B]/70 transition-all active:scale-95 cursor-pointer shadow-lg shadow-black/50"
          title="Ver o roteiro do culto"
          aria-label="Minimizar projeção e ver roteiro do culto"
        >
          <Minimize2 className="w-4 h-4 text-[#C59B4B] shrink-0" />
          <span className="font-title text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            Ver Roteiro
          </span>
        </button>
      </div>

      {/* Rodapé Institucional Solene com o Relógio Oficial Grande e Ações Alinhadas na Barra */}
      <footer className="relative z-10 flex items-center justify-between border-t border-stone-800/40 pt-2 sm:pt-2.5 text-xs text-stone-400 gap-2 shrink-0">
        {/* Esquerda: Status da Sincronização */}
        <div className="flex-1 flex items-center justify-start gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50" />
          <span className="font-sans font-medium text-stone-300 text-[10px] sm:text-xs whitespace-nowrap">
            <span className="hidden xs:inline">Projeção </span>Sincronizada
          </span>
        </div>

        {/* Centro: Relógio Oficial Grande Solene Centralizado no Rodapé */}
        <div className="flex justify-center shrink-0">
          <PulpitClock variant="large" className="shadow-lg" />
        </div>

        {/* Direita: Em tablets e telas deitadas, o botão Ver Roteiro fica embutido na barra; no celular em pé, sigla da igreja */}
        <div className="flex-1 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onMinimize}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-stone-200 hover:text-white border border-[#C59B4B]/40 hover:border-[#C59B4B]/70 transition-all active:scale-95 cursor-pointer shadow-md"
            title="Ver o roteiro do culto"
            aria-label="Minimizar projeção e ver roteiro do culto"
          >
            <Minimize2 className="w-3.5 h-3.5 text-[#C59B4B] shrink-0" />
            <span className="font-title text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Ver Roteiro
            </span>
          </button>
          <span className="sm:hidden text-stone-400 font-title font-semibold tracking-wide text-[10px] shrink-0">
            A.D. Utinga — PNO
          </span>
        </div>
      </footer>
    </div>
  );
};
