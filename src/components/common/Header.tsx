import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { LogOut, RefreshCw, Tablet, X } from 'lucide-react';

interface HeaderProps {
  minimal?: boolean; // Se true, esconde botões para a visão do púlpito
  onOpenPulpitPreview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ minimal = false, onOpenPulpitPreview }) => {
  const { room, role, isConnected, isFastSync, hasFreshUpdates, leaveRoom, refreshData } = useRoom();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  if (!room) return null;

  return (
    <>
      <header className="bg-church-parchment border-b border-church-sand px-3 py-2 flex items-center justify-between gap-3 shrink-0">
        {/* Logotipo Oficial Horizontal & Título */}
        <div className="flex items-center gap-3">
          <img 
            src="/assets/logo-adutinga-horizontal.png" 
            alt="A.D. Utinga" 
            className="h-7 sm:h-8 w-auto object-contain"
          />
          <div className="hidden sm:block border-l border-church-sand pl-3">
            <h1 className="font-title text-xs sm:text-sm font-bold tracking-tight text-church-charcoal uppercase">
              {room.title}
            </h1>
            <p className="font-sans text-[10px] text-church-muted">
              Código: <strong className="text-church-gold-dark font-mono tracking-wider">{room.code}</strong>
            </p>
          </div>
        </div>

        {/* Controles de Status e Papel */}
        <div className="flex items-center gap-2">
          {/* Indicador de Status da Conexão */}
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/70 border border-church-sand text-[11px] font-medium transition-all"
            title={
              !isConnected 
                ? 'Sem internet - exibindo cópia local offline' 
                : isFastSync 
                  ? 'Sincronização Rápida Ativa (2s) - Novidades recentes no culto' 
                  : 'Conectado em tempo real (Modo Econômico)'
            }
          >
            {isConnected ? (
              <>
                <span 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    hasFreshUpdates 
                      ? 'bg-church-gold ring-4 ring-church-gold/40 scale-125' 
                      : isFastSync 
                        ? 'bg-emerald-500 animate-pulse' 
                        : 'bg-emerald-500'
                  }`} 
                />
                <span className="hidden md:inline text-emerald-700 font-medium">
                  {hasFreshUpdates ? 'Atualizado!' : isFastSync ? 'Ao vivo ⚡' : 'Ao vivo'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden md:inline text-amber-700">Offline (Cache)</span>
              </>
            )}
          </div>

          {/* Botão Sincronizar Manual para o Obreiro (Tablet Anotador) */}
          {role === 'obreiro' && !minimal && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white border border-transparent hover:border-church-sand transition-colors text-xs font-title font-semibold uppercase tracking-wider cursor-pointer"
              title="Sincronizar anotações com o servidor agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-church-gold-dark ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          )}

          {/* Botão Ver Púlpito (Para alternar facilmente quando houver um tablet compartilhado) */}
          {role === 'obreiro' && !minimal && onOpenPulpitPreview && (
            <button
              type="button"
              onClick={onOpenPulpitPreview}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-church-gold/15 hover:bg-church-gold/25 text-church-charcoal border border-church-gold/40 transition-colors text-xs font-title font-bold uppercase tracking-wider cursor-pointer shadow-2xs"
              title="Abrir pré-visualização da tela do Púlpito"
            >
              <Tablet className="w-3.5 h-3.5 text-church-gold-dark shrink-0" />
              <span className="text-[11px]">Púlpito</span>
            </button>
          )}

          {/* Papel Ativo */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-title font-bold uppercase tracking-wider ${
            role === 'pastor' 
              ? 'bg-church-gold/15 text-church-gold-dark border border-church-gold/30'
              : role === 'controlador'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {role === 'pastor' ? 'Púlpito' : role === 'controlador' ? 'Controlador' : 'Obreiro'}
          </span>

          {/* Botão Sair da Sala com Confirmação Blindada */}
          {!minimal && (
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white border border-transparent hover:border-church-sand transition-colors text-xs font-title font-semibold uppercase tracking-wider cursor-pointer"
              title="Sair do Culto e voltar à tela inicial"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </header>

      {/* MODAL DE CONFIRMAÇÃO DE SAÍDA DA SALA (PROTEÇÃO PARA OBREIROS E CONTROLADORES) */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-church-parchment border border-church-sand flex items-center justify-center text-church-charcoal shrink-0">
                <LogOut className="w-5 h-5 text-church-charcoal" />
              </div>
              <div>
                <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
                  Deseja Sair da Sala?
                </h3>
                <p className="font-sans text-xs text-church-muted mt-0.5">
                  Voltar para a tela inicial de acesso ao culto
                </p>
              </div>
            </div>

            <div className="p-3 bg-church-parchment/70 border border-church-sand rounded-xl text-xs text-church-charcoal leading-relaxed">
              <p className="font-medium">
                Você sairá da tela de {role === 'controlador' ? 'Controlador' : 'Obreiro'} e retornará ao início.
              </p>
              <p className="mt-1 text-[11px] text-church-muted">
                As anotações e pedidos continuam salvos com segurança no sistema.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-church-sand/50">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-title text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 border border-red-700"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Cancelar / Continuar no Culto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  leaveRoom();
                }}
                className="px-4 py-2.5 rounded-xl border border-church-sand text-church-charcoal hover:bg-church-parchment font-title text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-church-muted" />
                <span>Sim, Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
