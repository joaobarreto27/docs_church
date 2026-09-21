import React from 'react';
import { LogOut, X } from 'lucide-react';
import { UserRole } from '../../types/liturgy';

interface LeaveRoomModalProps {
  isOpen: boolean;
  role: UserRole | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const LeaveRoomModal: React.FC<LeaveRoomModalProps> = ({
  isOpen,
  role,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-church-sand space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-church-parchment border border-church-sand flex items-center justify-center text-church-charcoal shrink-0">
            <LogOut className="w-5 h-5 text-church-charcoal" />
          </div>
          <div>
            <h3 className="font-title text-base font-bold text-church-charcoal uppercase">
              Deseja Sair da Sala?
            </h3>
            <p className="font-sans text-xs text-church-muted mt-0.5">
              Voltar para a tela inicial de acesso ao culto
            </p>
          </div>
        </div>

        <div className="p-3 bg-church-parchment/70 border border-church-sand rounded-xl text-xs text-church-charcoal leading-relaxed">
          <p className="font-medium">
            Você sairá da tela de {role === 'controlador' ? 'Controlador' : 'Obreiro'} e retornará ao início.
          </p>
          <p className="mt-1 text-[11px] text-church-muted">
            As anotações e pedidos continuam salvos com segurança no sistema.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-church-sand/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-title text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 border border-red-700"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Cancelar / Continuar no Culto</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl border border-church-sand text-church-charcoal hover:bg-church-parchment font-title text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-church-muted" />
            <span>Sim, Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
