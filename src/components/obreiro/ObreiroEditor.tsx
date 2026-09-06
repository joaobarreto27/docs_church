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
  FileText
} from 'lucide-react';

export const ObreiroEditor: React.FC = () => {
  const { room, blocks, updateBlock } = useRoom();

  // Estados de Visitantes
  const [visitorName, setVisitorName] = useState('');
  const [visitorChurch, setVisitorChurch] = useState('');
  const [visitorInvitedBy, setVisitorInvitedBy] = useState('');
  const [visitorBatchMode, setVisitorBatchMode] = useState(false);
  const [visitorBatchText, setVisitorBatchText] = useState('');

  // Estados de Oração Presencial
  const [prayerDesc, setPrayerDesc] = useState('');
  const [prayerUrgent, setPrayerUrgent] = useState(false);
  const [prayerBatchMode, setPrayerBatchMode] = useState(false);
  const [prayerBatchText, setPrayerBatchText] = useState('');

  // Estados de Oportunidades
  const [oppName, setOppName] = useState('');

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
    setVisitorBatchMode(false);
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
    setPrayerBatchMode(false);
    setPrayerUrgent(false);
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
    showFeedback('Oportunidade escalada!');
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

  const visitorsList = (getBlock('visitors')?.content || []) as VisitorItem[];
  const prayersList = (getBlock('prayer')?.content || []) as PrayerItem[];
  const oppsList = (getBlock('opportunities')?.content || []) as OpportunityItem[];
  const choirsList = (getBlock('choirs')?.content || []) as ChoirItem[];

  return (
    <div className="min-h-screen bg-church-parchment flex flex-col">
      <Header />

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
          <div className="flex items-center justify-between mb-4 border-b border-church-sand pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Visitantes da Noite
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark">
                {visitorsList.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVisitorBatchMode(!visitorBatchMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-church-gold-dark bg-church-gold/10 hover:bg-church-gold/20 transition-all cursor-pointer"
            >
              {visitorBatchMode ? <FileText className="w-3.5 h-3.5" /> : <ListPlus className="w-3.5 h-3.5" />}
              <span>{visitorBatchMode ? 'Modo Normal' : '+ Colar em Lote'}</span>
            </button>
          </div>

          {/* Lista de Visitantes Atuais */}
          {visitorsList.length > 0 && (
            <div className="space-y-2 mb-5">
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
                    className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                    title="Excluir visitante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário Visitantes: Lote (Estilo Google Docs) vs Normal */}
          {visitorBatchMode ? (
            <form onSubmit={handleAddBatchVisitor} className="space-y-4">
              <div className="bg-white rounded-xl border-2 border-dashed border-church-sand p-3 shadow-inner focus-within:border-church-gold transition-all">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-church-sand/60 text-xs text-church-muted font-sans">
                  <span className="font-semibold text-church-charcoal flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-church-gold" />
                    Folha de Digitação Contínua (Estilo Google Docs)
                  </span>
                  <span className="text-[11px] font-mono">1 visitante por linha</span>
                </div>
                <textarea
                  rows={9}
                  placeholder="Digite ou cole aqui os visitantes livremente (1 por linha), exatamente como fazia no Google Docs...&#10;&#10;Ex:&#10;Irmão Carlos Eduardo e Família (Igreja Batista Central)&#10;Irmã Valéria Souza (A.D. São Mateus)&#10;Jovem Matheus Henrique (Convidado pelo Gabriel)&#10;Pastor Marcos e Pastora Aline"
                  value={visitorBatchText}
                  onChange={e => setVisitorBatchText(e.target.value)}
                  className="w-full text-base font-sans p-3 bg-white border-0 focus:ring-0 outline-none resize-y min-h-[260px] sm:min-h-[300px] leading-relaxed text-church-charcoal placeholder:text-church-muted/50"
                />
              </div>
              <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!visitorBatchText.trim()}
                  className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  + Adicionar Todos os Visitantes
                </button>
                {visitorBatchText.trim() && (
                  <button
                    type="button"
                    onClick={() => setVisitorBatchText('')}
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
        </section>

        {/* ================= SEÇÃO PEDIDOS DE ORAÇÃO (PRESENCIAIS) ================= */}
        <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-church-sand pb-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Pedidos de Oração (Presenciais)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark">
                {prayersList.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPrayerBatchMode(!prayerBatchMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-church-gold-dark bg-church-gold/10 hover:bg-church-gold/20 transition-all cursor-pointer"
            >
              {prayerBatchMode ? <FileText className="w-3.5 h-3.5" /> : <ListPlus className="w-3.5 h-3.5" />}
              <span>{prayerBatchMode ? 'Modo Normal' : '+ Colar em Lote'}</span>
            </button>
          </div>

          {/* Lista de Pedidos */}
          {prayersList.length > 0 && (
            <div className="space-y-2 mb-5 max-h-72 overflow-y-auto pr-1">
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
                    className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                    title="Excluir pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de Pedidos: Lote (Estilo Google Docs) vs Normal */}
          {prayerBatchMode ? (
            <form onSubmit={handleAddBatchPrayer} className="space-y-4">
              <div className="bg-white rounded-xl border-2 border-dashed border-church-sand p-3 shadow-inner focus-within:border-church-gold transition-all">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-church-sand/60 text-xs text-church-muted font-sans">
                  <span className="font-semibold text-church-charcoal flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-church-gold" />
                    Folha de Pedidos Contínua (Estilo Google Docs)
                  </span>
                  <span className="text-[11px] font-mono">1 pedido por linha</span>
                </div>
                <textarea
                  rows={9}
                  placeholder="Digite ou cole os pedidos de oração livremente (1 por linha, exatamente como fazia no Google Docs)...&#10;&#10;Ex:&#10;Irmão João Batista - UTI do Hospital Santa Marcelina&#10;Irmã Sebastiana - Cirurgia do fêmur&#10;Família da Irmã Iva - Consolo e fortalecimento&#10;Irmão Marcos Vinicius - Libertação dos vícios"
                  value={prayerBatchText}
                  onChange={e => setPrayerBatchText(e.target.value)}
                  className="w-full text-base font-sans p-3 bg-white border-0 focus:ring-0 outline-none resize-y min-h-[260px] sm:min-h-[300px] leading-relaxed text-church-charcoal placeholder:text-church-muted/50"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-title font-semibold text-church-charcoal">
                  <input
                    type="checkbox"
                    checked={prayerUrgent}
                    onChange={e => setPrayerUrgent(e.target.checked)}
                    className="w-4 h-4 rounded text-church-gold focus:ring-church-gold"
                  />
                  Marcar todos deste lote como Caso Urgente
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!prayerBatchText.trim()}
                    className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                  >
                    + Adicionar Todos em Lote
                  </button>
                  {prayerBatchText.trim() && (
                    <button
                      type="button"
                      onClick={() => setPrayerBatchText('')}
                      className="px-3 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
                    >
                      Limpar
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
        </section>

        {/* ================= SEÇÃO CONJUNTOS (CHECKLIST) & OPORTUNIDADES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conjuntos */}
          <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
                <Users className="w-5 h-5 text-church-gold" />
                <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                  Conjuntos do Culto
                </h2>
              </div>

              <div className="space-y-2">
                {choirsList.map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleToggleChoir(ch.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      ch.checked 
                        ? 'bg-church-gold/10 border-church-gold text-church-charcoal font-bold' 
                        : 'bg-church-parchment/40 border-church-sand text-church-muted hover:bg-white'
                    }`}
                  >
                    <span className="font-title text-sm">{ch.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      ch.checked ? 'bg-church-gold text-white' : 'bg-church-sand/60 text-church-muted'
                    }`}>
                      {ch.checked ? 'Confirmado' : 'Não participa'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-church-muted mt-3 font-serif italic">
              * Toque no conjunto para marcar ou desmarcar sua participação no culto.
            </p>
          </section>

          {/* Oportunidades */}
          <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
                <Mic2 className="w-5 h-5 text-church-gold" />
                <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                  Participação / Oportunidades
                </h2>
              </div>

              <div className="space-y-2 mb-4">
                {oppsList.length === 0 ? (
                  <p className="font-serif italic text-church-muted text-xs p-2">Nenhuma oportunidade escalada ainda.</p>
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

            <form onSubmit={handleAddOpp} className="space-y-2 pt-2 border-t border-church-sand/40">
              <label className="block text-[11px] font-title font-bold uppercase tracking-wider text-church-charcoal">
                Escalar Cantor ou Grupo
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
                  + Escalar
                </button>
              </div>
            </form>
          </section>
        </div>

      </main>
    </div>
  );
};
