/**
 * Executa uma operação assíncrona com tentativas automáticas contra oscilações de rede (Wi-Fi de igreja).
 * Totalmente compatível com Android 4.4.4 KitKat e WebViews legadas.
 */
export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 2, delayMs = 350): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Helper seguro para requisições POST à API do servidor com suporte a Bearer token
 */
export async function postApi<T>(endpoint: string, payload: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data && (data.error || data.message)) errMsg = data.error || data.message;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

/**
 * Helper seguro para requisições GET à API do servidor
 */
export async function getApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint);
  if (!res.ok) {
    let errMsg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data && (data.error || data.message)) errMsg = data.error || data.message;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}
