import { neon, neonConfig } from '@neondatabase/serverless';
import { Room, LiturgicalBlock, BlockType } from '../types/liturgy';

// Sanitiza e valida a URL do banco contra erros comuns de digitação/colagem em painéis de env
function cleanDatabaseUrl(raw?: string): string {
  if (!raw) return '';
  let url = raw.trim();
  // Se foi colado no campo Value com 'VITE_DATABASE_URL=...'
  if (url.startsWith('VITE_DATABASE_URL=')) {
    url = url.substring('VITE_DATABASE_URL='.length).trim();
  } else if (url.startsWith('DATABASE_URL=')) {
    url = url.substring('DATABASE_URL='.length).trim();
  }
  // Remove aspas extras ao redor da URL
  url = url.replace(/^["']+|["']+$/g, '').trim();

  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return url;
  }
  return '';
}

const rawEnvUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATABASE_URL) 
  || (typeof process !== 'undefined' && process.env?.VITE_DATABASE_URL);

// Obtém URL do banco configurada em ambiente com fallback seguro
const databaseUrl = cleanDatabaseUrl(rawEnvUrl) 
  || 'postgresql://neondb_owner:npg_lCE6u9gIqOXc@ep-super-field-au3e58we-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Configura o endpoint do Neon para usar o proxy '/api/sql' na mesma origem.
// Isso é essencial no Android 4.4.4 KitKat, cujo repositório nativo de certificados raiz (2013)
// não confia no ISRG Root X1 (Let's Encrypt), bloqueando qualquer HTTPS direto ao domínio neon.tech.
if (typeof window !== 'undefined' && window.location && window.location.origin) {
  neonConfig.fetchEndpoint = () => {
    return `${window.location.origin}/api/sql`;
  };

  const originalFetch = window.fetch.bind(window);
  neonConfig.fetchFunction = async (url: string, options: any) => {
    try {
      const res = await originalFetch(url, options);
      if (res.status !== 404) {
        return res;
      }
    } catch (e) {
      console.warn('Proxy /api/sql falhou, tentando fallback direto ao Neon...', e);
    }
    // Fallback direto caso /api/sql não exista
    const match = databaseUrl.match(/@([^/:]+)/);
    const host = match ? match[1] : 'ep-super-field-au3e58we-pooler.c-10.us-east-1.aws.neon.tech';
    return originalFetch(`https://${host}/sql`, options);
  };
}

// Inicializa o client HTTP serverless do Neon
export const sql = neon(databaseUrl);

/**
 * Gera código de sala amigável no formato XXX-XXX (6 caracteres alfanuméricos com hífen automático)
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
 * Busca sala ativa pelo código (aceita texto como ADU-PNO ou números)
 */
export async function getRoomByCode(code: string): Promise<Room | null> {
  const normalized = code.trim().toUpperCase();
  const withoutHyphen = normalized.replace(/-/g, '');
  // SEGURANÇA: Não seleciona controller_pin para nunca vazar a senha ao púlpito/obreiro
  const rows = await sql`
    SELECT id, code, title, service_date, active_alert, current_page, version, status, created_at, updated_at 
    FROM rooms 
    WHERE (UPPER(code) = ${normalized} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
      AND status = 'active'
    LIMIT 1
  `;
  if (!rows || rows.length === 0) return null;
  return rows[0] as Room;
}

/**
 * Valida o PIN do controlador com segurança diretamente no banco Neon.
 * O hash/senha real nunca trafega na resposta, retornando apenas confirmação booleana.
 */
export async function verifyControllerPin(code: string, pin: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  const withoutHyphen = normalized.replace(/-/g, '');
  const rows = await sql`
    SELECT id FROM rooms 
    WHERE (UPPER(code) = ${normalized} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
      AND controller_pin = ${pin}
      AND status = 'active'
    LIMIT 1
  `;
  return Boolean(rows && rows.length > 0);
}

/**
 * Busca apenas a versão e o aviso ativo da sala (Smart-Polling ultra leve)
 */
