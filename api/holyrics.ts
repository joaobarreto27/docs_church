import { neon } from '@neondatabase/serverless';

/**
 * Proxy serverless seguro para o Holyrics.
 * - Caixa Preta: busca a holyrics_url no Postgres Neon a partir do roomId.
 * - O frontend (pastor/controlador) NUNCA recebe ou envia a URL no tráfego de produção.
 * - Valida whitelist estrita de hostnames permitidos (anti-SSRF).
 */

const ALLOWED_HOSTNAME_PATTERNS = [
  /^localhost$/,
  /^127\.0\.0\.1$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /\.ngrok-free\.dev$/,
  /\.ngrok\.io$/,
  /\.ngrok\.app$/,
];

function isAllowedUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return ALLOWED_HOSTNAME_PATTERNS.some((re) => re.test(parsed.hostname));
  } catch {
    return false;
  }
}

function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || 
              process.env.POSTGRES_URL || 
              process.env.NEON_DATABASE_URL || 
              process.env.DATABASE_URL_UNPOOLED ||
              process.env.VITE_DATABASE_URL;
  if (!raw) return '';
  let url = raw.trim();
  if (url.startsWith('DATABASE_URL=')) url = url.substring('DATABASE_URL='.length).trim();
  else if (url.startsWith('POSTGRES_URL=')) url = url.substring('POSTGRES_URL='.length).trim();
  else if (url.startsWith('NEON_DATABASE_URL=')) url = url.substring('NEON_DATABASE_URL='.length).trim();
  else if (url.startsWith('VITE_DATABASE_URL=')) url = url.substring('VITE_DATABASE_URL='.length).trim();
  return url.replace(/^["']+|["']+$/g, '').trim();
}

interface CacheEntry {
  url: string | null;
  expiresAt: number;
}

const roomUrlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30s de cache para evitar sobrecarga no Neon

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const roomId = String(req.query?.roomId || req.body?.roomId || '').trim();
  let targetUrl = String(req.query?.url || req.body?.url || '').trim();
  const forceFresh = req.query?.fresh === '1';

  // 1. Se roomId for fornecido, busca no cache ou consulta o banco Neon (Caixa Preta)
  if (roomId) {
    const cacheKey = roomId.toUpperCase();
    const cached = roomUrlCache.get(cacheKey);

    if (!forceFresh && cached && cached.expiresAt > Date.now()) {
      if (!cached.url) {
        return res.status(204).end();
      }
      targetUrl = cached.url;
    } else {
      try {
        const dbUrl = getDatabaseUrl();
        if (!dbUrl) {
          return res.status(500).json({ error: 'Configuração de banco indisponível no servidor.' });
        }
        const sql = neon(dbUrl);
        const roomRows = await sql`
          SELECT holyrics_url 
          FROM rooms 
          WHERE (id::text = ${roomId} OR UPPER(code) = ${cacheKey}) 
            AND status = 'active' 
          LIMIT 1
        `;

        const foundUrl = roomRows?.[0]?.holyrics_url ? String(roomRows[0].holyrics_url).trim() : null;
        roomUrlCache.set(cacheKey, {
          url: foundUrl,
          expiresAt: Date.now() + (foundUrl ? CACHE_TTL_MS : 10000)
        });

        if (!foundUrl) {
          return res.status(204).end(); // Sem projeção ativa para esta sala
        }
        targetUrl = foundUrl;
      } catch (err: any) {
        return res.status(500).json({ error: 'Erro ao consultar status da sala.' });
      }
    }
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Parâmetro roomId ou url é obrigatório.' });
  }

  let cleanBase = targetUrl.replace(/\/$/, '');
  cleanBase = cleanBase.replace(/\/view\/text(\.json)?$/, '');
  cleanBase = cleanBase.replace(/\/view\/widescreen$/, '');
  cleanBase = cleanBase.replace(/\/view$/, '');

  const endpoint = `${cleanBase}/view/text.json`;

  if (!isAllowedUrl(endpoint)) {
    return res.status(403).json({
      error: 'Domínio não permitido. Apenas localhost, rede local e ngrok são aceitos.'
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const upstream = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'ngrok-skip-browser-warning': 'any',
        'User-Agent': 'PainelDoCulto-Proxy/1.0'
      }
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Holyrics retornou status ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(502).json({
      error: 'Não foi possível conectar ao Holyrics ou ngrok',
      message: err.message
    });
  }
}
