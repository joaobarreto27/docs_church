import React from 'react';
import { UserRole } from '../../types/liturgy';
import { KeyRound } from 'lucide-react';
import { RoleSelectorTabs } from './RoleSelectorTabs';

export interface JoinRoomFormProps {
  code: string;
  onCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  pin: string;
  onPinChange: (pin: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const JoinRoomForm: React.FC<JoinRoomFormProps> = ({
  code,
  onCodeChange,
  selectedRole,
  onSelectRole,
  pin,
  onPinChange,
  isLoading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          onChange={onCodeChange}
          autoFocus
          className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-widest uppercase text-church-charcoal bg-church-parchment border-2 border-church-sand focus:border-church-gold rounded-xl py-3 outline-none transition-colors"
        />
      </div>

      {/* Escolha do Papel */}
      <RoleSelectorTabs selectedRole={selectedRole} onSelectRole={onSelectRole} />

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
            onChange={(e) => onPinChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
  );
};
