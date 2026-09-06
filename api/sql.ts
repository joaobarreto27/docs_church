export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const rawConn = req.headers.get('neon-connection-string') 
      || process.env.DATABASE_URL 
      || process.env.VITE_DATABASE_URL 
      || 'postgresql://neondb_owner:npg_lCE6u9gIqOXc@ep-super-field-au3e58we-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';

    // Extrai o host do Neon da string de conexão
    const match = rawConn.match(/@([^/:]+)/);
    const host = match ? match[1] : 'ep-super-field-au3e58we-pooler.c-10.us-east-1.aws.neon.tech';

    const forwardHeaders: Record<string, string> = {
      'content-type': 'application/json',
      'neon-raw-text-output': 'true',
      'neon-array-mode': 'true',
    };

    if (rawConn) {
      forwardHeaders['neon-connection-string'] = rawConn;
    }

    const body = await req.text();

    const neonRes = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: forwardHeaders,
      body,
    });

    const data = await neonRes.text();

    return new Response(data, {
      status: neonRes.status,
      headers: {
        'Content-Type': neonRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro de conexão no proxy Neon' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
