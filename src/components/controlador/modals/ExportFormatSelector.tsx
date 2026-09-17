import React from 'react';
import { ExportFormat } from '../../../services/export';

interface ExportFormatSelectorProps {
  currentFormat: ExportFormat;
  onSelectFormat: (format: ExportFormat) => void;
}

export const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({
  currentFormat,
  onSelectFormat,
}) => {
  return (
    <div className="px-4 py-2 bg-church-parchment/40 border-b border-church-sand/60 flex items-center gap-2 shrink-0">
      <span className="text-[10px] uppercase font-bold text-church-muted tracking-wider">Formato:</span>
      <button
        type="button"
        onClick={() => onSelectFormat('plain')}
        className={`px-2.5 py-1 rounded-md text-xs font-title font-bold transition-all cursor-pointer ${
          currentFormat === 'plain'
            ? 'bg-purple-700 text-white shadow-2xs'
            : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-50'
        }`}
      >
        📄 Texto Puro
      </button>
      <button
        type="button"
        onClick={() => onSelectFormat('whatsapp')}
        className={`px-2.5 py-1 rounded-md text-xs font-title font-bold transition-all cursor-pointer ${
          currentFormat === 'whatsapp'
            ? 'bg-emerald-700 text-white shadow-2xs'
            : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
        }`}
      >
        💬 WhatsApp
      </button>
      <button
        type="button"
        onClick={() => onSelectFormat('holyrics')}
        className={`px-2.5 py-1 rounded-md text-xs font-title font-bold transition-all cursor-pointer ${
          currentFormat === 'holyrics'
            ? 'bg-blue-700 text-white shadow-2xs'
            : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-50'
        }`}
      >
        📽️ Holyrics
      </button>
    </div>
  );
};
