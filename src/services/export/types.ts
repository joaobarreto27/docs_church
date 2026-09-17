import { Room, LiturgicalBlock } from '../../types/liturgy';

export type ExportFormat = 'plain' | 'whatsapp' | 'holyrics';
export type ExportSection = 'all' | 'visitors' | 'prayers' | 'youtube' | 'choirs' | 'opps';

export interface LiturgyExportStrategy {
  format(room: Room, blocks: LiturgicalBlock[], section: ExportSection): string;
}
