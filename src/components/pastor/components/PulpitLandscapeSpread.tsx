import React from 'react';
import { VisitorItem, PrayerItem, OpportunityItem, ChoirItem } from '../../../types/liturgy';
import { PulpitSheetOne } from './PulpitSheetOne';
import { PulpitSheetTwo } from './PulpitSheetTwo';

export interface PulpitLandscapeSpreadProps {
  roomTitle: string;
  fontScale: number;
  visitors: VisitorItem[];
  sheet1Prayers: PrayerItem[];
  overflowPresencial: PrayerItem[];
  youtube: PrayerItem[];
  opps: OpportunityItem[];
  choirs: ChoirItem[];
  totalPrayersCount: number;
  sheet1ScrollRef: React.RefObject<HTMLDivElement>;
  sheet2ScrollRef: React.RefObject<HTMLDivElement>;
  onScrollSheet1: () => void;
  onScrollSheet2: () => void;
  hasMoreSheet1: boolean;
  isSheet1Scrolled: boolean;
  hasMoreSheet2: boolean;
  isSheet2Scrolled: boolean;
  onScrollSheet1Down: () => void;
  onScrollSheet1Up: () => void;
  onScrollSheet2Down: () => void;
  onScrollSheet2Up: () => void;
}

export const PulpitLandscapeSpread: React.FC<PulpitLandscapeSpreadProps> = ({
  roomTitle,
  fontScale,
  visitors,
  sheet1Prayers,
  overflowPresencial,
  youtube,
  opps,
  choirs,
  totalPrayersCount,
  sheet1ScrollRef,
  sheet2ScrollRef,
  onScrollSheet1,
  onScrollSheet2,
  hasMoreSheet1,
  isSheet1Scrolled,
  hasMoreSheet2,
  isSheet2Scrolled,
  onScrollSheet1Down,
  onScrollSheet1Up,
  onScrollSheet2Down,
  onScrollSheet2Up,
}) => {
  const sheet2Items = [...overflowPresencial, ...youtube];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 flex-1 p-2 sm:p-3 md:p-3.5 overflow-hidden h-full max-h-full min-h-0 transition-[zoom] duration-150"
      style={{ zoom: fontScale }}
    >
      <PulpitSheetOne
        roomTitle={roomTitle}
        visitors={visitors}
        sheet1Prayers={sheet1Prayers}
        overflowPresencialCount={overflowPresencial.length}
        youtubeCount={youtube.length}
        totalPrayersCount={totalPrayersCount}
        scrollRef={sheet1ScrollRef}
        onScroll={onScrollSheet1}
        hasMore={hasMoreSheet1}
        isScrolled={isSheet1Scrolled}
        onScrollDown={onScrollSheet1Down}
        onScrollUp={onScrollSheet1Up}
      />

      <PulpitSheetTwo
        sheet2Items={sheet2Items}
        overflowPresencial={overflowPresencial}
        sheet1PrayersCount={sheet1Prayers.length}
        youtube={youtube}
        opps={opps}
        choirs={choirs}
        scrollRef={sheet2ScrollRef}
        onScroll={onScrollSheet2}
        hasMore={hasMoreSheet2}
        isScrolled={isSheet2Scrolled}
        onScrollDown={onScrollSheet2Down}
        onScrollUp={onScrollSheet2Up}
      />
    </div>
  );
};
