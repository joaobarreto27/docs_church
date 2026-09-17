# Plano de Implementação Holyrics - Fase 05: Integração no Púlpito e Validação

## 1. Objetivo da Fase
- Conectar o hook `useHolyricsSync` e os componentes visuais (`HolyricsOverlay` e `HolyricsReturnPill`) dentro da visão pastoral (`PulpitView.tsx`).
- Assegurar a transição sem esforço entre a visão do roteiro (duas folhas abertas) e a tela cheia da projeção no tablet do altar.
- Executar os testes rigorosos de compatibilidade com o **Android 4.4.4 KitKat** (Samsung Tab E) e auditoria de segurança pré-deploy.
- **Impacto esperado:**
  - Experiência litúrgica fluida para o pastor no altar, sem sustos ou quebras visuais.
  - Zero erros de compilação em pacotes legados gerados pelo `@vitejs/plugin-legacy`.
  - Conformidade estrita com o limite de linhas por arquivo e regras invioláveis do `AGENTS.md`.

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- *Nenhum arquivo novo será criado nesta fase (foco em orquestração e testes).*

### Arquivos que serão modificados:
- `src/components/pastor/PulpitView.tsx` — Integrar o hook `useHolyricsSync`, montagem condicional do `HolyricsOverlay` e do `HolyricsReturnPill`.

### Arquivos que serão removidos:
- *Nenhum arquivo será removido nesta fase.*

---

## 3. Padrões e Princípios Aplicados
- **Princípio "Púlpito Zen" (Anti-Poluição Visual):**
  - Quando a projeção não estiver ativa, a tela do pastor permanece limpa e serena, sem badges desnecessários.
  - Quando a projeção estiver ativa e minimizada, o Pill no rodapé fica fixado sem sobrepor o conteúdo das orações urgentes.
- **Compatibilidade Android 4.4.4 KitKat (Lei 5 do PRD):**
  - Nenhuma API moderna sem polyfill é injetada no ciclo de vida do Púlpito.
  - O `@vitejs/plugin-legacy` transpila o código para ES5 com os polyfills de `whatwg-fetch`, `abortcontroller` e `regenerator-runtime`.
- **Checklist Obrigatório Pré-Commit (Seção 6 do AGENTS.md):**
  - Tipagem estrita (`tsc --noEmit`), build de produção (`npm run build`) e varredura anti-vazamento no bundle público (`dist/`).

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. Importação e Invocação do Hook no `PulpitView.tsx`
No topo de `src/components/pastor/PulpitView.tsx`:
```typescript
import { useHolyricsSync } from '../../hooks/useHolyricsSync';
import { HolyricsOverlay, HolyricsReturnPill } from '../holyrics';
```
No corpo do componente:
```typescript
const {
  slide: holyricsSlide,
  isProjecting: isHolyricsProjecting,
  isMinimized: isHolyricsMinimized,
  dismiss: dismissHolyrics,
  restore: restoreHolyrics
} = useHolyricsSync(room?.holyrics_url);
```

### 4.2. Renderização da Camada em Tela Cheia
Logo antes do fechamento do container principal de `PulpitView.tsx`:
```tsx
{/* TELA CHEIA NATIVA DO TELÃO (QUANDO HOUVER PROJEÇÃO ATIVA E NÃO MINIMIZADA) */}
{isHolyricsProjecting && !isHolyricsMinimized && holyricsSlide && (
  <HolyricsOverlay
    slide={holyricsSlide}
    onMinimize={dismissHolyrics}
  />
)}

{/* BOTÃO FLUTUANTE DE RETORNO (QUANDO O PASTOR ESTIVER LENDO O ROTEIRO DURANTE A PROJEÇÃO) */}
{isHolyricsProjecting && isHolyricsMinimized && holyricsSlide && (
  <HolyricsReturnPill
    slide={holyricsSlide}
    onRestore={restoreHolyrics}
  />
)}
```

### 4.3. Verificação de Integridade em Dispositivos Antigos
1. Garantir que `fontScale` do púlpito não sofra interferência da projeção (a projeção calcula sua própria escala através de `fontScaling.ts`).
2. Testar o comportamento do botão `[✕ Ver Roteiro]` com eventos de toque (`onTouchStart` / `onClick`), garantindo resposta rápida em touchscreens resistivos ou capacitivos antigos.

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:
```tsx
// === src/components/pastor/PulpitView.tsx — Sem integração com o telão ===
return (
  <div className="min-h-screen bg-church-parchment flex flex-col justify-between">
    {/* Header do Púlpito */}
    {/* Duas Folhas de Oração e Visitantes */}
    {/* Rodapé com Zoom e Sair */}
  </div>
);
```

### Depois:
```tsx
// === src/components/pastor/PulpitView.tsx — Com alternância inteligente de projeção ===
return (
  <div className="min-h-screen bg-church-parchment flex flex-col justify-between relative">
    {/* Header do Púlpito */}
    {/* Duas Folhas de Oração e Visitantes */}
    {/* Rodapé com Zoom e Sair */}

    {/* Projeção Nativa em Tela Cheia (Escura Solene) */}
    {isHolyricsProjecting && !isHolyricsMinimized && holyricsSlide && (
      <HolyricsOverlay
        slide={holyricsSlide}
        onMinimize={dismissHolyrics}
      />
    )}

    {/* Pill Flutuante de Retorno */}
    {isHolyricsProjecting && isHolyricsMinimized && holyricsSlide && (
      <HolyricsReturnPill
        slide={holyricsSlide}
        onRestore={restoreHolyrics}
      />
    )}
  </div>
);
```

---

## 6. Apontamento de Anomalias em Regras de Negócio
> Nenhuma anomalia identificada. A sobreposição respeita a hierarquia de camadas (`z-index: 50` para overlay e `z-index: 40` para o pill) sem cobrir permanentemente alertas pastorais prioritários.

---

## 7. Critérios de Aceite e Verificação

Executar sequencialmente os 4 comandos do Security & Quality Gate:

1. **Validação de Tipagem TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   *(Critério: 0 erros encontrados).*

2. **Compilação do Bundle Moderno e Legado (KitKat):**
   ```bash
   npm run build
   ```
   *(Critério: Chunks legados gerados com sucesso na pasta `dist/assets/legacy/`).*

3. **Varredura Anti-Vazamento de Credenciais:**
   ```bash
   grep -rn "postgresql://" dist/ && grep -rn "npg_" dist/
   ```
   *(Critério: 0 ocorrências).*

4. **Auditoria de Linhas por Arquivo (AGENTS.md):**
   - Verificar que todos os arquivos criados e modificados permanecem abaixo de **200 linhas**.
