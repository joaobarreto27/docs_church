import React, { useState } from 'react';
import { AlertTriangle, Send, XCircle } from 'lucide-react';

interface PastoralAlertBarProps {
  activeAlert: string | null;
  onSendAlert: (text: string) => Promise<void> | void;
  onClearAlert: () => Promise<void> | void;
}

const PRESET_ALERTS = [
  '5 min restantes',
  'Favor encerrar',
  'Liberar carro',
  'Irmão ilustre chegou',
];

export const PastoralAlertBar: React.FC<PastoralAlertBarProps> = ({
  activeAlert,
  onSendAlert,
  onClearAlert,
}) => {
  const [alertInput, setAlertInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = alertInput.trim();
    if (!clean) return;
    await onSendAlert(clean);
    setAlertInput('');
  };

  const handleSelectPreset = (preset: string) => {
    setAlertInput(preset);
  };

  return (
    <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-title text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Faixa de Aviso no Púlpito
        </span>
        {activeAlert ? (
          <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            Aviso exibido na tela do Púlpito
          </span>
        ) : (
          <span className="text-[11px] text-purple-700 font-medium">
            Nenhum aviso ativo no momento
          </span>
        )}
      </div>

      {/* Formulário de Disparo */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Ex: 5 min restantes | Liberar carro ABC-123"
          value={alertInput}
          onChange={(e) => setAlertInput(e.target.value)}
          className="flex-1 min-w-0 text-xs font-sans p-2.5 rounded-lg border border-purple-300 bg-white focus:border-purple-600 outline-none text-church-charcoal"
        />
        <button
          type="submit"
          disabled={!alertInput.trim()}
          className="px-3 sm:px-4 py-2 bg-purple-700 text-white rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-purple-800 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Send className="w-3.5 h-3.5" />
          Transmitir
        </button>
        {activeAlert && (
          <button
            type="button"
            onClick={onClearAlert}
            className="px-2.5 sm:px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg font-title text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors shrink-0 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <XCircle className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </form>

      {/* Presets Litúrgicos Rápidos */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Atalhos:</span>
        {PRESET_ALERTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className="text-[11px] px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-200 transition-colors cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Pré-visualização do Aviso Ativo */}
      {activeAlert && (
        <div className="mt-2.5 p-2 rounded-lg bg-alert-bg border border-alert-border text-alert-text text-xs font-bold font-title flex items-center justify-between">
          <span>"{activeAlert}"</span>
          <span className="text-[10px] text-amber-800 uppercase tracking-widest">No ar</span>
        </div>
      )}
    </div>
  );
};
