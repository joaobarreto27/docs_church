export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = String(req.query?.url || req.body?.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
  }

  let cleanBase = rawUrl.replace(/\/$/, '');
  cleanBase = cleanBase.replace(/\/view\/text(\.json)?$/, '');
  cleanBase = cleanBase.replace(/\/view\/widescreen$/, '');
  cleanBase = cleanBase.replace(/\/view$/, '');

  const endpoint = `${cleanBase}/view/text.json`;

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
