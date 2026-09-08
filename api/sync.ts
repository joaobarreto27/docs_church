import { neon } from '@neondatabase/serverless';

function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || 
              process.env.POSTGRES_URL || 
              process.env.NEON_DATABASE_URL || 
              process.env.DATABASE_URL_UNPOOLED ||
              process.env.VITE_DATABASE_URL;
  if (!raw) {
    const keys = Object.keys(process.env)
      .filter(k => !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('token') && !k.toLowerCase().includes('key'));
    throw new Error(`DATABASE_URL não configurada no ambiente. Variáveis disponíveis: [${keys.join(', ')}]`);
  }

  let url = raw.trim();
  if (url.startsWith('DATABASE_URL=')) url = url.substring('DATABASE_URL='.length).trim();
  else if (url.startsWith('POSTGRES_URL=')) url = url.substring('POSTGRES_URL='.length).trim();
  else if (url.startsWith('NEON_DATABASE_URL=')) url = url.substring('NEON_DATABASE_URL='.length).trim();
  else if (url.startsWith('VITE_DATABASE_URL=')) url = url.substring('VITE_DATABASE_URL='.length).trim();
  url = url.replace(/^["']+|["']+$/g, '').trim();

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error('DATABASE_URL inválida (deve iniciar com postgresql:// ou postgres://).');
  }

  return url;
}

let _cachedUrl = '';
let _sqlInstance: any = null;
function getSql() {
  const currentUrl = getDatabaseUrl();
  if (!_sqlInstance || _cachedUrl !== currentUrl) {
    _cachedUrl = currentUrl;
    _sqlInstance = neon(currentUrl);
  }
  return _sqlInstance;
}

type SqlFunction = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
const sql: SqlFunction = ((...args: any[]) => (getSql() as any)(...args)) as any;

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let params = req.method === 'POST' ? req.body || {} : req.query || {};
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch {
        params = {};
      }
    }

    const roomId = String(params.roomId || params.id || '').trim();
    const code = String(params.code || '').trim().toUpperCase();
    const currentVersion = Number(params.version ?? -1);

    if (!roomId && !code) {
      return res.status(400).json({ error: 'Parâmetros roomId ou code obrigatórios.' });
    }

    const normalizedCode = code || roomId.toUpperCase();
    const withoutHyphen = normalizedCode.replace(/-/g, '');

    const rows = await sql`
      WITH room_meta AS (
        SELECT id, code, title, version, active_alert, current_page 
        FROM rooms 
        WHERE (id::text = ${roomId || normalizedCode} OR UPPER(code) = ${normalizedCode} OR REPLACE(UPPER(code), '-', '') = ${withoutHyphen})
          AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      )
      SELECT 
        r.id,
        r.code,
        r.title,
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

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Sala não encontrada ou inativa.' });
    }

    const row = rows[0] as any;
    const version = Number(row.version);
    const hasChanged = version !== currentVersion;

    let blocks: any[] | undefined = undefined;
    if (hasChanged && row.blocks_data && Array.isArray(row.blocks_data)) {
      blocks = row.blocks_data.sort(
        (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
      );
    }

    return res.status(200).json({
      id: row.id,
      code: row.code,
      title: row.title,
      version,
      active_alert: row.active_alert ?? null,
      current_page: Number(row.current_page ?? 1),
      blocks,
      hasChanged,
    });
  } catch (error: any) {
    console.error('Erro no /api/sync:', error);
    const safeMsg = error?.message ? String(error.message).replace(/:[^:@]+@/, ':***@') : 'Falha interna ao sincronizar sala.';
    return res.status(500).json({ error: safeMsg });
  }
}
