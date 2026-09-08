import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Obtém a URL do banco exclusivamente das variáveis de ambiente privadas do servidor
function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL não configurada no ambiente do servidor.');
  }

  let url = raw.trim();
  if (url.startsWith('DATABASE_URL=')) {
    url = url.substring('DATABASE_URL='.length).trim();
  } else if (url.startsWith('VITE_DATABASE_URL=')) {
    url = url.substring('VITE_DATABASE_URL='.length).trim();
  }
  url = url.replace(/^["']+|["']+$/g, '').trim();

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error('DATABASE_URL inválida.');
  }

  return url;
}

// Inicializa a instância SQL serverless sob demanda (lazy) para evitar erros em build estático
let _cachedUrl = '';
let _sqlInstance: any = null;
export function getSql() {
  const currentUrl = getDatabaseUrl();
  if (!_sqlInstance || _cachedUrl !== currentUrl) {
    _cachedUrl = currentUrl;
    _sqlInstance = neon(currentUrl);
  }
  return _sqlInstance;
}

export const sql = ((...args: any[]) => {
  return (getSql() as any)(...args);
}) as ReturnType<typeof neon>;

// Chave secreta de servidor para assinatura de tokens de sessão do controlador
const TOKEN_SECRET = process.env.SESSION_SECRET || 'docs_church_sec_token_k982_adutinga_congresso_2026';

/**
 * Assina um token de sessão de controlador usando HMAC-SHA256
 */
export function signControllerToken(roomId: string, pin: string): string {
  const payload = {
    roomId,
    pinHash: crypto.createHash('sha256').update(pin.trim()).digest('hex'),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 12 // 12 horas de validade máxima
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Valida o token de sessão do controlador
 */
export function verifyControllerToken(token: string | null | undefined, roomId: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');

  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.roomId !== roomId) return false;
    if (payload.expiresAt && Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}
