import React from 'react';
import { useRoom } from './context/RoomContext';
import { LoadingScreen } from './components/common/LoadingScreen';
import { JoinRoomModal } from './components/room/JoinRoomModal';
import { PulpitView } from './components/pastor/PulpitView';
import { ObreiroEditor } from './components/obreiro/ObreiroEditor';
import { ControladorPanel } from './components/controlador/ControladorPanel';

export const AppContent: React.FC = () => {
  const { room, role, isColdStarting } = useRoom();

  // Exibe tela oficial de carregamento ao conectar ou acordar o servidor Neon
  if (isColdStarting) {
    return <LoadingScreen />;
  }

  // Se não estiver em nenhuma sala, exibe a tela inicial de acesso
  if (!room || !role) {
    return <JoinRoomModal />;
  }

  // Roteamento condicional por papel de usuário
  switch (role) {
    case 'pastor':
      return <PulpitView />;
    case 'obreiro':
      return <ObreiroEditor />;
    case 'controlador':
      return <ControladorPanel />;
    default:
      return <JoinRoomModal />;
  }
};

export default function App() {
  return <AppContent />;
}
