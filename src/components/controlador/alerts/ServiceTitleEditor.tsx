import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface ServiceTitleEditorProps {
  title: string;
  onUpdateTitle: (title: string) => Promise<void>;
  triggerFeedback: (msg: string) => void;
}

export const ServiceTitleEditor: React.FC<ServiceTitleEditorProps> = ({
  title,
  onUpdateTitle,
  triggerFeedback,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    if (clean === title) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateTitle(clean);
      setIsEditing(false);
      triggerFeedback('Nome do culto atualizado!');
    } catch (err) {
      console.error(err);
      triggerFeedback('Erro ao atualizar nome do culto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-purple-700">Culto:</span>
      {isEditing ? (
        <form onSubmit={handleSave} className="flex items-center gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="text-xs font-title font-bold uppercase px-2 py-0.5 rounded border border-purple-400 bg-purple-50 text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs"
            autoFocus
          />
          <button
            type="submit"
            disabled={isSaving || !draft.trim()}
            className="p-1 rounded bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            title="Salvar novo nome do culto"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(title);
              setIsEditing(false);
            }}
            className="p-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
            title="Cancelar edição"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="font-title text-xs font-bold text-purple-950 uppercase">
            {title}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(title);
              setIsEditing(true);
            }}
            className="text-purple-600 hover:text-purple-900 p-0.5 rounded hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="Editar nome do culto"
          >
            <Pencil className="w-3 h-3" />
            <span className="underline">Editar</span>
          </button>
        </div>
      )}
    </div>
  );
};
