import React, { useState } from 'react';
import { ClipboardCopy, X, Check, Info } from 'lucide-react';
import { Room, LiturgicalBlock } from '../../../types/liturgy';
import { ExportFormat, ExportSection, getExportStrategy, extractLiturgyData, copyTextToClipboard } from '../../../services/export';
import { ExportFormatSelector } from './ExportFormatSelector';
import { ExportSectionTabs } from './ExportSectionTabs';

interface LiturgyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  blocks: LiturgicalBlock[];
  initialSection?: ExportSection;
  onCopiedFeedback?: (msg: string) => void;
}

export const LiturgyExportModal: React.FC<LiturgyExportModalProps> = ({
  isOpen,
  onClose,
  room,
  blocks,
  initialSection = 'all',
  onCopiedFeedback,
}) => {
  const [section, setSection] = useState<ExportSection>(initialSection);
  const [format, setFormat] = useState<ExportFormat>('plain');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const data = extractLiturgyData(blocks);
  const strategy = getExportStrategy(format);
  const formattedText = strategy.format(room, blocks, section);

  const handleCopy = async () => {
    const success = await copyTextToClipboard(formattedText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (onCopiedFeedback) {
        onCopiedFeedback('Copiado para a área de transferência!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-church-sand overflow-hidden">
        
        {/* Cabeçalho do Modal */}
        <header className="p-4 sm:p-5 bg-church-parchment border-b border-church-sand flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
              <ClipboardCopy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-title text-sm sm:text-base font-extrabold uppercase text-church-charcoal">
                Lista Completa do Culto
              </h3>
              <p className="text-[11px] sm:text-xs text-church-muted mt-0.5">
                Texto formatado para Google Docs, WhatsApp ou software de projeção Holyrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-church-sand/40 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Seletor de Formato (Estratégia) */}
        <ExportFormatSelector
          currentFormat={format}
          onSelectFormat={setFormat}
        />

        {/* Seletor de Seções (Abas) */}
        <ExportSectionTabs
          currentSection={section}
          onSelectSection={setSection}
          data={data}
        />

        {/* Área de Visualização do Texto */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-church-parchment/30">
          <div className="bg-white rounded-xl border border-church-sand p-4 font-mono text-xs sm:text-sm text-church-charcoal whitespace-pre-wrap leading-relaxed shadow-xs selection:bg-emerald-100 selection:text-emerald-900 border-l-4 border-l-emerald-600">
            {formattedText}
          </div>
        </div>

        {/* Rodapé */}
        <footer className="p-4 sm:p-5 bg-white border-t border-church-sand flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-church-muted flex items-center gap-1.5 text-center sm:text-left">
            <Info className="w-3.5 h-3.5 text-church-muted shrink-0" />
            <span>Copie e cole com <strong>Ctrl+V / Cmd+V</strong> no seu aplicativo desejado.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 sm:w-auto px-4 py-2.5 rounded-xl border border-church-sand font-title text-xs font-bold uppercase text-church-muted hover:text-church-charcoal hover:bg-church-parchment transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`w-2/3 sm:w-auto px-5 py-2.5 rounded-xl font-title text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                isCopied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4 stroke-[2.5]" />
                  <span>Copiar Liturgia</span>
                </>
              )}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
