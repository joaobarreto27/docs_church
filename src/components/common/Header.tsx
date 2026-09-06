import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  minimal?: boolean; // Se true, esconde botões para a visão do pastor
}

export const Header: React.FC<HeaderProps> = ({ minimal = false }) => {
  const { room, role, isConnected, leaveRoom } = useRoom();

  if (!room) return null;

  return (
    <header className="bg-church-parchment border-b border-church-sand px-3 py-2 flex items-center justify-between gap-3">
      {/* Logotipo Oficial Horizontal & Título */}
      <div className="flex items-center gap-3">
        <img 
          src="/assets/logo-adutinga-horizontal.png" 
          alt="A.D. Utinga" 
          className="h-7 sm:h-8 w-auto object-contain"
        />
        <div className="hidden sm:block border-l border-church-sand pl-3">
          <h1 className="font-title text-xs sm:text-sm font-bold tracking-tight text-church-charcoal uppercase">
            {room.title}
          </h1>
          <p className="font-sans text-[10px] text-church-muted">
            Código: <strong className="text-church-gold-dark font-mono tracking-wider">{room.code.slice(0, 3)}-{room.code.slice(3)}</strong>
          </p>
        </div>
      </div>

      {/* Controles de Status e Papel */}
      <div className="flex items-center gap-2">
        {/* Indicador de Status da Conexão */}
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/70 border border-church-sand text-[11px] font-medium"
          title={isConnected ? 'Conectado em tempo real' : 'Sem internet - exibindo cópia local offline'}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden md:inline text-emerald-700">Ao vivo</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden md:inline text-amber-700">Offline (Cache)</span>
            </>
          )}
        </div>

        {/* Papel Ativo */}
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-title font-bold uppercase tracking-wider ${
          role === 'pastor' 
            ? 'bg-church-gold/15 text-church-gold-dark border border-church-gold/30'
            : role === 'controlador'
            ? 'bg-purple-100 text-purple-800 border border-purple-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {role === 'pastor' ? 'Púlpito' : role === 'controlador' ? 'Controlador' : 'Obreiro'}
        </span>

        {/* Botão Sair da Sala (oculto no modo minimal/pastor para não ter toque acidental) */}
        {!minimal && (
          <button
            onClick={leaveRoom}
            className="p-1.5 rounded-lg text-church-muted hover:text-church-charcoal hover:bg-white transition-colors"
            title="Sair do Culto"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
