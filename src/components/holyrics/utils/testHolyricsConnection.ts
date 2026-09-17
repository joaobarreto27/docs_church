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
    const separator = base.includes('?') ? '&' : '?';
    const testEndpoint = `${base}/view/text.json${separator}ngrok-skip-browser-warning=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(testEndpoint, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        success: true,
        message: 'Conexão confirmada com sucesso! Holyrics respondendo perfeitamente.'
      };
    }
    return {
      success: false,
      message: `Servidor retornou status HTTP ${res.status}. Verifique se o Holyrics está ativo.`
    };
  } catch (_) {
    return {
      success: false,
      message: 'Não foi possível conectar. Verifique se o ngrok e o Holyrics estão abertos.'
    };
  }
}
