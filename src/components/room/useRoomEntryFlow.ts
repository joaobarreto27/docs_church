import { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { UserRole, Room } from '../../types/liturgy';
import { getRoomByCode, formatRoomCodeMask } from '../../services/neon';

export function useRoomEntryFlow() {
  const { joinRoom, startNewService, overwriteExistingService, error: contextError } = useRoom();

  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem('docs_church_last_code') || ''; } catch { return ''; }
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('docs_church_last_role');
      if (saved === 'pastor' || saved === 'obreiro' || saved === 'controlador') return saved;
    } catch {}
    return 'pastor';
  });
  const [pin, setPin] = useState('');
  const [newTitle, setNewTitle] = useState('Culto de Celebração');
  const [newPin, setNewPin] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conflictRoom, setConflictRoom] = useState<Room | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatRoomCodeMask(e.target.value));
    setLocalError(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setLocalError(null);
  };

  const handleModeChange = (newMode: 'join' | 'create') => {
    setMode(newMode);
    setLocalError(null);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (clean.length < 3) return setLocalError('Por favor, digite o código do culto.');
    if (selectedRole === 'controlador' && pin.length < 4) {
      return setLocalError('O papel de Controlador exige o PIN de 4 números.');
    }

    setIsLoading(true);
    setLocalError(null);
    const result = await joinRoom(clean, selectedRole, pin);
    if (!result.success && result.error) setLocalError(result.error);
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return setLocalError('O PIN do Controlador deve conter pelo menos 4 números.');
    const preferred = customCode.trim() ? customCode.trim().toUpperCase() : undefined;
    setIsLoading(true);
    setLocalError(null);

    if (preferred) {
      try {
        const existing = await getRoomByCode(preferred);
        if (existing) {
          setIsLoading(false);
          setConflictRoom(existing);
          return;
        }
      } catch (err) {
        console.warn('Erro ao verificar código existente:', err);
      }
    }

    const result = await startNewService(newTitle, newPin, preferred);
    if (!result.success && result.error) setLocalError(result.error);
    setIsLoading(false);
  };

  const handleOpenExisting = async () => {
    if (!conflictRoom) return;
    setIsLoading(true);
    setLocalError(null);
    const result = await joinRoom(conflictRoom.code, 'controlador', newPin);
    setIsLoading(false);
    setConflictRoom(null);
    if (!result.success) {
      setMode('join');
      setCode(conflictRoom.code);
      setSelectedRole('controlador');
      setLocalError(result.error || 'O PIN digitado não confere com o PIN gravado desta sala existente.');
    }
  };

  const handleOverwriteExisting = async () => {
    if (!conflictRoom) return;
    setIsLoading(true);
    setLocalError(null);
    const result = await overwriteExistingService(conflictRoom.id, conflictRoom.code, newTitle, newPin);
    setIsLoading(false);
    if (result.success) {
      setConflictRoom(null);
    } else {
      setLocalError(result.error || 'Falha ao substituir sala.');
    }
  };

  return {
    mode,
    code,
    selectedRole,
    pin,
    setPin,
    newTitle,
    setNewTitle,
    newPin,
    setNewPin,
    customCode,
    setCustomCode,
    errorMessage: localError || contextError,
    isLoading,
    conflictRoom,
    setConflictRoom,
    handleCodeChange,
    handleRoleSelect,
    handleModeChange,
    handleJoin,
    handleCreate,
    handleOpenExisting,
    handleOverwriteExisting,
  };
}
