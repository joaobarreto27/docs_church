import React, { useState } from 'react';
import { PrayerItem } from '../../../types/liturgy';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export interface PrayerItemCardProps {
  prayer: PrayerItem;
  index: number;
  onSaveEdit: (id: string, newText: string) => void;
  onRemove: (id: string) => void;
}

export const PrayerItemCard: React.FC<PrayerItemCardProps> = ({
  prayer,
  index,
  onSaveEdit,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditingText(prayer.description);
  };

  const handleSave = () => {
    if (!editingText.trim()) return;
    onSaveEdit(prayer.id, editingText);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-50/70 border-2 border-church-gold shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] text-church-gold-dark font-title font-bold uppercase tracking-wider">
          <Pencil className="w-3.5 h-3.5 text-church-gold" />
          <span>Corrigindo Linha Nº {index + 1}</span>
        </div>
        <div className="flex items-start gap-2 py-1 px-2 rounded-lg bg-white border border-church-gold/40 shadow-2xs">
          <span className="w-6 text-right pr-1 text-xs font-mono font-bold text-church-gold-dark shrink-0 pt-2">
            {index + 1}.
          </span>
          <textarea
            rows={1}
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="flex-1 bg-transparent py-1.5 px-1 text-sm sm:text-base font-sans text-church-charcoal border-b-2 border-church-gold outline-none resize-none leading-relaxed font-medium"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-church-sand/50">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-title font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!editingText.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-title font-bold uppercase tracking-wider bg-church-gold text-white hover:bg-church-gold-dark shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Alteração</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between p-3 rounded-xl bg-church-parchment/60 border border-church-sand gap-3 hover:bg-church-parchment transition-colors">
      <div className="text-sm font-sans flex-1">
        <span className="font-mono text-xs font-bold text-church-gold-dark mr-1.5">{index + 1}.</span>
        {prayer.urgent && (
          <span className="inline-block px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider mr-2">
            Urgente
          </span>
        )}
        <span className="text-church-charcoal font-medium">{prayer.description}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleStartEdit}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider text-church-gold-dark bg-church-gold/15 hover:bg-church-gold/25 border border-church-gold/30 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Corrigindo</span>
        </button>
        <button
          type="button"
          onClick={() => onRemove(prayer.id)}
          className="p-1.5 text-church-muted hover:text-red-600 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
