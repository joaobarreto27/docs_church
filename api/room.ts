import { sql, signControllerToken, verifyControllerToken } from './_db';

function formatRoomCodeMask(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 3; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${p1}-${p2}`;
}

async function getRoomBlocks(roomId: string) {
  const rows = await sql`
    SELECT DISTINCT ON (block_type) id, room_id, block_type, title, content, order_index, sheet_assignment, created_at, updated_at
    FROM liturgical_blocks 
    WHERE room_id::text = ${roomId}
    ORDER BY block_type, updated_at DESC
  `;
  const blocks = (rows || []) as any[];
  blocks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  return blocks;
}

async function authorizeController(roomId: string, token?: string, pin?: string): Promise<boolean> {
  if (token && verifyControllerToken(token, roomId)) {
    return true;
  }
  if (pin && pin.trim().length >= 4) {
    const rows = await sql`
      SELECT id FROM rooms 
      WHERE (id::text = ${roomId} OR UPPER(code) = UPPER(${roomId}))
        AND controller_pin = ${pin.trim()}
        AND status = 'active'
      LIMIT 1
    `;
    return Boolean(rows && rows.length > 0);
  }
  return false;
}

// Proteção contra Força Bruta (Brute-force) no PIN do controlador: máx 5 erros por IP a cada 3 min
const failedAttemptsByIp = new Map<string, { count: number; blockedUntil: number }>();

function checkPinRateLimit(ip: string): { blocked: boolean; remainingSeconds?: number } {
  const record = failedAttemptsByIp.get(ip);
  if (!record) return { blocked: false };
  const now = Date.now();
  if (record.blockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }
  if (record.blockedUntil <= now && record.blockedUntil > 0) {
    failedAttemptsByIp.delete(ip);
  }
  return { blocked: false };
}

function recordFailedPinAttempt(ip: string) {
  const record = failedAttemptsByIp.get(ip) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 3 * 60 * 1000; // Bloqueio temporário de 3 minutos
  }
  failedAttemptsByIp.set(ip, record);
}

function clearPinRateLimit(ip: string) {
  failedAttemptsByIp.delete(ip);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const body = req.method === 'POST' ? req.body || {} : req.query || {};
    const action = String(body.action || '').trim();

    // 1. LOOKUP: Busca sala e blocos por código ou ID
    if (action === 'lookup') {
      const codeOrId = String(body.code || body.id || '').trim();
      if (!codeOrId) return res.status(400).json({ error: 'Código ou ID obrigatório.' });

      const normalized = codeOrId.toUpperCase();
      const withoutHyphen = normalized.replace(/-/g, '');

      const roomRows = await sql`
        SELECT id, code, title, service_date, active_alert, current_page, version, status, created_at, updated_at 
        FROM rooms 
        WHERE (id::text = ${codeOrId} OR UPPER(code) = ${normalized} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
          AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      if (!roomRows || roomRows.length === 0) {
        return res.status(404).json({ error: 'Culto não encontrado com este código.' });
      }

      const room = roomRows[0];
      const blocks = await getRoomBlocks(room.id);
      return res.status(200).json({ room, blocks });
    }

    // 2. JOIN: Entra na sala e valida PIN se papel for 'controlador'
    if (action === 'join') {
      const code = String(body.code || '').trim().toUpperCase();
      const role = String(body.role || 'pastor').toLowerCase();
      const pin = String(body.pin || '').trim();

      if (!code) return res.status(400).json({ success: false, error: 'Código de culto obrigatório.' });

      const withoutHyphen = code.replace(/-/g, '');
      const roomRows = await sql`
        SELECT id, code, title, service_date, active_alert, current_page, version, status, controller_pin, created_at, updated_at 
        FROM rooms 
        WHERE (id::text = ${code} OR UPPER(code) = ${code} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
          AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      if (!roomRows || roomRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Código de culto não encontrado ou inativo.' });
      }

      const roomRow = roomRows[0];
      let sessionToken: string | undefined;

      if (role === 'controlador') {
        const clientIp = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
        const rateLimitStatus = checkPinRateLimit(clientIp);
        if (rateLimitStatus.blocked) {
          return res.status(429).json({ 
            success: false, 
            error: `Muitas tentativas incorretas. Por segurança, tente novamente em ${rateLimitStatus.remainingSeconds} segundos.` 
          });
        }

        if (!pin || pin.length < 4) {
          return res.status(400).json({ success: false, error: 'O papel de Controlador exige um PIN de pelo menos 4 dígitos.' });
        }
        if (roomRow.controller_pin !== pin) {
          recordFailedPinAttempt(clientIp);
          return res.status(401).json({ success: false, error: 'PIN do Controlador incorreto.' });
        }
        clearPinRateLimit(clientIp);
        sessionToken = signControllerToken(roomRow.id, pin);
      }

      // Remove controller_pin antes de devolver ao cliente
      const { controller_pin, ...safeRoom } = roomRow;
      const blocks = await getRoomBlocks(safeRoom.id);

      return res.status(200).json({
        success: true,
        room: safeRoom,
        blocks,
        sessionToken
      });
    }

    // 3. CREATE: Cria nova sala no Neon com validações rigorosas de servidor
    if (action === 'create') {
      const title = String(body.title || 'Culto de Celebração').trim().slice(0, 100);
      const pin = String(body.pin || '').trim();
      const preferredCode = body.preferredCode ? String(body.preferredCode).trim().toUpperCase() : null;

      if (!pin || pin.length < 4) {
        return res.status(400).json({ success: false, error: 'O PIN deve conter pelo menos 4 dígitos.' });
      }

      let code = preferredCode ? formatRoomCodeMask(preferredCode) : generateRandomCode();

      // Cria a sala no Postgres
      const roomRows = await sql`
        INSERT INTO rooms (code, title, controller_pin, version, status)
        VALUES (${code}, ${title}, ${pin}, 1, 'active')
        ON CONFLICT (code) DO UPDATE 
        SET title = ${title}, controller_pin = ${pin}, status = 'active', updated_at = NOW()
        RETURNING id, code, title, service_date, active_alert, current_page, version, status, created_at, updated_at
      `;
      const room = roomRows[0];

      // Garante os blocos litúrgicos padrão
      const existing = await getRoomBlocks(room.id);
      let blocks = existing;

      if (!existing || existing.length === 0) {
        const defaultBlocks = [
          { type: 'visitors', title: 'Visitantes', content: [], order: 1, sheet: 1 },
          { type: 'prayer', title: 'Pedidos de Oração', content: [], order: 2, sheet: 1 },
          { type: 'youtube', title: 'Pedidos de Oração Youtube', content: [], order: 3, sheet: 1 },
          { type: 'opportunities', title: 'Oportunidades', content: [], order: 4, sheet: 2 },
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
            sheet: 2
          }
        ];

        for (const b of defaultBlocks) {
          await sql`
            INSERT INTO liturgical_blocks (room_id, block_type, title, content, order_index, sheet_assignment)
            VALUES (${room.id}, ${b.type}, ${b.title}, ${JSON.stringify(b.content)}::jsonb, ${b.order}, ${b.sheet})
            ON CONFLICT (room_id, block_type) DO NOTHING
          `;
        }
        blocks = await getRoomBlocks(room.id);
      }

      const sessionToken = signControllerToken(room.id, pin);
      return res.status(200).json({
        success: true,
        room,
        blocks,
        sessionToken,
        code: room.code
      });
    }

    // 4. AÇÕES DE CONTROLADOR (Exigem autorização obrigatória de servidor)
    const roomId = String(body.roomId || body.id || '').trim();
    const token = req.headers.authorization?.replace('Bearer ', '') || body.sessionToken;
    const pin = body.pin ? String(body.pin).trim() : undefined;

    if (!roomId) {
      return res.status(400).json({ success: false, error: 'roomId obrigatório para operações de controlador.' });
    }

    const isAuthorized = await authorizeController(roomId, token, pin);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Acesso negado: token de controlador inválido ou expirado.' });
    }

    if (action === 'update-code') {
      const newCode = formatRoomCodeMask(String(body.newCode || ''));
      const withoutHyphen = newCode.replace(/-/g, '');
      if (withoutHyphen.length < 6) {
        return res.status(400).json({ success: false, error: 'O código deve conter 6 caracteres no formato XXX-XXX.' });
      }

      const conflict = await sql`
        SELECT id FROM rooms 
        WHERE (UPPER(code) = ${newCode} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
          AND id::text != ${roomId}
          AND status = 'active'
        LIMIT 1
      `;
      if (conflict && conflict.length > 0) {
        return res.status(409).json({ success: false, error: `O código ${newCode} já está em uso por outro culto ativo.` });
      }

      await sql`
        UPDATE rooms 
        SET code = ${newCode}, version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId}
      `;
      return res.status(200).json({ success: true, code: newCode });
    }

    if (action === 'update-title') {
      const title = String(body.title || '').trim().slice(0, 100);
      if (!title) return res.status(400).json({ success: false, error: 'Título não pode ser vazio.' });

      await sql`
        UPDATE rooms 
        SET title = ${title}, version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId}
      `;
      return res.status(200).json({ success: true });
    }

    if (action === 'send-alert') {
      const alert = body.alert ? String(body.alert).trim().slice(0, 300) : null;
      await sql`
        UPDATE rooms 
        SET active_alert = ${alert}, version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId}
      `;
      return res.status(200).json({ success: true });
    }

    if (action === 'set-page') {
      const page = Number(body.page || 1);
      await sql`
        UPDATE rooms 
        SET current_page = ${page}, version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId}
      `;
      return res.status(200).json({ success: true });
    }

    if (action === 'reset-service') {
      const title = String(body.title || 'Culto de Celebração').trim().slice(0, 100);
      await sql`
        UPDATE rooms 
        SET title = ${title}, active_alert = NULL, current_page = 1, version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId}
      `;
      await sql`
        UPDATE liturgical_blocks 
        SET content = '[]'::jsonb, updated_at = NOW()
        WHERE room_id::text = ${roomId} AND block_type IN ('visitors', 'prayer', 'youtube', 'opportunities')
      `;
      await sql`
        UPDATE liturgical_blocks 
        SET content = CASE 
          WHEN content IS NULL OR jsonb_typeof(content) != 'array' OR jsonb_array_length(content) = 0 THEN '[]'::jsonb
          ELSE (
            SELECT COALESCE(jsonb_agg(jsonb_set(elem, '{checked}', 'false'::jsonb)), '[]'::jsonb)
            FROM jsonb_array_elements(content) AS elem
          )
        END,
        updated_at = NOW()
        WHERE room_id::text = ${roomId} AND block_type = 'choirs'
      `;
      return res.status(200).json({ success: true });
    }

    if (action === 'overwrite-service') {
      const title = String(body.title || 'Culto de Celebração').trim().slice(0, 100);
      const newPin = String(body.newPin || '').trim();
      if (!newPin || newPin.length < 4) {
        return res.status(400).json({ success: false, error: 'O novo PIN deve ter pelo menos 4 dígitos.' });
      }

      await sql`
        UPDATE rooms 
        SET title = ${title}, controller_pin = ${newPin}, active_alert = NULL, current_page = 1, version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId}
      `;
      await sql`
        UPDATE liturgical_blocks 
        SET content = '[]'::jsonb, updated_at = NOW()
        WHERE room_id::text = ${roomId} AND block_type IN ('visitors', 'prayer', 'youtube', 'opportunities')
      `;
      await sql`
        UPDATE liturgical_blocks 
        SET content = CASE 
          WHEN content IS NULL OR jsonb_typeof(content) != 'array' OR jsonb_array_length(content) = 0 THEN '[]'::jsonb
          ELSE (
            SELECT COALESCE(jsonb_agg(jsonb_set(elem, '{checked}', 'false'::jsonb)), '[]'::jsonb)
            FROM jsonb_array_elements(content) AS elem
          )
        END,
        updated_at = NOW()
        WHERE room_id::text = ${roomId} AND block_type = 'choirs'
      `;

      const newToken = signControllerToken(roomId, newPin);
      return res.status(200).json({ success: true, sessionToken: newToken });
    }

    return res.status(400).json({ error: 'Ação não reconhecida.' });
  } catch (err: any) {
    console.error('Erro em /api/room:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao processar operação da sala.' });
  }
}
