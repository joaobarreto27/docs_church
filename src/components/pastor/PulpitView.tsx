import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { 
  VisitorItem, 
  PrayerItem, 
  ChoirItem, 
  OpportunityItem 
} from '../../types/liturgy';
import { AlertCircle, ZoomIn, ZoomOut, CheckSquare, Square, LogOut } from 'lucide-react';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, leaveRoom } = useRoom();

  // Escala de fonte para pregadores idosos (1 = padrão 100%, 1.15 = grande, 1.3 = muito grande)
  const [fontScale, setFontScale] = useState<number>(1.05);

  if (!room) return null;

  // Separação de blocos por folha (Folha 1: Esquerda, Folha 2: Direita)
  const sheet1Blocks = blocks.filter(b => b.sheet_assignment === 1);
  const sheet2Blocks = blocks.filter(b => b.sheet_assignment === 2);

  // Renderizador específico por tipo de bloco
  const renderBlockContent = (block: any) => {
    switch (block.block_type) {
      case 'visitors': {
        const items = (block.content || []) as VisitorItem[];
        if (items.length === 0) {
          return <p className="font-serif italic text-church-muted/70 text-sm">Nenhum visitante registrado ainda.</p>;
        }
        return (
          <ul className="space-y-1.5 list-disc list-inside">
            {items.map((v, i) => (
              <li key={v.id || i} className="font-sans text-church-charcoal leading-snug">
                <strong className="font-semibold">{v.name}</strong>
                {v.church && <span className="text-church-muted"> ({v.church})</span>}
                {v.invited_by && <span className="text-church-muted text-xs"> — Convidado por {v.invited_by}</span>}
              </li>
            ))}
          </ul>
        );
      }

      case 'prayer':
      case 'youtube': {
        const items = (block.content || []) as PrayerItem[];
        if (items.length === 0) {
          return <p className="font-serif italic text-church-muted/70 text-sm">Nenhum pedido de oração inserido.</p>;
        }
        return (
          <ul className="space-y-2 list-disc list-inside">
            {items.map((p, i) => (
              <li key={p.id || i} className="font-sans text-church-charcoal leading-relaxed">
                {p.urgent && (
                  <span className="inline-block px-1.5 py-0.2 mr-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                    Urgente
                  </span>
                )}
                <span className="font-medium">{p.description}</span>
              </li>
            ))}
          </ul>
        );
      }

      case 'opportunities': {
        const items = (block.content || []) as OpportunityItem[];
        if (items.length === 0) {
          return <p className="font-serif italic text-church-muted/70 text-sm">Nenhuma oportunidade escalada.</p>;
        }
        return (
          <div className="space-y-2">
            {items.map((op, i) => (
              <div key={op.id || i} className="flex items-center gap-2 p-2 rounded-lg bg-church-parchment/60 border border-church-sand">
                <span className="w-2 h-2 rounded-full bg-church-gold" />
                <span className="font-title text-sm font-semibold text-church-charcoal">{op.name}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'choirs': {
        const items = (block.content || []) as ChoirItem[];
        return (
          <div className="grid grid-cols-1 gap-2.5">
            {items.map((ch, i) => (
              <div 
                key={ch.id || i} 
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  ch.checked 
                    ? 'bg-church-gold/10 border-church-gold/40 text-church-charcoal font-bold' 
                    : 'bg-white border-church-sand/80 text-church-muted'
                }`}
              >
                {ch.checked ? (
                  <CheckSquare className="w-5 h-5 text-church-gold-dark shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-church-muted/50 shrink-0" />
                )}
                <span className="font-title text-sm tracking-wide">{ch.name}</span>
              </div>
            ))}
          </div>
        );
      }

      default:
        return (
          <div className="font-sans text-church-charcoal leading-relaxed whitespace-pre-wrap">
            {block.content?.text || ''}
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-church-parchment select-none overflow-hidden">
      {/* ⚠️ FAIXA DE ALERTA NO TOPO (OPÇÃO A) - EMPURRA SUAVEMENTE AS FOLHAS */}
      {room.active_alert && (
        <aside 
          aria-live="assertive"
          className="w-full bg-alert-bg border-b-2 border-alert-border px-4 py-2.5 flex items-center justify-center gap-3 shadow-md animate-slideDown"
        >
          <AlertCircle className="w-5 h-5 text-alert-text shrink-0 animate-bounce" />
          <p className="font-title text-sm sm:text-base font-bold text-alert-text uppercase tracking-wide text-center">
            {room.active_alert}
          </p>
        </aside>
      )}

      {/* ÁREA PRINCIPAL: DUAS FOLHAS LADO A LADO EM MODO PAISAGEM (ZERO SCROLL) */}
      <main 
        className="flex-1 p-2 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden h-full max-h-full"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {/* ================= FOLHA 1 (ESQUERDA) ================= */}
        <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
          {/* Cabeçalho da Folha 1 com Logotipo Horizontal Oficial */}
          <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex flex-col">
              <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                Liturgia & Pedidos
              </span>
              <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                {room.title}
              </h2>
            </div>
            <img 
              src="/assets/logo-adutinga-horizontal.png" 
              alt="A.D. Utinga" 
              className="h-7 sm:h-9 w-auto object-contain"
            />
          </div>

          {/* Conteúdo Dinâmico da Folha 1 */}
          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
            {sheet1Blocks.map(block => (
              <article key={block.id} className="pb-3 border-b border-church-sand/50 last:border-b-0">
                <header className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                    {block.title}
                  </h3>
                </header>
                {renderBlockContent(block)}
              </article>
            ))}
          </div>

          {/* Rodapé da Folha 1 */}
          <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
            <span className="font-serif italic">Folha 1 (Recepção & Orações)</span>
            <span className="font-mono">Página 1 de 2</span>
          </div>
        </section>

        {/* ================= FOLHA 2 (DIREITA) ================= */}
        <section className="paper-sheet rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col h-full overflow-hidden border border-church-sand shadow-sheet">
          {/* Cabeçalho da Folha 2 */}
          <div className="border-b border-church-sand pb-3 mb-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex flex-col">
              <span className="font-title text-[10px] font-bold uppercase tracking-[0.2em] text-church-gold">
                Participações & Louvor
              </span>
              <h2 className="font-title text-base sm:text-lg font-extrabold uppercase text-church-charcoal tracking-tight">
                Escala do Culto
              </h2>
            </div>
            <span className="font-serif italic text-xs text-church-muted">
              "Aqui chegamos pela fé!"
            </span>
          </div>

          {/* Conteúdo Dinâmico da Folha 2 */}
          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
            {sheet2Blocks.map(block => (
              <article key={block.id} className="pb-3 border-b border-church-sand/50 last:border-b-0">
                <header className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                  <h3 className="font-title text-xs font-bold uppercase tracking-wider text-church-gold-dark">
                    {block.title}
                  </h3>
                </header>
                {renderBlockContent(block)}
              </article>
            ))}
          </div>

          {/* Rodapé da Folha 2 */}
          <div className="pt-2 border-t border-church-sand/50 text-[10px] text-church-muted flex justify-between items-center shrink-0">
            <span className="font-serif italic">Folha 2 (Conjuntos & Oportunidades)</span>
            <span className="font-mono">Página 2 de 2</span>
          </div>
        </section>
      </main>

      {/* BARRA INFERIOR DISCRETA DE ACESSIBILIDADE E STATUS DO PÚLPITO */}
      <footer className="bg-church-parchment/80 border-t border-church-sand/60 px-4 py-1.5 flex items-center justify-between text-xs text-church-muted shrink-0">
        {/* Status de Conexão Silencioso */}
        <div className="flex items-center gap-2">
          <span 
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 pulse-status'}`}
            title={isConnected ? 'Conectado em tempo real' : 'Modo offline resiliente (conteúdo salvo localmente)'}
          />
          <span className="text-[11px] font-sans">
            {isConnected ? 'Sincronizado' : 'Offline (Seguro)'}
          </span>
        </div>

        {/* Centro / Direita: Controles de zoom e Botão Sair do Púlpito */}
        <div className="flex items-center gap-3">
          {/* Ajuste de Tamanho da Letra para Terceira Idade */}
          <div className="flex items-center gap-1.5 bg-white rounded-lg border border-church-sand px-2 py-0.5">
            <button
              type="button"
              onClick={() => setFontScale(prev => Math.max(0.9, prev - 0.08))}
              className="p-1 hover:text-church-charcoal active:scale-90"
              title="Diminuir tamanho da letra"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-title font-bold px-1 text-church-charcoal">
              A {Math.round(fontScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setFontScale(prev => Math.min(1.45, prev + 0.08))}
              className="p-1 hover:text-church-charcoal active:scale-90"
              title="Aumentar tamanho da letra"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão Sair Discreto do Púlpito para Voltar à Tela Inicial */}
          <button
            type="button"
            onClick={leaveRoom}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white border border-transparent hover:border-church-sand transition-colors text-[11px] font-title font-medium uppercase tracking-wider"
            title="Sair do Púlpito e voltar à tela inicial"
          >
            <LogOut className="w-3.5 h-3.5 text-church-muted" />
            <span>Sair</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
