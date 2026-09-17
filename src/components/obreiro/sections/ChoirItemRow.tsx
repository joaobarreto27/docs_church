import React from 'react';
import { Pencil, Trash2, Check, X, CheckCircle2, Clock } from 'lucide-react';
import { ChoirItem } from '../../../types/liturgy';

interface ChoirItemRowProps {
  ch: ChoirItem;
  isEditing: boolean;
  editingName: string;
  onStartEdit: (ch: ChoirItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onToggleChecked: (id: string) => void;
  onToggleStatus: (id: string, status?: 'idle' | 'ready' | 'done') => void;
  onDelete: (id: string) => void;
}

export const ChoirItemRow: React.FC<ChoirItemRowProps> = ({
  ch,
  isEditing,
  editingName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingNameChange,
  onToggleChecked,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
        ch.checked
          ? 'bg-church-gold/10 border-church-gold text-church-charcoal'
          : 'bg-church-parchment/40 border-church-sand text-church-muted hover:bg-white'
      }`}
    >
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1 mr-2">
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSaveEdit(ch.id);
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            className="flex-1 text-xs font-sans p-1.5 rounded-lg border border-church-gold bg-white outline-none text-church-charcoal font-semibold"
          />
          <button
            type="button"
            onClick={() => onSaveEdit(ch.id)}
            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => onToggleChecked(ch.id)}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              ch.checked
                ? 'bg-church-gold text-white shadow-xs'
                : 'bg-church-sand/70 text-church-muted hover:bg-church-sand'
            }`}
          >
            {ch.checked ? 'Confirmado' : 'Não participa'}
          </button>
          <span
            onClick={() => onToggleChecked(ch.id)}
            className={`font-title text-sm cursor-pointer select-none truncate ${
              ch.checked ? 'font-bold text-church-charcoal' : 'text-church-muted'
            }`}
          >
            {ch.name}
          </span>

          {ch.checked && (
            <div className="sm:ml-auto shrink-0 flex items-center gap-1">
              {ch.status === 'done' ? (
                <button
                  type="button"
                  onClick={() => onToggleStatus(ch.id, 'ready')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-title font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Já Louvou / OK</span>
                </button>
              ) : ch.status === 'ready' ? (
                <button
                  type="button"
                  onClick={() => onToggleStatus(ch.id, 'done')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-title font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs hover:bg-amber-600 transition-all cursor-pointer animate-pulse"
                >
                  <Clock className="w-3 h-3 text-white" />
                  <span>Vai Cantar ➔ OK</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleStatus(ch.id, 'ready')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-title font-semibold uppercase tracking-wider bg-church-parchment text-church-charcoal/80 border border-church-sand hover:bg-amber-50 hover:text-amber-900 transition-all cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-church-gold" />
                  <span>Escalar</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onStartEdit(ch)}
            className="p-1.5 text-church-muted hover:text-church-charcoal hover:bg-church-sand/50 rounded-lg transition-colors cursor-pointer"
            title="Editar nome do departamento"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(ch.id)}
            className="p-1.5 text-church-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Remover departamento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
