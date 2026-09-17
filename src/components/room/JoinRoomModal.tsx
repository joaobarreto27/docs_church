import React from 'react';
import { JoinRoomForm } from './JoinRoomForm';
import { CreateServiceForm } from './CreateServiceForm';
import { RoomConflictModal } from './RoomConflictModal';
import { useRoomEntryFlow } from './useRoomEntryFlow';

export const JoinRoomModal: React.FC = () => {
  const flow = useRoomEntryFlow();

  return (
    <div className="min-h-screen bg-church-parchment flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-church-sand p-6 sm:p-8 shadow-sheet">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/assets/logo-adutinga-horizontal.png"
            alt="A.D. Utinga - Parque Novo Oratório"
            className="w-56 sm:w-64 h-auto object-contain mb-2"
          />
          <p className="font-serif italic text-church-charcoal/80 text-sm">
            Sistema de Acompanhamento do Culto
          </p>
        </div>

        <div className="flex rounded-xl bg-church-parchment p-1 border border-church-sand mb-6">
          <button
            type="button"
            onClick={() => flow.handleModeChange('join')}
            className={`flex-1 py-2 text-xs font-title font-bold uppercase tracking-wider rounded-lg transition-all ${
              flow.mode === 'join' ? 'bg-white text-church-charcoal shadow-sm' : 'text-church-muted hover:text-church-charcoal'
            }`}
          >
            Entrar no Culto
          </button>
          <button
            type="button"
            onClick={() => flow.handleModeChange('create')}
            className={`flex-1 py-2 text-xs font-title font-bold uppercase tracking-wider rounded-lg transition-all ${
              flow.mode === 'create' ? 'bg-white text-church-charcoal shadow-sm' : 'text-church-muted hover:text-church-charcoal'
            }`}
          >
            Novo Culto
          </button>
        </div>

        {flow.errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {flow.errorMessage}
          </div>
        )}

        {flow.mode === 'join' ? (
          <JoinRoomForm
            code={flow.code}
            onCodeChange={flow.handleCodeChange}
            selectedRole={flow.selectedRole}
            onSelectRole={flow.handleRoleSelect}
            pin={flow.pin}
            onPinChange={flow.setPin}
            isLoading={flow.isLoading}
            onSubmit={flow.handleJoin}
          />
        ) : (
          <CreateServiceForm
            newTitle={flow.newTitle}
            onTitleChange={flow.setNewTitle}
            customCode={flow.customCode}
            onCustomCodeChange={flow.setCustomCode}
            newPin={flow.newPin}
            onNewPinChange={flow.setNewPin}
            isLoading={flow.isLoading}
            onSubmit={flow.handleCreate}
          />
        )}
      </div>

      <footer className="mt-8 text-center text-xs text-church-muted font-serif italic">
        "Aqui chegamos pela fé!" — A.D. Utinga
      </footer>

      <RoomConflictModal
        conflictRoom={flow.conflictRoom}
        isLoading={flow.isLoading}
        onOpenExisting={flow.handleOpenExisting}
        onOverwrite={flow.handleOverwriteExisting}
        onCancel={() => flow.setConflictRoom(null)}
      />
    </div>
  );
};
