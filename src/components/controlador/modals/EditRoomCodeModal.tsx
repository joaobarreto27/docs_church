import React, { useState, useEffect } from 'react';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { formatRoomCodeMask } from '../../../services/neon';

interface EditRoomCodeModalProps {
  isOpen: boolean;
  currentCode: string;
  onClose: () => void;
  onSave: (newCode: string) => Promise<{ success: boolean; error?: string }>;
}

export const EditRoomCodeModal: React.FC<EditRoomCodeModalProps> = ({
  isOpen,
  currentCode,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState(currentCode);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(currentCode);
      setErrorMessage(null);
    }
  }, [isOpen, currentCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const clean = formatRoomCodeMask(draft);
    const withoutHyphen = clean.replace(/-/g, '');

    if (withoutHyphen.length < 6) {
      setErrorMessage('O código deve conter exatamente 6 caracteres (XXX-XXX).');
      return;
    }

    if (clean === currentCode) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSave(clean);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Erro ao alterar a chave da sala.');
      }
    } catch (err) {
      console.error('Erro ao atualizar código da sala:', err);
      setErrorMessage('Erro de comunicação com o servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-church-sand p-6 max-w-sm w-full space-y-4 shadow-xl animate-fadeIn">
        <div className="flex items-center gap-2.5 text-church-charcoal">
          <div className="w-8 h-8 rounded-lg bg-church-gold/15 border border-church-gold/30 flex items-center justify-center text-church-gold-dark shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <h3 className="font-title text-base font-bold uppercase tracking-tight">
            Alterar Chave da Sala
          </h3>
        </div>

        <p className="font-sans text-xs text-church-muted leading-relaxed">
          Defina um novo código para esta sala de culto. Obreiros e Pastor continuarão conectados sem interrupção.
        </p>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-title font-bold text-church-charcoal uppercase tracking-wider mb-1.5">
              Novo Código (XXX-XXX):
            </label>
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(formatRoomCodeMask(e.target.value));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ex: CUL-TO1"
              maxLength={7}
              autoFocus
              className="w-full text-center text-lg font-mono font-bold tracking-widest p-3 rounded-xl border border-church-sand bg-church-parchment/50 outline-none focus:border-church-gold focus:ring-1 focus:ring-church-gold text-church-charcoal uppercase transition-colors"
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
              disabled={isSaving || draft.replace(/-/g, '').length < 6}
              className="px-4 py-2 bg-church-gold text-white rounded-xl text-xs font-title font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar Chave</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
