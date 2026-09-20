import React from 'react';
import { Pencil, Trash2, Check, X, Clock, CheckCircle2 } from 'lucide-react';
import { OpportunityItem, UserRole } from '../../../types/liturgy';

interface OpportunityItemCardProps {
  op: OpportunityItem;
  index: number;
  role?: UserRole | null;
  isEditing: boolean;
  editingText: string;
  onStartEdit: (op: OpportunityItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onToggleStatus: (id: string, status?: 'idle' | 'ready' | 'done') => void;
  onRemove: (id: string) => void;
}

export const OpportunityItemCard: React.FC<OpportunityItemCardProps> = ({
  op,
  index,
  role: _role,
  isEditing,
  editingText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onToggleStatus,
  onRemove,
}) => {
  if (isEditing) {
    return (
      <div id={`editing-opp-${op.id}`} className="p-3.5 rounded-xl bg-amber-50/70 border-2 border-church-gold shadow-sm space-y-3 transition-all">
        <div className="flex items-center justify-between text-[11px] text-church-gold-dark font-title font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5 text-church-gold" />
            <span>Corrigindo Linha Nº {index + 1}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 py-1 px-2 rounded-lg bg-white border border-church-gold/40 focus-within:border-church-gold shadow-2xs">
          <span className="w-6 text-right pr-1 text-xs font-mono font-bold text-church-gold-dark shrink-0 self-start pt-2">{index + 1}.</span>
          <textarea
            rows={1}
            value={editingText}
            onChange={e => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.max(36, e.target.scrollHeight)}px`;
              onEditTextChange(e.target.value);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSaveEdit(op.id);
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            ref={el => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = `${Math.max(36, el.scrollHeight)}px`;
              }
            }}
            autoFocus
            className="flex-1 bg-transparent py-1.5 px-1 text-sm sm:text-base font-sans text-church-charcoal border-b-2 border-church-gold outline-none resize-none overflow-hidden leading-relaxed break-words font-medium"
            style={{ minHeight: '36px' }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-church-sand/50">
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-title font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            title="Cancelar correção"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            onClick={() => onSaveEdit(op.id)}
            disabled={!editingText.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-title font-bold uppercase tracking-wider bg-church-gold text-white hover:bg-church-gold-dark shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Alteração</span>
          </button>
        </div>
      </div>
    );
  }

  const isDone = op.status === 'done';

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
        isDone
          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
          : 'bg-church-parchment/60 border-church-sand hover:bg-church-parchment'
      }`}
    >
      <div className="text-sm font-sans flex-1 min-w-0 mr-2">
        <span
          className={`font-mono text-xs font-bold mr-1.5 ${
            isDone ? 'text-emerald-700' : 'text-church-gold-dark'
          }`}
        >
          {index + 1}.
        </span>
        <span
          className={`font-title text-sm truncate ${
            isDone
              ? 'line-through text-emerald-900/80 font-semibold'
              : 'font-semibold text-church-charcoal'
          }`}
        >
          {op.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Alternância Direta de 1 Toque: [Vai Louvar] <-> [Já Louvou] */}
        <button
          type="button"
          onClick={() => onToggleStatus(op.id)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-title font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-[0.98] ${
            isDone
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
              : 'bg-amber-100/90 text-amber-950 border border-amber-300 hover:bg-amber-200'
          }`}
          title={
            isDone
              ? 'Já cantou no culto. Toque para retornar para a fila'
              : 'Confirmado para louvar! Toque quando terminar de cantar'
          }
        >
          {isDone ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">Já Louvou</span>
              <span className="xs:hidden">OK</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xs:inline">Vai Louvar</span>
              <span className="xs:hidden">Cantar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onStartEdit(op)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider text-church-gold-dark bg-church-gold/15 hover:bg-church-gold/25 border border-church-gold/30 transition-colors cursor-pointer"
          title="Corrigir esta oportunidade"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Corrigir</span>
        </button>
        <button
          type="button"
          onClick={() => onRemove(op.id)}
          className="p-1.5 text-church-muted hover:text-red-600 transition-colors cursor-pointer"
          title="Remover oportunidade"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
