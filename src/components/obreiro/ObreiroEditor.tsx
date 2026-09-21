import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { VisitorItem, PrayerItem, ChoirItem, OpportunityItem, BlockType } from '../../types/liturgy';
import { Header } from '../common/Header';
import { Check } from 'lucide-react';
import { useObreiroScrollSpy } from './hooks';
import { 
  ObreiroSectionNav, 
  ConfirmMassDeleteModal, 
  PulpitConfirmModal, 
  PulpitPreviewModal 
} from './components';
import {
  VisitorsEditorSection,
  PrayersEditorSection,
  ChoirsChecklistSection,
  OpportunitiesEditorSection
} from './sections';

interface ObreiroEditorProps {
  showHeader?: boolean;
}

export const ObreiroEditor: React.FC<ObreiroEditorProps> = ({ showHeader = true }) => {
  const { 
    room, 
    blocks, 
    updateBlock, 
    appendItemsToBlock, 
    removeItemFromBlock, 
    role, 
    setPulpitPreviewActive,
    isConnected,
    isFastSync
  } = useRoom();
  const { activeSection, scrollToSection } = useObreiroScrollSpy(role);

  const [showPulpitConfirm, setShowPulpitConfirm] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'visitors' | 'prayers'; count: number } | null>(null);

  useEffect(() => {
    return () => { setPulpitPreviewActive(false); };
  }, [setPulpitPreviewActive]);

  const showFeedback = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  const getBlock = (type: BlockType) => blocks.find(b => b.block_type === type);

  const handleExecuteClearAll = () => {
    if (!confirmModal) return;
    const block = getBlock(confirmModal.type === 'visitors' ? 'visitors' : 'prayer');
    if (block) {
      updateBlock(block.id, []);
      showFeedback(confirmModal.type === 'visitors' ? 'Todos os visitantes foram apagados.' : 'Todos os pedidos de oração foram apagados.');
    }
    setConfirmModal(null);
  };

  const visitorsBlock = getBlock('visitors');
  const prayerBlock = getBlock('prayer');
  const oppsBlock = getBlock('opportunities');
  const choirsBlock = getBlock('choirs');

  const visitorsList = (visitorsBlock?.content || []) as VisitorItem[];
  const prayersList = (prayerBlock?.content || []) as PrayerItem[];
  const oppsList = (oppsBlock?.content || []) as OpportunityItem[];
  const choirsList = (choirsBlock?.content || []) as ChoirItem[];

  return (
    <div className={`${showHeader ? 'min-h-screen' : ''} bg-church-parchment flex flex-col`}>
      {showHeader && <Header onOpenPulpitPreview={() => setShowPulpitConfirm(true)} />}

      {savedSuccess && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-title font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4" />
          {savedSuccess}
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <ObreiroSectionNav
          activeSection={activeSection}
          onSelectSection={scrollToSection}
          visitorsCount={visitorsList.length}
          prayersCount={prayersList.length}
          oppsCount={oppsList.length}
          choirsCount={choirsList.filter(c => c.checked).length}
          role={role}
        />

        <VisitorsEditorSection
          visitorsList={visitorsList}
          blockId={visitorsBlock?.id || ''}
          role={role}
          draftKey={room ? `docs_church_draft_visitors_${room.id}` : ''}
          draftFallbackKey={room ? `docs_church_draft_visitors_${room.code}` : ''}
          onAppendItems={appendItemsToBlock}
          onRemoveItem={removeItemFromBlock}
          onUpdateBlock={updateBlock}
          showFeedback={showFeedback}
        />

        <PrayersEditorSection
          prayersList={prayersList}
          blockId={prayerBlock?.id || ''}
          role={role}
          draftKey={room ? `docs_church_draft_prayers_${room.id}` : ''}
          draftFallbackKey={room ? `docs_church_draft_prayers_${room.code}` : ''}
          onAppendItems={appendItemsToBlock}
          onRemoveItem={removeItemFromBlock}
          onUpdateBlock={updateBlock}
          onOpenMassDeleteModal={() => setConfirmModal({ type: 'prayers', count: prayersList.length })}
          showFeedback={showFeedback}
        />

        {role === 'controlador' && (
          <ChoirsChecklistSection
            choirsList={choirsList}
            blockId={choirsBlock?.id || ''}
            onAppendItems={appendItemsToBlock}
            onUpdateBlock={updateBlock}
            showFeedback={showFeedback}
          />
        )}

        <OpportunitiesEditorSection
          oppsList={oppsList}
          blockId={oppsBlock?.id || ''}
          role={role}
          draftKey={room ? `docs_church_draft_opps_${room.id}` : ''}
          draftFallbackKey={room ? `docs_church_draft_opps_${room.code}` : ''}
          onAppendItems={appendItemsToBlock}
          onRemoveItem={removeItemFromBlock}
          onUpdateBlock={updateBlock}
          showFeedback={showFeedback}
        />

        <ConfirmMassDeleteModal
          isOpen={Boolean(confirmModal)}
          modalData={confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleExecuteClearAll}
        />

        <PulpitConfirmModal
          isOpen={showPulpitConfirm}
          onClose={() => setShowPulpitConfirm(false)}
          onConfirm={() => {
            setShowPulpitConfirm(false);
            setPulpitPreviewActive(true);
            setShowPulpitPreview(true);
          }}
        />

        <PulpitPreviewModal
          isOpen={showPulpitPreview}
          onClose={() => {
            setPulpitPreviewActive(false);
            setShowPulpitPreview(false);
          }}
        />

        {/* Rodapé Sutil de Informação de Conexão no Mobile */}
        <footer className="sm:hidden text-center py-6 text-[10px] font-mono text-church-muted flex items-center justify-center gap-1.5 opacity-70">
          <span className={`w-1.5 h-1.5 rounded-full ${!isConnected ? 'bg-amber-500' : isFastSync ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>
            {!isConnected
              ? 'Modo Offline (Gravado localmente)'
              : isFastSync
              ? 'Sincronização Rápida (2.5s)'
              : 'Sincronizado (6s)'}
          </span>
        </footer>
      </main>
    </div>
  );
};
