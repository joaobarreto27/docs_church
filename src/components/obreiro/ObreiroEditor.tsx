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
  Youtube, 
  Mic2, 
  Users, 
  Trash2, 
  Check 
} from 'lucide-react';

export const ObreiroEditor: React.FC = () => {
  const { room, blocks, updateBlock } = useRoom();

  // Estados de novos itens
  const [visitorName, setVisitorName] = useState('');
  const [visitorChurch, setVisitorChurch] = useState('');
  const [visitorInvitedBy, setVisitorInvitedBy] = useState('');

  const [prayerDesc, setPrayerDesc] = useState('');
  const [prayerUrgent, setPrayerUrgent] = useState(false);

  const [youtubeDesc, setYoutubeDesc] = useState('');
  const [oppName, setOppName] = useState('');

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  if (!room) return null;

  const showFeedback = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 2500);
  };

  // Encontra bloco por tipo
  const getBlock = (type: string) => blocks.find(b => b.block_type === type);

  // Adiciona Visitante
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

  // Remove Visitante
  const handleRemoveVisitor = (id: string) => {
    const block = getBlock('visitors');
    if (!block) return;
    const current = (block.content || []) as VisitorItem[];
    updateBlock(block.id, current.filter(v => v.id !== id));
  };

  // Adiciona Pedido Presencial
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
    showFeedback('Pedido de oração adicionado!');
  };

  // Remove Pedido Presencial
  const handleRemovePrayer = (id: string) => {
    const block = getBlock('prayer');
    if (!block) return;
    const current = (block.content || []) as PrayerItem[];
    updateBlock(block.id, current.filter(p => p.id !== id));
  };

  // Adiciona Pedido YouTube
  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeDesc.trim()) return;

    const block = getBlock('youtube');
    if (!block) return;

    const current = (block.content || []) as PrayerItem[];
    const newItem: PrayerItem = {
      id: Date.now().toString(),
      description: youtubeDesc.trim(),
      urgent: false,
    };

    updateBlock(block.id, [...current, newItem]);
    setYoutubeDesc('');
    showFeedback('Pedido do YouTube transmitido ao púlpito!');
  };

  // Remove Pedido YouTube
  const handleRemoveYoutube = (id: string) => {
    const block = getBlock('youtube');
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
          <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
            <UserPlus className="w-5 h-5 text-church-gold" />
            <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
              Visitantes
            </h2>
          </div>

          {/* Lista de Visitantes Atuais */}
          <div className="space-y-2 mb-4">
            {((getBlock('visitors')?.content || []) as VisitorItem[]).map(v => (
              <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-church-parchment/60 border border-church-sand">
                <div className="text-sm font-sans">
                  <span className="font-semibold text-church-charcoal">{v.name}</span>
                  {v.church && <span className="text-church-muted text-xs"> ({v.church})</span>}
                  {v.invited_by && <span className="text-church-muted text-xs block sm:inline sm:ml-2">Convidado por: {v.invited_by}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVisitor(v.id)}
                  className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Formulário Novo Visitante */}
          <form onSubmit={handleAddVisitor} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nome do Visitante"
              value={visitorName}
              onChange={e => setVisitorName(e.target.value)}
              className="text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/40 focus:border-church-gold outline-none"
            />
            <input
              type="text"
              placeholder="Igreja / Bairro (Opcional)"
              value={visitorChurch}
              onChange={e => setVisitorChurch(e.target.value)}
              className="text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/40 focus:border-church-gold outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Convidado por (Opcional)"
                value={visitorInvitedBy}
                onChange={e => setVisitorInvitedBy(e.target.value)}
                className="flex-1 text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/40 focus:border-church-gold outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-church-gold text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors shrink-0"
              >
                + Adicionar
              </button>
            </div>
          </form>
        </section>

        {/* ================= SEÇÃO PEDIDOS DE ORAÇÃO (PRESENCIAIS) ================= */}
        <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
            <HeartHandshake className="w-5 h-5 text-church-gold" />
            <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
              Pedidos de Oração (Presenciais)
            </h2>
          </div>

          {/* Lista de Pedidos */}
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {((getBlock('prayer')?.content || []) as PrayerItem[]).map(p => (
              <div key={p.id} className="flex items-start justify-between p-2.5 rounded-xl bg-church-parchment/60 border border-church-sand gap-3">
                <div className="text-sm font-sans flex-1">
                  {p.urgent && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider mr-2">
                      Urgente
                    </span>
                  )}
                  <span className="text-church-charcoal font-medium">{p.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePrayer(p.id)}
                  className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Formulário Novo Pedido */}
          <form onSubmit={handleAddPrayer} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Motivo da oração (Ex: Cirurgia da Irmã Maria)"
                value={prayerDesc}
                onChange={e => setPrayerDesc(e.target.value)}
                className="flex-1 text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/40 focus:border-church-gold outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-church-gold text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors shrink-0"
              >
                + Adicionar
              </button>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-title font-semibold text-church-charcoal">
              <input
                type="checkbox"
                checked={prayerUrgent}
                onChange={e => setPrayerUrgent(e.target.checked)}
                className="w-4 h-4 rounded text-church-gold focus:ring-church-gold"
              />
              Marcar como Caso Urgente (UTI, cirurgia iminente)
            </label>
          </form>
        </section>

        {/* ================= SEÇÃO PEDIDOS DO YOUTUBE ================= */}
        <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
            <Youtube className="w-5 h-5 text-red-600" />
            <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
              Pedidos do Chat do YouTube (Ao Vivo)
            </h2>
          </div>

          {/* Lista de Pedidos do YouTube */}
          <div className="space-y-2 mb-4">
            {((getBlock('youtube')?.content || []) as PrayerItem[]).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-100 gap-3">
                <span className="text-sm font-sans font-medium text-church-charcoal">{p.description}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveYoutube(p.id)}
                  className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Formulário YouTube */}
          <form onSubmit={handleAddYoutube} className="flex gap-2">
            <input
              type="text"
              placeholder="Cole aqui o pedido que chegou na transmissão..."
              value={youtubeDesc}
              onChange={e => setYoutubeDesc(e.target.value)}
              className="flex-1 text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/40 focus:border-red-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shrink-0"
            >
              + Enviar ao Púlpito
            </button>
          </form>
        </section>

        {/* ================= SEÇÃO CONJUNTOS (CHECKLIST) & OPORTUNIDADES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conjuntos */}
          <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
              <Users className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Conjuntos do Culto
              </h2>
            </div>

            <div className="space-y-2">
              {((getBlock('choirs')?.content || []) as ChoirItem[]).map(ch => (
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
          </section>

          {/* Oportunidades */}
          <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-church-sand pb-3">
              <Mic2 className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Oportunidades
              </h2>
            </div>

            <div className="space-y-2 mb-4">
              {((getBlock('opportunities')?.content || []) as OpportunityItem[]).map(op => (
                <div key={op.id} className="flex items-center justify-between p-2.5 rounded-xl bg-church-parchment/60 border border-church-sand">
                  <span className="font-title text-sm font-semibold text-church-charcoal">{op.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOpp(op.id)}
                    className="p-1.5 text-church-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddOpp} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do cantor ou grupo"
                value={oppName}
                onChange={e => setOppName(e.target.value)}
                className="flex-1 text-xs font-sans p-2.5 rounded-lg border border-church-sand bg-church-parchment/40 focus:border-church-gold outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-church-gold text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark transition-colors shrink-0"
              >
                + Adicionar
              </button>
            </form>
          </section>
        </div>

      </main>
    </div>
  );
};
