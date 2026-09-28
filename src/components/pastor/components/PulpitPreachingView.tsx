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
  const hasSlide = Boolean(isHolyricsProjecting && holyricsSlide && holyricsSlide.text);
  const slideRef = holyricsSlide?.title || (holyricsSlide?.type === 'bible' ? 'BÍBLIA SAGRADA' : 'PROJEÇÃO ATIVA');
  const textLength = holyricsSlide?.text?.trim().length || 0;
  const preachingTypographyClass =
    textLength < 100
      ? 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sans font-black leading-tight sm:leading-snug'
      : textLength <= 240
      ? 'text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-sans font-extrabold leading-snug sm:leading-normal'
      : textLength <= 450
      ? 'text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-sans font-bold leading-snug sm:leading-relaxed'
      : 'text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-sans font-bold leading-relaxed';

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
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800">Culto Ao Vivo</span>
          </div>
          <span className="text-xs font-serif italic text-stone-500 font-medium truncate max-w-[180px] hidden sm:inline">
            {roomTitle}
          </span>
        </div>
      </header>

      {/* Área Central: Retângulo de Pregação expandido ocupando toda a tela com borda dourada solene */}
      <main className="flex-1 min-h-0 w-full p-2.5 sm:p-4 md:p-6 flex flex-col justify-center items-center">
        {hasSlide && holyricsSlide ? (
          <div className="flex-1 w-full bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border-3 sm:border-4 border-[#C59B4B] shadow-2xl shadow-[#C59B4B]/15 text-center flex flex-col justify-center items-center overflow-y-auto">
            {/* Badge com a Referência Bíblica */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#C59B4B]/20 border-2 border-[#C59B4B]/50 text-[#7A5515] mb-3 sm:mb-6 shadow-sm shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#C59B4B] shrink-0" />
              <span className="text-xs sm:text-base font-title font-black uppercase tracking-wider">
                {slideRef}
              </span>
            </div>

            {/* Texto Bíblico Gigante Sans-Serif e Preto Profundo para Leitura Confortável por Idosos */}
            <p className={`${preachingTypographyClass} text-black max-w-5xl mx-auto whitespace-pre-line tracking-tight drop-shadow-2xs`}>
              {holyricsSlide.text}
            </p>
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

      {/* Rodapé: Botão de Sair e Relógio Oficial do Púlpito Responsivo */}
      <footer className="bg-white border-t-2 border-[#EAE5DF] p-3 sm:px-6 sm:py-3.5 shadow-2xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Relógio Grande Solene na Paleta Clara do Púlpito Zen (No tablet: canto esquerdo; no mobile: abaixo do botão) */}
        <div className="w-full sm:w-auto sm:flex-1 flex justify-center sm:justify-start order-2 sm:order-1">
          <PulpitClock variant="large" colorScheme="light" className="shadow-md" />
        </div>

        {/* Botão Sair Modo Pregação (No mobile: acima do relógio; no tablet/desktop: centralizado) */}
        <div className="w-full sm:w-auto flex justify-center order-1 sm:order-2">
          <button
            type="button"
            onClick={onExitPreaching}
            className="w-full sm:w-auto min-w-[240px] sm:min-w-[280px] h-12 sm:h-14 inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 rounded-2xl bg-[#C59B4B] hover:bg-[#B0893D] text-white font-title font-black text-sm sm:text-base uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-[#8A631E] active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
            <span>Sair Modo Pregação</span>
          </button>
        </div>

        {/* Espaçador simétrico no canto direito para garantir centralização matemática do botão em tablets */}
        <div className="hidden sm:flex sm:flex-1 justify-end" aria-hidden="true" />
      </footer>
    </div>
  );
};
