import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { VisitorItem, PrayerItem, ChoirItem, OpportunityItem } from '../../types/liturgy';
import { LoadingScreen } from '../common/LoadingScreen';
import { partitionSequentialColumns } from './utils';
import { usePulpitLayout, usePulpitScroll } from './hooks';
import {
  AlertBanner,
  PulpitMobileView,
  PulpitLandscapeSpread,
  PulpitSingleSheetView,
  PulpitFooter,
  PulpitLeaveConfirmModal,
} from './components';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, isFastSync, hasFreshUpdates, leaveRoom } = useRoom();

  const {
    fontScale,
    handleFontChange,
    isMobilePhone,
    effectiveLayout,
    activeTab,
    setActiveTab,
    handleToggleSheetLayout,
  } = usePulpitLayout();

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  if (!room) return <LoadingScreen />;

  // Extração de dados estruturados
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

  // Divisão sequencial vertical para o modo 4 Visões
  const { left: fourViewsPrayersLeft, right: fourViewsPrayersRight, splitIdx: prayersSplitIdx } =
    partitionSequentialColumns(prayers, 10);
  const { left: fourViewsYoutubeLeft, right: fourViewsYoutubeRight, splitIdx: youtubeSplitIdx } =
    partitionSequentialColumns(youtube, 10);
  const { left: fourViewsVisitorsLeft, right: fourViewsVisitorsRight, splitIdx: visitorsSplitIdx } =
    partitionSequentialColumns(visitors, 10);

  // Balanceamento dinâmico entre as duas folhas (Pasta Aberta)
  const visitorRows = visitors.length > 4 ? Math.ceil(visitors.length / 2) : visitors.length;
  const maxSheet1Prayers = Math.max(0, 12 - visitorRows);
  const sheet1Prayers = prayers.slice(0, maxSheet1Prayers);
  const overflowPresencial = prayers.slice(maxSheet1Prayers);

  const {
    sheet1ScrollRef,
    sheet2ScrollRef,
    hasMoreSheet1,
    isSheet1Scrolled,
    hasMoreSheet2,
    isSheet2Scrolled,
    checkScrollState,
    handleScrollSheet1Down,
    handleScrollSheet1Up,
    handleScrollSheet2Down,
    handleScrollSheet2Up,
  } = usePulpitScroll([visitors, prayers, youtube, fontScale, opps, choirs, effectiveLayout]);

  return (
    <div className="h-full w-full flex flex-col bg-church-parchment select-none overflow-hidden relative min-h-0">
      <AlertBanner alert={room.active_alert} />

      <main
        className="flex-1 overflow-hidden h-full max-h-full min-h-0 flex flex-col"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {effectiveLayout === 'four-views' ? (
          <PulpitMobileView
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fontScale={fontScale}
            activeAlert={room.active_alert}
            prayers={prayers}
            youtube={youtube}
            visitors={visitors}
            opps={opps}
            choirs={choirs}
            fourViewsPrayersLeft={fourViewsPrayersLeft}
            fourViewsPrayersRight={fourViewsPrayersRight}
            prayersSplitIdx={prayersSplitIdx}
            fourViewsYoutubeLeft={fourViewsYoutubeLeft}
            fourViewsYoutubeRight={fourViewsYoutubeRight}
            youtubeSplitIdx={youtubeSplitIdx}
            fourViewsVisitorsLeft={fourViewsVisitorsLeft}
            fourViewsVisitorsRight={fourViewsVisitorsRight}
            visitorsSplitIdx={visitorsSplitIdx}
          />
        ) : effectiveLayout === 'single-sheet' ? (
          <PulpitSingleSheetView
            roomTitle={room.title}
            fontScale={fontScale}
            visitors={visitors}
            prayers={prayers}
            youtube={youtube}
            opps={opps}
            choirs={choirs}
          />
        ) : (
          <PulpitLandscapeSpread
            roomTitle={room.title}
            fontScale={fontScale}
            visitors={visitors}
            sheet1Prayers={sheet1Prayers}
            overflowPresencial={overflowPresencial}
            youtube={youtube}
            opps={opps}
            choirs={choirs}
            totalPrayersCount={prayers.length}
            sheet1ScrollRef={sheet1ScrollRef}
            sheet2ScrollRef={sheet2ScrollRef}
            onScrollSheet1={checkScrollState}
            onScrollSheet2={checkScrollState}
            hasMoreSheet1={hasMoreSheet1}
            isSheet1Scrolled={isSheet1Scrolled}
            hasMoreSheet2={hasMoreSheet2}
            isSheet2Scrolled={isSheet2Scrolled}
            onScrollSheet1Down={handleScrollSheet1Down}
            onScrollSheet1Up={handleScrollSheet1Up}
            onScrollSheet2Down={handleScrollSheet2Down}
            onScrollSheet2Up={handleScrollSheet2Up}
          />
        )}
      </main>

      <PulpitFooter
        effectiveLayout={effectiveLayout}
        roomTitle={room.title}
        fontScale={fontScale}
        isConnected={isConnected}
        isFastSync={isFastSync}
        hasFreshUpdates={hasFreshUpdates}
        isMobilePhone={isMobilePhone}
        onToggleSheetLayout={handleToggleSheetLayout}
        onFontChange={handleFontChange}
        onOpenLeaveConfirm={() => setShowLeaveConfirm(true)}
      />

      <PulpitLeaveConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={leaveRoom}
      />
    </div>
  );
};