export async function getRoomMeta(code: string): Promise<{ version: number; active_alert: string | null; current_page: number } | null> {
  const normalized = code.trim().toUpperCase();
  const withoutHyphen = normalized.replace(/-/g, '');
  const rows = await sql`
    SELECT version, active_alert, current_page FROM rooms 
    WHERE (UPPER(code) = ${normalized} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
      AND status = 'active'
    LIMIT 1
  `;
  if (!rows || rows.length === 0) return null;
  return rows[0] as { version: number; active_alert: string | null; current_page: number };
}

export interface RoomSyncResult {
  version: number;
  active_alert: string | null;
  current_page: number;
  blocks?: LiturgicalBlock[];
  hasChanged: boolean;
}

/**
 * Sincronização inteligente em 1 viagem só (Sem Waterfall):
 * Busca a versão da sala. Se a versão mudou, já agrega e retorna os blocos litúrgicos no mesmo payload.
 */
export async function syncRoomState(
  roomId: string,
  code: string,
  currentVersion: number
): Promise<RoomSyncResult | null> {
  const normalized = code.trim().toUpperCase();
  const withoutHyphen = normalized.replace(/-/g, '');

  const rows = await sql`
    WITH room_meta AS (
      SELECT id, version, active_alert, current_page 
      FROM rooms 
      WHERE (id = ${roomId} OR UPPER(code) = ${normalized} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
        AND status = 'active'
      LIMIT 1
    )
    SELECT 
      r.version, 
      r.active_alert, 
      r.current_page,
      CASE 
        WHEN r.version != ${currentVersion} THEN (
          SELECT json_agg(b.*) FROM (
            SELECT DISTINCT ON (block_type) * 
            FROM liturgical_blocks 
            WHERE room_id = r.id 
            ORDER BY block_type, updated_at DESC
          ) b
        )
        ELSE NULL 
      END as blocks_data
    FROM room_meta r
  `;

  if (!rows || rows.length === 0) return null;
  const row = rows[0] as any;
  const version = Number(row.version);
  const hasChanged = version !== currentVersion;

  let blocks: LiturgicalBlock[] | undefined = undefined;
  if (hasChanged && row.blocks_data && Array.isArray(row.blocks_data)) {
    blocks = (row.blocks_data as LiturgicalBlock[]).sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0)
    );
  }

  return {
    version,
    active_alert: row.active_alert ?? null,
    current_page: Number(row.current_page ?? 1),
    blocks,
    hasChanged,
  };
}

/**
 * Busca todos os blocos litúrgicos de uma sala ordenados por ordem de exibição
 */
export async function getBlocksByRoomId(roomId: string): Promise<LiturgicalBlock[]> {
  const rows = await sql`
    SELECT DISTINCT ON (block_type) * FROM liturgical_blocks 
    WHERE room_id = ${roomId} 
    ORDER BY block_type, updated_at DESC
  `;
  const blocks = (rows || []) as LiturgicalBlock[];
  blocks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  return blocks;
}

/**
 * Cria uma nova sala com a estrutura de blocos padrão da congregação A.D. Utinga
 */
