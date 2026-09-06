# Template de Fase — Documento de Implementação

## Estrutura das 7 Seções

```markdown
# Plano de [Refatoração/Implementação] - Fase [X]: [NOME DA FASE]

## 1. Objetivo da Fase
- [Descrição clara do objetivo principal (2-3 linhas)]
- **Impacto esperado:**
  - [Métrica concreta 1: ex: "Eliminação de 3 funções duplicadas"]
  - [Métrica concreta 2: ex: "Redução de ~200 linhas duplicadas"]
  - [Métrica concreta 3: ex: "Barrel exports simplificam imports"]

---

## 2. Escopo de Arquivos Afetados

### Arquivos que serão criados:
- `caminho/do/novo-arquivo-1.ts` — [breve descrição]
- `caminho/do/novo-arquivo-2.tsx` — [breve descrição]

### Arquivos que serão modificados:
- `caminho/do/arquivo-existente.ts` — [o que muda: "Remover definições locais, importar de X"]

### Arquivos que serão removidos (se aplicável):
- `caminho/do/arquivo-legado.ts` — [motivo: "Substituído por módulos em X/"]

---

## 3. Padrões e Princípios Aplicados
- **[Princípio/Pattern 1]:** [Como se aplica nesta fase]
- **[Princípio/Pattern 2]:** [Como se aplica nesta fase]
- **[Princípio/Pattern 3]:** [Como se aplica nesta fase]

---

## 4. Passo a Passo Técnico de Implementação

### 4.1. [Ação 1 — título descritivo]
[Instruções detalhadas com referências a linhas do código.]
[Se relevante, incluir bloco de código com a implementação proposta.]

### 4.2. [Ação 2 — título descritivo]
[Instruções detalhadas...]

### 4.N. [Ação N]
[...]

---

## 5. Exemplo de Código (Antes vs. Depois)

### Antes:
\```typescript
// === arquivo.ts (linhas X-Y) — [descrição do problema] ===
[código legado/problemático]
\```

### Depois:
\```typescript
// === novo-arquivo.ts — [descrição da solução] ===
[código refatorado preservando regra de negócio]
\```

---

## 6. Apontamento de Anomalias em Regras de Negócio (Se houver)

> *Preencha apenas se identificar quebras, inconsistências ou bugs na regra atual.*

- **Arquivo / Trecho:** `caminho/do/arquivo.ts:linha`
- **Descrição do Problema:** [Inconformidade encontrada]
- **Impacto no Usuário:** [Como afeta o comportamento visível]
- **Ação Recomendada:** [Decisão que a equipe precisa tomar]

---

## 7. Critérios de Aceite e Verificação
- [ ] [Critério 1: Comportamento funcional mantido 100% idêntico]
- [ ] [Critério 2: Build passa sem erros (`npm run build`)]
- [ ] [Critério 3: Específico da fase — ex: "Nenhuma duplicação entre X e Y"]
- [ ] [Critério 4: Específico da fase]
- [ ] [Critério 5: Específico da fase]
```

---

## Instruções de Preenchimento

### Seção 1 (Objetivo)
- Descreva O QUE muda e POR QUÊ, não COMO (isso vai na seção 4)
- Inclua métricas quantificáveis: linhas reduzidas, duplicações eliminadas, módulos criados

### Seção 2 (Escopo)
- Liste TODOS os arquivos — não omita nenhum
- Separe entre criados, modificados, e removidos
- Para cada arquivo, explique em 1 frase o que ele faz ou o que muda nele

### Seção 4 (Passo a Passo)
- Numere com `4.1`, `4.2`, etc.
- Referencie linhas exatas do código atual: "Extrair linhas 23-67 de `actions.ts`"
- Inclua interfaces TypeScript completas quando novos tipos são criados
- Inclua blocos de código para implementações não-triviais

### Seção 5 (Antes/Depois)
- Mostre código REAL, não pseudo-código
- Marque com comentários o que era problemático (❌) e o que é solução (✅)
- Pelo menos 1 par antes/depois; ideal 2-3 pares

### Seção 6 (Anomalias)
- Se não encontrar anomalias, escreva: "> Nenhuma anomalia identificada nesta fase."
- Se encontrar, NUNCA proponha correção — apenas documente para decisão da equipe

### Seção 7 (Critérios)
- Sempre incluir: "Build passa" e "Comportamento funcional mantido"
- Adicionar 3-5 critérios específicos da fase
- Usar checkbox markdown `- [ ]` para facilitar tracking
