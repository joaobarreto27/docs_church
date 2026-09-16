import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Room, LiturgicalBlock, UserRole } from '../types/liturgy';
import { RoomContextType } from './types';
import {
  StoredSession,
  getStoredSession,
  getStoredCache,
  useRoomCache,
} from './storage';
import {
  broadcastLocalChange as triggerIntertabBroadcast,
  useAdaptivePolling,
} from './sync';
import { useRoomMutations } from './mutations';
import { useRoomControl } from './control';
import { useRoomSession } from './session';

export type { RoomContextType };

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialSession] = useState<StoredSession | null>(getStoredSession);
  const initialCache = initialSession ? getStoredCache(initialSession.roomId || initialSession.code) : null;

  const [room, setRoom] = useState<Room | null>(initialCache?.room || null);
  const [blocks, setBlocks] = useState<LiturgicalBlock[]>(initialCache?.blocks || []);
  const [role, setRole] = useState<UserRole | null>(initialSession?.role || null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(initialSession?.sessionToken);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isColdStarting, setIsColdStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFastSync, setIsFastSync] = useState<boolean>(false);
  const [hasFreshUpdates, setHasFreshUpdates] = useState<boolean>(false);
  const [isPulpitPreviewActive, setIsPulpitPreviewActive] = useState<boolean>(false);

  const lastActivityTimeRef = useRef<number>(Date.now());
  const { saveToCache, loadFromCache } = useRoomCache(setRoom, setBlocks);

  const broadcastLocalChange = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setIsFastSync(true);
    triggerIntertabBroadcast();
  }, []);

  const mutations = useRoomMutations({
    room, blocks, setBlocks, sessionToken, broadcastLocalChange, saveToCache, setIsConnected,
  });

  const control = useRoomControl({
    room, sessionToken, blocksRef: mutations.blocksRef, setRoom, setBlocks, setIsConnected,
    setIsColdStarting, setError, broadcastLocalChange, saveToCache, loadFromCache,
  });

  const session = useRoomSession({
    room, blocks, initialCache, blocksRef: mutations.blocksRef, sessionToken, setRoom,
    setBlocks, setRole, setSessionToken, setIsConnected, setIsColdStarting, setError, saveToCache,
  });

  useAdaptivePolling({
    room, role, sessionToken, isPulpitPreviewActive, blocksRef: mutations.blocksRef,
    pendingMutationsCountRef: mutations.pendingMutationsCountRef,
    lastMutationTimeRef: mutations.lastMutationTimeRef, lastActivityTimeRef, setRoom,
    setBlocks, setIsConnected, setIsFastSync, setHasFreshUpdates, saveToCache, leaveRoom: session.leaveRoom,
  });

  return (
    <RoomContext.Provider
      value={{
        room,
        blocks,
        role,
        isConnected,
        isColdStarting,
        isFastSync,
        hasFreshUpdates,
        error,
        joinRoom: session.joinRoom,
        startNewService: session.startNewService,
        overwriteExistingService: session.overwriteExistingService,
        leaveRoom: session.leaveRoom,
        updateBlock: mutations.updateBlock,
        appendItemsToBlock: mutations.appendItemsToBlock,
        removeItemFromBlock: mutations.removeItemFromBlock,
        sendAlert: control.sendAlert,
        setPage: control.setPage,
        resetCurrentService: control.resetCurrentService,
        refreshData: control.refreshData,
        updateTitle: control.updateTitle,
        updateCode: control.updateCode,
        isPulpitPreviewActive,
        setPulpitPreviewActive: setIsPulpitPreviewActive,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom deve ser utilizado dentro de um RoomProvider');
  }
  return context;
};
