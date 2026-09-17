import React from 'react';
import { Plus } from 'lucide-react';
import { formatRoomCodeMask } from '../../services/neon';

export interface CreateServiceFormProps {
  newTitle: string;
  onTitleChange: (value: string) => void;
  customCode: string;
  onCustomCodeChange: (value: string) => void;
  newPin: string;
  onNewPinChange: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateServiceForm: React.FC<CreateServiceFormProps> = ({
  newTitle,
  onTitleChange,
  customCode,
  onCustomCodeChange,
  newPin,
  onNewPinChange,
  isLoading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-1">
          Nome do Culto
        </label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => onTitleChange(e.target.value)}
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
          onChange={(e) => onCustomCodeChange(formatRoomCodeMask(e.target.value))}
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
          onChange={(e) => onNewPinChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
  );
};
