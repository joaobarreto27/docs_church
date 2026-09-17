import React from 'react';
import { UserRole } from '../../types/liturgy';
import { BookOpen, Edit3, ShieldAlert } from 'lucide-react';

export interface RoleSelectorTabsProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectorTabs: React.FC<RoleSelectorTabsProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  return (
    <div>
      <label className="block font-title text-xs font-bold uppercase tracking-wider text-church-charcoal mb-2 text-center">
        Quem está usando agora?
      </label>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Seleção de Papel Litúrgico">
        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === 'pastor'}
          onClick={() => onSelectRole('pastor')}
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
          role="tab"
          aria-selected={selectedRole === 'obreiro'}
          onClick={() => onSelectRole('obreiro')}
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
          role="tab"
          aria-selected={selectedRole === 'controlador'}
          onClick={() => onSelectRole('controlador')}
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
  );
};
