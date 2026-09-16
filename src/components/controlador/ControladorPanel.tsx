import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { PrayerItem, VisitorItem, ChoirItem, OpportunityItem } from '../../types/liturgy';
import { ObreiroEditor } from '../obreiro/ObreiroEditor';
import { PulpitView } from '../pastor/PulpitView';
import { Header } from '../common/Header';
import { LoadingScreen } from '../common/LoadingScreen';
import { Check, ClipboardCopy, Info, X } from 'lucide-react';
import { YoutubeSection } from './media';
import { PastoralAlertBar, ServiceMetadataBar, ResetServiceModal } from './alerts';
import { 
  formatVisitorsList, 
  formatPrayersList, 
  formatYoutubeList, 
  formatChoirsList, 
  formatOpportunitiesList, 
  formatFullLiturgy, 
  copyTextToClipboard 
} from '../../utils/liturgyExport';

export const ControladorPanel: React.FC = () => {
  const { room, blocks, isFastSync, appendItemsToBlock, removeItemFromBlock, sendAlert, resetCurrentService, updateTitle, updateCode, setPulpitPreviewActive } = useRoom();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [fullListTab, setFullListTab] = useState<'all' | 'visitors' | 'prayers' | 'youtube' | 'choirs' | 'opps'>('all');
  const [isListCopied, setIsListCopied] = useState(false);
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
      {/* MODAL DA LISTA COMPLETA DO CULTO (CONTINGÊNCIA PARA GOOGLE DOCS / BLOCO DE NOTAS) */}
      {showFullListModal && (() => {
        const visitorsList = (blocks.find(b => b.block_type === 'visitors')?.content || []) as VisitorItem[];
        const prayersList = (blocks.find(b => b.block_type === 'prayer')?.content || []) as PrayerItem[];
        const oppsList = (blocks.find(b => b.block_type === 'opportunities')?.content || []) as OpportunityItem[];
        const choirsList = (blocks.find(b => b.block_type === 'choirs')?.content || []) as ChoirItem[];

        const getSelectedTextForModal = () => {
          switch (fullListTab) {
            case 'visitors':
              return formatVisitorsList(visitorsList);
            case 'prayers':
              return formatPrayersList(prayersList);
            case 'youtube':
              return formatYoutubeList(youtubeList);
            case 'choirs':
              return formatChoirsList(choirsList.filter(c => c.checked));
            case 'opps':
              return formatOpportunitiesList(oppsList);
            default:
              return formatFullLiturgy({
                title: room.title,
                code: room.code,
                visitors: visitorsList,
                prayers: prayersList,
                youtube: youtubeList,
                choirs: choirsList.filter(c => c.checked),
                opportunities: oppsList,
              });
          }
        };

        const handleCopyModalText = async () => {
          const text = getSelectedTextForModal();
          const success = await copyTextToClipboard(text);
          if (success) {
            setIsListCopied(true);
            setTimeout(() => setIsListCopied(false), 2500);
            triggerFeedback('Copiado para a área de transferência!');
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-church-sand overflow-hidden">
              
              {/* Cabeçalho do Modal */}
              <header className="p-4 sm:p-5 bg-church-parchment border-b border-church-sand flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                    <ClipboardCopy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-title text-sm sm:text-base font-extrabold uppercase text-church-charcoal">
                      Lista Completa do Culto
                    </h3>
                    <p className="text-[11px] sm:text-xs text-church-muted mt-0.5">
                      Texto pronto para copiar e colar no Google Docs ou Bloco de Notas em caso de emergência
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullListModal(false)}
                  className="p-1.5 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-church-sand/40 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              {/* Seletor de Seções (Abas Rápidas) */}
              <div className="px-4 pt-3 pb-2 bg-white border-b border-church-sand/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => setFullListTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                    fullListTab === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
                  }`}
                >
                  📄 Tudo do Culto
                </button>
                <button
                  type="button"
                  onClick={() => setFullListTab('visitors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                    fullListTab === 'visitors'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
                  }`}
                >
                  Visitantes ({visitorsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFullListTab('prayers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                    fullListTab === 'prayers'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
                  }`}
                >
                  Orações Presenciais ({prayersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFullListTab('youtube')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                    fullListTab === 'youtube'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
                  }`}
                >
                  YouTube ({youtubeList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFullListTab('choirs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                    fullListTab === 'choirs'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
                  }`}
                >
                  Departamentos ({choirsList.filter(c => c.checked).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFullListTab('opps')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                    fullListTab === 'opps'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-church-parchment text-church-charcoal hover:bg-church-sand/50'
                  }`}
                >
                  Oportunidades ({oppsList.length})
                </button>
              </div>

              {/* Área de Visualização do Texto Formatado (Folha / Bloco de Notas) */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-church-parchment/30">
                <div className="bg-white rounded-xl border border-church-sand p-4 font-mono text-xs sm:text-sm text-church-charcoal whitespace-pre-wrap leading-relaxed shadow-xs selection:bg-emerald-100 selection:text-emerald-900 border-l-4 border-l-emerald-600">
                  {getSelectedTextForModal()}
                </div>
              </div>

              {/* Rodapé com Botão Principal de Cópia e Instrução */}
              <footer className="p-4 sm:p-5 bg-white border-t border-church-sand flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-church-muted flex items-center gap-1.5 text-center sm:text-left">
                  <Info className="w-3.5 h-3.5 text-church-muted shrink-0" />
                  <span>Basta clicar no botão e colar com <strong>Ctrl+V / Cmd+V</strong> no Google Docs ou Bloco de Notas.</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowFullListModal(false)}
                    className="w-1/3 sm:w-auto px-4 py-2.5 rounded-xl border border-church-sand font-title text-xs font-bold uppercase text-church-muted hover:text-church-charcoal hover:bg-church-parchment transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyModalText}
                    className={`w-2/3 sm:w-auto px-5 py-2.5 rounded-xl font-title text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      isListCopied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
                    }`}
                  >
                    {isListCopied ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-4 h-4 stroke-[2.5]" />
                        <span>Copiar para Área de Transferência</span>
                      </>
                    )}
                  </button>
                </div>
              </footer>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
