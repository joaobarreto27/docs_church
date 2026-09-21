import React from 'react';
import { Room, LiturgicalBlock, VisitorItem, PrayerItem, ChoirItem, OpportunityItem, BlockType } from '../../../types/liturgy';
import { VisitorsEditorSection, PrayersEditorSection } from '../../obreiro/sections';
import { YoutubeSection } from '../media';
import { ControladorMusicalGrid } from './ControladorMusicalGrid';

interface ControladorLiturgyWorkspaceProps {
  room: Room;
  blocks: LiturgicalBlock[];
  onAppendItems: (blockId: string, items: any[]) => void;
  onRemoveItem: (blockId: string, id: string) => void;
  onUpdateBlock: (blockId: string, content: any[]) => void;
  onOpenMassDeletePrayers: () => void;
  triggerFeedback: (msg: string) => void;
}

export const ControladorLiturgyWorkspace: React.FC<ControladorLiturgyWorkspaceProps> = ({
  room,
  blocks,
  onAppendItems,
  onRemoveItem,
  onUpdateBlock,
  onOpenMassDeletePrayers,
  triggerFeedback,
}) => {
  const getBlock = (type: BlockType) => blocks.find(b => b.block_type === type);
  const visitorsBlock = getBlock('visitors');
  const prayerBlock = getBlock('prayer');
  const youtubeBlock = getBlock('youtube');
  const choirsBlock = getBlock('choirs');
  const oppsBlock = getBlock('opportunities');

  const visitorsList = (visitorsBlock?.content || []) as VisitorItem[];
  const prayersList = (prayerBlock?.content || []) as PrayerItem[];
  const youtubeList = (youtubeBlock?.content || []) as PrayerItem[];
  const choirsList = (choirsBlock?.content || []) as ChoirItem[];
  const oppsList = (oppsBlock?.content || []) as OpportunityItem[];

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-6">
      {/* 1. Seção de Visitantes */}
      <div id="section-visitors" className="scroll-mt-16">
        <VisitorsEditorSection
          visitorsList={visitorsList}
          blockId={visitorsBlock?.id || ''}
          role="controlador"
          draftKey={`docs_church_draft_visitors_${room.id}`}
          draftFallbackKey={`docs_church_draft_visitors_${room.code}`}
          onAppendItems={onAppendItems}
          onRemoveItem={onRemoveItem}
          onUpdateBlock={onUpdateBlock}
          showFeedback={triggerFeedback}
        />
      </div>

      {/* 2. Seção de Pedidos de Oração Presenciais */}
      <div id="section-prayers" className="scroll-mt-16">
        <PrayersEditorSection
          prayersList={prayersList}
          blockId={prayerBlock?.id || ''}
          role="controlador"
          draftKey={`docs_church_draft_prayers_${room.id}`}
          draftFallbackKey={`docs_church_draft_prayers_${room.code}`}
          onAppendItems={onAppendItems}
          onRemoveItem={onRemoveItem}
          onUpdateBlock={onUpdateBlock}
          onOpenMassDeleteModal={onOpenMassDeletePrayers}
          showFeedback={triggerFeedback}
        />
      </div>

      {/* 3. Seção de Transmissão ao Vivo (YouTube Live & Prints) */}
      <div id="section-youtube" className="scroll-mt-16">
        <YoutubeSection
          youtubeList={youtubeList}
          blockId={youtubeBlock?.id}
          onAppendItems={onAppendItems}
          onRemoveItem={onRemoveItem}
          triggerFeedback={triggerFeedback}
        />
      </div>

      {/* 4. Programação Musical em 2 Colunas Lado a Lado (Departamentos & Oportunidades) */}
      <ControladorMusicalGrid
        choirsList={choirsList}
        choirsBlockId={choirsBlock?.id || ''}
        onAppendChoirItems={onAppendItems}
        onUpdateChoirsBlock={onUpdateBlock}
        oppsList={oppsList}
        oppsBlockId={oppsBlock?.id || ''}
        oppsDraftKey={`docs_church_draft_opps_${room.id}`}
        oppsDraftFallbackKey={`docs_church_draft_opps_${room.code}`}
        onAppendOppItems={onAppendItems}
        onRemoveOppItem={onRemoveItem}
        onUpdateOppsBlock={onUpdateBlock}
        showFeedback={triggerFeedback}
      />
    </main>
  );
};
