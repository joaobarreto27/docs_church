import React from 'react';
import { Layers, ClipboardCopy, Tablet, RotateCcw, Tv } from 'lucide-react';
import { ServiceTitleEditor } from './ServiceTitleEditor';
import { RoomCodeEditor } from './RoomCodeEditor';

interface ServiceMetadataBarProps {
  title: string;
  code: string;
  isFastSync: boolean;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  onOpenFullList: () => void;
  onOpenPulpitPreview: () => void;
  onOpenResetModal: () => void;
  onOpenHolyricsModal: () => void;
  triggerFeedback: (msg: string) => void;
}

export const ServiceMetadataBar: React.FC<ServiceMetadataBarProps> = ({
  title,
  code,
  isFastSync,
  onUpdateTitle,
  onUpdateCode,
  onOpenFullList,
  onOpenPulpitPreview,
  onOpenResetModal,
  onOpenHolyricsModal,
  triggerFeedback,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-purple-900">
        <Layers className="w-5 h-5 text-purple-700 shrink-0" />
        <div>
          <h2 className="font-title text-sm font-extrabold uppercase tracking-wide">
            Direção do Culto — Comando da Cabine
          </h2>
          
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <ServiceTitleEditor
              title={title}
              onUpdateTitle={onUpdateTitle}
              triggerFeedback={triggerFeedback}
            />

            <span className="text-purple-300 hidden sm:inline">•</span>

            <RoomCodeEditor
              code={code}
              onUpdateCode={onUpdateCode}
              triggerFeedback={triggerFeedback}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Badge de Sincronização Inteligente */}
        <div 
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-title font-bold uppercase tracking-wider border shadow-2xs transition-colors ${
            isFastSync 
              ? 'bg-amber-50 border-amber-300 text-amber-900' 
              : 'bg-purple-50 border-purple-200 text-purple-700'
          }`}
          title={
            isFastSync 
              ? 'Modo Rápido Ativo (2.5s) - Movimentação recente no culto' 
              : 'Modo Econômico Ativo (6s) - Calmaria (mais de 2,5min sem alterações)'
          }
        >
          <span className={`w-2 h-2 rounded-full ${isFastSync ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isFastSync ? 'Sinc. Rápida (2.5s)' : 'Modo Calmo (6s)'}</span>
        </div>

        {/* Botão Ver Lista Completa */}
        <button
          type="button"
          onClick={onOpenFullList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-title font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
          title="Abrir lista completa do culto formatada para copiar para Google Docs ou Bloco de Notas"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          <span>Ver Lista Completa</span>
        </button>

        {/* Botão de Integração Holyrics */}
        <button
          type="button"
          onClick={onOpenHolyricsModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-300 text-purple-900 text-xs font-title font-bold uppercase tracking-wider hover:bg-purple-100 transition-colors shadow-xs cursor-pointer active:scale-95"
          title="Configurar integração do Holyrics / Telão"
        >
          <Tv className="w-3.5 h-3.5 text-purple-700" />
          <span>Holyrics</span>
        </button>

        {/* Botão de Prévia do Púlpito */}
        <button
          type="button"
          onClick={onOpenPulpitPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 border border-purple-300 text-purple-900 text-xs font-title font-bold uppercase tracking-wider hover:bg-purple-200 transition-colors shadow-xs cursor-pointer"
          title="Abrir simulação da tela do Púlpito em tempo real"
        >
          <Tablet className="w-3.5 h-3.5 text-purple-700" />
          <span>Prévia do Púlpito</span>
        </button>

        {/* Botão Novo Culto / Limpar Folha */}
        <button
          type="button"
          onClick={onOpenResetModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 text-purple-800 text-xs font-title font-bold uppercase tracking-wider hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Novo Culto</span>
        </button>
      </div>
    </div>
  );
};
