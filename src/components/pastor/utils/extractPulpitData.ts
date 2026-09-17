import { LiturgicalBlock, VisitorItem, PrayerItem, ChoirItem, OpportunityItem } from '../../../types/liturgy';
import { partitionSequentialColumns } from './pulpitPartitioning';

export function extractPulpitData(blocks: LiturgicalBlock[]) {
  const visitorsBlock = blocks.find((b) => b.block_type === 'visitors');
  const prayerBlock = blocks.find((b) => b.block_type === 'prayer');
  const youtubeBlock = blocks.find((b) => b.block_type === 'youtube');
  const oppBlock = blocks.find((b) => b.block_type === 'opportunities');
  const choirsBlock = blocks.find((b) => b.block_type === 'choirs');

  const visitors = (visitorsBlock?.content || []) as VisitorItem[];
  const prayers = (prayerBlock?.content || []) as PrayerItem[];
  const youtube = (youtubeBlock?.content || []) as PrayerItem[];
  const opps = (oppBlock?.content || []) as OpportunityItem[];
  const choirs = (choirsBlock?.content || []) as ChoirItem[];

  const { left: fourViewsPrayersLeft, right: fourViewsPrayersRight, splitIdx: prayersSplitIdx } =
    partitionSequentialColumns(prayers, 10);
  const { left: fourViewsYoutubeLeft, right: fourViewsYoutubeRight, splitIdx: youtubeSplitIdx } =
    partitionSequentialColumns(youtube, 10);
  const { left: fourViewsVisitorsLeft, right: fourViewsVisitorsRight, splitIdx: visitorsSplitIdx } =
    partitionSequentialColumns(visitors, 10);

  const visitorRows = visitors.length > 4 ? Math.ceil(visitors.length / 2) : visitors.length;
  const maxSheet1Prayers = Math.max(0, 12 - visitorRows);
  const sheet1Prayers = prayers.slice(0, maxSheet1Prayers);
  const overflowPresencial = prayers.slice(maxSheet1Prayers);

  return {
    visitors,
    prayers,
    youtube,
    opps,
    choirs,
    fourViewsPrayersLeft,
    fourViewsPrayersRight,
    prayersSplitIdx,
    fourViewsYoutubeLeft,
    fourViewsYoutubeRight,
    youtubeSplitIdx,
    fourViewsVisitorsLeft,
    fourViewsVisitorsRight,
    visitorsSplitIdx,
    sheet1Prayers,
    overflowPresencial
  };
}
