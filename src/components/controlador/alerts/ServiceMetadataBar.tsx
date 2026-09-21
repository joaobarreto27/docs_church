import React from 'react';
import { Layers, ClipboardCopy, Tablet, RotateCcw, Tv, Pencil } from 'lucide-react';

interface ServiceMetadataBarProps {
  title: string;
  code: string;
  onOpenEditTitle: () => void;
  onOpenEditCode: () => void;
  onOpenFullList: () => void;
  onOpenPulpitPreview: () => void;
  onOpenResetModal: () => void;
  onOpenHolyricsModal: () => void;
}

export const ServiceMetadataBar: React.FC<ServiceMetadataBarProps> = ({
  title,
  code,
  onOpenEditTitle,
  onOpenEditCode,
  onOpenFullList,
  onOpenPulpitPreview,
  onOpenResetModal,
  onOpenHolyricsModal,
}) => {
  return (
    <div className="bg-church-parchment/40 rounded-2xl border border-church-sand shadow-2xs overflow-hidden">
      {/* 1. CORPO SUPERIOR DO CARD (COMUM PARA DESKTOP E MOBILE) */}
      <div className="p-3.5 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 text-church-charcoal">
          <div className="w-9 h-9 rounded-xl bg-church-gold/15 border border-church-gold/30 flex items-center justify-center shrink-0 text-church-gold-dark shadow-2xs mt-0.5 sm:mt-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wide text-church-charcoal">
              Direção do Culto — Comando da Cabine
            </h2>

            <div className="mt-1 space-y-0.5 text-xs">
              {/* Linha 1: Nome do Culto */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-church-muted uppercase">Culto:</span>
                <span className="font-title text-xs font-bold text-church-charcoal uppercase max-w-[200px] sm:max-w-md truncate" title={title}>
                  {title}
                </span>
                <button
                  type="button"
                  onClick={onOpenEditTitle}
                  className="text-church-gold-dark hover:text-church-gold p-0.5 rounded transition-colors inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  title="Editar nome do culto em modal"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="underline">Editar</span>
                </button>
              </div>

              {/* Linha 2: Chave na linha debaixo de Culto */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-church-muted uppercase">Chave:</span>
                <span className="font-mono text-xs font-bold text-church-charcoal bg-church-parchment border border-church-sand px-1.5 py-0.2 rounded tracking-wider shadow-2xs">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={onOpenEditCode}
                  className="text-church-gold-dark hover:text-church-gold p-0.5 rounded transition-colors inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  title="Alterar chave da sala em modal"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="underline">Alterar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PROPOSTA 1 PARA MOBILE (Dock Cápsula em 1 linha de 4 colunas) */}
        <div className="sm:hidden grid grid-cols-4 gap-1 p-1 rounded-xl bg-church-parchment/90 border border-church-sand shadow-2xs text-center w-full mt-2">
          {/* 1º Novo Culto */}
          <button
            type="button"
            onClick={onOpenResetModal}
            className="flex flex-col items-center justify-center py-2 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white text-[10px] font-title font-bold uppercase tracking-tighter transition-colors cursor-pointer"
            title="Arquivar culto e iniciar novo"
          >
            <RotateCcw className="w-3.5 h-3.5 mb-0.5 text-church-muted" />
            <span>Novo</span>
          </button>

          {/* 2º Ver Lista */}
          <button
            type="button"
            onClick={onOpenFullList}
            className="flex flex-col items-center justify-center py-2 rounded-lg text-church-charcoal hover:bg-white text-[10px] font-title font-bold uppercase tracking-tighter transition-colors cursor-pointer"
            title="Ver lista completa do culto"
          >
            <ClipboardCopy className="w-3.5 h-3.5 mb-0.5 text-church-gold-dark" />
            <span>Lista</span>
          </button>

          {/* 3º Prévia Púlpito */}
          <button
            type="button"
            onClick={onOpenPulpitPreview}
            className="flex flex-col items-center justify-center py-2 rounded-lg text-church-charcoal hover:bg-white text-[10px] font-title font-bold uppercase tracking-tighter transition-colors cursor-pointer"
            title="Abrir prévia do Púlpito"
          >
            <Tablet className="w-3.5 h-3.5 mb-0.5 text-church-gold-dark" />
            <span>Púlpito</span>
          </button>

          {/* 4º Holyrics */}
          <button
            type="button"
            onClick={onOpenHolyricsModal}
            className="flex flex-col items-center justify-center py-2 rounded-lg text-church-charcoal hover:bg-white text-[10px] font-title font-bold uppercase tracking-tighter transition-colors cursor-pointer"
            title="Integração Holyrics"
          >
            <Tv className="w-3.5 h-3.5 mb-0.5 text-church-gold-dark" />
            <span>Holyrics</span>
          </button>
        </div>
      </div>

      {/* 3. PROPOSTA 3 PARA DESKTOP (Faixa de Rodapé Ancorada do Card) */}
      <div className="hidden sm:flex bg-church-parchment/70 border-t border-church-sand px-4 sm:px-5 py-2.5 items-center gap-2">
        <span className="text-[10px] font-title font-bold uppercase tracking-wider text-church-muted mr-1">
          Ferramentas do Culto:
        </span>

        {/* 1º Novo Culto */}
        <button
          type="button"
          onClick={onOpenResetModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-church-sand bg-white hover:bg-church-parchment text-church-charcoal text-xs font-title font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          title="Arquivar culto e abrir nova folha limpa"
        >
          <RotateCcw className="w-3.5 h-3.5 text-church-muted shrink-0" />
          <span>Novo Culto</span>
        </button>

        {/* 2º Ver Lista */}
        <button
          type="button"
          onClick={onOpenFullList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-church-parchment border border-church-sand text-church-charcoal text-xs font-title font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          title="Ver lista completa do culto"
        >
          <ClipboardCopy className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
          <span>Ver Lista</span>
        </button>

        {/* 3º Prévia Púlpito */}
        <button
          type="button"
          onClick={onOpenPulpitPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-church-parchment border border-church-sand text-church-charcoal text-xs font-title font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          title="Abrir simulação da tela do Púlpito em tempo real"
        >
          <Tablet className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
          <span>Prévia Púlpito</span>
        </button>

        {/* 4º Holyrics */}
        <button
          type="button"
          onClick={onOpenHolyricsModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-church-parchment border border-church-sand text-church-charcoal text-xs font-title font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          title="Configurar integração Holyrics"
        >
          <Tv className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
          <span>Holyrics</span>
        </button>
      </div>
    </div>
  );
};
