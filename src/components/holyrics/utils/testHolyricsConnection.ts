export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export async function testHolyricsEndpoint(rawUrl: string): Promise<ConnectionTestResult> {
  const targetUrl = rawUrl.trim();
  if (!targetUrl) {
    return { success: false, message: 'Digite um endereço antes de testar.' };
  }

  try {
    const separator = targetUrl.includes('?') ? '&' : '?';
    const testEndpoint = `${targetUrl}/stage_view_data${separator}ngrok-skip-browser-warning=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(testEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        success: true,
        message: 'Conexão confirmada! Servidor Holyrics respondendo na porta 8081.'
      };
    }
    return {
      success: false,
      message: `Servidor retornou status HTTP ${res.status}. Verifique o endpoint.`
    };
  } catch (_) {
    return {
      success: false,
      message: 'Não foi possível conectar. Verifique se o ngrok e o Holyrics estão abertos.'
    };
  }
}
