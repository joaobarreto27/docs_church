import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_db';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const params = req.method === 'POST' ? req.body || {} : req.query || {};
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
    return res.status(500).json({ error: 'Falha interna ao sincronizar sala.' });
  }
}
