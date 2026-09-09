import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { 
  VisitorItem, 
  PrayerItem, 
  ChoirItem, 
  OpportunityItem 
} from '../../types/liturgy';
import { Header } from '../common/Header';
import { LoadingScreen } from '../common/LoadingScreen';
import { PulpitView } from '../pastor/PulpitView';
import { 
  UserPlus, 
  HeartHandshake, 
  Mic2, 
  Users, 
  Trash2, 
  Check,
  AlertTriangle,
  Pencil,
  X,
  Plus,
  Tablet,
  ClipboardCopy
} from 'lucide-react';
import { 
  formatVisitorsList, 
  formatPrayersList, 
  formatChoirsList, 
  formatOpportunitiesList, 
  copyTextToClipboard 
} from '../../utils/liturgyExport';
import { InteractiveLineSheet } from '../common/InteractiveLineSheet';

interface ObreiroEditorProps {
  showHeader?: boolean;
}

export const ObreiroEditor: React.FC<ObreiroEditorProps> = ({ showHeader = true }) => {
  const { room, blocks, updateBlock, appendItemsToBlock, removeItemFromBlock, role } = useRoom();

  const draftVisitorKey = room ? `docs_church_draft_visitors_${room.id}` : '';
  const draftPrayerKey = room ? `docs_church_draft_prayers_${room.id}` : '';
  const draftOppKey = room ? `docs_church_draft_opps_${room.id}` : '';

  // Estados de Prévia do Púlpito (Protegida contra toques acidentais para idosos)
  const [showPulpitConfirm, setShowPulpitConfirm] = useState(false);
  const [showPulpitPreview, setShowPulpitPreview] = useState(false);

  // Estados de Visitantes (Folha Pautada Contínua)
  const [visitorBatchText, setVisitorBatchText] = useState(() => {
    try {
      if (!room) return '';
      return localStorage.getItem(`docs_church_draft_visitors_${room.id}`) ||
             localStorage.getItem(`docs_church_draft_visitors_${room.code}`) || '';
    } catch {
      return '';
    }
  });
  const [visitorLines, setVisitorLines] = useState<string[]>(() => {
    try {
      if (!room) return Array(12).fill('');
      const saved = localStorage.getItem(`docs_church_draft_visitors_${room.id}`) ||
                    localStorage.getItem(`docs_church_draft_visitors_${room.code}`);
      if (saved) {
        const arr = saved.split('\n');
        if (arr.length > 0) return arr;
      }
    } catch {}
    return Array(12).fill('');
  });

  // Estados de Oração Presencial (Folha Pautada Contínua)
  const [prayerUrgent, setPrayerUrgent] = useState(false);
  const [prayerBatchText, setPrayerBatchText] = useState(() => {
    try {
      if (!room) return '';
      return localStorage.getItem(`docs_church_draft_prayers_${room.id}`) ||
             localStorage.getItem(`docs_church_draft_prayers_${room.code}`) || '';
    } catch {
      return '';
    }
  });
  const [prayerLines, setPrayerLines] = useState<string[]>(() => {
    try {
      if (!room) return Array(15).fill('');
      const saved = localStorage.getItem(`docs_church_draft_prayers_${room.id}`) ||
                    localStorage.getItem(`docs_church_draft_prayers_${room.code}`);
      if (saved) {
        const arr = saved.split('\n');
        if (arr.length > 0) return arr;
      }
    } catch {}
    return Array(15).fill('');
  });

  // Salva rascunho de visitantes no localStorage do tablet sem fazer requisições à Vercel
  const handleVisitorBatchTextChange = (text: string) => {
    setVisitorBatchText(text);
    const split = text.split('\n');
    setVisitorLines(split.length > 0 ? split : Array(12).fill(''));
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

  const handleVisitorLinesChange = (newLines: string[]) => {
    setVisitorLines(newLines);
    const nonBlank = newLines.map(l => l.trim()).filter(Boolean).join('\n');
    setVisitorBatchText(nonBlank);
    if (draftVisitorKey) {
      try {
        if (nonBlank) {
          localStorage.setItem(draftVisitorKey, nonBlank);
        } else {
          localStorage.removeItem(draftVisitorKey);
        }
      } catch (e) {}
    }
  };

  const handleClearVisitorBatch = () => {
    setVisitorBatchText('');
    setVisitorLines(Array(12).fill(''));
    if (draftVisitorKey) {
      try { localStorage.removeItem(draftVisitorKey); } catch (e) {}
    }
  };

  // Salva rascunho de oração no localStorage do tablet sem fazer requisições à Vercel
  const handlePrayerBatchTextChange = (text: string) => {
    setPrayerBatchText(text);
    const split = text.split('\n');
    setPrayerLines(split.length > 0 ? split : Array(15).fill(''));
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

  const handlePrayerLinesChange = (newLines: string[]) => {
    setPrayerLines(newLines);
    const nonBlank = newLines.map(l => l.trim()).filter(Boolean).join('\n');
    setPrayerBatchText(nonBlank);
    if (draftPrayerKey) {
      try {
        if (nonBlank) {
          localStorage.setItem(draftPrayerKey, nonBlank);
        } else {
          localStorage.removeItem(draftPrayerKey);
        }
      } catch (e) {}
    }
  };

  const handleClearPrayerBatch = () => {
    setPrayerBatchText('');
    setPrayerLines(Array(15).fill(''));
    if (draftPrayerKey) {
      try { localStorage.removeItem(draftPrayerKey); } catch (e) {}
    }
  };

  // Estados de Oportunidades (Folha Pautada com 4 linhas)
  const [oppBatchText, setOppBatchText] = useState(() => {
    try {
      if (!room) return '';
      return localStorage.getItem(`docs_church_draft_opps_${room.id}`) ||
             localStorage.getItem(`docs_church_draft_opps_${room.code}`) || '';
    } catch {
      return '';
    }
  });
  const [oppLines, setOppLines] = useState<string[]>(() => {
    try {
      if (!room) return Array(4).fill('');
      const saved = localStorage.getItem(`docs_church_draft_opps_${room.id}`) ||
                    localStorage.getItem(`docs_church_draft_opps_${room.code}`);
      if (saved) {
        const arr = saved.split('\n');
        if (arr.length > 0) return arr;
      }
    } catch {}
    return Array(4).fill('');
  });

  // Salva rascunho de oportunidades no localStorage do tablet sem fazer requisições à Vercel
  const handleOppBatchTextChange = (text: string) => {
    setOppBatchText(text);
    const split = text.split('\n');
    setOppLines(split.length > 0 ? split : Array(4).fill(''));
    if (draftOppKey) {
      try {
        if (text.trim()) {
          localStorage.setItem(draftOppKey, text);
        } else {
          localStorage.removeItem(draftOppKey);
        }
      } catch (e) {}
    }
  };

  const handleOppLinesChange = (newLines: string[]) => {
    setOppLines(newLines);
    const nonBlank = newLines.map(l => l.trim()).filter(Boolean).join('\n');
    setOppBatchText(nonBlank);
    if (draftOppKey) {
      try {
        if (nonBlank) {
          localStorage.setItem(draftOppKey, nonBlank);
        } else {
          localStorage.removeItem(draftOppKey);
        }
      } catch (e) {}
    }
  };

  const handleClearOppBatch = () => {
    setOppBatchText('');
    setOppLines(Array(4).fill(''));
    if (draftOppKey) {
      try { localStorage.removeItem(draftOppKey); } catch (e) {}
    }
  };

  // Estados para Correção em Linha Pautada (Oportunidades)
  const [editingOppId, setEditingOppId] = useState<string | null>(null);
  const [editingOppText, setEditingOppText] = useState('');

  // Estados de Conjuntos do Culto (Gestão pelo Controlador)
  const [newChoirName, setNewChoirName] = useState('');
  const [editingChoirId, setEditingChoirId] = useState<string | null>(null);
  const [editingChoirName, setEditingChoirName] = useState('');

  // Modal de Confirmação para Exclusão em Massa (Controlador)
  const [confirmModal, setConfirmModal] = useState<{ type: 'visitors' | 'prayers'; count: number } | null>(null);

  // Estados para Correção em Linha Pautada (Visitantes)
  const [editingVisitorId, setEditingVisitorId] = useState<string | null>(null);
  const [editingVisitorText, setEditingVisitorText] = useState('');

  // Estados para Correção em Linha Pautada (Pedidos de Oração)
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [editingPrayerText, setEditingPrayerText] = useState('');

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  if (!room) return <LoadingScreen />;

  const showFeedback = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  // Encontra bloco por tipo
  const getBlock = (type: string) => blocks.find(b => b.block_type === type);

  // Rolagem suave para o elemento em edição, com fallback 100% compatível com Android 4.4.4 (Chrome 30)
  const scrollToEditItem = (elementId: string) => {
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        try {
          // Navegadores modernos
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch {
          // Android 4.4.4 (Chrome 30) e WebViews legados
          el.scrollIntoView(false);
        }
      }
    }, 60);
  };

  // Inicia correção de visitante na linha pautada
  const handleStartEditVisitor = (v: VisitorItem) => {
    setEditingVisitorId(v.id);
    setEditingVisitorText(v.church ? `${v.name} (${v.church})` : v.name);
    scrollToEditItem(`editing-visitor-${v.id}`);
  };

  // Salva correção de visitante e sincroniza imediatamente com o púlpito
  const handleSaveEditVisitor = async (id: string) => {
    if (!editingVisitorText.trim()) return;
    const block = getBlock('visitors');
    if (!block) return;

    const match = editingVisitorText.match(/^([^(]+)(?:\(([^)]+)\))?/);
    const name = match ? match[1].trim() : editingVisitorText.trim();
    const church = match && match[2] ? match[2].trim() : undefined;

    const current = (block.content || []) as VisitorItem[];
    const updated = current.map(item => 
      item.id === id ? { ...item, name, church } : item
    );

    await updateBlock(block.id, updated);
    setEditingVisitorId(null);
    setEditingVisitorText('');
    showFeedback('Visitante corrigido com sucesso!');
  };

  // Inicia correção de pedido de oração na linha pautada
  const handleStartEditPrayer = (p: PrayerItem) => {
    setEditingPrayerId(p.id);
    setEditingPrayerText(p.description);
    scrollToEditItem(`editing-prayer-${p.id}`);
  };

  // Salva correção de pedido de oração e sincroniza imediatamente com o púlpito
  const handleSaveEditPrayer = async (id: string) => {
    if (!editingPrayerText.trim()) return;
    const block = getBlock('prayer');
    if (!block) return;

    const current = (block.content || []) as PrayerItem[];
    const updated = current.map(item => 
      item.id === id ? { ...item, description: editingPrayerText.trim() } : item
    );

    await updateBlock(block.id, updated);
    setEditingPrayerId(null);
    setEditingPrayerText('');
    showFeedback('Pedido de oração corrigido com sucesso!');
  };

  // Inicia correção de oportunidade na linha pautada
  const handleStartEditOpp = (op: OpportunityItem) => {
    setEditingOppId(op.id);
    setEditingOppText(op.name);
    scrollToEditItem(`editing-opp-${op.id}`);
  };

  // Salva correção de oportunidade e sincroniza imediatamente com o púlpito
  const handleSaveEditOpp = async (id: string) => {
    if (!editingOppText.trim()) return;
    const block = getBlock('opportunities');
    if (!block) return;

    const current = (block.content || []) as OpportunityItem[];
    const updated = current.map(item => 
      item.id === id ? { ...item, name: editingOppText.trim() } : item
    );

    await updateBlock(block.id, updated);
    setEditingOppId(null);
    setEditingOppText('');
    showFeedback('Oportunidade corrigida com sucesso!');
  };

  // Adiciona Visitantes em Lote (com blindagem atômica de concorrência e filtro de linhas vazias)
  const handleAddBatchVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    const linesToProcess = visitorLines.some(l => l.trim().length > 0)
      ? visitorLines.map(l => l.trim()).filter(l => l.length > 0)
      : visitorBatchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (linesToProcess.length === 0) return;

    const block = getBlock('visitors');
    if (!block) return;

    const newItems: VisitorItem[] = linesToProcess.map((line, idx) => {
      // Se tiver parênteses ex: "Irmão Carlos (Igreja Batista)"
      const match = line.match(/^([^(]+)(?:\(([^)]+)\))?/);
      const name = match ? match[1].trim() : line;
      const church = match && match[2] ? match[2].trim() : undefined;

      return {
        id: `${Date.now()}_v_${idx}`,
        name,
        church,
      };
    });

    appendItemsToBlock(block.id, newItems);
    handleClearVisitorBatch();
    // Mantém no modo de lote para que o irmão continue anotando os próximos
    showFeedback(`${newItems.length} visitante(s) adicionados ao púlpito! Se precisar corrigir algum nome, toque em Corrigir logo abaixo.`);
  };

  // Remove Visitante (atômico sem flicker)
  const handleRemoveVisitor = (id: string) => {
    const block = getBlock('visitors');
    if (!block) return;
    removeItemFromBlock(block.id, id);
  };

  // Adiciona Lote de Pedidos Presenciais (com blindagem atômica de concorrência e filtro de linhas vazias)
  const handleAddBatchPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    const linesToProcess = prayerLines.some(l => l.trim().length > 0)
      ? prayerLines.map(l => l.trim()).filter(l => l.length > 0)
      : prayerBatchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (linesToProcess.length === 0) return;

    const block = getBlock('prayer');
    if (!block) return;

    const newItems: PrayerItem[] = linesToProcess.map((desc, idx) => ({
      id: `${Date.now()}_${idx}`,
      description: desc,
      urgent: prayerUrgent,
    }));

    appendItemsToBlock(block.id, newItems);
    handleClearPrayerBatch();
    setPrayerUrgent(false);
    // Mantém no modo de lote para que o irmão continue anotando os próximos
    showFeedback(`${newItems.length} pedido(s) de oração adicionados ao púlpito! Se precisar corrigir algum motivo, toque em Corrigir logo abaixo.`);
  };

  // Remove Pedido Presencial (atômico sem flicker)
  const handleRemovePrayer = (id: string) => {
    const block = getBlock('prayer');
    if (!block) return;
    removeItemFromBlock(block.id, id);
  };

  // Adiciona Lote de Oportunidades (Folha Pautada com 4 linhas) com blindagem atômica de concorrência
  const handleAddBatchOpp = (e: React.FormEvent) => {
    e.preventDefault();
    const linesToProcess = oppLines.some(l => l.trim().length > 0)
      ? oppLines.map(l => l.trim()).filter(l => l.length > 0)
      : oppBatchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (linesToProcess.length === 0) return;

    const block = getBlock('opportunities');
    if (!block) return;

    const newItems: OpportunityItem[] = linesToProcess.map((name, idx) => ({
      id: `${Date.now()}_opp_${idx}`,
      name,
    }));

    appendItemsToBlock(block.id, newItems);
    handleClearOppBatch();
    showFeedback(`${newItems.length} oportunidade(s) adicionada(s) ao púlpito! Se precisar corrigir algum nome, toque em Corrigir logo abaixo.`);
  };

  // Remove Oportunidade
  const handleRemoveOpp = (id: string) => {
    const block = getBlock('opportunities');
    if (!block) return;
    removeItemFromBlock(block.id, id);
  };

  // Alterna Checkbox de Conjunto
  const handleToggleChoir = (id: string) => {
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    const updated = current.map(ch => ch.id === id ? { ...ch, checked: !ch.checked } : ch);
    updateBlock(block.id, updated);
  };

  // Adiciona novo departamento (Controlador) (com blindagem atômica de concorrência)
  const handleAddChoir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoirName.trim()) return;
    const block = getBlock('choirs');
    if (!block) return;

    const newItem: ChoirItem = {
      id: Date.now().toString(),
      name: newChoirName.trim(),
      checked: true,
    };

    appendItemsToBlock(block.id, [newItem]);
    setNewChoirName('');
    showFeedback('Departamento adicionado com sucesso!');
  };

  // Salva renomeação de departamento (Controlador)
  const handleSaveChoirName = (id: string) => {
    if (!editingChoirName.trim()) return;
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    const updated = current.map(ch => ch.id === id ? { ...ch, name: editingChoirName.trim() } : ch);
    updateBlock(block.id, updated);
    setEditingChoirId(null);
    setEditingChoirName('');
    showFeedback('Nome do departamento atualizado!');
  };

  // Exclui departamento (Controlador)
  const handleDeleteChoir = (id: string) => {
    const block = getBlock('choirs');
    if (!block) return;

    const current = (block.content || []) as ChoirItem[];
    updateBlock(block.id, current.filter(ch => ch.id !== id));
    showFeedback('Departamento removido.');
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
        
        {/* ================= SEÇÃO VISITANTES ================= */}
        <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-church-gold" />
              <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                Visitantes do Culto
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">
                {visitorsList.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de Cópia Rápida para o Controlador */}
              {role === 'controlador' && visitorsList.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    const text = formatVisitorsList(visitorsList);
                    const success = await copyTextToClipboard(text);
                    if (success) showFeedback('Lista de visitantes copiada para a área de transferência!');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  title="Copiar lista de visitantes formatada para o Google Docs ou Bloco de Notas"
                >
                  <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copiar</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. ÁREA DE DIGITAÇÃO LOGO NO TOPO (FOLHA PAUTADA CONTÍNUA) */}
          <form onSubmit={handleAddBatchVisitor} className="space-y-4">
            <InteractiveLineSheet
              lines={visitorLines}
              onChange={handleVisitorLinesChange}
              rawText={visitorBatchText}
              onChangeRawText={handleVisitorBatchTextChange}
              firstEmptyPlaceholder="Toque aqui para digitar o próximo visitante..."
              showModeToggle={false}
              showHeader={false}
              hasDraft={Boolean(visitorBatchText.trim() || visitorLines.some(l => l.trim().length > 0))}
            />
            <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
              <button
                type="submit"
                disabled={!visitorLines.some(l => l.trim().length > 0) && !visitorBatchText.trim()}
                className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
              >
                + Adicionar Todos à Lista
              </button>
              {(visitorBatchText.trim() || visitorLines.some(l => l.trim().length > 0)) && (
                <button
                  type="button"
                  onClick={handleClearVisitorBatch}
                  className="px-4 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
                >
                  Limpar Folha
                </button>
              )}
            </div>
          </form>

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
              <div className="space-y-2">
                {visitorsList.map((v, idx) => {
                  const isEditing = editingVisitorId === v.id;

                  if (isEditing) {
                    return (
                      <div key={v.id} id={`editing-visitor-${v.id}`} className="p-3.5 rounded-xl bg-amber-50/70 border-2 border-church-gold shadow-sm space-y-3 transition-all">
                        <div className="flex items-center justify-between text-[11px] text-church-gold-dark font-title font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-church-gold" />
                            <span>Corrigindo Linha Nº {idx + 1}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 py-1 px-2 rounded-lg bg-white border border-church-gold/40 focus-within:border-church-gold shadow-2xs">
                          <span className="w-6 text-right pr-1 text-xs font-mono font-bold text-church-gold-dark shrink-0 self-start pt-2">{idx + 1}.</span>
                          <textarea
                            rows={1}
                            value={editingVisitorText}
                            onChange={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.max(36, e.target.scrollHeight)}px`;
                              setEditingVisitorText(e.target.value);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditVisitor(v.id);
                              } else if (e.key === 'Escape') {
                                setEditingVisitorId(null);
                              }
                            }}
                            ref={el => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${Math.max(36, el.scrollHeight)}px`;
                              }
                            }}
                            autoFocus
                            className="flex-1 bg-transparent py-1.5 px-1 text-sm sm:text-base font-sans text-church-charcoal border-b-2 border-church-gold outline-none resize-none overflow-hidden leading-relaxed break-words font-medium"
                            style={{ minHeight: '36px' }}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-church-sand/50">
                          <button
                            type="button"
                            onClick={() => setEditingVisitorId(null)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-title font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                            title="Cancelar correção"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditVisitor(v.id)}
                            disabled={!editingVisitorText.trim()}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-title font-bold uppercase tracking-wider bg-church-gold text-white hover:bg-church-gold-dark shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Salvar Alteração</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-church-parchment/60 border border-church-sand hover:bg-church-parchment transition-colors">
                      <div className="text-sm font-sans">
                        <span className="font-mono text-xs font-bold text-church-gold-dark mr-1.5">{idx + 1}.</span>
                        <span className="font-semibold text-church-charcoal">{v.name}</span>
                        {v.church && <span className="text-church-muted text-xs"> ({v.church})</span>}
                        {v.invited_by && <span className="text-church-muted text-xs block sm:inline sm:ml-2">Convidado por: {v.invited_by}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditVisitor(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider text-church-gold-dark bg-church-gold/15 hover:bg-church-gold/25 border border-church-gold/30 transition-colors cursor-pointer"
                          title="Corrigir este visitante"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Corrigir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVisitor(v.id)}
                          className="p-1.5 text-church-muted hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir este visitante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">
                {prayersList.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de Cópia Rápida para o Controlador */}
              {role === 'controlador' && prayersList.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    const text = formatPrayersList(prayersList);
                    const success = await copyTextToClipboard(text);
                    if (success) showFeedback('Pedidos de oração copiados para a área de transferência!');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  title="Copiar pedidos de oração formatados para o Google Docs ou Bloco de Notas"
                >
                  <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copiar</span>
                </button>
              )}

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
            </div>
          </div>

          {/* 1. ÁREA DE DIGITAÇÃO LOGO NO TOPO (FOLHA PAUTADA CONTÍNUA) */}
          <form onSubmit={handleAddBatchPrayer} className="space-y-4">
            <InteractiveLineSheet
              lines={prayerLines}
              onChange={handlePrayerLinesChange}
              rawText={prayerBatchText}
              onChangeRawText={handlePrayerBatchTextChange}
              firstEmptyPlaceholder="Toque aqui para digitar o próximo pedido de oração..."
              showModeToggle={false}
              showHeader={false}
              minLines={15}
              hasDraft={Boolean(prayerBatchText.trim() || prayerLines.some(l => l.trim().length > 0))}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!prayerLines.some(l => l.trim().length > 0) && !prayerBatchText.trim()}
                  className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  + Adicionar Todos os Pedidos
                </button>
                {(prayerBatchText.trim() || prayerLines.some(l => l.trim().length > 0)) && (
                  <button
                    type="button"
                    onClick={handleClearPrayerBatch}
                    className="px-3 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
                  >
                    Limpar Folha
                  </button>
                )}
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-serif italic text-church-muted hover:text-church-charcoal transition-colors select-none">
                <input
                  type="checkbox"
                  checked={prayerUrgent}
                  onChange={e => setPrayerUrgent(e.target.checked)}
                  className="w-4 h-4 rounded text-church-gold focus:ring-church-gold"
                />
                <span>Marcar todos deste grupo como Caso Urgente</span>
              </label>
            </div>
          </form>

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
              <div className="space-y-2">
                {prayersList.map((p, idx) => {
                  const isEditing = editingPrayerId === p.id;

                  if (isEditing) {
                    return (
                      <div key={p.id} id={`editing-prayer-${p.id}`} className="p-3.5 rounded-xl bg-amber-50/70 border-2 border-church-gold shadow-sm space-y-3 transition-all">
                        <div className="flex items-center justify-between text-[11px] text-church-gold-dark font-title font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-church-gold" />
                            <span>Corrigindo Linha Nº {idx + 1}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 py-1 px-2 rounded-lg bg-white border border-church-gold/40 focus-within:border-church-gold shadow-2xs">
                          <span className="w-6 text-right pr-1 text-xs font-mono font-bold text-church-gold-dark shrink-0 self-start pt-2">{idx + 1}.</span>
                          <textarea
                            rows={1}
                            value={editingPrayerText}
                            onChange={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.max(36, e.target.scrollHeight)}px`;
                              setEditingPrayerText(e.target.value);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditPrayer(p.id);
                              } else if (e.key === 'Escape') {
                                setEditingPrayerId(null);
                              }
                            }}
                            ref={el => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${Math.max(36, el.scrollHeight)}px`;
                              }
                            }}
                            autoFocus
                            className="flex-1 bg-transparent py-1.5 px-1 text-sm sm:text-base font-sans text-church-charcoal border-b-2 border-church-gold outline-none resize-none overflow-hidden leading-relaxed break-words font-medium"
                            style={{ minHeight: '36px' }}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-church-sand/50">
                          <button
                            type="button"
                            onClick={() => setEditingPrayerId(null)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-title font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                            title="Cancelar correção"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditPrayer(p.id)}
                            disabled={!editingPrayerText.trim()}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-title font-bold uppercase tracking-wider bg-church-gold text-white hover:bg-church-gold-dark shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Salvar Alteração</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={p.id} className="flex items-start justify-between p-3 rounded-xl bg-church-parchment/60 border border-church-sand gap-3 hover:bg-church-parchment transition-colors">
                      <div className="text-sm font-sans flex-1">
                        <span className="font-mono text-xs font-bold text-church-gold-dark mr-1.5">{idx + 1}.</span>
                        {p.urgent && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider mr-2">
                            Urgente
                          </span>
                        )}
                        <span className="text-church-charcoal font-medium">{p.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditPrayer(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider text-church-gold-dark bg-church-gold/15 hover:bg-church-gold/25 border border-church-gold/30 transition-colors cursor-pointer"
                          title="Corrigir este pedido"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Corrigir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePrayer(p.id)}
                          className="p-1.5 text-church-muted hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir este pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ================= SEÇÃO DEPARTAMENTOS (CONTROLADOR) & OPORTUNIDADES ================= */}
        <div className={`grid gap-6 ${role === 'controlador' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Departamentos - VISÍVEL E EDITÁVEL EXCLUSIVAMENTE PELO CONTROLADOR */}
          {role === 'controlador' && (
            <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-church-gold" />
                    <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                      Departamentos do Culto
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-title font-bold px-2.5 py-0.5 rounded-full bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">
                      {choirsList.filter(c => c.checked).length} Confirmados
                    </span>
                    {choirsList.filter(c => c.checked).length > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const text = formatChoirsList(choirsList.filter(c => c.checked));
                          const success = await copyTextToClipboard(text);
                          if (success) showFeedback('Departamentos confirmados copiados para a área de transferência!');
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        title="Copiar departamentos confirmados para o Google Docs ou Bloco de Notas"
                      >
                        <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copiar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Adicionar Novo Departamento */}
                <form onSubmit={handleAddChoir} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Novo departamento (Ex: Mocidade, Círculo de Oração, Varões)..."
                    value={newChoirName}
                    onChange={e => setNewChoirName(e.target.value)}
                    className="flex-1 min-w-0 text-xs font-sans p-2.5 rounded-xl border border-church-sand bg-church-parchment/40 focus:border-church-gold focus:bg-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newChoirName.trim()}
                    className="px-3 sm:px-3.5 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    title="Adicionar à lista de departamentos"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </form>

                {/* Lista de Departamentos Cadastrados com Edição e Exclusão */}
                <div className="space-y-2">
                  {choirsList.length === 0 ? (
                    <p className="font-serif italic text-church-muted text-xs p-3 text-center border border-dashed border-church-sand rounded-xl">
                      Nenhum departamento cadastrado. Adicione um departamento no campo acima.
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
                              title="Renomear departamento"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChoir(ch.id)}
                              className="p-1.5 text-church-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir departamento"
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
                * Toque no botão de status para marcar nos Departamentos do púlpito. Use o lápis para renomear ou a lixeira para excluir.
              </p>
            </section>
          )}

          {/* Oportunidades */}
          <section className="bg-white rounded-2xl border border-church-sand p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 border-b border-church-sand pb-3">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-church-gold" />
                  <h2 className="font-title text-sm font-bold uppercase tracking-wide text-church-charcoal">
                    Oportunidades
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-title font-bold bg-church-gold/15 text-church-gold-dark whitespace-nowrap shrink-0">
                    {oppsList.length}
                  </span>
                </div>
                {role === 'controlador' && oppsList.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      const text = formatOpportunitiesList(oppsList);
                      const success = await copyTextToClipboard(text);
                      if (success) showFeedback('Oportunidades copiadas para a área de transferência!');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-title font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                    title="Copiar oportunidades formatadas para o Google Docs ou Bloco de Notas"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copiar</span>
                  </button>
                )}
              </div>

              {/* 1. ÁREA DE DIGITAÇÃO (FOLHA PAUTADA CONTÍNUA COM 4 LINHAS) */}
              <form onSubmit={handleAddBatchOpp} className="space-y-4 mb-4 pb-4 border-b border-church-sand/40">
                <InteractiveLineSheet
                  lines={oppLines}
                  onChange={handleOppLinesChange}
                  rawText={oppBatchText}
                  onChangeRawText={handleOppBatchTextChange}
                  firstEmptyPlaceholder="Toque aqui para digitar o próximo cantor ou grupo..."
                  showModeToggle={false}
                  showHeader={false}
                  minLines={4}
                  hasDraft={Boolean(oppBatchText.trim() || oppLines.some(l => l.trim().length > 0))}
                />
                <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={!oppLines.some(l => l.trim().length > 0) && !oppBatchText.trim()}
                    className="px-6 py-2.5 bg-church-gold text-white rounded-xl font-title text-xs font-bold uppercase tracking-wider hover:bg-church-gold-dark disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                  >
                    + Adicionar Todos à Lista
                  </button>
                  {(oppBatchText.trim() || oppLines.some(l => l.trim().length > 0)) && (
                    <button
                      type="button"
                      onClick={handleClearOppBatch}
                      className="px-3 py-2 text-church-muted hover:text-church-charcoal text-xs font-sans font-medium transition-colors cursor-pointer"
                    >
                      Limpar Folha
                    </button>
                  )}
                </div>
              </form>

              {/* 2. LISTA DE OPORTUNIDADES JÁ CADASTRADAS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-church-muted font-title uppercase tracking-wider pb-1">
                  <span>Cantores Cadastrados ({oppsList.length})</span>
                  <span className="text-[10px] lowercase text-church-muted font-sans font-normal italic">
                    Atualizado em tempo real no púlpito
                  </span>
                </div>
                {oppsList.length === 0 ? (
                  <p className="font-serif italic text-church-muted text-xs p-2">Nenhuma oportunidade adicionada ainda.</p>
                ) : (
                  oppsList.map((op, idx) => {
                    const isEditing = editingOppId === op.id;

                    if (isEditing) {
                      return (
                        <div key={op.id} id={`editing-opp-${op.id}`} className="p-3.5 rounded-xl bg-amber-50/70 border-2 border-church-gold shadow-sm space-y-3 transition-all">
                          <div className="flex items-center justify-between text-[11px] text-church-gold-dark font-title font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-church-gold" />
                              <span>Corrigindo Linha Nº {idx + 1}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 py-1 px-2 rounded-lg bg-white border border-church-gold/40 focus-within:border-church-gold shadow-2xs">
                            <span className="w-6 text-right pr-1 text-xs font-mono font-bold text-church-gold-dark shrink-0 self-start pt-2">{idx + 1}.</span>
                            <textarea
                              rows={1}
                              value={editingOppText}
                              onChange={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.max(36, e.target.scrollHeight)}px`;
                                setEditingOppText(e.target.value);
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEditOpp(op.id);
                                } else if (e.key === 'Escape') {
                                  setEditingOppId(null);
                                }
                              }}
                              ref={el => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = `${Math.max(36, el.scrollHeight)}px`;
                                }
                              }}
                              autoFocus
                              className="flex-1 bg-transparent py-1.5 px-1 text-sm sm:text-base font-sans text-church-charcoal border-b-2 border-church-gold outline-none resize-none overflow-hidden leading-relaxed break-words font-medium"
                              style={{ minHeight: '36px' }}
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-church-sand/50">
                            <button
                              type="button"
                              onClick={() => setEditingOppId(null)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-title font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                              title="Cancelar correção"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditOpp(op.id)}
                              disabled={!editingOppText.trim()}
                              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-title font-bold uppercase tracking-wider bg-church-gold text-white hover:bg-church-gold-dark shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              <span>Salvar Alteração</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={op.id} className="flex items-center justify-between p-2.5 rounded-xl bg-church-parchment/60 border border-church-sand hover:bg-church-parchment transition-colors">
                        <div className="text-sm font-sans flex-1">
                          <span className="font-mono text-xs font-bold text-church-gold-dark mr-1.5">{idx + 1}.</span>
                          <span className="font-title text-sm font-semibold text-church-charcoal">{op.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditOpp(op)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-title font-bold uppercase tracking-wider text-church-gold-dark bg-church-gold/15 hover:bg-church-gold/25 border border-church-gold/30 transition-colors cursor-pointer"
                            title="Corrigir esta oportunidade"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Corrigir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOpp(op.id)}
                            className="p-1.5 text-church-muted hover:text-red-600 transition-colors cursor-pointer"
                            title="Remover oportunidade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
                onClick={() => setShowPulpitPreview(false)}
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
