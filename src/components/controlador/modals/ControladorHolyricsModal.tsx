import React, { useState } from 'react';
import { Tv, X, Check, AlertCircle, Loader2, Link2, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { testHolyricsEndpoint, ConnectionTestResult } from '../../holyrics/utils/testHolyricsConnection';

export interface ControladorHolyricsModalProps {
  isOpen: boolean;
  hasHolyrics: boolean;
  onClose: () => void;
  onSave: (url: string | null, adminKey: string) => Promise<{ success: boolean; error?: string } | boolean>;
}

export const ControladorHolyricsModal: React.FC<ControladorHolyricsModalProps> = ({
  isOpen,
  hasHolyrics,
  onClose,
  onSave
}) => {
  const [url, setUrl] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setUrl('');
    setAdminKey('');
    setTestResult(null);
    setErrorMessage(null);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    const result = await testHolyricsEndpoint(url);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleExecute = async (targetUrl: string | null) => {
    if (!adminKey.trim()) return setErrorMessage('Informe a Chave Mestra de Administração.');
    if (targetUrl !== null && !targetUrl.trim()) return setErrorMessage('Informe o endereço do Holyrics.');

    setIsSaving(true);
    setErrorMessage(null);
    const currentKey = adminKey.trim();
    setAdminKey(''); // Limpa a chave da memória imediatamente (Zero Leaks)

    const res = await onSave(targetUrl ? targetUrl.trim() : null, currentKey);
    setIsSaving(false);

    if (typeof res === 'object' && !res.success) {
      setErrorMessage(res.error || 'Chave Mestra incorreta ou falha ao salvar.');
    } else if (res) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-church-sand/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-title text-sm sm:text-base font-bold text-church-charcoal uppercase tracking-wider">
                Integração Holyrics (Telão)
              </h3>
              <p className="font-sans text-[11px] text-church-muted">Transmissão nativa para o púlpito</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="p-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-stone-100 transition-colors" title="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasHolyrics && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Integração Ativa:</strong> Endereço protegido no servidor (oculto por segurança).</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-title font-bold text-church-charcoal uppercase tracking-wider mb-1.5">
              {hasHolyrics ? 'Novo Endereço do Holyrics (Substituir):' : 'Endereço do Holyrics (ngrok ou IP local):'}
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setTestResult(null); setErrorMessage(null); }}
                placeholder="Ex: https://igreja-pno.ngrok-free.app"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-sans text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-title font-bold text-church-charcoal uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-purple-900">
              <KeyRound className="w-3.5 h-3.5 text-purple-700" />
              <span>Chave Mestra de Administração:</span>
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={adminKey}
              onChange={(e) => { setAdminKey(e.target.value); setErrorMessage(null); }}
              placeholder="Digite a Chave Mestra para autorizar a alteração"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-sans text-xs transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-title text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-purple-700" />}
              <span>{isTesting ? 'Testando...' : 'Testar Link'}</span>
            </button>

            {hasHolyrics && (
              <button
                type="button"
                onClick={() => handleExecute(null)}
                disabled={isSaving}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-title text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desativar Integração</span>
              </button>
            )}
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${testResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
              {testResult.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              <span className="leading-tight">{testResult.message}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-xl text-xs flex items-start gap-2 border bg-red-50 text-red-900 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-church-sand/60">
          <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl text-xs font-title font-medium text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleExecute(url)}
            disabled={isSaving || !url.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-title text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Salvar com Chave Mestra</span>
          </button>
        </div>
      </div>
    </div>
  );
};
