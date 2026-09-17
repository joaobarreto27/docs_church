import { sanitizeHolyricsBaseUrl } from './holyricsParser';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export async function testHolyricsEndpoint(rawUrl: string): Promise<ConnectionTestResult> {
  const base = sanitizeHolyricsBaseUrl(rawUrl);
  if (!base) {
    return { success: false, message: 'Digite um endereço antes de testar.' };
  }

  try {
    const testEndpoint = `/api/holyrics?url=${encodeURIComponent(base)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(testEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        success: true,
        message: 'Conexão confirmada com sucesso! Holyrics respondendo perfeitamente.'
      };
    }
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.error || `Servidor retornou status HTTP ${res.status}. Verifique se o Holyrics está ativo.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Não foi possível conectar. Verifique se o ngrok e o Holyrics estão abertos.'
    };
  }
}
