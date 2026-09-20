import React, { useState } from 'react';
import { ChoirItem } from '../../../types/liturgy';
import { Users, ClipboardCopy, Plus } from 'lucide-react';
import { formatChoirsList, copyTextToClipboard } from '../../../utils/liturgyExport';
import { ChoirItemRow } from './ChoirItemRow';

export interface ChoirsChecklistSectionProps {
  choirsList: ChoirItem[];
  blockId: string;
  onAppendItems: (blockId: string, items: ChoirItem[]) => void;
  onUpdateBlock: (blockId: string, content: ChoirItem[]) => void;
  showFeedback: (msg: string) => void;
}

export const ChoirsChecklistSection: React.FC<ChoirsChecklistSectionProps> = ({
  choirsList,
  blockId,
  onAppendItems,
  onUpdateBlock,
  showFeedback,
}) => {
  const [newChoirName, setNewChoirName] = useState('');
  const [editingChoirId, setEditingChoirId] = useState<string | null>(null);
  const [editingChoirName, setEditingChoirName] = useState('');

  const confirmedCount = choirsList.filter((c) => c.checked).length;

  const handleCopy = async () => {
    const text = formatChoirsList(choirsList.filter((c) => c.checked));
    const success = await copyTextToClipboard(text);
    if (success) showFeedback('Departamentos confirmados copiados para a área de transferência!');
  };

  const handleAddChoir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoirName.trim() || !blockId) return;

    const newItem: ChoirItem = {
      id: Date.now().toString(),
      name: newChoirName.trim(),
      checked: true,
      status: 'ready',
    };

    onAppendItems(blockId, [newItem]);
    setNewChoirName('');
    showFeedback('Departamento adicionado e confirmado com sucesso!');
  };

  const handleCycleChoirStatus = (id: string) => {
    if (!blockId) return;
    const updated = choirsList.map((ch) => {
      if (ch.id !== id) return ch;
      // Ciclo: 
      // 0 (!checked) -> 1 (checked: true, status: 'ready')
      // 1 (checked && status !== 'done') -> 2 (checked: true, status: 'done')
      // 2 (checked && status === 'done') -> 0 (checked: false, status: 'idle')
      if (!ch.checked) {
        return { ...ch, checked: true, status: 'ready' as const };
      }
      if (ch.status === 'done') {
        return { ...ch, checked: false, status: 'idle' as const };
      }
      return { ...ch, checked: true, status: 'done' as const };
    });
    onUpdateBlock(blockId, updated);
  };

  const handleStartEdit = (ch: ChoirItem) => {
    setEditingChoirId(ch.id);
    setEditingChoirName(ch.name);
  };

  const handleSaveChoirName = (id: string) => {
    if (!editingChoirName.trim() || !blockId) return;
    const updated = choirsList.map((ch) =>
      ch.id === id ? { ...ch, name: editingChoirName.trim() } : ch
    );
    onUpdateBlock(blockId, updated);
    setEditingChoirId(null);
    setEditingChoirName('');
    showFeedback('Nome do departamento atualizado!');
  };

  const handleDeleteChoir = (id: string) => {
    if (!blockId) return;
    const updated = choirsList.filter((ch) => ch.id !== id);
    onUpdateBlock(blockId, updated);
    showFeedback('Departamento excluído!');
  };

  return (
    <section id="section-choirs" className="scroll-mt-16 bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-church-gold" />
            <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
              Departamentos do Culto
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-title font-bold px-2.5 py-0.5 rounded-full bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">
              {confirmedCount} Confirmados
            </span>
            {confirmedCount > 0 && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                title="Copiar departamentos confirmados"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copiar</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleAddChoir} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Novo departamento (Ex: Mocidade, Círculo de Oração, Varões)..."
            value={newChoirName}
            onChange={(e) => setNewChoirName(e.target.value)}
            className="flex-1 min-w-0 text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none"
          />
          <button
            type="submit"
            disabled={!newChoirName.trim()}
            className="px-3 sm:px-3.5 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            title="Adicionar à lista de departamentos"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </form>

        <div className="space-y-2">
          {choirsList.length === 0 ? (
            <p className="font-serif italic text-church-muted text-xs p-3 text-center border border-dashed border-church-sand rounded-xl">
              Nenhum departamento cadastrado. Adicione um departamento no campo acima.
            </p>
          ) : (
            choirsList.map((ch) => (
              <ChoirItemRow
                key={ch.id}
                ch={ch}
                isEditing={editingChoirId === ch.id}
                editingName={editingChoirName}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveChoirName}
                onCancelEdit={() => setEditingChoirId(null)}
                onEditingNameChange={setEditingChoirName}
                onCycleStatus={handleCycleChoirStatus}
                onDelete={handleDeleteChoir}
              />
            ))
          )}
        </div>
      </div>
      <p className="text-[11px] text-church-muted mt-4 font-serif italic border-t border-church-sand/50 pt-2">
        * Toque no botão de status para avançar o ciclo (Confirmar Presença ➔ Confirmado ➔ Já Louvou). Use o lápis para renomear ou a lixeira para excluir.
      </p>
    </section>
  );
};
