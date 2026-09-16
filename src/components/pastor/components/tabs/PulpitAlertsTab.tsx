import React from 'react';
import { AlertCircle, Bell } from 'lucide-react';

export interface PulpitAlertsTabProps {
  activeAlert: string | null;
}

export const PulpitAlertsTab: React.FC<PulpitAlertsTabProps> = ({ activeAlert }) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-church-sand pb-3">
        <span className="text-[10px] font-title font-bold uppercase tracking-widest text-church-gold">Tema do Culto</span>
        <h2 className="text-base sm:text-xl font-title font-extrabold text-church-charcoal uppercase">
          Avisos da Direção & Cabine
        </h2>
      </div>

      {activeAlert ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-alert-bg border-3 border-alert-border text-alert-text shadow-md space-y-4 animate-fadeIn text-center">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-alert-text animate-bounce" />
            <span className="text-xs font-title font-extrabold uppercase tracking-widest bg-amber-200/80 px-3 py-1 rounded-full">
              Aviso Urgente Ativo
            </span>
          </div>
          <p className="font-title text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wide leading-relaxed">
            "{activeAlert}"
          </p>
          <p className="text-xs font-serif italic text-amber-900/80">
            Transmitido pela equipe da cabine de som e apoio.
          </p>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-church-sand text-center space-y-2">
          <Bell className="w-10 h-10 text-church-muted/50 mx-auto" />
          <h4 className="font-title text-base font-bold text-church-charcoal uppercase">
            Nenhum Aviso no Momento
          </h4>
          <p className="font-serif italic text-sm text-church-muted max-w-md mx-auto">
            Quando a cabine de som ou o obreiro transmitir um aviso de emergência ou orientação, ele aparecerá aqui com destaque para leitura no púlpito.
          </p>
        </div>
      )}
    </div>
  );
};
