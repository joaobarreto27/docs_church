import { VisitorItem, PrayerItem, ChoirItem, OpportunityItem, Room, LiturgicalBlock } from '../types/liturgy';
import { PlainTextExportStrategy } from '../services/export/strategies/PlainTextExportStrategy';
import { copyTextToClipboard } from '../services/export/helpers';

const plainStrategy = new PlainTextExportStrategy();

export function formatVisitorsList(visitors: VisitorItem[]): string {
  return plainStrategy.formatVisitors(visitors);
}

export function formatPrayersList(prayers: PrayerItem[]): string {
  return plainStrategy.formatPrayers(prayers);
}

export function formatYoutubeList(youtube: PrayerItem[]): string {
  return plainStrategy.formatYoutube(youtube);
}

export function formatChoirsList(choirs: ChoirItem[]): string {
  return plainStrategy.formatChoirs(choirs);
}

export function formatOpportunitiesList(opps: OpportunityItem[]): string {
  return plainStrategy.formatOpportunities(opps);
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
  const fakeRoom = { id: '1', title: data.title || 'Culto', code: data.code || '' } as Room;
  const fakeBlocks: LiturgicalBlock[] = [
    { id: '1', room_id: '1', block_type: 'visitors', title: 'Visitantes', content: data.visitors, order_index: 1, sheet_assignment: 1 },
    { id: '2', room_id: '1', block_type: 'prayer', title: 'Oração Presencial', content: data.prayers, order_index: 2, sheet_assignment: 1 },
    { id: '3', room_id: '1', block_type: 'youtube', title: 'Oração YouTube', content: data.youtube, order_index: 3, sheet_assignment: 1 },
    { id: '4', room_id: '1', block_type: 'choirs', title: 'Conjuntos', content: data.choirs, order_index: 4, sheet_assignment: 1 },
    { id: '5', room_id: '1', block_type: 'opportunities', title: 'Oportunidades', content: data.opportunities, order_index: 5, sheet_assignment: 1 },
  ];
  return plainStrategy.format(fakeRoom, fakeBlocks, 'all');
}

export { copyTextToClipboard };
export * from '../services/export';
