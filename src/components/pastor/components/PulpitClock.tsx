import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export interface PulpitClockProps {
  className?: string;
  showIcon?: boolean;
}

/**
 * Formata número com 2 dígitos sem depender de padStart (compatível com Android 4.4.4 KitKat)
 */
function padZero(val: number): string {
  return val < 10 ? '0' + val : '' + val;
}

function getCurrentTimeString(): string {
  const now = new Date();
  return padZero(now.getHours()) + ':' + padZero(now.getMinutes());
}

/**
 * Relógio discreto para o Púlpito do Pastor
 * - Sem segundos piscantes para não atrair atenção periférica nem distrair a congregação/pregador.
 * - Atualização a cada 10s (baixo consumo de CPU e bateria em tablets antigos).
 * - Tratamento instantâneo de wake-up: ao bloquear e desbloquear a tela (mesmo após 10, 30 ou 60 minutos),
 *   os eventos 'visibilitychange', 'focus' e 'pageshow' atualizam o horário no exato milissegundo do retorno.
 * - 100% compatível com Android 4.4.4 (Chrome 30-36).
 */
export const PulpitClock: React.FC<PulpitClockProps> = ({ className = '', showIcon = true }) => {
  const [timeStr, setTimeStr] = useState<string>(getCurrentTimeString);

  useEffect(() => {
    const updateTime = () => {
      const nextTime = getCurrentTimeString();
      setTimeStr((prev) => (prev !== nextTime ? nextTime : prev));
    };

    // Timer leve a cada 10 segundos
    const timer = setInterval(updateTime, 10000);

    // Eventos disparados instantaneamente quando o dispositivo/aba acorda do repouso
    const handleWakeup = () => {
      updateTime();
    };

    document.addEventListener('visibilitychange', handleWakeup);
    // Suporte legado a WebKit para Android 4.4.4
    document.addEventListener('webkitvisibilitychange', handleWakeup);
    window.addEventListener('focus', handleWakeup);
    window.addEventListener('pageshow', handleWakeup);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleWakeup);
      document.removeEventListener('webkitvisibilitychange', handleWakeup);
      window.removeEventListener('focus', handleWakeup);
      window.removeEventListener('pageshow', handleWakeup);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/95 border border-church-sand text-church-charcoal font-mono font-black text-[12px] sm:text-[14px] shadow-2xs select-none tabular-nums shrink-0 ${className}`}
      title="Horário do Culto"
      aria-label={`Horário atual: ${timeStr}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-church-gold shrink-0" />}
      <span>{timeStr}</span>
    </div>
  );
};
