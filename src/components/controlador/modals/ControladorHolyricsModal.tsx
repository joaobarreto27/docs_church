import React, { useState } from 'react';
import { Tv, X, Check, AlertCircle, Loader2, Link2, Trash2 } from 'lucide-react';
import { testHolyricsEndpoint, ConnectionTestResult } from '../../holyrics/utils/testHolyricsConnection';

export interface ControladorHolyricsModalProps {
  isOpen: boolean;
  currentUrl: string;
  onClose: () => void;
  onSave: (url: string | null) => Promise<boolean>;
}

export const ControladorHolyricsModal: React.FC<ControladorHolyricsModalProps> = ({
  isOpen,
  currentUrl,
  onClose,
  onSave
}) => {
  const [url, setUrl] = useState<string>(currentUrl || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testHolyricsEndpoint(url);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const cleanUrl = url.trim() || null;
    const ok = await onSave(cleanUrl);
    setIsSaving(false);
    if (ok) onClose();
  };

  const handleClear = async () => {
    setIsSaving(true);
    setUrl('');
    const ok = await onSave(null);
    setIsSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
        <div className="flex items-center justify-between border-b border-church-sand/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-title text-sm sm:text-base font-bold text-church-charcoal uppercase tracking-wider">
                Integração Holyrics (Telão)
              </h3>
              <p className="font-sans text-[11px] text-church-muted">
                Transmissão nativa de louvores e versículos para o púlpito
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-stone-100 transition-colors"
            title="Fechar"
            aria-label="Fechar modal de configuração"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-title font-bold text-church-charcoal uppercase tracking-wider mb-1.5">
              Endereço do Holyrics (ngrok ou IP local):
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Ex: https://igreja-pno.ngrok-free.app ou http://192.168.1.50:8081"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-sans text-xs transition-colors"
              />
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Cole o link gerado pelo ngrok no PC da igreja ou o IP local com a porta 8081.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-title text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-purple-700" />}
              <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão'}</span>
            </button>

            {currentUrl && (
              <button
                type="button"
                onClick={handleClear}
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
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-church-sand/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-title font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-title text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Salvar na Sala</span>
          </button>
        </div>
      </div>
    </div>
  );
};
