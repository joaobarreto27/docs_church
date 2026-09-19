import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { LoadingScreen } from '../common/LoadingScreen';
import { extractPulpitData } from './utils';
import { usePulpitLayout, usePulpitScroll } from './hooks';
import {
  AlertBanner,
  PulpitMobileView,
  PulpitLandscapeSpread,
  PulpitSingleSheetView,
  PulpitFooter,
  PulpitLeaveConfirmModal,
  PulpitPreachingView,
} from './components';
import { useHolyricsSync } from '../../hooks';
import { HolyricsOverlay, HolyricsReturnPill } from '../holyrics';

export const PulpitView: React.FC = () => {
  const { room, blocks, isConnected, isFastSync, hasFreshUpdates, leaveRoom } = useRoom();

  const {
    fontScale,
    handleFontChange,
    isMobilePhone,
    effectiveLayout,
    activeTab,
    setActiveTab,
    isPreachingMode,
    handleEnterPreachingMode,
    handleExitPreachingMode,
    handleToggleSheetLayout,
  } = usePulpitLayout();

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const {
    slide: holyricsSlide,
    isProjecting: isHolyricsProjecting,
    isMinimized: isHolyricsMinimized,
    dismiss: dismissHolyrics,
    restore: restoreHolyrics,
  } = useHolyricsSync(room?.id, room?.has_holyrics);

  if (!room) return <LoadingScreen />;

  const {
    visitors, prayers, youtube, opps, choirs,
    fourViewsPrayersLeft, fourViewsPrayersRight, prayersSplitIdx,
    fourViewsYoutubeLeft, fourViewsYoutubeRight, youtubeSplitIdx,
    fourViewsVisitorsLeft, fourViewsVisitorsRight, visitorsSplitIdx,
    sheet1Prayers, overflowPresencial,
  } = extractPulpitData(blocks);

  const {
    sheet1ScrollRef, sheet2ScrollRef,
    hasMoreSheet1, isSheet1Scrolled, hasMoreSheet2, isSheet2Scrolled,
    checkScrollState, handleScrollSheet1Down, handleScrollSheet1Up,
    handleScrollSheet2Down, handleScrollSheet2Up,
  } = usePulpitScroll([visitors, prayers, youtube, fontScale, opps, choirs, effectiveLayout]);

  return (
    <div className="h-full w-full flex flex-col bg-church-parchment select-none overflow-hidden relative min-h-0">
      <AlertBanner alert={room.active_alert} />

      <main
        className="flex-1 overflow-hidden h-full max-h-full min-h-0 flex flex-col"
        style={{ fontSize: `${fontScale}rem` }}
      >
        {isPreachingMode ? (
          <PulpitPreachingView
            roomTitle={room.title}
            holyricsSlide={holyricsSlide}
            isHolyricsProjecting={Boolean(isHolyricsProjecting && holyricsSlide)}
            onExitPreaching={handleExitPreachingMode}
          />
        ) : effectiveLayout === 'four-views' ? (
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

      {!isPreachingMode && (
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
          onEnterPreachingMode={handleEnterPreachingMode}
          onOpenLeaveConfirm={() => setShowLeaveConfirm(true)}
        />
      )}

      <PulpitLeaveConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={leaveRoom}
      />

      {/* TELÃO (QUANDO HOUVER PROJEÇÃO ATIVA E NÃO MINIMIZADA, FORA DO MODO PREGAÇÃO) */}
      {!isPreachingMode && isHolyricsProjecting && !isHolyricsMinimized && holyricsSlide && (
        <HolyricsOverlay slide={holyricsSlide} onMinimize={dismissHolyrics} />
      )}

      {/* BOTÃO FLUTUANTE DE RETORNO DO TELÃO */}
      {!isPreachingMode && isHolyricsProjecting && isHolyricsMinimized && holyricsSlide && (
        <HolyricsReturnPill slide={holyricsSlide} onRestore={restoreHolyrics} />
      )}
    </div>
  );
};
