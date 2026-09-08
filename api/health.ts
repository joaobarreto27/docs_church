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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const dbUrl = getDatabaseUrl();
    const sql = neon(dbUrl);
    const result = await sql`SELECT 1 as connected, NOW() as server_time`;

    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      serverTime: result[0]?.server_time,
      runtime: 'vercel-serverless-node'
    });
  } catch (err: any) {
    console.error('Erro em /api/health:', err);
    const safeMsg = err?.message ? String(err.message).replace(/:[^:@]+@/, ':***@') : 'Erro desconhecido';
    return res.status(500).json({
      status: 'unhealthy',
      error: safeMsg
    });
  }
}
