import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { formatRoomCodeMask } from '../../../services/neon';

interface RoomCodeEditorProps {
  code: string;
  onUpdateCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  triggerFeedback: (msg: string) => void;
}

export const RoomCodeEditor: React.FC<RoomCodeEditorProps> = ({
  code,
  onUpdateCode,
  triggerFeedback,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = formatRoomCodeMask(draft);
    const withoutHyphen = clean.replace(/-/g, '');
    if (withoutHyphen.length < 6) {
      triggerFeedback('O código deve conter 6 caracteres no formato XXX-XXX.');
      return;
    }
    if (clean === code) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await onUpdateCode(clean);
      if (res.success) {
        setIsEditing(false);
        triggerFeedback(`Chave do culto atualizada para ${clean}!`);
      } else {
        triggerFeedback(res.error || 'Erro ao atualizar código.');
      }
    } catch (err) {
      console.error(err);
      triggerFeedback('Erro ao atualizar código do culto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-purple-700">Chave:</span>
      {isEditing ? (
        <form onSubmit={handleSave} className="flex items-center gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(formatRoomCodeMask(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsEditing(false);
            }}
            placeholder="XXX-XXX"
            maxLength={7}
            className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border border-purple-400 bg-purple-50 text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs w-24 tracking-wider text-center"
            autoFocus
          />
          <button
            type="submit"
            disabled={isSaving || draft.replace(/-/g, '').length < 6}
            className="p-1 rounded bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            title="Salvar nova chave da sala"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(code);
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
          <span className="font-mono text-xs font-bold text-purple-950 bg-purple-100 border border-purple-200/80 px-1.5 py-0.5 rounded tracking-wider shadow-2xs">
            {code}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(code);
              setIsEditing(true);
            }}
            className="text-purple-600 hover:text-purple-900 p-0.5 rounded hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            title="Alterar chave da sala"
          >
            <Pencil className="w-3 h-3" />
            <span className="underline">Alterar</span>
          </button>
        </div>
      )}
    </div>
  );
};
