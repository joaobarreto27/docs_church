import React from 'react';
import { ChoirItem, OpportunityItem } from '../../../types/liturgy';
import { ChoirsChecklistSection, OpportunitiesEditorSection } from '../../obreiro/sections';

interface ControladorMusicalGridProps {
  choirsList: ChoirItem[];
  choirsBlockId: string;
  onAppendChoirItems: (blockId: string, items: ChoirItem[]) => void;
  onUpdateChoirsBlock: (blockId: string, content: ChoirItem[]) => void;
  oppsList: OpportunityItem[];
  oppsBlockId: string;
  oppsDraftKey: string;
  oppsDraftFallbackKey: string;
  onAppendOppItems: (blockId: string, items: OpportunityItem[]) => void;
  onRemoveOppItem: (blockId: string, id: string) => void;
  onUpdateOppsBlock: (blockId: string, content: OpportunityItem[]) => void;
  showFeedback: (msg: string) => void;
}

export const ControladorMusicalGrid: React.FC<ControladorMusicalGridProps> = ({
  choirsList,
  choirsBlockId,
  onAppendChoirItems,
  onUpdateChoirsBlock,
  oppsList,
  oppsBlockId,
  oppsDraftKey,
  oppsDraftFallbackKey,
  onAppendOppItems,
  onRemoveOppItem,
  onUpdateOppsBlock,
  showFeedback,
}) => {
  return (
    <div id="section-music" className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start scroll-mt-16">
      {/* 1. Coluna Esquerda: Departamentos do Culto (Conjuntos e Grupos) */}
      <ChoirsChecklistSection
        choirsList={choirsList}
        blockId={choirsBlockId}
        onAppendItems={onAppendChoirItems}
        onUpdateBlock={onUpdateChoirsBlock}
        showFeedback={showFeedback}
      />

      {/* 2. Coluna Direita: Oportunidades & Cantores Individuais */}
      <OpportunitiesEditorSection
        oppsList={oppsList}
        blockId={oppsBlockId}
        role="controlador"
        draftKey={oppsDraftKey}
        draftFallbackKey={oppsDraftFallbackKey}
        onAppendItems={onAppendOppItems}
        onRemoveItem={onRemoveOppItem}
        onUpdateBlock={onUpdateOppsBlock}
        showFeedback={showFeedback}
      />
    </div>
  );
};
