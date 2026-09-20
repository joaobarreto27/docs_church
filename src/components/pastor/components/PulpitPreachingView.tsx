import React from 'react';
import { Mic, BookOpen, ArrowLeft } from 'lucide-react';
import { HolyricsSlide } from '../../../types/holyrics';
import { PulpitClock } from './PulpitClock';

export interface PulpitPreachingViewProps {
  roomTitle: string;
  holyricsSlide: HolyricsSlide | null;
  isHolyricsProjecting: boolean;
  onExitPreaching: () => void;
}

export const PulpitPreachingView: React.FC<PulpitPreachingViewProps> = ({
  roomTitle,
  holyricsSlide,
  isHolyricsProjecting,
  onExitPreaching,
}) => {
  const hasSlide = isHolyricsProjecting && holyricsSlide && holyricsSlide.text;
  const slideRef = holyricsSlide?.title || (holyricsSlide?.type === 'bible' ? 'BÍBLIA SAGRADA' : 'PROJEÇÃO ATIVA');

  return (
    <div className="h-full w-full flex flex-col bg-[#FAF8F5] text-[#1C1917] select-none overflow-hidden font-sans relative">
      {/* Topo Solene com Logotipo e Indicador Ao Vivo */}
      <header className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-[#EAE5DF] bg-white/80 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo-adutinga-horizontal.png"
            alt="A.D. Utinga"
            className="h-7 sm:h-8 w-auto object-contain"
          />
          <span className="text-[11px] sm:text-xs font-title font-bold text-[#8A7650] uppercase tracking-widest border-l border-[#EAE5DF] pl-3 hidden xs:inline">
            Púlpito Zen • A.D. Utinga
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <PulpitClock />
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800">Culto Ao Vivo</span>
          </div>
          <span className="text-xs font-serif italic text-stone-500 font-medium truncate max-w-[180px] hidden sm:inline">
            {roomTitle}
          </span>
        </div>
      </header>

      {/* Área Central: Projeção de Versículo Gigante OU Logo Expandida da Igreja */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 text-center max-w-5xl mx-auto w-full overflow-y-auto">
        {hasSlide ? (
          <div className="w-full bg-white rounded-3xl p-5 sm:p-8 md:p-10 border-2 border-[#C59B4B] shadow-xl shadow-[#C59B4B]/15 text-center my-auto">
            {/* Badge com a Referência Bíblica */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-full bg-[#C59B4B]/15 border border-[#C59B4B]/35 text-[#8A631E] mb-4 sm:mb-6">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#C59B4B] shrink-0" />
              <span className="text-sm sm:text-base font-title font-black uppercase tracking-wider">
                {slideRef}
              </span>
            </div>

            {/* Texto Bíblico Gigante para Leitura Confortável por Idosos */}
            <blockquote className="font-serif italic font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1C1917] leading-relaxed sm:leading-loose max-w-4xl mx-auto whitespace-pre-line">
              "{holyricsSlide.text}"
            </blockquote>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-2xl shadow-[#C59B4B]/15 border-2 border-[#EAE5DF] mb-5">
              <img
                src="/assets/logo-adutinga-horizontal.png"
                alt="Assembleia de Deus Utinga"
                className="h-20 sm:h-28 md:h-32 w-auto object-contain drop-shadow-sm"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#C59B4B]/15 border border-[#C59B4B]/35 text-[#8A631E] shadow-2xs">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-[#C59B4B] shrink-0" />
              <span className="text-xs sm:text-sm font-title font-black uppercase tracking-widest">
                Momento da Pregação da Palavra
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé: SOMENTE O BOTÃO DE SAIR (Zero Distração durante a ministração) */}
      <footer className="bg-white border-t-2 border-[#EAE5DF] p-3 sm:p-4 shadow-2xl shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onExitPreaching}
          className="w-full max-w-md h-13 sm:h-16 inline-flex items-center justify-center gap-3 px-6 sm:px-8 rounded-2xl bg-[#C59B4B] hover:bg-[#B0893D] text-white font-title font-black text-sm sm:text-base uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-[#8A631E] active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white shrink-0" />
          <span>Sair Modo Pregação</span>
        </button>
      </footer>
    </div>
  );
};
