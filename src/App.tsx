import React from 'react';
import { useRoom } from './context/RoomContext';
import { LoadingScreen } from './components/common/LoadingScreen';
import { JoinRoomModal } from './components/room/JoinRoomModal';
import { PulpitView } from './components/pastor/PulpitView';
import { ObreiroEditor } from './components/obreiro/ObreiroEditor';
import { ControladorPanel } from './components/controlador/ControladorPanel';

export const AppContent: React.FC = () => {
  const { room, role, isColdStarting } = useRoom();

  // Se não estiver em nenhuma sala, exibe a tela inicial de acesso.
  // CRÍTICO: JoinRoomModal deve permanecer montado durante tentativas de login
  // para que os campos digitados não sejam apagados e qualquer mensagem de erro
  // permaneça visível na tela sem "piscar" e voltar para a tela inicial.
  if (!room || !role) {
    return <JoinRoomModal />;
  }

  // Exibe tela oficial de carregamento se já está autenticado na sala e acordando o Neon
  if (isColdStarting) {
    return <LoadingScreen />;
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
