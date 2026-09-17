# Plano de Implementação Holyrics - Fase 02: Hook useHolyricsSync

## 1. Objetivo da Fase
- Construir o custom hook `useHolyricsSync` em `src/hooks/useHolyricsSync.ts` para gerenciar a comunicação em tempo real com o servidor do Holyrics.
- Implementar transporte primário via **Push com WebSocket nativo**, blindando o aplicativo contra o Erro 99 da WAF no Android 4.4.4 KitKat.
- Implementar fallback resiliente com Smart Polling espaçado (3.5s a 5s) e temporizador em backoff exponencial.
- Fornecer controle de soberania pastoral: métodos `dismiss()` (minimizar) e `restore()` (voltar ao telão ativo).
- **Impacto esperado:**
  - Zero bloqueio por Erro 99 da WAF.
  - Latência sub-segundo (< 100ms) ao receber slides via WebSocket.
  - Consumo de CPU e RAM no tablet inferior a 1% em repouso.

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `src/hooks/useHolyricsSync.ts` — Custom hook React encapsulando o ciclo de vida do WebSocket, parsing seguro e estados locais.

### Arquivos que serão modificados:
- `src/hooks/index.ts` — Barrel export para exportação consistente do hook.

### Arquivos que serão removidos:
- *Nenhum arquivo será removido nesta fase.*

---

## 3. Padrões e Princípios Aplicados
- **Lei 6 de `/secure-architecture` (Consciência de WAF & Anti-DDoS):** Eliminação de requisições HTTP repetitivas em curto intervalo (1s-2s), substituídas por conexão única WebSocket.
- **Fail-Safe Silencioso:** Qualquer erro de conexão de rede, queda de Wi-Fi ou desligamento do PC do Holyrics é capturado silenciosamente com `catch`, mantendo o painel do culto operando sem alertas intrusivos.
- **Single Responsibility Principle (SRP):** Toda a complexidade de protocolo, conversão de protocolo (`http://` -> `ws://`, `https://` -> `wss://`), reconexão e timers reside exclusivamente neste hook.
- **Limite de Complexidade (AGENTS.md):** O arquivo é projetado para conter entre 110 e 150 linhas, respeitando com folga a barreira máxima de 200 linhas.

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Conversão Segura de Protocolos Web
Implementar função pura utilitária para mapear URLs HTTP(S) para WS(S):
```typescript
function buildHolyricsWebSocketUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://') + '/ws';
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://') + '/ws';
  }
  return `ws://${url}/ws`;
}
```

### 4.2. Estrutura de Retorno do Hook
O hook expõe uma interface limpa e reativa para os componentes de apresentação:
```typescript
export interface UseHolyricsSyncReturn {
  slide: HolyricsSlide | null;
  isProjecting: boolean;       // True se há texto ativo no telão
  isMinimized: boolean;        // True se o pastor minimizou a tela cheia
  isConnected: boolean;        // True se o socket ou endpoint está respondendo
  error: string | null;
  dismiss: () => void;         // Ação para minimizar
  restore: () => void;         // Ação para reabrir no slide atual
}
```

### 4.3. Ciclo de Vida do WebSocket com Backoff Exponencial
1. Se `holyricsUrl` for nulo ou vazio, o hook retorna imediatamente sem alocar recursos.
2. Iniciar conexão via `new WebSocket(wsUrl)`.
3. Ao receber mensagem (`ws.onmessage`), executar `JSON.parse` seguro do payload.
4. Ao fechar (`ws.onclose`) ou falhar (`ws.onerror`), programar tentativa de reconexão silenciosa com intervalo progressivo (3s, 6s, 12s até o teto de 30s).
5. No cleanup do `useEffect`, fechar o WebSocket adequadamente para evitar vazamentos de memória (*memory leaks*).

### 4.4. Fallback com Polling Espaçado Anti-WAF
Se o WebSocket for recusado (ex: servidor proxy intermediário que bloqueia upgrade de conexão), o hook ativa um fallback com requisições HTTP espaçadas (4000ms), utilizando o cabeçalho `ngrok-skip-browser-warning: true` e `AbortController` com timeout de 2.5s.

### 4.5. Gerenciamento do Estado Pastoral (`dismiss` & `restore`)
- Quando o pastor clica em minimizar: `setIsMinimized(true)`.
- Enquanto minimizado, o `slide` continua sendo atualizado na memória do hook sempre que o operador do Holyrics mudar de estrofe.
- Ao clicar em restaurar: `setIsMinimized(false)`. O componente reabre com o slide corrente.
- Se o operador limpar o telão (slide vazio): `setIsMinimized(false)` é resetado automaticamente, preparando o tablet para a próxima projeção.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:
```typescript
// === Abordagem Ingênua do Chat original — Polling agressivo de 1000ms gerando Erro 99 ===
setInterval(async () => {
  try {
    const res = await fetch(`${url}/stage_view_data?ngrok-skip-browser-warning=true`);
    const data = await res.json();
    // ❌ Disparava 60 requisições/minuto da WebView Android 4.4.4
    // ❌ Acionava WAF antibot e bloqueava o tablet no meio do culto com Erro 99
  } catch (e) {}
}, 1000);
```

### Depois:
```typescript
// === src/hooks/useHolyricsSync.ts — Push Nativo via WebSocket com Fallback Silencioso ===
useEffect(() => {
  if (!holyricsUrl) return;

  let ws: WebSocket | null = null;
  let reconnectTimeout: any = null;
  let delay = 3000;

  const connect = () => {
    try {
      const wsUrl = buildHolyricsWebSocketUrl(holyricsUrl);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const text = String(payload.text || '').trim();
          if (text) {
            setSlide({
              text,
              title: payload.title || undefined,
              slide_number: payload.slide_number,
              total_slides: payload.total_slides
            });
            setIsProjecting(true);
          } else {
            setSlide(null);
            setIsProjecting(false);
            setIsMinimized(false); // Reset automático ao limpar slide
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, delay);
        delay = Math.min(delay * 1.5, 30000); // Backoff anti-WAF
      };
    } catch (_) {
      // Fallback silencioso
    }
  };

  connect();

  return () => {
    if (ws) ws.close();
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
  };
}, [holyricsUrl]);
```

---

## 6. Apontamento de Anomalias em Regras de Negócio
> Nenhuma anomalia identificada. O protocolo preserva a integridade de dados e opera de forma transparente.

---

## 7. Critérios de Aceite e Verificação
- [ ] Hook inicializa em estado ocioso quando `holyrics_url` é nulo.
- [ ] Conexão WebSocket estabelecida com sucesso quando a URL for fornecida.
- [ ] Slide ativo atualiza o estado `isProjecting` para `true`.
- [ ] Ação `dismiss()` altera `isMinimized` para `true` sem interromper a recepção de novos slides em memória.
- [ ] Slide vazio (`text === ""`) reseta `isProjecting` e `isMinimized` para `false`.
- [ ] Desconexão de rede não dispara pop-ups e reconecta silenciosamente com backoff.
- [ ] Arquivo com menos de 160 linhas e verificação TypeScript sem erros (`npx tsc --noEmit`).
