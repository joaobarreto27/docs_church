import { LiturgicalBlock, VisitorItem, PrayerItem, ChoirItem, OpportunityItem } from '../../types/liturgy';

export interface ExtractedLiturgy {
  visitors: VisitorItem[];
  prayers: PrayerItem[];
  youtube: PrayerItem[];
  choirs: ChoirItem[];
  opportunities: OpportunityItem[];
}

export function extractLiturgyData(blocks: LiturgicalBlock[]): ExtractedLiturgy {
  return {
    visitors: ((blocks.find(b => b.block_type === 'visitors')?.content || []) as VisitorItem[]),
    prayers: ((blocks.find(b => b.block_type === 'prayer')?.content || []) as PrayerItem[]),
    youtube: ((blocks.find(b => b.block_type === 'youtube')?.content || []) as PrayerItem[]),
    choirs: ((blocks.find(b => b.block_type === 'choirs')?.content || []) as ChoirItem[]).filter(c => c.checked),
    opportunities: ((blocks.find(b => b.block_type === 'opportunities')?.content || []) as OpportunityItem[]),
  };
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
