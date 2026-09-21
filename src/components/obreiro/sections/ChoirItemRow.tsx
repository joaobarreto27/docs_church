import React from 'react';
import { Pencil, Trash2, Check, X, CheckCircle2, Plus } from 'lucide-react';
import { ChoirItem } from '../../../types/liturgy';

interface ChoirItemRowProps {
  ch: ChoirItem;
  isEditing: boolean;
  editingName: string;
  onStartEdit: (ch: ChoirItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onCycleStatus: (id: string) => void;
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
  onCycleStatus,
  onDelete,
}) => {
  const isDone = ch.checked && ch.status === 'done';
  const isConfirmed = ch.checked && !isDone;

  return (
    <div
      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-colors ${
        isDone
          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
          : isConfirmed
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
            title="Salvar nome"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors cursor-pointer"
            title="Cancelar edição"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span
            onClick={() => onCycleStatus(ch.id)}
            className={`font-title text-xs sm:text-sm cursor-pointer select-none truncate transition-colors flex-1 min-w-0 mr-2 ${
              isDone
                ? 'line-through text-emerald-900/80 font-semibold'
                : isConfirmed
                ? 'font-bold text-church-charcoal'
                : 'text-church-muted'
            }`}
            title="Toque para alternar o status do departamento"
          >
            {ch.name}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão de Ação Direta com Verbo Explícito */}
            <button
              type="button"
              onClick={() => onCycleStatus(ch.id)}
              className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-title font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 active:scale-[0.98] ${
                isDone
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                  : isConfirmed
                  ? 'bg-church-gold hover:bg-church-gold-dark text-white shadow-xs'
                  : 'bg-church-sand/50 text-church-charcoal/70 border border-church-sand hover:bg-church-sand hover:text-church-charcoal'
              }`}
              title={
                isDone
                  ? 'Já louvou no culto. Toque para retornar para a fila'
                  : isConfirmed
                  ? 'Toque quando o conjunto terminar de louvar'
                  : 'Toque para confirmar a presença deste departamento no culto'
              }
            >
              {isDone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span><span className="hidden sm:inline">Já </span>Louvou ✓</span>
                </>
              ) : isConfirmed ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span><span className="hidden sm:inline">Marcar que </span>Louvou ✓</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span><span className="hidden sm:inline">Confirmar </span>Presença</span>
                </>
              )}
            </button>

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
        </>
      )}
    </div>
  );
};
