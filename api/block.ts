import { sql } from './_db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = req.body || {};
    const action = String(body.action || '').trim();
    const roomId = String(body.roomId || '').trim();
    const blockId = String(body.blockId || '').trim();

    if (!roomId || !blockId) {
      return res.status(400).json({ error: 'Parâmetros roomId e blockId são obrigatórios (proteção contra IDOR).' });
    }

    // 1. APPEND: Adiciona itens aos blocos (Visitantes, Oração, etc. pelo obreiro) de forma atômica
    if (action === 'append') {
      const newItems = body.newItems;
      if (!Array.isArray(newItems) || newItems.length === 0) {
        return res.status(400).json({ error: 'newItems deve ser um array não vazio.' });
      }

      // Sanitização estrita de cada item para prevenir DoS e corrupção de schema
      const sanitized = newItems.slice(0, 50).map((item: any) => {
        const cleanItem: Record<string, any> = {
          id: String(item.id || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`).slice(0, 50)
        };
        if (item.name) cleanItem.name = String(item.name).trim().slice(0, 200);
        if (item.church) cleanItem.church = String(item.church).trim().slice(0, 150);
        if (item.invited_by) cleanItem.invited_by = String(item.invited_by).trim().slice(0, 150);
        if (item.description) cleanItem.description = String(item.description).trim().slice(0, 300);
        if (item.urgent !== undefined) cleanItem.urgent = Boolean(item.urgent);
        if (item.checked !== undefined) cleanItem.checked = Boolean(item.checked);
        if (item.created_at) cleanItem.created_at = Number(item.created_at) || Date.now();
        return cleanItem;
      });

      const itemsJson = JSON.stringify(sanitized);

      // Trava de IDOR: Atualiza APENAS se o blockId pertencer ao roomId informado
      const updateRes = await sql`
        WITH upd AS (
          UPDATE liturgical_blocks 
          SET content = COALESCE(content, '[]'::jsonb) || ${itemsJson}::jsonb, updated_at = NOW()
          WHERE id::text = ${blockId} AND room_id::text = ${roomId}
          RETURNING id
        )
        UPDATE rooms 
        SET version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId} AND EXISTS (SELECT 1 FROM upd)
        RETURNING version
      `;

      if (!updateRes || updateRes.length === 0) {
        return res.status(404).json({ error: 'Bloco ou sala não encontrada com o vínculo informado (IDOR bloqueado).' });
      }

      return res.status(200).json({ success: true, version: updateRes[0].version });
    }

    // 2. UPDATE: Atualiza conteúdo integral de um bloco
    if (action === 'update') {
      const content = body.content;
      if (content === undefined) {
        return res.status(400).json({ error: 'content obrigatório.' });
      }

      const contentJson = typeof content === 'string' ? content : JSON.stringify(content);
      if (contentJson.length > 200000) {
        return res.status(413).json({ error: 'Payload excede o limite máximo permitido de 200KB.' });
      }

      // Trava de IDOR: Atualiza APENAS se o blockId pertencer ao roomId informado
      const updateRes = await sql`
        WITH upd AS (
          UPDATE liturgical_blocks 
          SET content = ${contentJson}::jsonb, updated_at = NOW()
          WHERE id::text = ${blockId} AND room_id::text = ${roomId}
          RETURNING id
        )
        UPDATE rooms 
        SET version = version + 1, updated_at = NOW()
        WHERE id::text = ${roomId} AND EXISTS (SELECT 1 FROM upd)
        RETURNING version
      `;

      if (!updateRes || updateRes.length === 0) {
        return res.status(404).json({ error: 'Bloco ou sala não encontrada com o vínculo informado (IDOR bloqueado).' });
      }

      return res.status(200).json({ success: true, version: updateRes[0].version });
    }

    return res.status(400).json({ error: 'Ação não reconhecida no /api/block.' });
  } catch (err: any) {
    console.error('Erro em /api/block:', err);
    return res.status(500).json({ error: 'Falha interna ao atualizar bloco.' });
  }
}
