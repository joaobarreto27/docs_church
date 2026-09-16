import React from 'react';
import { Room } from '../../types/liturgy';
import { AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';

export interface RoomConflictModalProps {
  conflictRoom: Room | null;
  isLoading: boolean;
  onOpenExisting: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

export const RoomConflictModal: React.FC<RoomConflictModalProps> = ({
  conflictRoom,
  isLoading,
  onOpenExisting,
  onOverwrite,
  onCancel,
}) => {
  if (!conflictRoom) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-amber-300 p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-600">
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 id="conflict-modal-title" className="font-title font-bold text-base text-church-charcoal">
              Sala Já Existente: {conflictRoom.code}
            </h3>
            <p className="text-xs text-church-muted">
              Este código já está em uso por outro culto.
            </p>
          </div>
        </div>

        <div className="bg-church-parchment p-3.5 rounded-xl border border-church-sand space-y-2 text-xs">
          <div className="flex items-center justify-between text-church-charcoal font-medium">
            <span>Culto Atual:</span>
            <span className="font-bold text-church-gold-dark">{conflictRoom.title}</span>
          </div>
          <p className="text-church-charcoal/80 leading-relaxed pt-1 border-t border-church-sand/60">
            O que você deseja fazer com esta reunião?
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onOpenExisting}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-title font-bold text-xs uppercase tracking-wider text-church-charcoal bg-church-sand/40 hover:bg-church-sand active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-church-sand"
          >
            <FolderOpen className="w-4 h-4 text-church-gold-dark shrink-0" />
            <span>Abrir Sala Existente (Manter Anotações)</span>
          </button>

          <button
            type="button"
            onClick={onOverwrite}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-title font-bold text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Substituir (Iniciar Folha Limpa)</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-xl font-title font-bold text-xs text-church-muted hover:text-church-charcoal transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
