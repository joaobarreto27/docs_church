import React from 'react';

interface ResetServiceModalProps {
  isOpen: boolean;
  newTitle: string;
  onChangeNewTitle: (title: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetServiceModal: React.FC<ResetServiceModalProps> = ({
  isOpen,
  newTitle,
  onChangeNewTitle,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-church-sand p-6 max-w-sm w-full space-y-4 shadow-xl">
        <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
          Iniciar Novo Culto?
        </h3>
        <p className="font-sans text-xs text-church-muted leading-relaxed">
          Isso arquivará as anotações do culto anterior e começará uma <strong>folha limpa</strong> com o mesmo código de sala.
        </p>
        <div>
          <label className="block text-xs font-title font-bold text-church-charcoal mb-1">
            Nome do Próximo Culto:
          </label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => onChangeNewTitle(e.target.value)}
            placeholder="Ex: Culto de Domingo Noite"
            className="w-full text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/50 outline-none focus:border-church-gold"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-title font-bold uppercase text-church-muted hover:text-church-charcoal cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-church-gold text-white rounded-lg text-xs font-title font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors cursor-pointer shadow-xs"
          >
            Confirmar e Limpar
          </button>
        </div>
      </div>
    </div>
  );
};
