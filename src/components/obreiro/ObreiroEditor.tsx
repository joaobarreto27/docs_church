import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import { 
  VisitorItem, 
  PrayerItem, 
  ChoirItem, 
  OpportunityItem,
  BlockType
} from '../../types/liturgy';
import { Header } from '../common/Header';
import { PulpitView } from '../pastor/PulpitView';
import { 
  UserPlus, 
  HeartHandshake, 
  Mic2, 
  Users, 
  Check,
  AlertTriangle,
  X,
  Tablet
} from 'lucide-react';
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
  const { room, blocks, updateBlock, appendItemsToBlock, removeItemFromBlock, role, setPulpitPreviewActive } = useRoom();

  const draftVisitorKey = room ? `docs_church_draft_visitors_${room.id}` : '';
  const draftVisitorFallbackKey = room ? `docs_church_draft_visitors_${room.code}` : '';
  const draftPrayerKey = room ? `docs_church_draft_prayers_${room.id}` : '';
  const draftPrayerFallbackKey = room ? `docs_church_draft_prayers_${room.code}` : '';
  const draftOppKey = room ? `docs_church_draft_opps_${room.id}` : '';
  const draftOppFallbackKey = room ? `docs_church_draft_opps_${room.code}` : '';

  // Estados de Navegação Rápida entre Seções (com destaque ativo da sessão atual)
  const [activeSection, setActiveSection] = useState<'visitors' | 'prayers' | 'opps' | 'choirs'>('visitors');

  // Estados de Prévia do Púlpito (Protegida contra toques acidentais para idosos)
  const [showPulpitConfirm, setShowPulpitConfirm] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);

  // Notificação flutuante de feedback
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const showFeedback = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  // Modal de Confirmação para Exclusão em Massa (Controlador)
  const [confirmModal, setConfirmModal] = useState<{ type: 'visitors' | 'prayers'; count: number } | null>(null);

  // Garante que o polling de 8s volte aos 30s se o componente for desmontado
  useEffect(() => {
    return () => {
      setPulpitPreviewActive(false);
    };
  }, [setPulpitPreviewActive]);

  // Rastreia a seção visível na tela durante o scroll do operador
  useEffect(() => {
    const sectionIds = ['section-visitors', 'section-prayers', 'section-opportunities'];
    if (role === 'controlador') sectionIds.push('section-choirs');

    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 140;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            if (id === 'section-visitors') setActiveSection('visitors');
            else if (id === 'section-prayers') setActiveSection('prayers');
            else if (id === 'section-opportunities') setActiveSection('opps');
            else if (id === 'section-choirs') setActiveSection('choirs');
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [role]);

  const scrollToSection = (id: string, sectionKey: 'visitors' | 'prayers' | 'opps' | 'choirs') => {
    setActiveSection(sectionKey);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getBlock = (type: BlockType) => blocks.find(b => b.block_type === type);

  const handleExecuteClearAll = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'visitors') {
      const block = getBlock('visitors');
      if (block) {
        updateBlock(block.id, []);
        showFeedback('Todos os visitantes foram apagados.');
      }
    } else if (confirmModal.type === 'prayers') {
      const block = getBlock('prayer');
      if (block) {
        updateBlock(block.id, []);
        showFeedback('Todos os pedidos de oração foram apagados.');
      }
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

      {/* Notificação Flutuante de Feedback */}
      {savedSuccess && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-title font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4" />
          {savedSuccess}
        </div>
      )}

      {/* Conteúdo Principal do Editor */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ================= BARRA DE NAVEGAÇÃO STICKY (ACESSO RÁPIDO SEM SCROLL FATIGUE) ================= */}
        <nav 
          aria-label="Navegação rápida do formulário"
          className="sticky top-0 z-30 bg-church-parchment/95 backdrop-blur-md py-2 px-1 -mx-2 sm:-mx-4 border-b border-church-sand/80 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-1 sm:gap-2 max-w-4xl mx-auto w-full">
            {/* 1. Visitantes */}
            <button
              type="button"
              onClick={() => scrollToSection('section-visitors', 'visitors')}
              className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
                activeSection === 'visitors'
                  ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
                  : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
              }`}
            >
              <UserPlus className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeSection === 'visitors' ? 'text-white' : 'text-church-gold-dark'}`} />
              <span className="truncate">Visitantes</span>
              <span className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
                activeSection === 'visitors' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}>
                {visitorsList.length}
              </span>
              {activeSection === 'visitors' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
              )}
            </button>

            {/* 2. Pedidos de Oração */}
            <button
              type="button"
              onClick={() => scrollToSection('section-prayers', 'prayers')}
              className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
                activeSection === 'prayers'
                  ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
                  : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
              }`}
            >
              <HeartHandshake className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeSection === 'prayers' ? 'text-white' : 'text-church-gold-dark'}`} />
              <span className="truncate">Orações</span>
              <span className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
                activeSection === 'prayers' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}>
                {prayersList.length}
              </span>
              {activeSection === 'prayers' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
              )}
            </button>

            {/* 3. Oportunidades e Louvores */}
            <button
              type="button"
              onClick={() => scrollToSection('section-opportunities', 'opps')}
              className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
                activeSection === 'opps'
                  ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
                  : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
              }`}
            >
              <Mic2 className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeSection === 'opps' ? 'text-white' : 'text-church-gold-dark'}`} />
              <span className="truncate">Louvores</span>
              <span className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
                activeSection === 'opps' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
              }`}>
                {oppsList.length}
              </span>
              {activeSection === 'opps' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
              )}
            </button>

            {/* 4. Departamentos (Checklist dos Conjuntos - Exclusivo do Controlador) */}
            {role === 'controlador' && (
              <button
                type="button"
                onClick={() => scrollToSection('section-choirs', 'choirs')}
                className={`flex-1 inline-flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2 px-1 xs:px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-title font-black uppercase tracking-tighter xs:tracking-tight sm:tracking-wider transition-all cursor-pointer min-h-[42px] sm:min-h-[44px] select-none ${
                  activeSection === 'choirs'
                    ? 'bg-church-gold text-white shadow-md border-2 border-church-gold-dark ring-2 ring-church-gold/30 scale-[1.02]'
                    : 'bg-white text-church-charcoal hover:bg-church-sand/40 border border-church-sand'
                }`}
              >
                <Users className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeSection === 'choirs' ? 'text-white' : 'text-church-gold-dark'}`} />
                <span className="truncate">Grupos</span>
                <span className={`px-1 py-0.2 rounded-full text-[9px] xs:text-[10px] font-mono font-bold leading-none ${
                  activeSection === 'choirs' ? 'bg-white/25 text-white' : 'bg-church-sand/80 text-church-charcoal'
                }`}>
                  {choirsList.filter(c => c.checked).length}
                </span>
                {activeSection === 'choirs' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 hidden sm:inline-block" />
                )}
              </button>
            )}
          </div>
        </nav>

        {/* 1. SEÇÃO DE VISITANTES */}
        <VisitorsEditorSection
          visitorsList={visitorsList}
          blockId={visitorsBlock?.id || ''}
          role={role}
          draftKey={draftVisitorKey}
          draftFallbackKey={draftVisitorFallbackKey}
          onAppendItems={appendItemsToBlock}
          onRemoveItem={removeItemFromBlock}
          onUpdateBlock={updateBlock}
          showFeedback={showFeedback}
        />

        {/* 2. SEÇÃO DE PEDIDOS DE ORAÇÃO */}
        <PrayersEditorSection
          prayersList={prayersList}
          blockId={prayerBlock?.id || ''}
          role={role}
          draftKey={draftPrayerKey}
          draftFallbackKey={draftPrayerFallbackKey}
          onAppendItems={appendItemsToBlock}
          onRemoveItem={removeItemFromBlock}
          onUpdateBlock={updateBlock}
          onOpenMassDeleteModal={() => setConfirmModal({ type: 'prayers', count: prayersList.length })}
          showFeedback={showFeedback}
        />

        {/* 3. SEÇÃO DE DEPARTAMENTOS / CONJUNTOS (CONTROLADOR) */}
        {role === 'controlador' && (
          <ChoirsChecklistSection
            choirsList={choirsList}
            blockId={choirsBlock?.id || ''}
            onAppendItems={appendItemsToBlock}
            onUpdateBlock={updateBlock}
            showFeedback={showFeedback}
          />
        )}

        {/* 4. SEÇÃO DE OPORTUNIDADES */}
        <OpportunitiesEditorSection
          oppsList={oppsList}
          blockId={oppsBlock?.id || ''}
          role={role}
          draftKey={draftOppKey}
          draftFallbackKey={draftOppFallbackKey}
          onAppendItems={appendItemsToBlock}
          onRemoveItem={removeItemFromBlock}
          onUpdateBlock={updateBlock}
          showFeedback={showFeedback}
        />

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO EM MASSA (DIREÇÃO / CONTROLADOR) */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-church-sand p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
                  {confirmModal.type === 'visitors' 
                    ? 'Apagar Todos os Visitantes?' 
                    : 'Apagar Todos os Pedidos?'}
                </h3>
                <p className="font-sans text-xs text-church-muted leading-relaxed">
                  Tem certeza que deseja apagar todos os{' '}
                  <strong className="text-church-charcoal font-bold">
                    {confirmModal.count} {confirmModal.type === 'visitors' ? 'visitantes' : 'pedidos de oração'}
                  </strong>{' '}
                  cadastrados?
                  <br />
                  <span className="text-red-600 font-medium">Esta ação apagará imediatamente a lista do púlpito.</span>
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 text-xs font-title font-bold uppercase rounded-xl border border-church-sand text-church-charcoal hover:bg-church-parchment transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClearAll}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-title font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                >
                  Sim, Apagar Tudo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO PARA O IDOSO NÃO ENTRAR POR ENGANO */}
        {showPulpitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-church-gold/15 flex items-center justify-center text-church-gold-dark shrink-0">
                  <Tablet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-title text-base font-bold text-church-charcoal">
                    Visualizar Tela do Púlpito?
                  </h3>
                  <p className="font-sans text-xs text-church-muted mt-0.5">
                    Alternar para a visualização do púlpito
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <p className="font-medium">
                  Esta tela mostrará a visualização oficial do Púlpito.
                </p>
                <p className="mt-1 text-[11px] text-amber-800">
                  • Suas anotações continuam salvas intactas.<br />
                  • Para voltar, haverá um botão vermelho bem visível no topo da tela.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-church-sand/50">
                <button
                  type="button"
                  onClick={() => setShowPulpitConfirm(false)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-title text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 border border-red-700"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Cancelar / Ficar Aqui</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPulpitConfirm(false);
                    setPulpitPreviewActive(true);
                    setShowPulpitPreview(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-church-gold hover:bg-church-gold-dark text-church-charcoal border border-church-gold-dark/40 font-title text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Tablet className="w-4 h-4" />
                  <span>Sim, Ver Púlpito</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE PRÉVIA EM TEMPO REAL DO PÚLPITO (ESPELHO COM RETORNO BLINDADO) */}
        {showPulpitPreview && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex flex-col p-1.5 sm:p-4 animate-fadeIn">
            {/* Barra superior de saída ultra-visível para idosos */}
            <header className="flex items-center justify-between py-2 px-3 bg-stone-900 border-b border-stone-700 text-white rounded-t-xl max-w-[98vw] w-full mx-auto shrink-0 shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="flex flex-col">
                  <span className="font-title text-xs sm:text-sm font-extrabold uppercase tracking-wider text-church-gold">
                    Modo Tela do Púlpito
                  </span>
                  <span className="text-[10px] text-stone-300 hidden xs:inline sm:inline">
                    Suas anotações de obreiro continuam salvas
                  </span>
                </div>
              </div>

              {/* BOTÃO GRANDE E INCONFUNDÍVEL DE RETORNO EM VERMELHO */}
              <button
                type="button"
                onClick={() => {
                  setPulpitPreviewActive(false);
                  setShowPulpitPreview(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-title font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-white ring-2 ring-red-500/50"
                title="Fechar e voltar imediatamente para suas anotações de obreiro"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 stroke-[3]" />
                <span>Voltar ao Obreiro</span>
              </button>
            </header>

            {/* Moldura de exibição do Púlpito */}
            <div className="flex-1 max-w-[98vw] w-full mx-auto bg-church-parchment rounded-b-xl overflow-hidden shadow-2xl border-x-2 border-b-2 border-stone-800 relative flex flex-col min-h-0">
              <PulpitView />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
