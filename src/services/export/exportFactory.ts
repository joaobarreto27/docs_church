import { ExportFormat, LiturgyExportStrategy } from './types';
import { PlainTextExportStrategy } from './strategies/PlainTextExportStrategy';
import { WhatsAppExportStrategy } from './strategies/WhatsAppExportStrategy';
import { HolyricsExportStrategy } from './strategies/HolyricsExportStrategy';

const plainStrategy = new PlainTextExportStrategy();
const whatsappStrategy = new WhatsAppExportStrategy();
const holyricsStrategy = new HolyricsExportStrategy();

export function getExportStrategy(format: ExportFormat): LiturgyExportStrategy {
  switch (format) {
    case 'whatsapp':
      return whatsappStrategy;
    case 'holyrics':
      return holyricsStrategy;
    case 'plain':
    default:
      return plainStrategy;
  }
}
