import React from 'react';
import { Tablet, X } from 'lucide-react';

interface PulpitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PulpitConfirmModal: React.FC<PulpitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-church-gold/15 flex items-center justify-center text-church-gold-dark shrink-0">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-title text-base font-bold text-church-charcoal">
              Visualizar Tela do Púlpito?
            </h3>
            <p className="font-sans text-xs text-church-muted mt-0.5">
              Alternar para a visualização do púlpito
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
          <p className="font-medium">
            Esta tela mostrará a visualização oficial do Púlpito.
          </p>
          <p className="mt-1 text-[11px] text-amber-800">
            • Suas anotações continuam salvas intactas.<br />
            • Para voltar, haverá um botão vermelho bem visível no topo da tela.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-church-sand/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-title text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 border border-red-700"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Cancelar / Ficar Aqui</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-church-gold hover:bg-church-gold-dark text-church-charcoal border border-church-gold-dark/40 font-title text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Tablet className="w-4 h-4" />
            <span>Sim, Ver Púlpito</span>
          </button>
        </div>
      </div>
    </div>
  );
};
