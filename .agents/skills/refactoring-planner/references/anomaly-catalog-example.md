# Catálogo de Anomalias — Exemplo Real

Anomalias identificadas durante a análise do smart_finance_tracker. Documentadas sem correção — para decisão da equipe.

---

## Anomalia 1: Filtro que Oculta Transações Únicas

- **Arquivo / Trecho:** `src/app/actions.ts:1318-1319`
- **Descrição do Problema:** O filtro `.filter(item => item.count >= 2)` na função `syncUnmappedTransactions` oculta transações com ocorrência única (count === 1) da fila de parametrização. Gastos significativos pontuais nunca aparecem para o usuário mapear.
- **Impacto no Usuário:** Uma compra de R$5.000 em loja nova que ocorre apenas uma vez nunca aparece na fila de "De-Para", permanecendo como "OUTROS" para sempre.
- **Código Atual:**
  ```typescript
  const grouped = rawList
    .filter(item => item.count >= 2)  // ← transações únicas excluídas
    .sort((a, b) => b.count - a.count);
  ```
- **Ação Recomendada:** Mover filtro para a camada de apresentação (frontend). O repository deve persistir TODAS as transações sem mapeamento. A view pode oferecer filtros "Recorrentes (2+)" e "Todos".

---

## Anomalia 2: Tipo de Transação Sempre 'Crédito'

- **Arquivo / Trecho:** `src/app/actions.ts:259` (dentro de `parseCSVAction`)
- **Descrição do Problema:** O campo `type` é inicializado como `'Crédito'` para todos os bancos e nunca é derivado da coluna `Tipo` do CSV do Inter. Compras no débito ficam marcadas como crédito.
- **Impacto no Usuário:** Relatórios e filtros por "Crédito"/"Débito" não refletem a realidade. O usuário não consegue separar gastos de crédito vs. débito.
- **Código Atual:**
  ```typescript
  const type: 'Crédito' | 'Débito' = 'Crédito';  // ← hardcoded para todos
  ```
- **Ação Recomendada:** No `InterParser`, mapear a coluna `Tipo` do CSV para `'Crédito' | 'Débito'`. Requer análise dos valores possíveis na coluna `Tipo` do CSV do Inter.

---

## Formato de Documentação

Cada anomalia deve seguir este formato:

```markdown
## Anomalia [N]: [Título Descritivo]

- **Arquivo / Trecho:** `caminho/do/arquivo.ts:linha`
- **Descrição do Problema:** [O que está errado ou inconsistente]
- **Impacto no Usuário:** [Como afeta o comportamento visível]
- **Código Atual:**
  ```typescript
  // trecho do código problemático
  ```
- **Ação Recomendada:** [O que decidir — NÃO a correção]
```

---

## Regra Inviolável

> **NUNCA corrija uma anomalia de regra de negócio sem aprovação explícita.**
> O papel desta skill é IDENTIFICAR e DOCUMENTAR, nunca CORRIGIR.
> A decisão de corrigir é do usuário/equipe.
