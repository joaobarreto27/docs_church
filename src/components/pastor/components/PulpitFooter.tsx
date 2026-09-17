import React from 'react';
import { LayoutList, BookOpen, FileText, ZoomIn, ZoomOut, LogOut } from 'lucide-react';
import { SheetLayoutMode } from '../hooks';

export interface PulpitFooterProps {
  effectiveLayout: SheetLayoutMode;
  roomTitle: string;
  fontScale: number;
  isConnected: boolean;
  isFastSync: boolean;
  hasFreshUpdates: boolean;
  isMobilePhone?: boolean;
  onToggleSheetLayout: (mode: SheetLayoutMode) => void;
  onFontChange: (delta: number) => void;
  onOpenLeaveConfirm: () => void;
}

export const PulpitFooter: React.FC<PulpitFooterProps> = ({
  effectiveLayout,
  roomTitle,
  fontScale,
  isConnected,
  isFastSync,
  hasFreshUpdates,
  isMobilePhone,
  onToggleSheetLayout,
  onFontChange,
  onOpenLeaveConfirm,
}) => {
  return (
    <footer className="bg-church-parchment/90 border-t border-church-sand/70 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs text-church-muted shrink-0 gap-2 select-none">
      {/* Esquerda: Status de Conexão Silencioso */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            !isConnected
              ? 'bg-amber-500 pulse-status'
              : hasFreshUpdates
              ? 'bg-church-gold ring-4 ring-church-gold/40 scale-125'
              : isFastSync
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-emerald-500'
          }`}
          title={
            !isConnected
              ? 'Modo offline resiliente (conteúdo salvo localmente)'
              : isFastSync
              ? 'Sincronização Rápida Ativa (2s) - Novidades recentes no culto'
              : 'Conectado em tempo real (Modo Econômico)'
          }
        />
        <span className="text-[11px] font-sans whitespace-nowrap hidden sm:inline">
          {!isConnected
            ? 'Offline (Seguro)'
            : hasFreshUpdates
            ? 'Atualizado!'
            : isFastSync
            ? 'Ao vivo ⚡ (2s)'
            : 'Sincronizado'}
        </span>
      </div>

      {/* Centro: Seletor de Visualização */}
      <div className="flex items-center gap-1 bg-white/95 p-1 rounded-xl border border-church-sand shadow-2xs">
        {/* 1º BOTÃO: 4 VISÕES */}
        <button
          type="button"
          onClick={() => onToggleSheetLayout('four-views')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
            effectiveLayout === 'four-views'
              ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
              : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
          }`}
          title="Visualização em 4 Abas Focadas (Orações, Visitantes, Oportunidades e Avisos)"
        >
          <LayoutList
            className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'four-views' ? 'text-white' : 'text-church-gold-dark'}`}
          />
          <span className="hidden xs:inline">4 Visões</span>
          {effectiveLayout === 'four-views' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
          )}
        </button>

        {/* 2º BOTÃO: PASTA ABERTA (2 folhas) */}
        {!isMobilePhone && (
          <button
            type="button"
            onClick={() => onToggleSheetLayout('two-sheets')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
              effectiveLayout === 'two-sheets'
                ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
                : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
            }`}
            title="Visualização em Pasta Aberta (2 folhas lado a lado, estilo folheto tradicional)"
          >
            <BookOpen
              className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'two-sheets' ? 'text-white' : 'text-church-gold-dark'}`}
            />
            <span className="hidden xs:inline">2 Folhas</span>
          </button>
        )}

        {/* 3º BOTÃO: FOLHA ÚNICA (contínua) */}
        <button
          type="button"
          onClick={() => onToggleSheetLayout('single-sheet')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
            effectiveLayout === 'single-sheet'
              ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
              : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
          }`}
          title="Visualização em Folha Única (leitura contínua vertical, ideal para tablet em pé)"
        >
          <FileText
            className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'single-sheet' ? 'text-white' : 'text-church-gold-dark'}`}
          />
          <span className="hidden xs:inline">Folha Única</span>
        </button>
      </div>

      {/* Direita: Controles de zoom, Nome do Culto e Botão Sair do Púlpito */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span
          className="text-xs sm:text-sm md:text-base font-serif italic font-semibold text-church-charcoal bg-white/95 px-3 py-1 rounded-lg border border-church-sand shadow-2xs truncate max-w-[170px] sm:max-w-[320px] md:max-w-[440px]"
          title={roomTitle}
        >
          {roomTitle}
        </span>

        {/* Ajuste de Tamanho da Letra para Pregadores Idosos (Zoom em passos de 10%) */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-church-sand px-1.5 sm:px-2 py-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onFontChange(-0.1)}
            className="p-1 sm:p-1.5 hover:text-church-charcoal active:scale-90 cursor-pointer"
            title="Diminuir tamanho da letra (Zoom -10%)"
            aria-label="Diminuir tamanho da letra"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-title font-bold px-1 text-church-charcoal tabular-nums min-w-[36px] text-center">
            {Math.round(fontScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onFontChange(0.1)}
            className="p-1 sm:p-1.5 hover:text-church-charcoal active:scale-90 cursor-pointer"
            title="Aumentar tamanho da letra (Zoom +10%)"
            aria-label="Aumentar tamanho da letra"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenLeaveConfirm}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white border border-transparent hover:border-church-sand transition-colors text-[11px] font-title font-medium uppercase tracking-wider cursor-pointer"
          title="Sair do Púlpito e voltar à tela inicial"
        >
          <LogOut className="w-3.5 h-3.5 text-church-muted" />
          <span>Sair</span>
        </button>
      </div>
    </footer>
  );
};