export async function createRoom(
  title: string = 'Culto de Celebração',
  controllerPin: string,
  preferredCode?: string
): Promise<{ room: Room; blocks: LiturgicalBlock[] }> {
  // Permite código alfanumérico customizado (ex: ADU-PNO) ou gera 6 dígitos aleatórios
  const code = preferredCode && preferredCode.trim().length >= 3 
    ? preferredCode.trim().toUpperCase() 
    : generateRoomCode();

  if (!controllerPin || controllerPin.trim().length < 4) {
    throw new Error('O PIN do Controlador deve conter pelo menos 4 dígitos.');
  }

  // Insere a sala no Neon
  const roomRows = await sql`
    INSERT INTO rooms (code, title, controller_pin, version, status)
    VALUES (${code}, ${title}, ${controllerPin.trim()}, 1, 'active')
    ON CONFLICT (code) DO UPDATE 
    SET title = ${title}, controller_pin = ${controllerPin.trim()}, status = 'active', updated_at = NOW()
    RETURNING id, code, title, service_date, active_alert, current_page, version, status, created_at, updated_at
  `;
  const room = roomRows[0] as Room;

  // Verifica se a sala já tem blocos criados para evitar duplicidade
  const existingBlocks = await sql`
    SELECT * FROM liturgical_blocks 
    WHERE room_id = ${room.id}
    ORDER BY order_index ASC
  `;

  if (existingBlocks && existingBlocks.length > 0) {
    return { room, blocks: existingBlocks as LiturgicalBlock[] };
  }

  // Cria os blocos padrão da congregação (folha limpa com os 5 departamentos padrão)
  const defaultBlocks: Array<{
    type: BlockType;
    title: string;
    content: any;
    order: number;
    sheet: number;
  }> = [
    {
      type: 'visitors',
      title: 'Visitantes',
      content: [],
      order: 1,
      sheet: 1, // Folha 1 (Esquerda)
    },
    {
      type: 'prayer',
      title: 'Pedidos de Oração',
      content: [],
      order: 2,
      sheet: 1, // Folha 1 (Esquerda)
    },
    {
      type: 'youtube',
      title: 'Pedidos de Oração Youtube',
      content: [],
      order: 3,
      sheet: 1, // Folha 1 (Esquerda)
    },
    {
      type: 'opportunities',
      title: 'Oportunidades',
      content: [],
      order: 4,
      sheet: 2, // Folha 2 (Direita)
    },
    {
      type: 'choirs',
      title: 'Departamentos',
      content: [
        { id: '1', name: 'Mocidade', checked: false },
        { id: '2', name: 'Círculo de Oração', checked: false },
        { id: '3', name: 'Varões', checked: false },
        { id: '4', name: 'Juniores', checked: false },
        { id: '5', name: 'Crianças', checked: false }
      ],
      order: 5,
      sheet: 2, // Folha 2 (Direita)
    }
  ];

  // Insere cada bloco no banco
  const createdBlocks: LiturgicalBlock[] = [];
  for (const b of defaultBlocks) {
    const blockRows = await sql`
      INSERT INTO liturgical_blocks (room_id, block_type, title, content, order_index, sheet_assignment)
      VALUES (${room.id}, ${b.type}, ${b.title}, ${JSON.stringify(b.content)}, ${b.order}, ${b.sheet})
      ON CONFLICT (room_id, block_type) DO NOTHING
      RETURNING *
    `;
    if (blockRows && blockRows.length > 0) {
      createdBlocks.push(blockRows[0] as LiturgicalBlock);
    }
  }

  return { room, blocks: createdBlocks };
}

/**
 * Atualiza o conteúdo de um bloco e incrementa a versão da sala em 1 única viagem HTTP (CTE atômica)
 */
export async function updateBlockContent(blockId: string, content: any, roomId: string): Promise<void> {
  const contentJson = typeof content === 'string' ? content : JSON.stringify(content);
  await sql`
    WITH upd AS (
      UPDATE liturgical_blocks 
      SET content = ${contentJson}::jsonb, updated_at = NOW()
      WHERE id = ${blockId}
    )
    UPDATE rooms 
    SET version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
}

/**
 * Concatena novos itens a um bloco de forma atômica no PostgreSQL (sem risco de sobrescrita concorrente)
 * Se 2 ou mais obreiros adicionarem itens no mesmo milissegundo, o Postgres enfileira e preserva todos!
 */
export async function appendBlockContent(blockId: string, newItems: any[], roomId: string): Promise<void> {
  if (!newItems || newItems.length === 0) return;
  const itemsJson = JSON.stringify(newItems);
  await sql`
    WITH upd AS (
      UPDATE liturgical_blocks 
      SET content = COALESCE(content, '[]'::jsonb) || ${itemsJson}::jsonb, updated_at = NOW()
      WHERE id = ${blockId}
    )
    UPDATE rooms 
    SET version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
}

/**
 * Dispara ou limpa o aviso urgente no topo da tela do púlpito
 */
