import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmMassDeleteModalProps {
  isOpen: boolean;
  modalData: { type: 'visitors' | 'prayers'; count: number } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmMassDeleteModal: React.FC<ConfirmMassDeleteModalProps> = ({
  isOpen,
  modalData,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !modalData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-church-sand p-6 max-w-sm w-full space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
            {modalData.type === 'visitors'
              ? 'Apagar Todos os Visitantes?'
              : 'Apagar Todos os Pedidos?'}
          </h3>
          <p className="font-sans text-xs text-church-muted leading-relaxed">
            Tem certeza que deseja apagar todos os{' '}
            <strong className="text-church-charcoal font-bold">
              {modalData.count} {modalData.type === 'visitors' ? 'visitantes' : 'pedidos de oração'}
            </strong>{' '}
            cadastrados?
            <br />
            <span className="text-red-600 font-medium">
              Esta ação apagará imediatamente a lista do púlpito.
            </span>
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-title font-bold uppercase rounded-xl border border-church-sand text-church-charcoal hover:bg-church-parchment transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-title font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            Sim, Apagar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};
