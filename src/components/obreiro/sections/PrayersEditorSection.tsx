import React from 'react';
import { PrayerItem, UserRole } from '../../../types/liturgy';
import { HeartHandshake, ClipboardCopy, Trash2 } from 'lucide-react';
import { InteractiveLineSheet } from '../../common/InteractiveLineSheet';
import { useDraftBatch } from '../hooks';
import { formatPrayersList, copyTextToClipboard } from '../../../utils/liturgyExport';
import { PrayerItemCard } from './PrayerItemCard';

export interface PrayersEditorSectionProps {
  prayersList: PrayerItem[];
  blockId: string;
  role?: UserRole | null;
  draftKey: string;
  draftFallbackKey?: string;
  onAppendItems: (blockId: string, items: PrayerItem[]) => void;
  onRemoveItem: (blockId: string, itemId: string) => void;
  onUpdateBlock: (blockId: string, content: PrayerItem[]) => void;
  onOpenMassDeleteModal?: () => void;
  showFeedback: (msg: string) => void;
}

export const PrayersEditorSection: React.FC<PrayersEditorSectionProps> = ({
  prayersList,
  blockId,
  role,
  draftKey,
  draftFallbackKey,
  onAppendItems,
  onRemoveItem,
  onUpdateBlock,
  onOpenMassDeleteModal,
  showFeedback,
}) => {
  const {
    rawText,
    lines,
    isUrgent,
    setIsUrgent,
    handleRawTextChange,
    handleLinesChange,
    handleClearBatch,
    linesToProcess,
    hasDraft,
  } = useDraftBatch({ storageKey: draftKey, fallbackKey: draftFallbackKey, defaultLineCount: 15 });

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (linesToProcess.length === 0 || !blockId) return;

    const newItems: PrayerItem[] = linesToProcess.map((desc, idx) => ({
      id: `${Date.now()}_${idx}`,
      description: desc,
      urgent: isUrgent,
    }));
    onAppendItems(blockId, newItems);
    handleClearBatch();
    setIsUrgent(false);
    showFeedback(`${newItems.length} pedido(s) de oração adicionados ao púlpito!`);
  };

  const handleSaveEdit = async (id: string, text: string) => {
    if (!text.trim() || !blockId) return;
    const updated = prayersList.map((p) => (p.id === id ? { ...p, description: text.trim() } : p));
    await onUpdateBlock(blockId, updated);
    showFeedback('Pedido de oração corrigido com sucesso!');
  };

  const handleCopy = async () => {
    const text = formatPrayersList(prayersList);
    const success = await copyTextToClipboard(text);
    if (success) showFeedback('Pedidos de oração copiados para a área de transferência!');
  };

  return (
    <section id="section-prayers" className="scroll-mt-16 bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-church-gold" />
          <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">Pedidos de Oração (Presenciais)</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">{prayersList.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {role === 'controlador' && prayersList.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                title="Copiar pedidos de oração formatados"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copiar</span>
              </button>

              {onOpenMassDeleteModal && (
                <button
                  type="button"
                  onClick={onOpenMassDeleteModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                  title="Apagar todos os pedidos de oração"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Apagar Todos</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleAddBatch} className="space-y-4">
        <InteractiveLineSheet
          lines={lines}
          onChange={handleLinesChange}
          rawText={rawText}
          onChangeRawText={handleRawTextChange}
          firstEmptyPlaceholder="Toque aqui para digitar o próximo pedido de oração..."
          showModeToggle={false}
          showHeader={false}
          minLines={15}
          hasDraft={hasDraft}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!linesToProcess.length}
              className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              + Adicionar Todos os Pedidos
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

          <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-serif italic text-church-muted hover:text-church-charcoal transition-colors select-none">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 rounded text-church-gold focus:ring-church-gold"
            />
            <span>Marcar todos deste grupo como Caso Urgente</span>
          </label>
        </div>
      </form>

      {prayersList.length > 0 && (
        <div className="pt-5 border-t border-church-sand/70 mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-church-muted mb-2 font-sans">
            <span className="font-semibold text-church-charcoal">Pedidos Já Cadastrados ({prayersList.length})</span>
            <span className="text-[11px] font-serif italic text-church-muted hidden sm:inline">Atualizado em tempo real no púlpito</span>
          </div>
          <div className="space-y-2">
            {prayersList.map((p, idx) => (
              <PrayerItemCard
                key={p.id}
                prayer={p}
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
