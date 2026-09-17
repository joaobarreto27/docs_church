import React from 'react';
import { VisitorItem, PrayerItem, OpportunityItem, ChoirItem } from '../../../types/liturgy';
import { PulpitActiveTab } from '../hooks';
import { PulpitTabsNav } from './PulpitTabsNav';
import {
  PulpitPrayersTab,
  PulpitVisitorsTab,
  PulpitOpportunitiesTab,
  PulpitAlertsTab,
} from './tabs';

export interface PulpitMobileViewProps {
  activeTab: PulpitActiveTab;
  setActiveTab: (tab: PulpitActiveTab) => void;
  fontScale: number;
  activeAlert: string | null;
  prayers: PrayerItem[];
  youtube: PrayerItem[];
  visitors: VisitorItem[];
  opps: OpportunityItem[];
  choirs: ChoirItem[];
  fourViewsPrayersLeft: PrayerItem[];
  fourViewsPrayersRight: PrayerItem[];
  prayersSplitIdx: number;
  fourViewsYoutubeLeft: PrayerItem[];
  fourViewsYoutubeRight: PrayerItem[];
  youtubeSplitIdx: number;
  fourViewsVisitorsLeft: VisitorItem[];
  fourViewsVisitorsRight: VisitorItem[];
  visitorsSplitIdx: number;
}

export const PulpitMobileView: React.FC<PulpitMobileViewProps> = ({
  activeTab,
  setActiveTab,
  fontScale,
  activeAlert,
  prayers,
  youtube,
  visitors,
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
}) => {
  const prayersCount = prayers.length + youtube.length;
  const visitorsCount = visitors.length;
  const opportunitiesCount = opps.length + choirs.filter((c) => c.checked).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
      {/* FAIXA NO TOPO: 4 ABAS MODERNAS E CLARAS COM ALTO CONTRASTE */}
      <PulpitTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        prayersCount={prayersCount}
        visitorsCount={visitorsCount}
        opportunitiesCount={opportunitiesCount}
        activeAlert={activeAlert}
      />

      {/* CORPO DA SESSÃO SELECIONADA */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-5 min-h-0 scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="max-w-6xl 2xl:max-w-7xl w-full mx-auto paper-sheet rounded-2xl p-4 sm:p-7 border border-church-sand shadow-sheet space-y-4 transition-[zoom] duration-150"
          style={{ zoom: fontScale }}
        >
          {activeTab === 'prayers' && (
            <PulpitPrayersTab
              prayers={prayers}
              youtube={youtube}
              fourViewsPrayersLeft={fourViewsPrayersLeft}
              fourViewsPrayersRight={fourViewsPrayersRight}
              prayersSplitIdx={prayersSplitIdx}
              fourViewsYoutubeLeft={fourViewsYoutubeLeft}
              fourViewsYoutubeRight={fourViewsYoutubeRight}
              youtubeSplitIdx={youtubeSplitIdx}
            />
          )}

          {activeTab === 'visitors' && (
            <PulpitVisitorsTab
              visitors={visitors}
              fourViewsVisitorsLeft={fourViewsVisitorsLeft}
              fourViewsVisitorsRight={fourViewsVisitorsRight}
              visitorsSplitIdx={visitorsSplitIdx}
            />
          )}

          {activeTab === 'opps' && <PulpitOpportunitiesTab opps={opps} choirs={choirs} />}

          {activeTab === 'alerts' && <PulpitAlertsTab activeAlert={activeAlert} />}
        </div>
      </div>
    </div>
  );
};
