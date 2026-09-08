import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { UserRole, Room } from '../../types/liturgy';
import { BookOpen, Edit3, ShieldAlert, Plus, KeyRound, AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';
import { getRoomByCode, formatRoomCodeMask } from '../../services/neon';

export const JoinRoomModal: React.FC = () => {
  const { joinRoom, startNewService, overwriteExistingService, error: contextError } = useRoom();

  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem('docs_church_last_code') || '';
    } catch {
      return '';
    }
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('docs_church_last_role');
      if (saved === 'pastor' || saved === 'obreiro' || saved === 'controlador') return saved;
    } catch {}
    return 'pastor';
  });
  const [pin, setPin] = useState('');
  const [newTitle, setNewTitle] = useState('Culto de Celebração');
  const [newPin, setNewPin] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conflictRoom, setConflictRoom] = useState<Room | null>(null);

  // Formata o código automaticamente com máscara XXX-XXX sem precisar digitar o hífen
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRoomCodeMask(e.target.value);
    setCode(formatted);
    setLocalError(null);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (clean.length < 3) {
      setLocalError('Por favor, digite o código do culto.');
      return;
    }
    if (selectedRole === 'controlador' && pin.length < 4) {
      setLocalError('O papel de Controlador exige o PIN de 4 números.');
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    const result = await joinRoom(clean, selectedRole, pin);
    if (!result.success && result.error) {
      setLocalError(result.error);
    }
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setLocalError('O PIN do Controlador deve conter pelo menos 4 números.');
      return;
    }

    const preferred = customCode.trim() ? customCode.trim().toUpperCase() : undefined;

    setIsLoading(true);
    setLocalError(null);

    // Se informou um código personalizado, verifica previamente se ele já existe
    if (preferred) {
      try {
        const existing = await getRoomByCode(preferred);
        if (existing) {
          setIsLoading(false);
          setConflictRoom(existing);
          return;
        }
      } catch (err) {
        console.warn('Erro ao verificar código existente:', err);
      }
    }

    const result = await startNewService(newTitle, newPin, preferred);
    if (!result.success && result.error) {
      setLocalError(result.error);
    }
    setIsLoading(false);
  };

  // Abre a sala existente mantendo todo o histórico e pedidos anotados
  const handleOpenExisting = async () => {
    if (!conflictRoom) return;
    setIsLoading(true);
    setLocalError(null);
    const result = await joinRoom(conflictRoom.code, 'controlador', newPin);
    setIsLoading(false);
    if (result.success) {
      setConflictRoom(null);
    } else {
      setConflictRoom(null);
      setMode('join');
      setCode(conflictRoom.code);
      setSelectedRole('controlador');
      setLocalError(result.error || 'O PIN digitado não confere com o PIN gravado desta sala existente.');
    }
  };

  // Substitui a sala existente com uma folha limpa em branco
  const handleOverwriteExisting = async () => {
    if (!conflictRoom) return;
    setIsLoading(true);
    setLocalError(null);
    const result = await overwriteExistingService(conflictRoom.id, conflictRoom.code, newTitle, newPin);
    setIsLoading(false);
    if (result.success) {
      setConflictRoom(null);
    } else {
      setLocalError(result.error || 'Falha ao substituir sala.');
    }
  };

  return (
    <div className="min-h-screen bg-church-parchment flex flex-col items-center justify-center p-4">
      {/* Card Principal - Double-Bezel Architecture */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-church-sand p-6 sm:p-8 shadow-sheet">
        {/* Logotipo Horizontal Oficial */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/assets/logo-adutinga-horizontal.png" 
            alt="A.D. Utinga - Parque Novo Oratório" 
            className="w-56 sm:w-64 h-auto object-contain mb-2"
          />
          <p className="font-serif italic text-church-charcoal/80 text-sm">
            Sistema de Acompanhamento do Culto
          </p>
        </div>

        {/* Abas Alternar: Entrar no Culto vs Criar Novo */}
        <div className="flex rounded-xl bg-church-parchment p-1 border border-church-sand mb-6">
          <button
            type="button"
            onClick={() => { setMode('join'); setLocalError(null); }}
            className={`flex-1 py-2 text-xs font-title font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'join' 
                ? 'bg-white text-church-charcoal shadow-sm' 
                : 'text-church-muted hover:text-church-charcoal'
            }`}
          >
            Entrar no Culto
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setLocalError(null); }}
            className={`flex-1 py-2 text-xs font-title font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'create' 
                ? 'bg-white text-church-charcoal shadow-sm' 
                : 'text-church-muted hover:text-church-charcoal'
            }`}
          >
            Novo Culto
          </button>
        </div>

        {/* Mensagens de Erro */}
        {(localError || contextError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {localError || contextError}
          </div>
        )}

        {mode === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-5">
            {/* Campo do Código */}
            <div>
              <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-1.5 text-center">
                Código do Culto
              </label>
              <input
                type="text"
                maxLength={7}
                placeholder="EX: EBD-DOM"
                value={code}
                onChange={handleCodeChange}
                autoFocus
                className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-widest uppercase text-church-charcoal bg-church-parchment border-2 border-church-sand focus:border-church-gold rounded-xl py-3 outline-none transition-colors"
              />
            </div>

            {/* Escolha do Papel */}
            <div>
              <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2 text-center">
                Quem está usando agora?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('pastor'); setLocalError(null); }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    selectedRole === 'pastor'
                      ? 'border-church-gold bg-church-gold/10 text-church-gold-dark ring-2 ring-church-gold/20'
                      : 'border-church-sand bg-white text-church-charcoal hover:bg-church-parchment'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-1 text-church-gold" />
                  <span className="font-title text-xs font-bold uppercase">Púlpito</span>
                  <span className="text-[10px] text-church-muted font-sans mt-0.5">Altar</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedRole('obreiro'); setLocalError(null); }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    selectedRole === 'obreiro'
                      ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
                      : 'border-church-sand bg-white text-church-charcoal hover:bg-church-parchment'
                  }`}
                >
                  <Edit3 className="w-5 h-5 mb-1 text-blue-600" />
                  <span className="font-title text-xs font-bold uppercase">Obreiro</span>
                  <span className="text-[10px] text-church-muted font-sans mt-0.5">Apoio</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedRole('controlador'); setLocalError(null); }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    selectedRole === 'controlador'
                      ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-200'
                      : 'border-church-sand bg-white text-church-charcoal hover:bg-church-parchment'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 mb-1 text-purple-600" />
                  <span className="font-title text-xs font-bold uppercase">Direção</span>
                  <span className="text-[10px] text-church-muted font-sans mt-0.5">PIN</span>
                </button>
              </div>
            </div>

            {/* PIN Se for Controlador */}
            {selectedRole === 'controlador' && (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 animate-fadeIn">
                <div className="flex items-center gap-2 mb-1 text-purple-900">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-title font-bold uppercase tracking-wider">PIN da Cabine</span>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="PIN de 4 dígitos"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center text-lg font-mono font-bold tracking-widest bg-white border border-purple-300 focus:border-purple-500 rounded-lg py-1.5 outline-none"
                />
              </div>
            )}

            {/* Botão Acessar */}
            <button
              type="submit"
              disabled={isLoading || code.trim().length < 3}
              className="w-full py-3.5 px-4 rounded-xl font-title font-bold text-sm uppercase tracking-wider text-white bg-church-gold hover:bg-church-gold-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-soft-gold"
            >
              {isLoading ? 'Conectando...' : 'Acessar Culto'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-1">
                Nome do Culto
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Culto de Celebração - Domingo"
                className="w-full text-sm font-sans font-medium text-church-charcoal bg-church-parchment border border-church-sand focus:border-church-gold rounded-xl px-3 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-1">
                Código Personalizado da Sala (Opcional)
              </label>
              <input
                type="text"
                maxLength={7}
                value={customCode}
                onChange={(e) => setCustomCode(formatRoomCodeMask(e.target.value))}
                placeholder="Ex: EBD-DOM (ou deixe vazio para automático)"
                className="w-full text-center font-mono font-bold text-sm tracking-wider uppercase text-church-charcoal bg-church-parchment border border-church-sand focus:border-church-gold rounded-xl px-3 py-2.5 outline-none"
              />
              <p className="text-[11px] text-church-muted mt-1">
                Se deixar em branco, geraremos um código no formato XXX-XXX automaticamente.
              </p>
            </div>

            <div>
              <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-1">
                Definir PIN do Controlador (4 números)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="PIN de 4 dígitos"
                className="w-full text-center text-xl font-mono font-bold text-church-charcoal bg-church-parchment border border-church-sand focus:border-church-gold rounded-xl py-2 outline-none"
              />
              <p className="text-[11px] text-church-muted mt-1 text-center">
                Defina um PIN secreto para liberar avisos e edição da folha.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newTitle.trim() || newPin.length < 4}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-title font-bold text-sm uppercase tracking-wider text-white bg-church-gold hover:bg-church-gold-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-soft-gold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isLoading ? 'Criando no Neon...' : 'Iniciar Folha do Culto'}
            </button>
          </form>
        )}
      </div>

      {/* Rodapé discreto */}
      <footer className="mt-8 text-center text-xs text-church-muted font-serif italic">
        "Aqui chegamos pela fé!" — A.D. Utinga
      </footer>

      {/* Modal de Conflito: Sala Já Existente */}
      {conflictRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border-2 border-amber-300 p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-title font-bold text-base text-church-charcoal">
                  Sala Já Existente: {conflictRoom.code}
                </h3>
                <p className="text-xs text-church-muted">
                  Este código já está em uso por outro culto.
                </p>
              </div>
            </div>

            <div className="bg-church-parchment p-3.5 rounded-xl border border-church-sand space-y-2 text-xs">
              <div className="flex items-center justify-between text-church-charcoal font-medium">
                <span>Culto Atual:</span>
                <span className="font-bold text-church-gold-dark">{conflictRoom.title}</span>
              </div>
              <p className="text-church-charcoal/80 leading-relaxed pt-1 border-t border-church-sand/60">
                O que você deseja fazer com esta reunião?
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOpenExisting}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-title font-bold text-xs uppercase tracking-wider text-church-charcoal bg-church-sand/40 hover:bg-church-sand active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-church-sand"
              >
                <FolderOpen className="w-4 h-4 text-church-gold-dark shrink-0" />
                <span>Abrir Sala Existente (Manter Anotações)</span>
              </button>

              <button
                type="button"
                onClick={handleOverwriteExisting}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-title font-bold text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>Substituir (Iniciar Folha Limpa)</span>
              </button>

              <button
                type="button"
                onClick={() => setConflictRoom(null)}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-xl font-title font-bold text-xs text-church-muted hover:text-church-charcoal transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
