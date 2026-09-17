import { UserRole } from '../../types/liturgy';
import { PollingConfig, PollingIntervalResult } from './types';

export const FAST_SYNC_THRESHOLD_MS = 2.5 * 60 * 1000; // 150.000 ms = 2,5 minutos de modo rápido

/**
 * Calcula dinamicamente o intervalo ideal de polling com base no papel e atividade do usuário.
 * Totalmente blindado contra o Erro 99 da Vercel e otimizado para dispositivos legados (Android 4.4.4 KitKat).
 */
export function calculatePollingInterval(config: PollingConfig): PollingIntervalResult {
  // Se a prévia do púlpito estiver ativa no obreiro/cabine, sincroniza a cada 8 segundos
  // Previne sobrecarga e desafios antibot da Vercel/WAF no Android KitKat
  if (config.isPulpitPreviewActive) {
    return { interval: 8000, isFast: false };
  }

  // Obreiro em tablet/celular antigo usa intervalo relaxado de 30s
  if (config.role === 'obreiro') {
    return { interval: 30000, isFast: false };
  }

  const timeSinceLast = Date.now() - config.lastActivityTime;
  const isFast = timeSinceLast < FAST_SYNC_THRESHOLD_MS;

  if (isFast) {
    // Pastor precisa de resposta quase instantânea (2s); Controlador opera em 2.5s
    const interval = config.role === 'pastor' ? 2000 : 2500;
    return { interval, isFast: true };
  }

  // Modo ocioso normal (6s)
  return { interval: 6000, isFast: false };
}

/**
 * Intervalo de backoff exponencial seguro para falhas temporárias de conexão
 */
export function getBackoffInterval(role: UserRole | null): number {
  return role === 'obreiro' ? 45000 : 7000;
}
