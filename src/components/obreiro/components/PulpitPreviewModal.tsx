import React from 'react';
import { X } from 'lucide-react';
import { PulpitView } from '../../pastor/PulpitView';

interface PulpitPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PulpitPreviewModal: React.FC<PulpitPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex flex-col p-1.5 sm:p-4 animate-fadeIn">
      {/* Barra superior de saída ultra-visível para idosos */}
      <header className="flex items-center justify-between py-2 px-3 bg-stone-900 border-b border-stone-700 text-white rounded-t-xl max-w-[98vw] w-full mx-auto shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold">
              Modo Tela do Púlpito
            </span>
            <span className="text-[10px] text-stone-300 hidden xs:inline sm:inline">
              Suas anotações de obreiro continuam salvas
            </span>
          </div>
        </div>

        {/* BOTÃO GRANDE E INCONFUNDÍVEL DE RETORNO EM VERMELHO */}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-title font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-white ring-2 ring-red-500/50"
          title="Fechar e voltar imediatamente para suas anotações de obreiro"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 stroke-[3]" />
          <span>Voltar ao Obreiro</span>
        </button>
      </header>

      {/* Moldura de exibição do Púlpito */}
      <div className="flex-1 max-w-[98vw] w-full mx-auto bg-church-parchment rounded-b-xl overflow-hidden shadow-2xl border-x-2 border-b-2 border-stone-800 relative flex flex-col min-h-0">
        <PulpitView />
      </div>
    </div>
  );
};
