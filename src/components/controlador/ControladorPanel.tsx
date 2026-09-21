import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { Header } from '../common/Header';
import { LoadingScreen } from '../common/LoadingScreen';
import { Check } from 'lucide-react';
import { PastoralAlertBar, ServiceMetadataBar } from './alerts';
import { ControladorModalsContainer } from './modals';
import { ControladorSectionNav } from './nav';
import { ControladorLiturgyWorkspace } from './sections';
import { useControladorScrollSpy } from './hooks';
import { ExportSection } from '../../services/export';
import { BlockType } from '../../types/liturgy';

export const ControladorPanel: React.FC = () => {
  const { 
    room, 
    blocks, 
    appendItemsToBlock, 
    removeItemFromBlock, 
    updateBlock,
    sendAlert, 
    resetCurrentService, 
    updateTitle, 
    updateCode, 
    updateHolyricsUrl,
    setPulpitPreviewActive 
  } = useRoom();

  const { activeSection, scrollToSection } = useControladorScrollSpy();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [showEditCodeModal, setShowEditCodeModal] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);
  const [showHolyricsModal, setShowHolyricsModal] = useState(false);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [fullListTab, setFullListTab] = useState<ExportSection>('all');
  const [newTitleInput, setNewTitleInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'visitors' | 'prayers'; count: number } | null>(null);

  useEffect(() => () => setPulpitPreviewActive(false), [setPulpitPreviewActive]);

  if (!room) return <LoadingScreen />;

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSendAlert = async (text: string) => {
    await sendAlert(text);
    triggerFeedback('Aviso enviado ao Púlpito!');
  };
  const handleClearAlert = async () => {
    await sendAlert(null);
    triggerFeedback('Aviso removido do Púlpito.');
  };
  const handleConfirmReset = async () => {
    if (!newTitleInput.trim()) return;
    await resetCurrentService(newTitleInput.trim());
    setShowResetModal(false);
    triggerFeedback('Culto arquivado e nova folha iniciada!');
  };
  const handleSaveTitle = async (newTitle: string) => {
    await updateTitle(newTitle);
    triggerFeedback('Nome do culto atualizado!');
  };
  const handleSaveCode = async (newCode: string) => {
    const res = await updateCode(newCode);
    if (res.success) triggerFeedback(`Chave do culto alterada para ${newCode}!`);
    return res;
  };
  const handleSaveHolyrics = async (url: string | null, adminKey: string) => {
    const res = await updateHolyricsUrl(url, adminKey);
    triggerFeedback(res.success ? (url ? 'Holyrics salvo!' : 'Holyrics desativado.') : (res.error || 'Erro ao salvar.'));
    return res.success ? true : res;
  };

  const getBlockContent = (t: BlockType) => blocks.find(b => b.block_type === t)?.content || [];
  const visitorsCount = getBlockContent('visitors').length;
  const prayersCount = getBlockContent('prayer').length;
  const youtubeCount = getBlockContent('youtube').length;
  const oppsCount = getBlockContent('opportunities').length;
  const choirsCount = (getBlockContent('choirs') as any[]).filter(c => c.checked).length;

  const handleExecuteClearAll = () => {
    if (!confirmModal) return;
    const block = blocks.find(b => b.block_type === (confirmModal.type === 'visitors' ? 'visitors' : 'prayer'));
    if (block) {
      updateBlock(block.id, []);
      triggerFeedback(confirmModal.type === 'visitors' ? 'Visitantes apagados.' : 'Orações apagadas.');
    }
    setConfirmModal(null);
  };

  return (
    <div className="min-h-screen bg-church-parchment flex flex-col font-sans antialiased text-church-charcoal">
      <Header />

      {feedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-church-charcoal text-white px-4 py-1.5 rounded-full text-xs font-title font-bold flex items-center gap-2 shadow-lg animate-fadeIn border border-church-sand/30">
          <Check className="w-4 h-4 text-church-gold" />
          {feedback}
        </div>
      )}

      {/* 1. PAINEL DE CONTROLE MESTRE DA CABINE */}
      <section className="bg-white border-b border-church-sand px-3 sm:px-6 py-4 shadow-xs">
        <div className="max-w-5xl mx-auto space-y-4">
          <ServiceMetadataBar
            title={room.title}
            code={room.code}
            onOpenEditTitle={() => setShowEditTitleModal(true)}
            onOpenEditCode={() => setShowEditCodeModal(true)}
            onOpenFullList={() => { setFullListTab('all'); setShowFullListModal(true); }}
            onOpenPulpitPreview={() => {
              setPulpitPreviewActive(true);
              setShowPulpitPreview(true);
            }}
            onOpenResetModal={() => {
              setNewTitleInput(room.title);
              setShowResetModal(true);
            }}
            onOpenHolyricsModal={() => setShowHolyricsModal(true)}
          />

          <PastoralAlertBar
            activeAlert={room.active_alert}
            onSendAlert={handleSendAlert}
            onClearAlert={handleClearAlert}
          />
        </div>
      </section>

      {/* 2. NAVEGAÇÃO DE SEÇÕES DA CABINE */}
      <ControladorSectionNav
        activeSection={activeSection}
        onSelectSection={scrollToSection}
        visitorsCount={visitorsCount}
        prayersCount={prayersCount}
        youtubeCount={youtubeCount}
        musicCount={oppsCount + choirsCount}
      />

      {/* 3. ÁREA DE TRABALHO LITÚRGICA DA CABINE */}
      <ControladorLiturgyWorkspace
        room={room}
        blocks={blocks}
        onAppendItems={appendItemsToBlock}
        onRemoveItem={removeItemFromBlock}
        onUpdateBlock={updateBlock}
        onOpenMassDeletePrayers={() => setConfirmModal({ type: 'prayers', count: prayersCount })}
        triggerFeedback={triggerFeedback}
      />

      {/* 4. CONTAINER DE MODAIS DO CONTROLADOR */}
      <ControladorModalsContainer
        room={room}
        blocks={blocks}
        showHolyricsModal={showHolyricsModal}
        onCloseHolyricsModal={() => setShowHolyricsModal(false)}
        onSaveHolyrics={handleSaveHolyrics}
        showResetModal={showResetModal}
        newTitleInput={newTitleInput}
        onChangeNewTitle={setNewTitleInput}
        onCloseResetModal={() => setShowResetModal(false)}
        onConfirmReset={handleConfirmReset}
        showPulpitPreview={showPulpitPreview}
        onClosePulpitPreview={() => {
          setPulpitPreviewActive(false);
          setShowPulpitPreview(false);
        }}
        showFullListModal={showFullListModal}
        onCloseFullListModal={() => setShowFullListModal(false)}
        fullListTab={fullListTab}
        onCopiedFeedback={triggerFeedback}
        confirmModal={confirmModal}
        onCloseConfirmModal={() => setConfirmModal(null)}
        onConfirmClearAll={handleExecuteClearAll}
        showEditTitleModal={showEditTitleModal}
        onCloseEditTitleModal={() => setShowEditTitleModal(false)}
        onSaveTitle={handleSaveTitle}
        showEditCodeModal={showEditCodeModal}
        onCloseEditCodeModal={() => setShowEditCodeModal(false)}
        onSaveCode={handleSaveCode}
      />
    </div>
  );
};
