import React, { useState, useEffect } from 'react';
import { Pencil, Loader2 } from 'lucide-react';

interface EditServiceTitleModalProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onSave: (newTitle: string) => Promise<void>;
}

export const EditServiceTitleModal: React.FC<EditServiceTitleModalProps> = ({
  isOpen,
  currentTitle,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(currentTitle);
    }
  }, [isOpen, currentTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean || clean === currentTitle) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await onSave(clean);
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar nome do culto:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-church-sand p-6 max-w-md w-full space-y-4 shadow-xl animate-fadeIn">
        <div className="flex items-center gap-2.5 text-church-charcoal">
          <div className="w-8 h-8 rounded-lg bg-church-gold/15 border border-church-gold/30 flex items-center justify-center text-church-gold-dark shrink-0">
            <Pencil className="w-4 h-4" />
          </div>
          <h3 className="font-title text-base font-bold uppercase tracking-tight">
            Editar Nome do Culto
          </h3>
        </div>

        <p className="font-sans text-xs text-church-muted leading-relaxed">
          Altere o título do culto em andamento. A mudança refletirá imediatamente no Púlpito do pastor e nos relatórios de exportação.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-title font-bold text-church-charcoal uppercase tracking-wider mb-1.5">
              Título do Culto:
            </label>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex: Culto da Família"
              autoFocus
              className="w-full text-sm font-sans p-3 rounded-xl border border-church-sand bg-church-parchment/50 outline-none focus:border-church-gold focus:ring-1 focus:ring-church-gold text-church-charcoal font-medium transition-colors"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-church-sand/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-title font-bold uppercase text-church-muted hover:text-church-charcoal transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !draft.trim()}
              className="px-4 py-2 bg-church-gold text-white rounded-xl text-xs font-title font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Alteração</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
