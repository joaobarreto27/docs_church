import React, { useState, useRef } from 'react';
import { useRoom } from '../../context/RoomContext';
import { PrayerItem } from '../../types/liturgy';
import { ObreiroEditor } from '../obreiro/ObreiroEditor';
import { PulpitView } from '../pastor/PulpitView';
import { Header } from '../common/Header';
import { 
  AlertTriangle, 
  Send, 
  XCircle, 
  RotateCcw, 
  Layers, 
  Check,
  Eye,
  X,
  Youtube,
  Image as ImageIcon,
  Trash2,
  Plus,
  Pencil
} from 'lucide-react';

export const ControladorPanel: React.FC = () => {
  const { room, blocks, updateBlock, sendAlert, resetCurrentService, updateTitle } = useRoom();

  const [alertInput, setAlertInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);
  const [newTitleInput, setNewTitleInput] = useState('Culto de Celebração');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Estados de edição inline do título do culto
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Estados do YouTube
  const [youtubeText, setYoutubeText] = useState('');
  const [youtubeImageBase64, setYoutubeImageBase64] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!room) return null;

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Dispara aviso ao púlpito
  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertInput.trim()) return;
    await sendAlert(alertInput.trim());
    setAlertInput('');
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

  // Salva alteração do nome do culto diretamente pelo controlador
  const handleSaveTitle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = titleDraft.trim();
    if (!clean) return;
    if (clean === room.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    try {
      await updateTitle(clean);
      setIsEditingTitle(false);
      triggerFeedback('Nome do culto atualizado!');
    } catch (err) {
      console.error(err);
      triggerFeedback('Erro ao atualizar nome do culto.');
    } finally {
      setIsSavingTitle(false);
    }
  };

  // Comprime imagem no Canvas (~30-45KB, max 600px de largura)
  const compressImageFile = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 600;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas context indisponível');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.65);
          resolve(base64);
        };
        img.onerror = () => reject('Erro ao processar imagem');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsDataURL(file);
    });
  };

  // Captura evento de Colar Print (Ctrl+V)
  const handlePasteEvent = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setIsCompressing(true);
          try {
            const compressed = await compressImageFile(file);
            setYoutubeImageBase64(compressed);
            triggerFeedback('Print capturado e otimizado com sucesso!');
          } catch (err) {
            console.error(err);
          } finally {
            setIsCompressing(false);
          }
          break;
        }
      }
    }
  };

  // Captura seleção manual de arquivo
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImageFile(file);
        setYoutubeImageBase64(compressed);
        triggerFeedback('Imagem selecionada e otimizada!');
      } catch (err) {
        console.error(err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Adiciona pedido ou print do YouTube
  const handleAddYoutubeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeText.trim() && !youtubeImageBase64) return;

    const block = blocks.find(b => b.block_type === 'youtube');
    if (!block) return;

    const current = (block.content || []) as PrayerItem[];
    const newItem: PrayerItem = {
      id: `${Date.now()}_yt`,
      description: youtubeText.trim() || 'Print da Transmissão (YouTube)',
      image_data: youtubeImageBase64 || undefined,
      created_at: Date.now(),
    };

    updateBlock(block.id, [...current, newItem]);
    setYoutubeText('');
    setYoutubeImageBase64(null);
    triggerFeedback('Pedido do YouTube transmitido ao púlpito!');
  };

  // Remove pedido ou print do YouTube
  const handleRemoveYoutubeItem = (id: string) => {
    const block = blocks.find(b => b.block_type === 'youtube');
    if (!block) return;
    const current = (block.content || []) as PrayerItem[];
    updateBlock(block.id, current.filter(p => p.id !== id));
    triggerFeedback('Pedido do YouTube removido.');
  };

  const youtubeList = ((blocks.find(b => b.block_type === 'youtube')?.content || []) as PrayerItem[]);

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
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-purple-900">
              <Layers className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <h2 className="font-title text-sm font-extrabold uppercase tracking-wide">
                  Direção do Culto — Comando da Cabine
                </h2>
                
                {/* Edição Rápida do Nome do Culto */}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-purple-700">Culto:</span>
                  {isEditingTitle ? (
                    <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={titleDraft}
                        onChange={e => setTitleDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setIsEditingTitle(false);
                        }}
                        className="text-xs font-title font-bold uppercase px-2 py-0.5 rounded border border-purple-400 bg-purple-50 text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-2xs"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isSavingTitle || !titleDraft.trim()}
                        className="p-1 rounded bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                        title="Salvar novo nome do culto"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTitleDraft(room.title);
                          setIsEditingTitle(false);
                        }}
                        className="p-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                        title="Cancelar edição"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-title text-xs font-bold text-purple-950 uppercase">
                        {room.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTitleDraft(room.title);
                          setIsEditingTitle(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 p-0.5 rounded hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                        title="Editar nome do culto"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="underline">Editar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de Prévia do Púlpito */}
              <button
                type="button"
                onClick={() => setShowPulpitPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 border border-purple-300 text-purple-900 text-xs font-title font-bold uppercase tracking-wider hover:bg-purple-200 transition-colors shadow-xs cursor-pointer"
                title="Abrir simulação da tela do Pastor em tempo real"
              >
                <Eye className="w-3.5 h-3.5 text-purple-700" />
                <span>Prévia do Púlpito</span>
              </button>

              {/* Botão Novo Culto / Limpar Folha */}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 text-purple-800 text-xs font-title font-bold uppercase tracking-wider hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Novo Culto</span>
              </button>
            </div>
          </div>

          {/* DISPARADOR DE AVISOS AO PÚLPITO */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-title text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Faixa de Aviso no Púlpito
              </span>
              {room.active_alert ? (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Aviso exibido na tela do Pastor
                </span>
              ) : (
                <span className="text-[11px] text-purple-700 font-medium">
                  Nenhum aviso ativo no momento
                </span>
              )}
            </div>

            {/* Formulário de Disparo */}
            <form onSubmit={handleSendAlert} className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Tempo restante: 5 min | Liberar o carro placa ABC-123"
                value={alertInput}
                onChange={e => setAlertInput(e.target.value)}
                className="flex-1 text-xs font-sans p-2.5 rounded-lg border border-purple-300 bg-white focus:border-purple-600 outline-none text-church-charcoal"
              />
              <button
                type="submit"
                disabled={!alertInput.trim()}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-purple-800 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Transmitir
              </button>
              {room.active_alert && (
                <button
                  type="button"
                  onClick={handleClearAlert}
                  className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Limpar
                </button>
              )}
            </form>

            {/* Pré-visualização do Aviso Ativo */}
            {room.active_alert && (
              <div className="mt-2.5 p-2 rounded-lg bg-alert-bg border border-alert-border text-alert-text text-xs font-bold font-title flex items-center justify-between">
                <span>"{room.active_alert}"</span>
                <span className="text-[10px] text-amber-800 uppercase tracking-widest">No ar</span>
              </div>
            )}
          </div>

          {/* STATUS DO PÚLPITO E MODO PASTA ABERTA (OPÇÃO 1) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-purple-200/60 mt-2">
            <div>
              <span className="text-xs font-title font-extrabold text-purple-950 uppercase tracking-wide block">
                Visualização do Púlpito (Tablet do Pastor):
              </span>
              <span className="text-[11px] text-purple-700 font-sans">
                Modo <strong className="text-purple-950 font-bold">Pasta Aberta (Folhas 1 e 2 Lado a Lado)</strong> com rolagem vertical suave (sem virada de página).
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-title font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sincronização Ativa
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO EXCLUSIVA DO CONTROLADOR: TRANSMISSÃO AO VIVO / YOUTUBE COM PRINTS */}
      <section className="max-w-4xl w-full mx-auto p-4 sm:p-6 pb-0">
        <div className="bg-white rounded-2xl border-2 border-red-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              <h3 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Transmissão ao Vivo (YouTube) — Chat & Prints
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-red-100 text-red-700">
                {youtubeList.length}
              </span>
            </div>
            <span className="text-xs font-serif italic text-church-muted hidden sm:inline">
              Área exclusiva da Cabine
            </span>
          </div>

          {/* Lista de Pedidos / Prints do YouTube */}
          {youtubeList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 max-h-72 overflow-y-auto pr-1">
              {youtubeList.map(p => (
                <div key={p.id} className="p-3 rounded-xl bg-red-50/40 border border-red-200/80 flex flex-col justify-between gap-2">
                  <div className="space-y-2">
                    {p.image_data && (
                      <div className="rounded-lg overflow-hidden border border-red-200 bg-white">
                        <img 
                          src={p.image_data} 
                          alt="Print do chat" 
                          className="w-full h-auto max-h-32 object-contain"
                        />
                      </div>
                    )}
                    <p className="text-xs font-sans font-medium text-church-charcoal leading-snug">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex justify-end pt-1 border-t border-red-100">
                    <button
                      type="button"
                      onClick={() => handleRemoveYoutubeItem(p.id)}
                      className="p-1 text-church-muted hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                      title="Excluir print/pedido"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de Envio com Captura de Print (Ctrl+V) */}
          <form onSubmit={handleAddYoutubeItem} onPaste={handlePasteEvent} className="space-y-3">
            <div 
              onPaste={handlePasteEvent}
              className="p-4 rounded-xl border-2 border-dashed border-red-300 bg-red-50/30 hover:bg-red-50/60 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept="image/*"
                className="hidden"
              />
              {youtubeImageBase64 ? (
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={youtubeImageBase64} 
                    alt="Prévia do print colado" 
                    className="max-h-28 rounded-lg border border-red-200 shadow-xs"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Print pronto para envio!
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setYoutubeImageBase64(null); }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remover print
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-title text-xs font-bold uppercase tracking-wider text-red-900">
                      Cole o Print aqui (<strong className="font-mono">Ctrl + V</strong>) ou clique para selecionar
                    </p>
                    <p className="text-[11px] text-church-muted mt-0.5">
                      Tire print do chat da live (Win+Shift+S ou Cmd+Shift+4) e dê Ctrl+V direto nesta caixa.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Texto ou Legenda do Pedido */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Legenda ou pedido em texto (Ex: Família do Irmão Marcos - Live)..."
                value={youtubeText}
                onChange={e => setYoutubeText(e.target.value)}
                onPaste={handlePasteEvent}
                className="flex-1 text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-red-500 focus:bg-white outline-none"
              />
              <button
                type="submit"
                disabled={isCompressing || (!youtubeText.trim() && !youtubeImageBase64)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Transmitir ao Púlpito</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* REAPROVEITA TODA A ÁREA DE EDIÇÃO DO OBREIRO */}
      <div className="flex-1">
        <ObreiroEditor showHeader={false} />
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE NOVO CULTO */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-church-sand p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
              Iniciar Novo Culto?
            </h3>
            <p className="font-sans text-xs text-church-muted leading-relaxed">
              Isso arquivará as anotações do culto anterior e começará uma <strong>folha limpa</strong> com o mesmo código de sala.
            </p>
            <div>
              <label className="block text-xs font-title font-bold text-church-charcoal mb-1">
                Nome do Próximo Culto:
              </label>
              <input
                type="text"
                value={newTitleInput}
                onChange={e => setNewTitleInput(e.target.value)}
                placeholder="Ex: Culto de Domingo Noite"
                className="w-full text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/50 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3 py-2 text-xs font-title font-bold uppercase text-church-muted hover:text-church-charcoal"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-church-gold text-white rounded-lg text-xs font-title font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors"
              >
                Confirmar e Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉVIA EM TEMPO REAL DO PÚLPITO (TABLET PEEK) */}
      {showPulpitPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col p-2 sm:p-6 animate-fadeIn">
          {/* Barra superior de controle da prévia */}
          <header className="flex items-center justify-between pb-3 text-white max-w-6xl w-full mx-auto shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-title text-sm font-bold uppercase tracking-wider">
                Transmissão ao Vivo — Réplica do Tablet do Pastor
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPulpitPreview(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-title font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Voltar à Edição</span>
            </button>
          </header>

          {/* Moldura do Tablet */}
          <div className="flex-1 max-w-6xl w-full mx-auto bg-church-parchment rounded-2xl overflow-hidden shadow-2xl border-4 border-stone-800 relative">
            <PulpitView />
          </div>
        </div>
      )}
    </div>
  );
};
