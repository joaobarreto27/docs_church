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
  const statusIndicator = (
    <div className="flex items-center gap-1.5 shrink-0">
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
        title={!isConnected ? 'Offline (Seguro)' : 'Ao vivo'}
      />
      <span className="text-[11px] font-sans whitespace-nowrap hidden sm:inline">
        {!isConnected ? 'Offline' : hasFreshUpdates ? 'Atualizado!' : isFastSync ? 'Ao vivo ⚡' : 'Sincronizado'}
      </span>
    </div>
  );

  const viewSelector = (
    <div className="flex items-center gap-1 bg-white/95 p-0.5 sm:p-1 rounded-xl border border-church-sand shadow-2xs">
      <button
        type="button"
        onClick={() => onToggleSheetLayout('four-views')}
        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
          effectiveLayout === 'four-views'
            ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
            : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
        }`}
        title="4 Visões"
      >
        <LayoutList className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${effectiveLayout === 'four-views' ? 'text-white' : 'text-church-gold-dark'}`} />
        <span>4 Visões</span>
      </button>

      {!isMobilePhone && (
        <button
          type="button"
          onClick={() => onToggleSheetLayout('two-sheets')}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
            effectiveLayout === 'two-sheets'
              ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
              : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
          }`}
          title="2 Folhas"
        >
          <BookOpen className={`w-3.5 h-3.5 shrink-0 ${effectiveLayout === 'two-sheets' ? 'text-white' : 'text-church-gold-dark'}`} />
          <span>2 Folhas</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => onToggleSheetLayout('single-sheet')}
        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-title font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
          effectiveLayout === 'single-sheet'
            ? 'bg-church-gold text-white shadow-xs border-2 border-church-gold-dark ring-2 ring-church-gold/20'
            : 'text-church-charcoal/70 hover:text-church-charcoal hover:bg-church-parchment border border-transparent'
        }`}
        title="Folha Única"
      >
        <FileText className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${effectiveLayout === 'single-sheet' ? 'text-white' : 'text-church-gold-dark'}`} />
        <span>Folha Única</span>
      </button>
    </div>
  );

  const zoomControls = (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-lg border border-church-sand px-1 sm:px-2 py-0.5 shadow-2xs">
      <button
        type="button"
        onClick={() => onFontChange(-0.1)}
        className="p-1 hover:text-church-charcoal active:scale-90 cursor-pointer"
        title="Diminuir tamanho da letra"
      >
        <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <span className="text-[10px] sm:text-xs font-title font-bold px-0.5 sm:px-1 text-church-charcoal tabular-nums min-w-[32px] sm:min-w-[36px] text-center">
        {Math.round(fontScale * 100)}%
      </span>
      <button
        type="button"
        onClick={() => onFontChange(0.1)}
        className="p-1 hover:text-church-charcoal active:scale-90 cursor-pointer"
        title="Aumentar tamanho da letra"
      >
        <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );

  const titleBadge = (
    <span
      className="text-xs sm:text-sm font-serif italic font-bold text-church-charcoal bg-white/95 px-2.5 py-0.5 sm:py-1 rounded-lg border border-church-sand shadow-2xs truncate max-w-[170px] xs:max-w-[210px] sm:max-w-[320px]"
      title={roomTitle}
    >
      {roomTitle}
    </span>
  );

  const exitButton = (
    <button
      type="button"
      onClick={onOpenLeaveConfirm}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white sm:bg-transparent text-stone-700 hover:text-red-700 hover:bg-red-50 border border-church-sand/80 sm:border-transparent transition-colors text-[11px] font-title font-bold uppercase tracking-wider cursor-pointer shrink-0 shadow-2xs sm:shadow-none"
      title="Sair do Púlpito"
    >
      <LogOut className="w-3.5 h-3.5 text-red-600 sm:text-stone-500" />
      <span>Sair</span>
    </button>
  );

  return (
    <footer className="bg-church-parchment/90 border-t border-church-sand/70 px-2 sm:px-4 py-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-church-muted shrink-0 gap-1.5 sm:gap-2 select-none">
      {/* VISÃO DESKTOP / TABLET (1 linha fluida) */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {statusIndicator}
        {viewSelector}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {titleBadge}
          {zoomControls}
          {exitButton}
        </div>
      </div>

      {/* VISÃO MOBILE (2 linhas organizadas: Linha 1 = Layout + Zoom; Linha 2 = Título no Canto Inferior Esquerdo e Sair no Canto Direito) */}
      <div className="flex sm:hidden items-center justify-between gap-1 w-full">
        {viewSelector}
        {zoomControls}
      </div>
      <div className="flex sm:hidden items-center justify-between gap-2 w-full pt-1 border-t border-church-sand/40">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {statusIndicator}
          {titleBadge}
        </div>
        {exitButton}
      </div>
    </footer>
  );
};
