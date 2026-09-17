import { StoredSession } from './types';

export const SESSION_KEY = 'docs_church_session';
export const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export function saveStoredSession(session: StoredSession): void {
  try {
    const raw = JSON.stringify(session);
    sessionStorage.setItem(SESSION_KEY, raw);
    localStorage.setItem(SESSION_KEY, raw);
    localStorage.setItem('docs_church_last_code', session.code);
    localStorage.setItem('docs_church_last_role', session.role);
  } catch (e) {}
}

export function clearStoredSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: StoredSession = JSON.parse(raw);
    const now = Date.now();
    // Se a sessão expirou (mais de 3 horas), remove imediatamente
    if (parsed.expiresAt && now > parsed.expiresAt) {
      clearStoredSession();
      return null;
    }
    if (parsed.code && parsed.role) {
      return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler sessionStorage/localStorage:', e);
  }
  return null;
}
