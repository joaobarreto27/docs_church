import React from 'react';
import { ExportSection, ExtractedLiturgy } from '../../../services/export';

interface ExportSectionTabsProps {
  currentSection: ExportSection;
  onSelectSection: (section: ExportSection) => void;
  data: ExtractedLiturgy;
}

export const ExportSectionTabs: React.FC<ExportSectionTabsProps> = ({
  currentSection,
  onSelectSection,
  data,
}) => {
  const tabs: Array<{ id: ExportSection; label: string; count?: number }> = [
    { id: 'all', label: '📄 Tudo do Culto' },
    { id: 'visitors', label: 'Visitantes', count: data.visitors.length },
    { id: 'prayers', label: 'Orações Presenciais', count: data.prayers.length },
    { id: 'youtube', label: 'YouTube', count: data.youtube.length },
    { id: 'choirs', label: 'Departamentos', count: data.choirs.length },
    { id: 'opps', label: 'Oportunidades', count: data.opportunities.length },
  ];

  return (
    <div className="px-4 pt-3 pb-2 bg-white border-b border-church-sand/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelectSection(tab.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
            currentSection === tab.id
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
          }`}
        >
          {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
        </button>
      ))}
    </div>
  );
};
