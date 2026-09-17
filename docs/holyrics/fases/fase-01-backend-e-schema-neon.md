# Plano de Implementação Holyrics - Fase 01: Backend e Schema Neon

## 1. Objetivo da Fase
- Expandir o schema relacional da tabela `rooms` no PostgreSQL Neon para persistir o endpoint do Holyrics (`holyrics_url`).
- Implementar a rota serverless parametrizada `update-holyrics-url` no backend com prepared statements e validação estrita de token HMAC-SHA256 do Controlador.
- Garantir a persistência perpétua da URL durante a reciclagem litúrgica (`reset-service`), para que a igreja não precise reconfigurar o link todo domingo.
- **Impacto esperado:**
  - Zero necessidade de reconfiguração de URL nos cultos futuros.
  - Blindagem total contra IDOR e injeção SQL através de prepared statements.
  - Tipagem estrita em TypeScript sincronizada entre frontend e backend.

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `src/types/holyrics.ts` — Definições de tipos TypeScript do slide, payload JSON e status de conexão.

### Arquivos que serão modificados:
- `src/types/liturgy.ts` — Adicionar propriedade `holyrics_url?: string | null` na interface `Room`.
- `api/room.ts` — Incluir migração inline de coluna, projeção explícita no SELECT de salas, handler da ação `update-holyrics-url` e preservação em `reset-service`.

### Arquivos que serão removidos:
- *Nenhum arquivo será removido nesta fase.*

---

## 3. Padrões e Princípios Aplicados
- **Lei 1 e 2 de `/secure-architecture` (Zero Secrets & Zero Proxies SQL):** Toda mutação ocorre através de rotas fechadas de negócio via Prepared Statements (`$1`, `$2`), sem expor credenciais no bundle público.
- **Lei 3 de `/secure-architecture` (Fim da Autorização Visual):** A alteração da URL do Holyrics exige validação criptográfica no servidor via `verifyControllerToken()` ou conferência de hash do PIN.
- **Lei 4 de `/secure-architecture` (Projeção Mínima Explícita):** A coluna `holyrics_url` é explicitamente selecionada nas queries, sem recorrer a `SELECT *` que poderia vazar segredos.
- **Single Responsibility Principle (SRP):** Os tipos específicos do Holyrics são isolados em `src/types/holyrics.ts`, mantendo `liturgy.ts` focado no domínio litúrgico da congregação.

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Criação das Tipagens Oficiais (`src/types/holyrics.ts`)
Criar o arquivo com as interfaces do payload recebido do software Holyrics:
```typescript
export type HolyricsSlideType = 'music' | 'bible' | 'announcement' | 'text';

export interface HolyricsSlide {
  text: string;
  title?: string;
  author?: string;
  slide_number?: number;
  total_slides?: number;
  type?: HolyricsSlideType;
  updated_at?: number;
}

export interface HolyricsConnectionState {
  url: string | null;
  isConnected: boolean;
  isProjecting: boolean;
  currentSlide: HolyricsSlide | null;
  error: string | null;
}
```

### 4.2. Atualização da Interface `Room` (`src/types/liturgy.ts`)
Nas linhas 58-70 de `src/types/liturgy.ts`, estender a interface `Room`:
```typescript
export interface Room {
  id: string;
  code: string;
  title: string;
  service_date: string;
  controller_pin?: string;
  active_alert: string | null;
  current_page: number;
  version: number;
  status: 'active' | 'archived';
  holyrics_url?: string | null; // Adicionado para persistência do telão
  created_at?: string;
  updated_at?: string;
}
```

### 4.3. Migração Inline e Projeção Explícita (`api/room.ts`)
1. No bloco de inicialização de tabelas (linhas 200-240), adicionar a instrução DDL segura:
```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS holyrics_url TEXT DEFAULT NULL;
```
2. Em todas as queries de busca de sala (`SELECT id, code, title, ...`), adicionar explicitamente a coluna `holyrics_url` na lista de campos projetados.

### 4.4. Implementação da Ação `update-holyrics-url` (`api/room.ts`)
Criar a ação administrativa com validação rigorosa de payload:
1. Validar se o token do controlador é válido através de `authorizeController(roomId, token, pin)`.
2. Sanitizar a URL recebida (máximo de 255 caracteres; deve iniciar com `http://` ou `https://` ou ser string vazia para limpar).
3. Executar o UPDATE parametrizado no PostgreSQL:
```typescript
if (action === 'update-holyrics-url') {
  const isAuthorized = await authorizeController(roomId, token, pin);
  if (!isAuthorized) {
    return res.status(401).json({ success: false, error: 'Acesso não autorizado ao controlador.' });
  }

  const rawUrl = String(body.url ?? '').trim();
  const holyricsUrl = rawUrl ? rawUrl.slice(0, 255) : null;

  if (holyricsUrl && !holyricsUrl.startsWith('http://') && !holyricsUrl.startsWith('https://')) {
    return res.status(400).json({ success: false, error: 'URL do Holyrics inválida (deve iniciar com http:// ou https://).' });
  }

  await sql`
    UPDATE rooms 
    SET holyrics_url = ${holyricsUrl}, version = version + 1, updated_at = NOW()
    WHERE id::text = ${roomId}
  `;
  return res.status(200).json({ success: true, holyrics_url: holyricsUrl });
}
```

### 4.5. Preservação em `reset-service` (`api/room.ts`)
Nas linhas 410-435 de `api/room.ts`, verificar o handler `reset-service` e certificar-se de que `holyrics_url` **NÃO** seja sobreescrito como `NULL`, mantendo o vínculo configurado pela igreja intacto.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:
```typescript
// === api/room.ts (linhas 410-416) — reset-service limpava todo o estado da sala sem suporte a Holyrics ===
if (action === 'reset-service') {
  const title = String(body.title || 'Culto de Celebração').trim().slice(0, 100);
  await sql`
    UPDATE rooms 
    SET title = ${title}, active_alert = NULL, current_page = 1, version = version + 1, updated_at = NOW()
    WHERE id::text = ${roomId}
  `;
  // ... reseta blocos litúrgicos ...
}
```

### Depois:
```typescript
// === api/room.ts — holyrics_url é preservado durante o reset de culto ===
if (action === 'reset-service') {
  const title = String(body.title || 'Culto de Celebração').trim().slice(0, 100);
  await sql`
    UPDATE rooms 
    SET title = ${title}, active_alert = NULL, current_page = 1, version = version + 1, updated_at = NOW()
    WHERE id::text = ${roomId}
    -- holyrics_url NÃO é resetado: a igreja herda a configuração no próximo culto!
  `;
  // ... reseta blocos litúrgicos ...
}
```

---

## 6. Apontamento de Anomalias em Regras de Negócio
> Nenhuma anomalia identificada no schema atual. A adição é retrocompatível e não quebra salas existentes sem `holyrics_url` (valor padrão é `NULL`).

---

## 7. Critérios de Aceite e Verificação
- [ ] Interface `Room` compilando com `holyrics_url?: string | null`.
- [ ] Coluna `holyrics_url` adicionada no Neon sem quebra de dados preexistentes.
- [ ] Rota `update-holyrics-url` rejeita requisições sem token do controlador com status `401 Unauthorized`.
- [ ] Rota `update-holyrics-url` atualiza com sucesso e incrementa a `version` da sala.
- [ ] Ação `reset-service` limpa blocos mas preserva a `holyrics_url`.
- [ ] Verificação de tipos limpa: `npx tsc --noEmit` executando com 0 erros.
