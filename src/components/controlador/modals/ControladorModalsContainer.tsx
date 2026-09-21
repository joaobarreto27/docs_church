import React from 'react';
import { Room, LiturgicalBlock } from '../../../types/liturgy';
import { ExportSection } from '../../../services/export';
import { ControladorHolyricsModal } from './ControladorHolyricsModal';
import { ResetServiceModal } from '../alerts/ResetServiceModal';
import { PulpitPreviewModal } from './PulpitPreviewModal';
import { LiturgyExportModal } from './LiturgyExportModal';
import { ConfirmMassDeleteModal } from '../../obreiro/components';
import { EditServiceTitleModal } from './EditServiceTitleModal';
import { EditRoomCodeModal } from './EditRoomCodeModal';

interface ControladorModalsContainerProps {
  room: Room;
  blocks: LiturgicalBlock[];
  showHolyricsModal: boolean;
  onCloseHolyricsModal: () => void;
  onSaveHolyrics: (url: string | null, adminKey: string) => Promise<{ success: boolean; error?: string } | boolean>;
  showResetModal: boolean;
  newTitleInput: string;
  onChangeNewTitle: (title: string) => void;
  onCloseResetModal: () => void;
  onConfirmReset: () => Promise<void>;
  showPulpitPreview: boolean;
  onClosePulpitPreview: () => void;
  showFullListModal: boolean;
  onCloseFullListModal: () => void;
  fullListTab: ExportSection;
  onCopiedFeedback: (msg: string) => void;
  confirmModal: { type: 'visitors' | 'prayers'; count: number } | null;
  onCloseConfirmModal: () => void;
  onConfirmClearAll: () => void;
  showEditTitleModal: boolean;
  onCloseEditTitleModal: () => void;
  onSaveTitle: (newTitle: string) => Promise<void>;
  showEditCodeModal: boolean;
  onCloseEditCodeModal: () => void;
  onSaveCode: (newCode: string) => Promise<{ success: boolean; error?: string }>;
}

export const ControladorModalsContainer: React.FC<ControladorModalsContainerProps> = ({
  room,
  blocks,
  showHolyricsModal,
  onCloseHolyricsModal,
  onSaveHolyrics,
  showResetModal,
  newTitleInput,
  onChangeNewTitle,
  onCloseResetModal,
  onConfirmReset,
  showPulpitPreview,
  onClosePulpitPreview,
  showFullListModal,
  onCloseFullListModal,
  fullListTab,
  onCopiedFeedback,
  confirmModal,
  onCloseConfirmModal,
  onConfirmClearAll,
  showEditTitleModal,
  onCloseEditTitleModal,
  onSaveTitle,
  showEditCodeModal,
  onCloseEditCodeModal,
  onSaveCode,
}) => {
  return (
    <>
      <ControladorHolyricsModal
        isOpen={showHolyricsModal}
        hasHolyrics={Boolean(room.has_holyrics)}
        onClose={onCloseHolyricsModal}
        onSave={onSaveHolyrics}
      />

      <ResetServiceModal
        isOpen={showResetModal}
        newTitle={newTitleInput}
        onChangeNewTitle={onChangeNewTitle}
        onClose={onCloseResetModal}
        onConfirm={onConfirmReset}
      />

      <PulpitPreviewModal
        isOpen={showPulpitPreview}
        onClose={onClosePulpitPreview}
      />

      <LiturgyExportModal
        isOpen={showFullListModal}
        onClose={onCloseFullListModal}
        room={room}
        blocks={blocks}
        initialSection={fullListTab}
        onCopiedFeedback={onCopiedFeedback}
      />

      <ConfirmMassDeleteModal
        isOpen={Boolean(confirmModal)}
        modalData={confirmModal}
        onClose={onCloseConfirmModal}
        onConfirm={onConfirmClearAll}
      />

      <EditServiceTitleModal
        isOpen={showEditTitleModal}
        currentTitle={room.title}
        onClose={onCloseEditTitleModal}
        onSave={onSaveTitle}
      />

      <EditRoomCodeModal
        isOpen={showEditCodeModal}
        currentCode={room.code}
        onClose={onCloseEditCodeModal}
        onSave={onSaveCode}
      />
    </>
  );
};
