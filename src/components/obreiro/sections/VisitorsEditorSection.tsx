import React from 'react';
import { VisitorItem, UserRole } from '../../../types/liturgy';
import { UserPlus, ClipboardCopy } from 'lucide-react';
import { InteractiveLineSheet } from '../../common/InteractiveLineSheet';
import { useDraftBatch } from '../hooks';
import { formatVisitorsList, copyTextToClipboard } from '../../../utils/liturgyExport';
import { VisitorItemCard } from './VisitorItemCard';

export interface VisitorsEditorSectionProps {
  visitorsList: VisitorItem[];
  blockId: string;
  role?: UserRole | null;
  draftKey: string;
  draftFallbackKey?: string;
  onAppendItems: (blockId: string, items: VisitorItem[]) => void;
  onRemoveItem: (blockId: string, itemId: string) => void;
  onUpdateBlock: (blockId: string, content: VisitorItem[]) => void;
  showFeedback: (msg: string) => void;
}

export const VisitorsEditorSection: React.FC<VisitorsEditorSectionProps> = ({
  visitorsList,
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
  } = useDraftBatch({
    storageKey: draftKey,
    fallbackKey: draftFallbackKey,
    defaultLineCount: 12,
  });

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (linesToProcess.length === 0 || !blockId) return;

    const newItems: VisitorItem[] = linesToProcess.map((line, idx) => {
      const match = line.match(/^([^(]+)(?:\(([^)]+)\))?/);
      const name = match ? match[1].trim() : line;
      const church = match && match[2] ? match[2].trim() : undefined;
      return {
        id: `${Date.now()}_v_${idx}`,
        name,
        church,
      };
    });

    onAppendItems(blockId, newItems);
    handleClearBatch();
    showFeedback(`${newItems.length} visitante(s) adicionados ao púlpito!`);
  };

  const handleSaveEdit = async (id: string, text: string) => {
    if (!text.trim() || !blockId) return;
    const match = text.match(/^([^(]+)(?:\(([^)]+)\))?/);
    const name = match ? match[1].trim() : text.trim();
    const church = match && match[2] ? match[2].trim() : undefined;

    const updated = visitorsList.map((v) => (v.id === id ? { ...v, name, church } : v));
    await onUpdateBlock(blockId, updated);
    showFeedback('Visitante corrigido com sucesso!');
  };

  const handleCopy = async () => {
    const text = formatVisitorsList(visitorsList);
    const success = await copyTextToClipboard(text);
    if (success) showFeedback('Lista de visitantes copiada para a área de transferência!');
  };

  return (
    <section id="section-visitors" className="scroll-mt-16 bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-church-gold" />
          <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
            Visitantes do Culto
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">
            {visitorsList.length}
          </span>
        </div>

        {role === 'controlador' && visitorsList.length > 0 && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
            title="Copiar lista de visitantes formatada"
          >
            <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
            <span>Copiar</span>
          </button>
        )}
      </div>

      <form onSubmit={handleAddBatch} className="space-y-4">
        <InteractiveLineSheet
          lines={lines}
          onChange={handleLinesChange}
          rawText={rawText}
          onChangeRawText={handleRawTextChange}
          firstEmptyPlaceholder="Toque aqui para digitar o próximo visitante..."
          showModeToggle={false}
          showHeader={false}
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
              className="px-4 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              Limpar Folha
            </button>
          )}
        </div>
      </form>

      {visitorsList.length > 0 && (
        <div className="pt-5 border-t border-church-sand/70 mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-church-muted mb-2 font-sans">
            <span className="font-semibold text-church-charcoal">
              Visitantes Já Cadastrados ({visitorsList.length})
            </span>
            <span className="text-[11px] font-serif italic text-church-muted hidden sm:inline">
              Atualizado em tempo real no púlpito
            </span>
          </div>
          <div className="space-y-2">
            {visitorsList.map((v, idx) => (
              <VisitorItemCard
                key={v.id}
                visitor={v}
                index={idx}
                onSaveEdit={handleSaveEdit}
                onRemove={(id) => onRemoveItem(blockId, id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
