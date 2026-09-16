import { Room, LiturgicalBlock, VisitorItem, PrayerItem, ChoirItem, OpportunityItem } from '../../../types/liturgy';
import { LiturgyExportStrategy, ExportSection } from '../types';
import { extractLiturgyData } from '../helpers';

export class HolyricsExportStrategy implements LiturgyExportStrategy {
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
    if (!visitors || visitors.length === 0) return 'Nenhum visitante';
    return visitors.map((v) => {
      let line = v.name.trim().toUpperCase();
      if (v.church && v.church.trim()) {
        line += `\n${v.church.trim()}`;
      }
      return line;
    }).join('\n\n');
  }

  formatPrayers(prayers: PrayerItem[]): string {
    if (!prayers || prayers.length === 0) return 'Nenhum pedido de oração';
    return prayers.map((p) => {
      const urgentTag = p.urgent ? '[URGENTE] ' : '';
      return `${urgentTag}${p.description.trim()}`;
    }).join('\n\n');
  }

  formatYoutube(youtube: PrayerItem[]): string {
    if (!youtube || youtube.length === 0) return 'Nenhum pedido do YouTube';
    return youtube.map((y) => y.description.trim()).join('\n\n');
  }

  formatChoirs(choirs: ChoirItem[]): string {
    if (!choirs || choirs.length === 0) return 'Nenhum departamento';
    return choirs.map((c) => c.name.trim().toUpperCase()).join('\n\n');
  }

  formatOpportunities(opps: OpportunityItem[]): string {
    if (!opps || opps.length === 0) return 'Nenhuma oportunidade';
    return opps.map((o, idx) => `${idx + 1}. ${o.name.trim()}`).join('\n\n');
  }

  private formatAll(room: Room, data: ReturnType<typeof extractLiturgyData>): string {
    const slides: string[] = [];
    const headerTitle = room.title ? room.title.toUpperCase() : 'CULTO';
    slides.push(`=== ${headerTitle} ===\nA.D. UTINGA`);

    if (data.visitors && data.visitors.length > 0) {
      slides.push(`--- VISITANTES ---\n${this.formatVisitors(data.visitors)}`);
    }

    if (data.prayers && data.prayers.length > 0) {
      slides.push(`--- PEDIDOS DE ORAÇÃO ---\n${this.formatPrayers(data.prayers)}`);
    }

    if (data.youtube && data.youtube.length > 0) {
      slides.push(`--- ORAÇÃO YOUTUBE ---\n${this.formatYoutube(data.youtube)}`);
    }

    if (data.choirs && data.choirs.length > 0) {
      slides.push(`--- DEPARTAMENTOS ---\n${this.formatChoirs(data.choirs)}`);
    }

    if (data.opportunities && data.opportunities.length > 0) {
      slides.push(`--- OPORTUNIDADES ---\n${this.formatOpportunities(data.opportunities)}`);
    }

    return slides.join('\n\n---\n\n');
  }
}
