import { neon } from '@neondatabase/serverless';
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

// Inicializa o client HTTP serverless do Neon
export const sql = neon(databaseUrl);

// Gera código de sala amigável de 6 dígitos numéricos
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

/**
 * Busca todos os blocos litúrgicos de uma sala ordenados por ordem de exibição
 */
export async function getBlocksByRoomId(roomId: string): Promise<LiturgicalBlock[]> {
  const rows = await sql`
    SELECT * FROM liturgical_blocks 
    WHERE room_id = ${roomId} 
    ORDER BY order_index ASC
  `;
  return (rows || []) as LiturgicalBlock[];
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

  // Cria os blocos padrão da congregação (baseado no Google Docs da A.D. Utinga)
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
      content: [
        { id: '1', name: 'Mãe da Andrei', church: '', invited_by: 'Andrei' }
      ],
      order: 1,
      sheet: 1, // Folha 1 (Esquerda)
    },
    {
      type: 'prayer',
      title: 'Pedidos de Oração',
      content: [
        { id: '1', description: 'Pedidos de oração do Irmão Ervelino: Pastor Silas e Kelly; Irmã Nadir; Irmã Graciete; Valentina; Talita; Leonor; Regina e Beto; Deilton e Esposa; Tânia; Antonio; Rosângela; Irmã Aninha; Irmã Eluana; Guilherme; Irmã Celia;', urgent: false },
        { id: '2', description: 'Oração pela irmã Sebastiana', urgent: false },
        { id: '3', description: 'Oração por João está na UTI - irmão da irmã Sara', urgent: true },
        { id: '4', description: 'Irmã Iva', urgent: false },
        { id: '5', description: 'Irmã Shirlei está internada', urgent: true }
      ],
      order: 2,
      sheet: 1, // Folha 1 (Esquerda)
    },
    {
      type: 'youtube',
      title: 'Pedidos de Oração Youtube',
      content: [
        { id: '1', description: 'Família do Irmão Marcos (Live)', urgent: false }
      ],
      order: 3,
      sheet: 1, // Folha 1 (Esquerda)
    },
    {
      type: 'opportunities',
      title: 'Oportunidade',
      content: [
        { id: '1', name: 'Grupo Renovo' }
      ],
      order: 4,
      sheet: 2, // Folha 2 (Direita)
    },
    {
      type: 'choirs',
      title: 'Conjuntos',
      content: [
        { id: '1', name: 'Mocidade', checked: false },
        { id: '2', name: 'Círculo de Oração', checked: false },
        { id: '3', name: 'Varões', checked: true },
        { id: '4', name: 'Juniores', checked: false },
        { id: '5', name: 'Crianças', checked: true }
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
      RETURNING *
    `;
    createdBlocks.push(blockRows[0] as LiturgicalBlock);
  }

  return { room, blocks: createdBlocks };
}

/**
 * Atualiza o conteúdo de um bloco e incrementa a versão da sala
 */
export async function updateBlockContent(blockId: string, content: any, roomId: string): Promise<void> {
  const contentJson = typeof content === 'string' ? content : JSON.stringify(content);
  await sql`
    UPDATE liturgical_blocks 
    SET content = ${contentJson}::jsonb, updated_at = NOW()
    WHERE id = ${blockId}
  `;
  // Incrementa a versão da sala para avisar os leitores
  await sql`
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
  // Desmarca checkboxes de conjuntos
  await sql`
    UPDATE liturgical_blocks 
    SET content = '[{"id":"1","name":"Mocidade","checked":false},{"id":"2","name":"Círculo de Oração","checked":false},{"id":"3","name":"Varões","checked":false},{"id":"4","name":"Juniores","checked":false},{"id":"5","name":"Crianças","checked":false}]'::jsonb, updated_at = NOW()
    WHERE room_id = ${roomId} AND block_type = 'choirs'
  `;
}
