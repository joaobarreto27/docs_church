import React from 'react';
import { Youtube, ClipboardCopy, Trash2, Plus } from 'lucide-react';
import { PrayerItem } from '../../../types/liturgy';
import { formatYoutubeList, copyTextToClipboard } from '../../../utils/liturgyExport';
import { useYoutubeCapture } from './useYoutubeCapture';
import { YoutubeScreenshotUploader } from './YoutubeScreenshotUploader';

interface YoutubeSectionProps {
  youtubeList: PrayerItem[];
  blockId?: string;
  onAppendItems: (blockId: string, items: PrayerItem[]) => void;
  onRemoveItem: (blockId: string, id: string) => void;
  triggerFeedback: (msg: string) => void;
}

export const YoutubeSection: React.FC<YoutubeSectionProps> = ({
  youtubeList,
  blockId,
  onAppendItems,
  onRemoveItem,
  triggerFeedback,
}) => {
  const {
    youtubeText,
    setYoutubeText,
    youtubeImageBase64,
    isCompressing,
    fileInputRef,
    handlePasteEvent,
    handleFileInput,
    clearCapture,
    removeImage,
  } = useYoutubeCapture({
    onSuccessFeedback: triggerFeedback,
    onErrorFeedback: triggerFeedback,
  });

  const handleCopy = async () => {
    const text = formatYoutubeList(youtubeList);
    const success = await copyTextToClipboard(text);
    if (success) triggerFeedback('Pedidos do YouTube copiados para a área de transferência!');
  };

  const handleAddYoutubeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeText.trim() && !youtubeImageBase64) return;
    if (!blockId) return;

    const newItem: PrayerItem = {
      id: `${Date.now()}_yt`,
      description: youtubeText.trim() || 'Print da Transmissão (YouTube)',
      image_data: youtubeImageBase64 || undefined,
      created_at: Date.now(),
    };

    onAppendItems(blockId, [newItem]);
    clearCapture();
    triggerFeedback('Pedido do YouTube transmitido ao púlpito!');
  };

  return (
    <section className="max-w-4xl w-full mx-auto p-4 sm:p-6 pb-0">
      <div className="bg-white rounded-2xl border-2 border-red-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-red-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <h3 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
              Transmissão ao Vivo (YouTube) — Chat & Prints
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-red-100 text-red-700">
              {youtubeList.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {youtubeList.length > 0 && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                title="Copiar pedidos do YouTube formatados para o Google Docs ou Bloco de Notas"
              >
                <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copiar</span>
              </button>
            )}
            <span className="text-xs font-serif italic text-church-muted hidden sm:inline">
              Área exclusiva da Cabine
            </span>
          </div>
        </div>

        {/* Lista de Pedidos / Prints do YouTube */}
        {youtubeList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 max-h-72 overflow-y-auto pr-1">
            {youtubeList.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-red-50/40 border border-red-200/80 flex flex-col justify-between gap-2"
              >
                <div className="space-y-2">
                  {p.image_data && (
                    <div className="rounded-lg overflow-hidden border border-red-200 bg-white">
                      <img
                        src={p.image_data}
                        alt="Print do chat"
                        className="w-full h-auto max-h-32 object-contain"
                      />
                    </div>
                  )}
                  <p className="text-xs font-sans font-medium text-church-charcoal leading-snug">
                    {p.description}
                  </p>
                </div>
                <div className="flex justify-end pt-1 border-t border-red-100">
                  <button
                    type="button"
                    onClick={() => blockId && onRemoveItem(blockId, p.id)}
                    className="p-1 text-church-muted hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Excluir print/pedido"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulário de Envio com Captura de Print (Ctrl+V) */}
        <form onSubmit={handleAddYoutubeItem} onPaste={handlePasteEvent} className="space-y-3">
          <YoutubeScreenshotUploader
            youtubeImageBase64={youtubeImageBase64}
            fileInputRef={fileInputRef}
            onFileInput={handleFileInput}
            onPaste={handlePasteEvent}
            onRemoveImage={removeImage}
          />

          {/* Texto ou Legenda do Pedido */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Legenda ou pedido em texto (Ex: Família do Irmão Marcos - Live)..."
              value={youtubeText}
              onChange={(e) => setYoutubeText(e.target.value)}
              onPaste={handlePasteEvent}
              className="flex-1 text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-red-500 focus:bg-white outline-none w-full"
            />
            <button
              type="submit"
              disabled={isCompressing || (!youtubeText.trim() && !youtubeImageBase64)}
              className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Transmitir ao Púlpito</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
