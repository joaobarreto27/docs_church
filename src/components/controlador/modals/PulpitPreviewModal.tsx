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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col p-2 sm:p-4 animate-fadeIn">
      {/* Barra superior de controle da prévia */}
      <header className="flex items-center justify-between pb-2 text-white max-w-[97vw] w-full mx-auto shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-title text-sm font-bold uppercase tracking-wider">
            Transmissão ao Vivo — Réplica do Púlpito
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-title font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/40 shadow-xs"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
          <span>Voltar à Edição</span>
        </button>
      </header>

      {/* Moldura do Tablet */}
      <div className="flex-1 max-w-[97vw] w-full mx-auto bg-church-parchment rounded-2xl overflow-hidden shadow-2xl border-4 border-stone-800 relative flex flex-col min-h-0">
        <PulpitView />
      </div>
    </div>
  );
};
