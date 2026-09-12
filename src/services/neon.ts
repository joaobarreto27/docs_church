import { Room, LiturgicalBlock } from '../types/liturgy';

/**
 * Gera código de sala amigável no formato XXX-XXX (6 caracteres alfanuméricos)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 3; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${p1}-${p2}`;
}

/**
 * Máscara padrão para código de sala: aceita apenas letras e números, convertendo automaticamente para XXX-XXX
 */
export function formatRoomCodeMask(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

/**
 * Executa uma operação assíncrona com tentativas automáticas contra oscilações de rede (Wi-Fi de igreja)
 */
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 2, delayMs = 350): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Helper seguro para requisições à API do servidor
 */
async function postApi<T>(endpoint: string, payload: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data && (data.error || data.message)) errMsg = data.error || data.message;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

/**
 * Busca sala ativa pelo código através da API protegida
 */
export async function getRoomByCode(code: string): Promise<Room | null> {
  try {
    const data = await postApi<{ room: Room; blocks: LiturgicalBlock[] }>('/api/room', {
      action: 'lookup',
      code,
    });
    return data.room || null;
  } catch (err) {
    return null;
  }
}

/**
 * Valida o PIN do controlador exclusivamente no servidor
 */
export async function verifyControllerPin(code: string, pin: string): Promise<boolean> {
  try {
    const res = await postApi<{ success: boolean; sessionToken?: string }>('/api/room', {
      action: 'join',
      code,
      role: 'controlador',
      pin,
    });
    return Boolean(res && res.success);
  } catch {
    return false;
  }
}

/**
 * Realiza o login na sala com emissão de token de sessão assinado
 */
export async function joinRoomApi(code: string, role: string, pin?: string): Promise<{ success: boolean; room?: Room; blocks?: LiturgicalBlock[]; sessionToken?: string; error?: string }> {
  try {
    return await postApi('/api/room', {
      action: 'join',
      code,
      role,
      pin,
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao conectar à sala.' };
  }
}

/**
 * Busca metadados da sala
 */
export async function getRoomMeta(identifier: string): Promise<{ id: string; code: string; title: string; version: number; active_alert: string | null; current_page: number } | null> {
  try {
    const res = await fetch(`/api/sync?roomId=${encodeURIComponent(identifier)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      code: data.code,
      title: data.title,
      version: data.version,
      active_alert: data.active_alert,
      current_page: data.current_page,
    };
  } catch {
    return null;
  }
}

export interface RoomSyncResult {
  id: string;
  code: string;
  title: string;
  version: number;
  active_alert: string | null;
  current_page: number;
  blocks?: LiturgicalBlock[];
  hasChanged: boolean;
}

/**
 * Sincronização inteligente via /api/sync (sem expor credenciais)
 */
export async function syncRoomState(
  roomId: string,
  code: string,
  currentVersion: number
): Promise<RoomSyncResult | null> {
  try {
    return await postApi<RoomSyncResult>('/api/sync', {
      roomId,
      code,
      version: currentVersion,
    });
  } catch {
    return null;
  }
}

/**
 * Busca todos os blocos litúrgicos de uma sala
 */
export async function getBlocksByRoomId(roomId: string): Promise<LiturgicalBlock[]> {
  try {
    const data = await postApi<{ room: Room; blocks: LiturgicalBlock[] }>('/api/room', {
      action: 'lookup',
      id: roomId,
    });
    return data.blocks || [];
  } catch {
    return [];
  }
}

/**
 * Cria uma nova sala no servidor
 */
export async function createRoom(
  title: string = 'Culto de Celebração',
  controllerPin: string,
  preferredCode?: string
): Promise<{ room: Room; blocks: LiturgicalBlock[]; sessionToken?: string }> {
  return await postApi<{ room: Room; blocks: LiturgicalBlock[]; sessionToken?: string }>('/api/room', {
    action: 'create',
    title,
    pin: controllerPin,
    preferredCode,
  });
}

/**
 * Atualiza o conteúdo de um bloco (com proteção contra IDOR no servidor)
 */
export async function updateBlockContent(blockId: string, content: any, roomId: string, token?: string): Promise<void> {
  await withRetry(async () => {
    await postApi('/api/block', {
      action: 'update',
      blockId,
      roomId,
      content,
    }, token);
  });
}

/**
 * Concatena novos itens a um bloco de forma atômica no servidor
 */
export async function appendBlockContent(blockId: string, newItems: any[], roomId: string): Promise<void> {
  if (!newItems || newItems.length === 0) return;
  await withRetry(async () => {
    await postApi('/api/block', {
      action: 'append',
      blockId,
      roomId,
      newItems,
    });
  });
}

/**
 * Dispara ou limpa o aviso urgente no topo da tela do púlpito
 */
export async function setRoomAlert(roomId: string, alertText: string | null, token?: string): Promise<void> {
  await withRetry(async () => {
    await postApi('/api/room', {
      action: 'send-alert',
      roomId,
      alert: alertText,
      message: alertText,
      sessionToken: token,
    }, token);
  });
}

/**
 * Atualiza a página ativa remotamente para o púlpito
 */
export async function setRoomCurrentPage(roomId: string, page: number, token?: string): Promise<void> {
  await withRetry(async () => {
    await postApi('/api/room', {
      action: 'set-page',
      roomId,
      page,
      sessionToken: token,
    }, token);
  });
}

/**
 * Atualiza o nome/título do culto
 */
export async function updateRoomTitle(roomId: string, newTitle: string, token?: string): Promise<void> {
  await withRetry(async () => {
    await postApi('/api/room', {
      action: 'update-title',
      roomId,
      title: newTitle,
      sessionToken: token,
    }, token);
  });
}

/**
 * Atualiza o código/chave da sala no formato padrão XXX-XXX
 */
export async function updateRoomCode(roomId: string, newCode: string, token?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await postApi<{ success: boolean; error?: string }>('/api/room', {
      action: 'update-code',
      roomId,
      newCode,
      sessionToken: token,
    }, token);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao atualizar código.' };
  }
}

/**
 * Arquiva o culto atual e reinicia as folhas para um novo culto
 */
export async function archiveAndResetRoom(roomId: string, newTitle: string, token?: string): Promise<void> {
  await withRetry(async () => {
    await postApi('/api/room', {
      action: 'reset-service',
      roomId,
      title: newTitle,
      sessionToken: token,
    }, token);
  });
}

/**
 * Substitui um culto existente com nova folha limpa e atualiza o PIN
 */
export async function overwriteExistingRoom(roomId: string, newTitle: string, newPin: string, token?: string): Promise<{ success: boolean; sessionToken?: string }> {
  return await withRetry(async () => {
    return await postApi<{ success: boolean; sessionToken?: string }>('/api/room', {
      action: 'overwrite-service',
      roomId,
      title: newTitle,
      newPin,
      sessionToken: token,
    }, token);
  });
}
