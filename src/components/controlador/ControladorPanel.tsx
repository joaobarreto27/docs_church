import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { PrayerItem } from '../../types/liturgy';
import { ObreiroEditor } from '../obreiro/ObreiroEditor';
import { PulpitView } from '../pastor/PulpitView';
import { Header } from '../common/Header';
import { LoadingScreen } from '../common/LoadingScreen';
import { Check, X } from 'lucide-react';
import { YoutubeSection } from './media';
import { PastoralAlertBar, ServiceMetadataBar, ResetServiceModal } from './alerts';
import { LiturgyExportModal } from './modals';
import { ExportSection } from '../../services/export';

export const ControladorPanel: React.FC = () => {
  const { room, blocks, isFastSync, appendItemsToBlock, removeItemFromBlock, sendAlert, resetCurrentService, updateTitle, updateCode, setPulpitPreviewActive } = useRoom();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [fullListTab, setFullListTab] = useState<ExportSection>('all');
  const [newTitleInput, setNewTitleInput] = useState('Culto de Celebração');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Garante que o polling de 8s volte aos 30s se o componente for desmontado
  React.useEffect(() => {
    return () => {
      setPulpitPreviewActive(false);
    };
  }, [setPulpitPreviewActive]);

  if (!room) return <LoadingScreen />;

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Dispara aviso ao púlpito
  const handleSendAlert = async (text: string) => {
    await sendAlert(text);
    triggerFeedback('Aviso enviado ao Púlpito!');
  };

  // Limpa o aviso ativo
  const handleClearAlert = async () => {
    await sendAlert(null);
    triggerFeedback('Aviso removido do Púlpito.');
  };

  // Executa reset para novo culto
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
      {/* Barra de Cabeçalho Oficial no Topo */}
      <Header />

      {/* Toast Feedback */}
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

      {/* MODAL DE CONFIRMAÇÃO DE NOVO CULTO */}
      <ResetServiceModal
        isOpen={showResetModal}
        newTitle={newTitleInput}
        onChangeNewTitle={setNewTitleInput}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
      />

      {/* MODAL DE PRÉVIA EM TEMPO REAL DO PÚLPITO (TABLET PEEK) */}
      {showPulpitPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col p-2 sm:p-4 animate-fadeIn">
          {/* Barra superior de controle da prévia */}
          <header className="flex items-center justify-between pb-2 text-white max-w-[97vw] w-full mx-auto shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-title text-sm font-bold uppercase tracking-wider">
                Transmissão ao Vivo — Réplica do Púlpito
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setPulpitPreviewActive(false);
                setShowPulpitPreview(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-title font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/40 shadow-xs"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Voltar à Edição</span>
            </button>
          </header>

          {/* Moldura do Tablet */}
          <div className="flex-1 max-w-[97vw] w-full mx-auto bg-church-parchment rounded-2xl overflow-hidden shadow-2xl border-4 border-stone-800 relative flex flex-col min-h-0">
            <PulpitView />
          </div>
        </div>
      )}
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
