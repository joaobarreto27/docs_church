import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { ObreiroEditor } from '../obreiro/ObreiroEditor';
import { 
  AlertTriangle, 
  Send, 
  XCircle, 
  RotateCcw, 
  Layers, 
  Check 
} from 'lucide-react';

export const ControladorPanel: React.FC = () => {
  const { room, sendAlert, setPage, resetCurrentService } = useRoom();

  const [alertInput, setAlertInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [newTitleInput, setNewTitleInput] = useState('Culto de Celebração');
  const [feedback, setFeedback] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-church-parchment flex flex-col">
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900">
              <Layers className="w-5 h-5 text-purple-700" />
              <h2 className="font-title text-sm font-extrabold uppercase tracking-wide">
                Direção do Culto — Comando da Cabine
              </h2>
            </div>

            {/* Botão Novo Culto / Limpar Folha */}
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 text-purple-800 text-xs font-title font-bold uppercase tracking-wider hover:bg-purple-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Iniciar Novo Culto
            </button>
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
                className="px-4 py-2 bg-purple-700 text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-purple-800 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Transmitir
              </button>
              {room.active_alert && (
                <button
                  type="button"
                  onClick={handleClearAlert}
                  className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors shrink-0 flex items-center gap-1"
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

          {/* CONTROLE REMOTO DA PÁGINA ATIVA */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-title font-bold text-church-charcoal uppercase">
              Controle Remoto de Folha:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider border transition-all ${
                  room.current_page === 1
                    ? 'bg-church-gold text-white border-church-gold-dark shadow-sm'
                    : 'bg-white text-church-charcoal border-church-sand hover:bg-church-parchment'
                }`}
              >
                Folha 1 (Orações)
              </button>
              <button
                type="button"
                onClick={() => setPage(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider border transition-all ${
                  room.current_page === 2
                    ? 'bg-church-gold text-white border-church-gold-dark shadow-sm'
                    : 'bg-white text-church-charcoal border-church-sand hover:bg-church-parchment'
                }`}
              >
                Folha 2 (Conjuntos)
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* REAPROVEITA TODA A ÁREA DE EDIÇÃO DO OBREIRO */}
      <div className="flex-1">
        <ObreiroEditor />
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
    </div>
  );
};
