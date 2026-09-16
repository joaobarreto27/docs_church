import { liturgicalRepository } from './liturgicalRepository';

export * from './types';
export * from './roomCodeUtils';
export * from './httpClient';
export * from './roomRepository';
export * from './blockRepository';
export * from './controlRepository';
export * from './liturgicalRepository';

// Aliases para permitir importação desestruturada direta em código legado
export const getRoomByCode = liturgicalRepository.getRoomByCode;
export const verifyControllerPin = liturgicalRepository.verifyControllerPin;
export const joinRoomApi = liturgicalRepository.joinRoom;
export const getRoomMeta = liturgicalRepository.getRoomMeta;
export const syncRoomState = liturgicalRepository.syncRoomState;
export const getBlocksByRoomId = liturgicalRepository.getBlocksByRoomId;
export const createRoom = liturgicalRepository.createRoom;
export const updateBlockContent = liturgicalRepository.updateBlockContent;
export const appendBlockContent = liturgicalRepository.appendBlockContent;
export const setRoomAlert = liturgicalRepository.setRoomAlert;
export const setRoomCurrentPage = liturgicalRepository.setRoomCurrentPage;
export const updateRoomTitle = liturgicalRepository.updateRoomTitle;
export const updateRoomCode = liturgicalRepository.updateRoomCode;
export const archiveAndResetRoom = liturgicalRepository.archiveAndResetRoom;
export const overwriteExistingRoom = liturgicalRepository.overwriteExistingRoom;
