import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { PrayerItem } from '../../types/liturgy';
import { ObreiroEditor } from '../obreiro/ObreiroEditor';
import { Header } from '../common/Header';
import { LoadingScreen } from '../common/LoadingScreen';
import { Check } from 'lucide-react';
import { YoutubeSection } from './media';
import { PastoralAlertBar, ServiceMetadataBar, ResetServiceModal } from './alerts';
import { LiturgyExportModal, PulpitPreviewModal, ControladorHolyricsModal } from './modals';
import { ExportSection } from '../../services/export';

export const ControladorPanel: React.FC = () => {
  const { 
    room, 
    blocks, 
    isFastSync, 
    appendItemsToBlock, 
    removeItemFromBlock, 
    sendAlert, 
    resetCurrentService, 
    updateTitle, 
    updateCode, 
    updateHolyricsUrl,
    setPulpitPreviewActive 
  } = useRoom();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);
  const [showHolyricsModal, setShowHolyricsModal] = useState(false);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [fullListTab, setFullListTab] = useState<ExportSection>('all');
  const [newTitleInput, setNewTitleInput] = useState('Culto de Celebração');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Garante que o polling de 8s volte aos 30s se o componente for desmontado
  useEffect(() => {
    return () => {
      setPulpitPreviewActive(false);
    };
  }, [setPulpitPreviewActive]);

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

  const youtubeBlock = blocks.find(b => b.block_type === 'youtube');
  const youtubeList = ((youtubeBlock?.content || []) as PrayerItem[]);

  return (
    <div className="min-h-screen bg-church-parchment flex flex-col">
      <Header />

      {feedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-purple-800 text-white px-4 py-1.5 rounded-full text-xs font-title font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4" />
          {feedback}
        </div>
      )}

      {/* PAINEL DE CONTROLE MESTRE DA CABINE (BARRA SUPERIOR ROXA/OURO) */}
      <section className="bg-white border-b-2 border-purple-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          <ServiceMetadataBar
            title={room.title}
            code={room.code}
            isFastSync={isFastSync}
            onUpdateTitle={updateTitle}
            onUpdateCode={updateCode}
            onOpenFullList={() => { setFullListTab('all'); setShowFullListModal(true); }}
            onOpenPulpitPreview={() => {
              setPulpitPreviewActive(true);
              setShowPulpitPreview(true);
            }}
            onOpenResetModal={() => setShowResetModal(true)}
            onOpenHolyricsModal={() => setShowHolyricsModal(true)}
            triggerFeedback={triggerFeedback}
          />

          <PastoralAlertBar
            activeAlert={room.active_alert}
            onSendAlert={handleSendAlert}
            onClearAlert={handleClearAlert}
          />
        </div>
      </section>

      {/* SEÇÃO EXCLUSIVA DO CONTROLADOR: TRANSMISSÃO AO VIVO / YOUTUBE COM PRINTS */}
      <YoutubeSection
        youtubeList={youtubeList}
        blockId={youtubeBlock?.id}
        onAppendItems={appendItemsToBlock}
        onRemoveItem={removeItemFromBlock}
        triggerFeedback={triggerFeedback}
      />

      {/* REAPROVEITA TODA A ÁREA DE EDIÇÃO DO OBREIRO */}
      <div className="flex-1">
        <ObreiroEditor showHeader={false} />
      </div>

      {/* MODAL DE CONFIGURAÇÃO DO HOLYRICS (TELÃO) */}
      <ControladorHolyricsModal
        isOpen={showHolyricsModal}
        currentUrl={room.holyrics_url || ''}
        onClose={() => setShowHolyricsModal(false)}
        onSave={async (url) => {
          const res = await updateHolyricsUrl(url);
          if (res.success) {
            triggerFeedback(url ? 'Configuração do Holyrics salva na sala!' : 'Integração do Holyrics desativada.');
            return true;
          } else {
            triggerFeedback(res.error || 'Erro ao salvar configuração.');
            return false;
          }
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE NOVO CULTO */}
      <ResetServiceModal
        isOpen={showResetModal}
        newTitle={newTitleInput}
        onChangeNewTitle={setNewTitleInput}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
      />

      {/* MODAL DE PRÉVIA EM TEMPO REAL DO PÚLPITO (TABLET PEEK) */}
      <PulpitPreviewModal
        isOpen={showPulpitPreview}
        onClose={() => {
          setPulpitPreviewActive(false);
          setShowPulpitPreview(false);
        }}
      />

      {/* MODAL DA LISTA COMPLETA DO CULTO (EXPORTAÇÃO: DOCS, WHATSAPP, HOLYRICS) */}
      <LiturgyExportModal
        isOpen={showFullListModal}
        onClose={() => setShowFullListModal(false)}
        room={room}
        blocks={blocks}
        initialSection={fullListTab}
        onCopiedFeedback={triggerFeedback}
      />
    </div>
  );
};
