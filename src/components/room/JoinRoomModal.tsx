import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { UserRole } from '../../types/liturgy';
import { BookOpen, Edit3, ShieldAlert, Sparkles, KeyRound } from 'lucide-react';

export const JoinRoomModal: React.FC = () => {
  const { joinRoom, startNewService, error: contextError } = useRoom();

  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('pastor');
  const [pin, setPin] = useState('');
  const [newTitle, setNewTitle] = useState('Culto de Celebração');
  const [newPin, setNewPin] = useState('1234');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formata o código conforme a pessoa digita (ex: 742-890)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(raw);
    setLocalError(null);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 5) {
      setLocalError('Por favor, digite o código de 6 números.');
      return;
    }
    if (selectedRole === 'controlador' && pin.length < 4) {
      setLocalError('O papel de Controlador exige o PIN de 4 números.');
      return;
    }

    setIsLoading(true);
    setLocalError(null);
    const result = await joinRoom(code, selectedRole, pin);
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

    setIsLoading(true);
    setLocalError(null);
    const result = await startNewService(newTitle, newPin);
    if (!result.success && result.error) {
      setLocalError(result.error);
    }
    setIsLoading(false);
  };

  const formattedCode = code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;

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
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={7}
                placeholder="Ex: 742-890"
                value={formattedCode}
                onChange={handleCodeChange}
                autoFocus
                className="w-full text-center text-3xl font-mono font-bold tracking-widest text-church-charcoal bg-church-parchment border-2 border-church-sand focus:border-church-gold rounded-xl py-3 outline-none transition-colors"
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
                  <span className="font-title text-xs font-bold uppercase">Pastor</span>
                  <span className="text-[10px] text-church-muted font-sans mt-0.5">Púlpito</span>
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
                  placeholder="PIN de 4 dígitos (Ex: 1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center text-lg font-mono font-bold tracking-widest bg-white border border-purple-300 focus:border-purple-500 rounded-lg py-1.5 outline-none"
                />
              </div>
            )}

            {/* Botão Acessar */}
            <button
              type="submit"
              disabled={isLoading || code.length < 5}
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
                placeholder="Ex: Culto de Domingo - 06/09"
                className="w-full text-sm font-sans font-medium text-church-charcoal bg-church-parchment border border-church-sand focus:border-church-gold rounded-xl px-3 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-1">
                PIN do Controlador (4 números)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ex: 1234"
                className="w-full text-center text-xl font-mono font-bold text-church-charcoal bg-church-parchment border border-church-sand focus:border-church-gold rounded-xl py-2 outline-none"
              />
              <p className="text-[11px] text-church-muted mt-1 text-center">
                Guarde este PIN para poder disparar avisos e controlar a folha.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newTitle.trim()}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-title font-bold text-sm uppercase tracking-wider text-white bg-church-gold hover:bg-church-gold-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-soft-gold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Criando no Neon...' : 'Iniciar Folha do Culto'}
            </button>
          </form>
        )}
      </div>

      {/* Rodapé discreto */}
      <footer className="mt-8 text-center text-xs text-church-muted font-serif italic">
        "Aqui chegamos pela fé!" — A.D. Utinga
      </footer>
    </div>
  );
};
