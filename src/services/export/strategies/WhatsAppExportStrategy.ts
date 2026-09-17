import { Room, LiturgicalBlock, VisitorItem, PrayerItem, ChoirItem, OpportunityItem } from '../../../types/liturgy';
import { LiturgyExportStrategy, ExportSection } from '../types';
import { extractLiturgyData } from '../helpers';

export class WhatsAppExportStrategy implements LiturgyExportStrategy {
  format(room: Room, blocks: LiturgicalBlock[], section: ExportSection): string {
    const data = extractLiturgyData(blocks);

    switch (section) {
      case 'visitors':
        return this.formatVisitors(data.visitors);
      case 'prayers':
        return this.formatPrayers(data.prayers);
      case 'youtube':
        return this.formatYoutube(data.youtube);
      case 'choirs':
        return this.formatChoirs(data.choirs);
      case 'opps':
        return this.formatOpportunities(data.opportunities);
      case 'all':
      default:
        return this.formatAll(room, data);
    }
  }

  formatVisitors(visitors: VisitorItem[]): string {
    if (!visitors || visitors.length === 0) return '_Nenhum visitante registrado._';
    return visitors.map((v) => {
      let line = `• *${v.name.trim()}*`;
      if (v.church && v.church.trim()) {
        line += ` (${v.church.trim()})`;
      }
      if (v.invited_by && v.invited_by.trim()) {
        line += ` — _Por: ${v.invited_by.trim()}_`;
      }
      return line;
    }).join('\n');
  }

  formatPrayers(prayers: PrayerItem[]): string {
    if (!prayers || prayers.length === 0) return '_Nenhum pedido presencial registrado._';
    return prayers.map((p) => {
      const prefix = p.urgent ? '• 🚨 *[URGENTE]* ' : '• ';
      return `${prefix}${p.description.trim()}`;
    }).join('\n');
  }

  formatYoutube(youtube: PrayerItem[]): string {
    if (!youtube || youtube.length === 0) return '_Nenhum pedido do YouTube registrado._';
    return youtube.map((y) => `• ▶️ ${y.description.trim()}`).join('\n');
  }

  formatChoirs(choirs: ChoirItem[]): string {
    if (!choirs || choirs.length === 0) return '_Nenhum departamento registrado._';
    return choirs.map((c) => `• 🎵 *${c.name.trim()}*`).join('\n');
  }

  formatOpportunities(opps: OpportunityItem[]): string {
    if (!opps || opps.length === 0) return '_Nenhuma oportunidade registrada._';
    return opps.map((o, idx) => `*${idx + 1}.* ${o.name.trim()}`).join('\n');
  }

  private formatAll(room: Room, data: ReturnType<typeof extractLiturgyData>): string {
    const parts: string[] = [];
    const headerTitle = room.title ? room.title.toUpperCase() : 'CULTO';
    parts.push(`📖 *LISTA DO CULTO — ${headerTitle}*`);
    parts.push('🏛️ _A.D. Utinga — Parque Novo Oratório_');
    parts.push('──────────────────────────────');

    if (data.visitors && data.visitors.length > 0) {
      parts.push(`👥 *VISITANTES DO CULTO (${data.visitors.length}):*`);
      parts.push(this.formatVisitors(data.visitors));
      parts.push('──────────────────────────────');
    }

    if (data.prayers && data.prayers.length > 0) {
      parts.push(`🙏 *PEDIDOS DE ORAÇÃO PRESENCIAIS (${data.prayers.length}):*`);
      parts.push(this.formatPrayers(data.prayers));
      parts.push('──────────────────────────────');
    }

    if (data.youtube && data.youtube.length > 0) {
      parts.push(`📺 *TRANSMISSÃO AO VIVO — YOUTUBE (${data.youtube.length}):*`);
      parts.push(this.formatYoutube(data.youtube));
      parts.push('──────────────────────────────');
    }

    if (data.choirs && data.choirs.length > 0) {
      parts.push(`🎶 *DEPARTAMENTOS DO CULTO (${data.choirs.length}):*`);
      parts.push(this.formatChoirs(data.choirs));
      parts.push('──────────────────────────────');
    }

    if (data.opportunities && data.opportunities.length > 0) {
      parts.push(`🎤 *OPORTUNIDADES (${data.opportunities.length}):*`);
      parts.push(this.formatOpportunities(data.opportunities));
    }

    return parts.join('\n\n');
  }
}
