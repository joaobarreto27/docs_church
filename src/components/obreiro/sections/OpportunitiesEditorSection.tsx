import React, { useState } from 'react';
import { Mic2, ClipboardCopy } from 'lucide-react';
import { OpportunityItem, UserRole } from '../../../types/liturgy';
import { InteractiveLineSheet } from '../../common/InteractiveLineSheet';
import { useDraftBatch } from '../hooks';
import { formatOpportunitiesList, copyTextToClipboard } from '../../../utils/liturgyExport';
import { OpportunityItemCard } from './OpportunityItemCard';

export interface OpportunitiesEditorSectionProps {
  oppsList: OpportunityItem[];
  blockId: string;
  role?: UserRole | null;
  draftKey: string;
  draftFallbackKey?: string;
  onAppendItems: (blockId: string, items: OpportunityItem[]) => void;
  onRemoveItem: (blockId: string, itemId: string) => void;
  onUpdateBlock: (blockId: string, content: OpportunityItem[]) => void;
  showFeedback: (msg: string) => void;
}

export const OpportunitiesEditorSection: React.FC<OpportunitiesEditorSectionProps> = ({
  oppsList,
  blockId,
  role,
  draftKey,
  draftFallbackKey,
  onAppendItems,
  onRemoveItem,
  onUpdateBlock,
  showFeedback,
}) => {
  const {
    rawText,
    lines,
    handleRawTextChange,
    handleLinesChange,
    handleClearBatch,
    linesToProcess,
    hasDraft,
  } = useDraftBatch({ storageKey: draftKey, fallbackKey: draftFallbackKey, defaultLineCount: 4 });

  const [editingOppId, setEditingOppId] = useState<string | null>(null);
  const [editingOppText, setEditingOppText] = useState('');

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (linesToProcess.length === 0 || !blockId) return;
    const newItems: OpportunityItem[] = linesToProcess.map((name, idx) => ({
      id: `${Date.now()}_opp_${idx}`,
      name,
    }));
    onAppendItems(blockId, newItems);
    handleClearBatch();
    showFeedback(`${newItems.length} oportunidade(s) adicionada(s) ao púlpito!`);
  };

  const handleStartEdit = (op: OpportunityItem) => {
    setEditingOppId(op.id);
    setEditingOppText(op.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingOppText.trim() || !blockId) return;
    const updated = oppsList.map((item) => item.id === id ? { ...item, name: editingOppText.trim() } : item);
    await onUpdateBlock(blockId, updated);
    setEditingOppId(null);
    setEditingOppText('');
    showFeedback('Oportunidade corrigida com sucesso!');
  };

  const handleToggleStatus = (id: string, status?: 'idle' | 'ready' | 'done') => {
    if (!blockId) return;
    const updated = oppsList.map((op) => {
      if (op.id !== id) return op;
      const nextStatus = status !== undefined ? status : op.status === 'ready' ? 'done' : op.status === 'done' ? 'idle' : 'ready';
      return { ...op, status: nextStatus };
    });
    onUpdateBlock(blockId, updated);
  };

  const handleCopy = async () => {
    const text = formatOpportunitiesList(oppsList);
    const success = await copyTextToClipboard(text);
    if (success) showFeedback('Oportunidades copiadas para a área de transferência!');
  };

  return (
    <section id="section-opportunities" className="scroll-mt-16 bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-church-gold" />
            <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">Oportunidades</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">{oppsList.length}</span>
          </div>
          {role === 'controlador' && oppsList.length > 0 && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
              title="Copiar oportunidades formatadas para o Google Docs ou Bloco de Notas"
            >
              <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
              <span>Copiar</span>
            </button>
          )}
        </div>

        {/* 1. ÁREA DE DIGITAÇÃO (FOLHA PAUTADA COM 4 LINHAS) */}
        <form onSubmit={handleAddBatch} className="space-y-4 mb-4 pb-4 border-b border-church-sand/40">
          <InteractiveLineSheet
            lines={lines}
            onChange={handleLinesChange}
            rawText={rawText}
            onChangeRawText={handleRawTextChange}
            firstEmptyPlaceholder="Toque aqui para digitar o próximo cantor ou grupo..."
            showModeToggle={false}
            showHeader={false}
            minLines={4}
            hasDraft={hasDraft}
          />
          <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
            <button
              type="submit"
              disabled={!linesToProcess.length}
              className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              + Adicionar Todos à Lista
            </button>
            {hasDraft && (
              <button
                type="button"
                onClick={handleClearBatch}
                className="px-3 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
              >
                Limpar Folha
              </button>
            )}
          </div>
        </form>

        {/* 2. LISTA DE OPORTUNIDADES */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-church-muted mb-2 font-sans">
            <span className="font-semibold text-church-charcoal flex items-center gap-1.5">Cantores Cadastrados ({oppsList.length})</span>
            <span className="text-[11px] font-serif italic text-church-muted hidden sm:inline">Atualizado em tempo real no púlpito</span>
          </div>
          {oppsList.length === 0 ? (
            <p className="font-serif italic text-church-muted text-xs p-2">Nenhuma oportunidade adicionada ainda.</p>
          ) : (
            oppsList.map((op, idx) => (
              <OpportunityItemCard
                key={op.id}
                op={op}
                index={idx}
                role={role}
                isEditing={editingOppId === op.id}
                editingText={editingOppText}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => setEditingOppId(null)}
                onEditTextChange={setEditingOppText}
                onToggleStatus={handleToggleStatus}
                onRemove={(id) => onRemoveItem(blockId, id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};