export async function setRoomAlert(roomId: string, alertText: string | null): Promise<void> {
  await sql`
    UPDATE rooms 
    SET active_alert = ${alertText}, version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
}

/**
 * Atualiza a página ativa remotamente para o púlpito
 */
export async function setRoomCurrentPage(roomId: string, page: number): Promise<void> {
  await sql`
    UPDATE rooms 
    SET current_page = ${page}, version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
}

/**
 * Atualiza o nome/título do culto
 */
export async function updateRoomTitle(roomId: string, newTitle: string): Promise<void> {
  await sql`
    UPDATE rooms 
    SET title = ${newTitle.trim()}, version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
}

/**
 * Atualiza o código/chave da sala no formato padrão XXX-XXX
 */
export async function updateRoomCode(roomId: string, newCode: string): Promise<{ success: boolean; error?: string }> {
  const clean = formatRoomCodeMask(newCode);
  const withoutHyphen = clean.replace(/-/g, '');
  if (withoutHyphen.length < 6) {
    return { success: false, error: 'O código deve conter 6 caracteres no formato XXX-XXX.' };
  }
  
  // Verifica se já existe outra sala ativa com este código
  const existing = await sql`
    SELECT id FROM rooms 
    WHERE (UPPER(code) = ${clean} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
      AND id != ${roomId}
      AND status = 'active'
    LIMIT 1
  `;
  if (existing && existing.length > 0) {
    return { success: false, error: `O código ${clean} já está em uso por outro culto ativo.` };
  }

  await sql`
    UPDATE rooms 
    SET code = ${clean}, version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
  return { success: true };
}

/**
 * Arquiva o culto atual e reinicia as folhas para um novo culto
 */
export async function archiveAndResetRoom(roomId: string, newTitle: string): Promise<void> {
  // Limpa o conteúdo dos blocos para uma folha limpa
  await sql`
    UPDATE rooms 
    SET title = ${newTitle}, active_alert = NULL, current_page = 1, version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
  // Reseta os blocos para vazios
  await sql`
    UPDATE liturgical_blocks 
    SET content = '[]'::jsonb, updated_at = NOW()
    WHERE room_id = ${roomId} AND block_type IN ('visitors', 'prayer', 'youtube', 'opportunities')
  `;
  // Desmarca checkboxes de conjuntos mantendo os nomes cadastrados pela igreja
  await sql`
    UPDATE liturgical_blocks 
    SET content = CASE 
      WHEN content IS NULL OR jsonb_array_length(content) = 0 THEN '[]'::jsonb
      ELSE (
        SELECT COALESCE(jsonb_agg(jsonb_set(elem, '{checked}', 'false'::jsonb)), '[]'::jsonb)
        FROM jsonb_array_elements(content) AS elem
      )
    END,
    updated_at = NOW()
    WHERE room_id = ${roomId} AND block_type = 'choirs'
  `;
}

/**
 * Substitui um culto existente com nova folha limpa e atualiza o PIN
 */
export async function overwriteExistingRoom(roomId: string, newTitle: string, newPin: string): Promise<void> {
  await sql`
    UPDATE rooms 
    SET title = ${newTitle}, controller_pin = ${newPin.trim()}, active_alert = NULL, current_page = 1, version = version + 1, updated_at = NOW()
    WHERE id = ${roomId}
  `;
  await sql`
    UPDATE liturgical_blocks 
    SET content = '[]'::jsonb, updated_at = NOW()
    WHERE room_id = ${roomId} AND block_type IN ('visitors', 'prayer', 'youtube', 'opportunities')
  `;
  await sql`
    UPDATE liturgical_blocks 
    SET content = CASE 
      WHEN content IS NULL OR jsonb_array_length(content) = 0 THEN '[]'::jsonb
      ELSE (
        SELECT COALESCE(jsonb_agg(jsonb_set(elem, '{checked}', 'false'::jsonb)), '[]'::jsonb)
        FROM jsonb_array_elements(content) AS elem
      )
    END,
    updated_at = NOW()
    WHERE room_id = ${roomId} AND block_type = 'choirs'
  `;
}
