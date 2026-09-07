import { VisitorItem, PrayerItem, ChoirItem, OpportunityItem } from '../types/liturgy';

export function formatVisitorsList(visitors: VisitorItem[]): string {
  if (!visitors || visitors.length === 0) return 'Nenhum visitante registrado.';
  return visitors.map(v => {
    let line = `• ${v.name.trim()}`;
    if (v.church && v.church.trim()) {
      line += ` (${v.church.trim()})`;
    }
    if (v.invited_by && v.invited_by.trim()) {
      line += ` — Por: ${v.invited_by.trim()}`;
    }
    return line;
  }).join('\n');
}

export function formatPrayersList(prayers: PrayerItem[]): string {
  if (!prayers || prayers.length === 0) return 'Nenhum pedido presencial registrado.';
  return prayers.map(p => {
    const prefix = p.urgent ? '• [URGENTE] ' : '• ';
    return `${prefix}${p.description.trim()}`;
  }).join('\n');
}

export function formatYoutubeList(youtube: PrayerItem[]): string {
  if (!youtube || youtube.length === 0) return 'Nenhum pedido do YouTube registrado.';
  return youtube.map(y => `• ${y.description.trim()}`).join('\n');
}

export function formatChoirsList(choirs: ChoirItem[]): string {
  if (!choirs || choirs.length === 0) return 'Nenhum departamento registrado.';
  return choirs.map(c => `• ${c.name.trim()}`).join('\n');
}

export function formatOpportunitiesList(opps: OpportunityItem[]): string {
  if (!opps || opps.length === 0) return 'Nenhuma oportunidade registrada.';
  return opps.map((o, idx) => `${idx + 1}. ${o.name.trim()}`).join('\n');
}

export interface FullLiturgyData {
  title?: string;
  code?: string;
  visitors: VisitorItem[];
  prayers: PrayerItem[];
  youtube: PrayerItem[];
  choirs: ChoirItem[];
  opportunities: OpportunityItem[];
}

export function formatFullLiturgy(data: FullLiturgyData): string {
  const parts: string[] = [];
  const headerTitle = data.title ? data.title.toUpperCase() : 'CULTO';
  parts.push(`LISTA DO CULTO — ${headerTitle}`);
  parts.push('A.D. Utinga — Parque Novo Oratório');
  parts.push('--------------------------------------------------');

  if (data.visitors && data.visitors.length > 0) {
    parts.push(`VISITANTES DO CULTO (${data.visitors.length}):`);
    parts.push(formatVisitorsList(data.visitors));
    parts.push('--------------------------------------------------');
  }

  if (data.prayers && data.prayers.length > 0) {
    parts.push(`PEDIDOS DE ORAÇÃO PRESENCIAIS (${data.prayers.length}):`);
    parts.push(formatPrayersList(data.prayers));
    parts.push('--------------------------------------------------');
  }

  if (data.youtube && data.youtube.length > 0) {
    parts.push(`TRANSMISSÃO AO VIVO — YOUTUBE (${data.youtube.length}):`);
    parts.push(formatYoutubeList(data.youtube));
    parts.push('--------------------------------------------------');
  }

  if (data.choirs && data.choirs.length > 0) {
    parts.push(`DEPARTAMENTOS DO CULTO (${data.choirs.length}):`);
    parts.push(formatChoirsList(data.choirs));
    parts.push('--------------------------------------------------');
  }

  if (data.opportunities && data.opportunities.length > 0) {
    parts.push(`OPORTUNIDADES (${data.opportunities.length}):`);
    parts.push(formatOpportunitiesList(data.opportunities));
  }

  return parts.join('\n\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, using textarea fallback:', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}
