import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { 
  VisitorItem, 
  PrayerItem, 
  ChoirItem, 
  OpportunityItem 
} from '../../types/liturgy';
import { Header } from '../common/Header';
import { 
  UserPlus, 
  HeartHandshake, 
  Mic2, 
  Users, 
  Trash2, 
  Check,
  ListPlus,
  FileText,
  AlertTriangle,
  Pencil,
  X,
  Plus
} from 'lucide-react';

interface ObreiroEditorProps {
  showHeader?: boolean;
}

export const ObreiroEditor: React.FC<ObreiroEditorProps> = ({ showHeader = true }) => {
  const { room, blocks, updateBlock, role } = useRoom();

  const draftVisitorKey = room ? `docs_church_draft_visitors_${room.code}` : '';
  const draftPrayerKey = room ? `docs_church_draft_prayers_${room.code}` : '';

  // Estados de Visitantes
  const [visitorName, setVisitorName] = useState('');
  const [visitorChurch, setVisitorChurch] = useState('');
  const [visitorInvitedBy, setVisitorInvitedBy] = useState('');
  const [visitorBatchMode, setVisitorBatchMode] = useState(true);
  const [visitorBatchText, setVisitorBatchText] = useState(() => {
    try {
      return (room ? localStorage.getItem(`docs_church_draft_visitors_${room.code}`) : null) || '';
    } catch {
      return '';
    }
  });

  // Estados de Oração Presencial
  const [prayerDesc, setPrayerDesc] = useState('');
  const [prayerUrgent, setPrayerUrgent] = useState(false);
  const [prayerBatchMode, setPrayerBatchMode] = useState(true);
  const [prayerBatchText, setPrayerBatchText] = useState(() => {
    try {
      return (room ? localStorage.getItem(`docs_church_draft_prayers_${room.code}`) : null) || '';
    } catch {
      return '';
    }
  });

  // Salva rascunho de visitantes no localStorage do tablet sem fazer requisições à Vercel
  const handleVisitorBatchTextChange = (text: string) => {
    setVisitorBatchText(text);
    if (draftVisitorKey) {
      try {
        if (text.trim()) {
          localStorage.setItem(draftVisitorKey, text);
        } else {
          localStorage.removeItem(draftVisitorKey);
        }
      } catch (e) {}
    }
  };

  // Salva rascunho de oração no localStorage do tablet sem fazer requisições à Vercel
  const handlePrayerBatchTextChange = (text: string) => {
    setPrayerBatchText(text);
    if (draftPrayerKey) {
      try {
        if (text.trim()) {
          localStorage.setItem(draftPrayerKey, text);
        } else {
          localStorage.removeItem(draftPrayerKey);
        }
      } catch (e) {}
    }
  };

  // Estados de Oportunidades
  const [oppName, setOppName] = useState('');

  // Estados de Conjuntos do Culto (Gestão pelo Controlador)
  const [newChoirName, setNewChoirName] = useState('');
  const [editingChoirId, setEditingChoirId] = useState<string | null>(null);
  const [editingChoirName, setEditingChoirName] = useState('');

  // Modal de Confirmação para Exclusão em Massa (Controlador)
  const [confirmModal, setConfirmModal] = useState<{ type: 'visitors' | 'prayers'; count: number } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  if (!room) return null;

  const showFeedback = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  // Encontra bloco por tipo
  const getBlock = (type: string) => blocks.find(b => b.block_type === type);

  // Adiciona Visitante Único
  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    const block = getBlock('visitors');
    if (!block) return;

    const current = (block.content || []) as VisitorItem[];
    const newItem: VisitorItem = {
      id: Date.now().toString(),
      name: visitorName.trim(),
      church: visitorChurch.trim() || undefined,
      invited_by: visitorInvitedBy.trim() || undefined,
    };

    updateBlock(block.id, [...current, newItem]);
    setVisitorName('');
    setVisitorChurch('');
    setVisitorInvitedBy('');
    showFeedback('Visitante enviado ao púlpito!');
  };

  // Adiciona Visitantes em Lote (Estilo Google Docs)
  const handleAddBatchVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorBatchText.trim()) return;

    const block = getBlock('visitors');
    if (!block) return;

    const lines = visitorBatchText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const current = (block.content || []) as VisitorItem[];
    const newItems: VisitorItem[] = lines.map((line, idx) => {
      // Se tiver parênteses ex: "Irmão Carlos (Igreja Central)"
      const match = line.match(/^([^(]+)(?:\(([^)]+)\))?/);
      const name = match ? match[1].trim() : line;
      const church = match && match[2] ? match[2].trim() : undefined;

      return {
        id: `${Date.now()}_v_${idx}`,
        name,
        church,
      };
    });

    updateBlock(block.id, [...current, ...newItems]);
    setVisitorBatchText('');
    if (draftVisitorKey) {
      try { localStorage.removeItem(draftVisitorKey); } catch (e) {}
    }
    // Mantém no modo de lote para que o irmão continue anotando os próximos
    showFeedback(`${newItems.length} visitantes adicionados à folha!`);
  };

  // Remove Visitante
  const handleRemoveVisitor = (id: string) => {
    const block = getBlock('visitors');
    if (!block) return;
    const current = (block.content || []) as VisitorItem[];
    updateBlock(block.id, current.filter(v => v.id !== id));
  };

  // Adiciona Pedido Presencial Único
  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerDesc.trim()) return;

    const block = getBlock('prayer');
    if (!block) return;

    const current = (block.content || []) as PrayerItem[];
    const newItem: PrayerItem = {
      id: Date.now().toString(),
      description: prayerDesc.trim(),
      urgent: prayerUrgent,
    };

    updateBlock(block.id, [...current, newItem]);
    setPrayerDesc('');
    setPrayerUrgent(false);
    showFeedback('Pedido de oração enviado ao púlpito!');
  };

  // Adiciona Lote de Pedidos Presenciais (Estilo Google Docs)
  const handleAddBatchPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerBatchText.trim()) return;
    const block = getBlock('prayer');
    if (!block) return;

    const lines = prayerBatchText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const current = (block.content || []) as PrayerItem[];
    const newItems: PrayerItem[] = lines.map((desc, idx) => ({
      id: `${Date.now()}_${idx}`,
      description: desc,
      urgent: prayerUrgent,
    }));

    updateBlock(block.id, [...current, ...newItems]);
    setPrayerBatchText('');
    if (draftPrayerKey) {
      try { localStorage.removeItem(draftPrayerKey); } catch (e) {}
    }
    setPrayerUrgent(false);
    // Mantém no modo de lote para que o irmão continue anotando os próximos
    showFeedback(`${newItems.length} pedidos de oração adicionados!`);
  };

  // Remove Pedido Presencial
  const handleRemovePrayer = (id: string) => {
    const block = getBlock('prayer');
    if (!block) return;
    const current = (block.content || []) as PrayerItem[];
    updateBlock(block.id, current.filter(p => p.id !== id));
  };

  // Adiciona Oportunidade
  const handleAddOpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppName.trim()) return;

    const block = getBlock('opportunities');
    if (!block) return;

    const current = (block.content || []) as OpportunityItem[];
    const newItem: OpportunityItem = {
      id: Date.now().toString(),
      name: oppName.trim(),
    };

    updateBlock(block.id, [...current, newItem]);
    setOppName('');
    showFeedback('Oportunidade adicionada!');
  };

  // Remove Oportunidade
  const handleRemoveOpp = (id: string) => {
    const block = getBlock('opportunities');
    if (!block) return;
    const current = (block.content || []) as OpportunityItem[];
    updateBlock(block.id, current.filter(o => o.id !== id));
  };

  // Alterna Checkbox de Conjunto
  const handleToggleChoir = (id: string) => {
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    const updated = current.map(ch => ch.id === id ? { ...ch, checked: !ch.checked } : ch);
    updateBlock(block.id, updated);
  };

  // Adiciona novo conjunto (Controlador)
  const handleAddChoir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoirName.trim()) return;
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    const newItem: ChoirItem = {
      id: Date.now().toString(),
      name: newChoirName.trim(),
      checked: true,
    };

    updateBlock(block.id, [...current, newItem]);
    setNewChoirName('');
    showFeedback('Conjunto adicionado com sucesso!');
  };

  // Salva renomeação de conjunto (Controlador)
  const handleSaveChoirName = (id: string) => {
    if (!editingChoirName.trim()) return;
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    const updated = current.map(ch => ch.id === id ? { ...ch, name: editingChoirName.trim() } : ch);
    updateBlock(block.id, updated);
    setEditingChoirId(null);
    setEditingChoirName('');
    showFeedback('Nome do conjunto atualizado!');
  };

  // Exclui conjunto (Controlador)
  const handleDeleteChoir = (id: string) => {
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    updateBlock(block.id, current.filter(ch => ch.id !== id));
    showFeedback('Conjunto removido.');
  };

  // Exclusão em massa com confirmação (Controlador)
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

  const visitorsList = (getBlock('visitors')?.content || []) as VisitorItem[];
  const prayersList = (getBlock('prayer')?.content || []) as PrayerItem[];
  const oppsList = (getBlock('opportunities')?.content || []) as OpportunityItem[];
  const choirsList = (getBlock('choirs')?.content || []) as ChoirItem[];

  return (
    <div className={`${showHeader ? 'min-h-screen' : ''} bg-church-parchment flex flex-col`}>
      {showHeader && <Header />}

      {/* Notificação Flutuante de Feedback */}
      {savedSuccess && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-title font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4" />
          {savedSuccess}
        </div>
      )}

      {/* Conteúdo Principal do Editor */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ================= SEÇÃO VISITANTES ================= */}
        <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Visitantes do Culto
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark">
                {visitorsList.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão exclusivo da Direção/Controlador para limpar tudo */}
              {role === 'controlador' && visitorsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmModal({ type: 'visitors', count: visitorsList.length })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                  title="Apagar todos os visitantes cadastrados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Apagar Todos</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setVisitorBatchMode(!visitorBatchMode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-church-gold-dark bg-church-gold/10 hover:bg-church-gold/20 transition-all cursor-pointer"
              >
                {visitorBatchMode ? <FileText className="w-3.5 h-3.5" /> : <ListPlus className="w-3.5 h-3.5" />}
                <span>{visitorBatchMode ? 'Digitar Um por Um' : '+ Digitar Vários Juntos'}</span>
              </button>
            </div>
          </div>

          {/* 1. ÁREA DE DIGITAÇÃO LOGO NO TOPO (MUITO MAIS FÁCIL PARA ESCREVER) */}
          {visitorBatchMode ? (
            <form onSubmit={handleAddBatchVisitor} className="space-y-4">
              <div className="bg-white rounded-xl border-2 border-dashed border-church-sand p-3 shadow-inner focus-within:border-church-gold transition-all">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-church-sand/60 text-xs text-church-muted font-sans">
                  <span className="font-semibold text-church-charcoal flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-church-gold" />
                    Folha para Digitar Vários Nomes (1 por linha)
                  </span>
                  <span className="text-[11px] font-mono text-church-gold-dark font-medium">Aperte Enter para pular linha</span>
                </div>
                <textarea
                  rows={9}
                  placeholder="Digite ou cole aqui os visitantes (1 por linha), como se fosse em uma folha em branco...&#10;&#10;Exemplo:&#10;Irmão Carlos Eduardo e Família (Igreja Batista)&#10;Irmã Valéria Souza (A.D. São Mateus)&#10;Jovem Matheus Henrique (Convidado pelo Gabriel)&#10;Pastor Marcos e Pastora Aline"
                  value={visitorBatchText}
                  onChange={e => handleVisitorBatchTextChange(e.target.value)}
                  className="w-full text-base font-sans p-3 bg-white border-0 focus:ring-0 outline-none resize-y min-h-[260px] sm:min-h-[300px] leading-relaxed text-church-charcoal placeholder:text-church-muted/50"
                />
                {visitorBatchText.trim() && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium px-3 pb-1 pt-0.5 border-t border-church-sand/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Rascunho salvo no aparelho (não se perde se a tela desligar ou recarregar)</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!visitorBatchText.trim()}
                  className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  + Adicionar Todos à Lista
                </button>
                {visitorBatchText.trim() && (
                  <button
                    type="button"
                    onClick={() => handleVisitorBatchTextChange('')}
                    className="px-4 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
                  >
                    Limpar Folha
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddVisitor} className="space-y-3">
              <div>
                <label className="block text-[11px] font-title font-bold uppercase tracking-wider text-church-charcoal mb-1">
                  Nome do Visitante ou Família *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Irmão Carlos Eduardo e Família"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  className="w-full text-sm font-sans p-3 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-title font-bold uppercase tracking-wider text-church-muted mb-1">
                    Igreja de Origem / Bairro (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Igreja Batista Central - Sto André"
                    value={visitorChurch}
                    onChange={e => setVisitorChurch(e.target.value)}
                    className="w-full text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-title font-bold uppercase tracking-wider text-church-muted mb-1">
                    Quem Convidou (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Diác. Paulo"
                    value={visitorInvitedBy}
                    onChange={e => setVisitorInvitedBy(e.target.value)}
                    className="w-full text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-start gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!visitorName.trim()}
                  className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  + Adicionar Visitante
                </button>
              </div>
            </form>
          )}

          {/* 2. LISTA DE VISITANTES JÁ CADASTRADOS (LOGO ABAIXO DA ÁREA DE DIGITAÇÃO) */}
          {visitorsList.length > 0 && (
            <div className="pt-5 border-t border-church-sand/70 mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-church-muted mb-2 font-sans">
                <span className="font-semibold text-church-charcoal flex items-center gap-1.5">
                  Visitantes Já Cadastrados ({visitorsList.length})
                </span>
                <span className="text-[11px] font-serif italic text-church-muted hidden sm:inline">
                  Atualizado em tempo real no púlpito
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {visitorsList.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-church-parchment/60 border border-church-sand hover:bg-church-parchment transition-colors">
                    <div className="text-sm font-sans">
                      <span className="font-semibold text-church-charcoal">{v.name}</span>
                      {v.church && <span className="text-church-muted text-xs"> ({v.church})</span>}
                      {v.invited_by && <span className="text-church-muted text-xs block sm:inline sm:ml-2">Convidado por: {v.invited_by}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVisitor(v.id)}
                      className="p-1.5 text-church-muted hover:text-red-600 transition-colors cursor-pointer"
                      title="Excluir este visitante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= SEÇÃO PEDIDOS DE ORAÇÃO (PRESENCIAIS) ================= */}
        <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Pedidos de Oração (Presenciais)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark">
                {prayersList.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão exclusivo da Direção/Controlador para limpar tudo */}
              {role === 'controlador' && prayersList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmModal({ type: 'prayers', count: prayersList.length })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                  title="Apagar todos os pedidos de oração cadastrados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Apagar Todos</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPrayerBatchMode(!prayerBatchMode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-church-gold-dark bg-church-gold/10 hover:bg-church-gold/20 transition-all cursor-pointer"
              >
                {prayerBatchMode ? <FileText className="w-3.5 h-3.5" /> : <ListPlus className="w-3.5 h-3.5" />}
                <span>{prayerBatchMode ? 'Digitar Um por Um' : '+ Digitar Vários Juntos'}</span>
              </button>
            </div>
          </div>

          {/* 1. ÁREA DE DIGITAÇÃO LOGO NO TOPO (MUITO MAIS FÁCIL PARA ESCREVER) */}
          {prayerBatchMode ? (
            <form onSubmit={handleAddBatchPrayer} className="space-y-4">
              <div className="bg-white rounded-xl border-2 border-dashed border-church-sand p-3 shadow-inner focus-within:border-church-gold transition-all">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-church-sand/60 text-xs text-church-muted font-sans">
                  <span className="font-semibold text-church-charcoal flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-church-gold" />
                    Folha para Digitar Vários Pedidos (1 por linha)
                  </span>
                  <span className="text-[11px] font-mono text-church-gold-dark font-medium">Aperte Enter para pular linha</span>
                </div>
                <textarea
                  rows={9}
                  placeholder="Digite ou cole aqui os pedidos de oração livremente (1 por linha)...&#10;&#10;Exemplo:&#10;Irmão João Batista - UTI do Hospital Santa Marcelina&#10;Irmã Sebastiana - Cirurgia do fêmur&#10;Família da Irmã Iva - Consolo e fortalecimento&#10;Irmão Marcos Vinicius - Libertação dos vícios"
                  value={prayerBatchText}
                  onChange={e => handlePrayerBatchTextChange(e.target.value)}
                  className="w-full text-base font-sans p-3 bg-white border-0 focus:ring-0 outline-none resize-y min-h-[260px] sm:min-h-[300px] leading-relaxed text-church-charcoal placeholder:text-church-muted/50"
                />
                {prayerBatchText.trim() && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium px-3 pb-1 pt-0.5 border-t border-church-sand/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Rascunho salvo no aparelho (não se perde se a tela desligar ou recarregar)</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-title font-semibold text-church-charcoal">
                  <input
                    type="checkbox"
                    checked={prayerUrgent}
                    onChange={e => setPrayerUrgent(e.target.checked)}
                    className="w-4 h-4 rounded text-church-gold focus:ring-church-gold"
                  />
                  Marcar todos deste grupo como Caso Urgente
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!prayerBatchText.trim()}
                    className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                  >
                    + Adicionar Todos os Pedidos
                  </button>
                  {prayerBatchText.trim() && (
                    <button
                      type="button"
                      onClick={() => handlePrayerBatchTextChange('')}
                      className="px-3 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
                    >
                      Limpar Folha
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddPrayer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-title font-bold uppercase tracking-wider text-church-charcoal mb-1">
                  Motivo da Oração *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Irmão João Batista (UTI do Hospital Santa Marcelina)"
                  value={prayerDesc}
                  onChange={e => setPrayerDesc(e.target.value)}
                  className="w-full text-sm font-sans p-3 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 pt-2">
                <button
                  type="submit"
                  disabled={!prayerDesc.trim()}
                  className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  + Adicionar Pedido
                </button>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-title font-semibold text-church-charcoal">
                  <input
                    type="checkbox"
                    checked={prayerUrgent}
                    onChange={e => setPrayerUrgent(e.target.checked)}
                    className="w-4 h-4 rounded text-church-gold focus:ring-church-gold"
                  />
                  Marcar como Caso Urgente (UTI, cirurgia iminente)
                </label>
              </div>
            </form>
          )}

          {/* 2. LISTA DE PEDIDOS JÁ CADASTRADOS (LOGO ABAIXO DA ÁREA DE DIGITAÇÃO) */}
          {prayersList.length > 0 && (
            <div className="pt-5 border-t border-church-sand/70 mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-church-muted mb-2 font-sans">
                <span className="font-semibold text-church-charcoal flex items-center gap-1.5">
                  Pedidos Já Cadastrados ({prayersList.length})
                </span>
                <span className="text-[11px] font-serif italic text-church-muted hidden sm:inline">
                  Atualizado em tempo real no púlpito
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {prayersList.map(p => (
                  <div key={p.id} className="flex items-start justify-between p-3 rounded-xl bg-church-parchment/60 border border-church-sand gap-3 hover:bg-church-parchment transition-colors">
                    <div className="text-sm font-sans flex-1">
                      {p.urgent && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider mr-2">
                          Urgente
                        </span>
                      )}
                      <span className="text-church-charcoal font-medium">{p.description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePrayer(p.id)}
                      className="p-1.5 text-church-muted hover:text-red-600 transition-colors cursor-pointer"
                      title="Excluir este pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= SEÇÃO CONJUNTOS (CONTROLADOR) & OPORTUNIDADES ================= */}
        <div className={`grid gap-6 ${role === 'controlador' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Conjuntos - VISÍVEL E EDITÁVEL EXCLUSIVAMENTE PELO CONTROLADOR */}
          {role === 'controlador' && (
            <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-church-sand pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-church-gold" />
                    <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                      Conjuntos do Culto
                    </h2>
                  </div>
                  <span className="text-[11px] font-title font-bold px-2.5 py-0.5 rounded-full bg-church-gold/15 text-church-gold-dark">
                    {choirsList.filter(c => c.checked).length} Confirmados
                  </span>
                </div>

                {/* Adicionar Novo Conjunto */}
                <form onSubmit={handleAddChoir} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Novo conjunto (Ex: Coral Geral, Grupo de Louvor)..."
                    value={newChoirName}
                    onChange={e => setNewChoirName(e.target.value)}
                    className="flex-1 text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newChoirName.trim()}
                    className="px-3.5 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Adicionar à lista de conjuntos"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </form>

                {/* Lista de Conjuntos Cadastrados com Edição e Exclusão */}
                <div className="space-y-2">
                  {choirsList.length === 0 ? (
                    <p className="font-serif italic text-church-muted text-xs p-3 text-center border border-dashed border-church-sand rounded-xl">
                      Nenhum conjunto cadastrado. Adicione um conjunto no campo acima.
                    </p>
                  ) : (
                    choirsList.map(ch => (
                      <div
                        key={ch.id}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                          ch.checked 
                            ? 'bg-church-gold/10 border-church-gold text-church-charcoal' 
                            : 'bg-church-parchment/40 border-church-sand text-church-muted hover:bg-white'
                        }`}
                      >
                        {editingChoirId === ch.id ? (
                          // Modo de Edição Inline de Nome
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingChoirName}
                              onChange={e => setEditingChoirName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveChoirName(ch.id);
                                } else if (e.key === 'Escape') {
                                  setEditingChoirId(null);
                                }
                              }}
                              autoFocus
                              className="flex-1 text-xs font-sans p-1.5 rounded-lg border border-church-gold bg-white outline-none text-church-charcoal font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveChoirName(ch.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              title="Salvar alteração"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingChoirId(null)}
                              className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors cursor-pointer"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          // Visualização Normal com Botão de Confirmação e Nome
                          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                            <button
                              type="button"
                              onClick={() => handleToggleChoir(ch.id)}
                              className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                                ch.checked 
                                  ? 'bg-church-gold text-white shadow-xs' 
                                  : 'bg-church-sand/70 text-church-muted hover:bg-church-sand'
                              }`}
                              title={ch.checked ? 'Clique para desmarcar do culto' : 'Clique para confirmar no culto'}
                            >
                              {ch.checked ? 'Confirmado' : 'Não participa'}
                            </button>
                            <span 
                              onClick={() => handleToggleChoir(ch.id)}
                              className={`font-title text-sm cursor-pointer select-none truncate ${
                                ch.checked ? 'font-bold text-church-charcoal' : 'text-church-muted'
                              }`}
                              title="Clique para alternar participação"
                            >
                              {ch.name}
                            </span>
                          </div>
                        )}

                        {/* Botões de Ação: Editar e Excluir */}
                        {editingChoirId !== ch.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChoirId(ch.id);
                                setEditingChoirName(ch.name);
                              }}
                              className="p-1.5 text-church-muted hover:text-church-charcoal hover:bg-church-sand/50 rounded-lg transition-colors cursor-pointer"
                              title="Renomear conjunto"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChoir(ch.id)}
                              className="p-1.5 text-church-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir conjunto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <p className="text-[11px] text-church-muted mt-4 font-serif italic border-t border-church-sand/50 pt-2">
                * Toque no botão de status para marcar no Louvor Final do púlpito. Use o lápis para renomear ou a lixeira para excluir.
              </p>
            </section>
          )}

          {/* Oportunidades */}
          <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
                <Mic2 className="w-5 h-5 text-church-gold" />
                <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                  Oportunidades
                </h2>
              </div>

              {/* Formulário de Adicionar no TOPO */}
              <form onSubmit={handleAddOpp} className="space-y-2 mb-4 pb-4 border-b border-church-sand/40">
                <label className="block text-[11px] font-title font-bold uppercase tracking-wider text-church-charcoal">
                  Adicionar Cantor ou Grupo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do cantor ou grupo"
                    value={oppName}
                    onChange={e => setOppName(e.target.value)}
                    className="flex-1 text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!oppName.trim()}
                    className="px-4 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>
              </form>

              {/* Lista de Oportunidades Adicionadas Abaixo do Formulário */}
              <div className="space-y-2">
                {oppsList.length === 0 ? (
                  <p className="font-serif italic text-church-muted text-xs p-2">Nenhuma oportunidade adicionada ainda.</p>
                ) : (
                  oppsList.map(op => (
                    <div key={op.id} className="flex items-center justify-between p-2.5 rounded-xl bg-church-parchment/60 border border-church-sand">
                      <span className="font-title text-sm font-semibold text-church-charcoal">{op.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOpp(op.id)}
                        className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                        title="Remover oportunidade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

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
                  <span className="text-red-600 font-medium">Esta ação apagará imediatamente a lista do púlpito do pastor.</span>
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

      </main>
    </div>
  );
};
