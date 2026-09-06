---
name: refactoring-planner
description: >
  Analisa codebases e gera planos de refatoração modulares por fases. Três modos:
  plan (PRD + fases sequenciais), decompose (decompor arquivos monolíticos em módulos),
  audit (catalogar anomalias de regras de negócio). Trigger: /refactor-plan, "decompor arquivo",
  "verificar anomalias".
---

# Refactoring Planner — Planejador de Refatoração por Fases

## Quando Usar

Acione esta skill quando o usuário pedir para:
- Planejar uma refatoração de codebase
- Decompor um arquivo grande em módulos menores
- Auditar regras de negócio em busca de anomalias
- Criar plano de migração arquitetural

**Triggers:** `/refactor-plan`, "planejar refatoração", "decompor monolito", "decompor arquivo", "arquivo muito grande", "verificar anomalias", "auditar regras de negócio"

---

## Modo 1: `plan` (Padrão)

Gera um plano de refatoração completo com PRD + fases incrementais.

### Workflow

1. **Análise do Codebase:**
   - Contar linhas dos arquivos principais (`wc -l`)
   - Identificar duplicações (`grep` por funções com mesmo nome em múltiplos arquivos)
   - Mapear acoplamento (imports diretos a implementações vs. abstrações)
   - Listar componentes/funções por arquivo

2. **Gerar PRD:**
   - Seguir template em `references/prd-template.md`
   - Definir restrição crítica (geralmente: preservar regras de negócio)
   - Listar patterns obrigatórios baseados na análise

3. **Dividir em Fases:**
   - Ordenar por dependência (tipos/utils primeiro, UI por último)
   - Cada fase deve ser autônoma: pode ser implementada e testada independentemente
   - Padrão recomendado de ordenação:
     1. Tipos e utilitários compartilhados
     2. Camada de dados (repositories, parsers)
     3. Decomposição de componentes UI
     4. Decomposição de sub-componentes + hooks
     5. Infraestrutura (tema, auth, segurança)
     6. Operacional (Docker, CI/CD, cloud)

4. **Documentar Cada Fase:**
   - Seguir template em `references/phase-template.md`
   - Meta: 300-475 linhas por fase
   - Salvar em `docs/[feature]/fases/fase-[NUM]-[nome].md`

### Referências
- `references/prd-template.md` — Template do PRD
- `references/phase-template.md` — Template das 7 seções de fase
- `references/phase-example-types.md` — Exemplo: extração de tipos e utils
- `references/phase-example-data-layer.md` — Exemplo: repository + strategy
- `examples/before-after-metrics.md` — Métricas reais de refatoração

---

## Modo 2: `decompose`

Especializado em decompor um arquivo monolítico (1000+ linhas) em módulos menores sem alterar comportamento.

### Workflow

1. **Análise do Arquivo:**
   ```bash
   wc -l [arquivo]                    # contar linhas
   grep -n "function\|const.*=.*=>" [arquivo] | head -50  # listar funções
   grep -n "export" [arquivo]         # listar exports
   ```

2. **Mapear Componentes/Funções:**
   - Para cada componente/função: anotar linhas de início e fim, dependências, props
   - Agrupar por domínio/responsabilidade

3. **Propor Estrutura de Extração:**
   - Definir diretórios de destino
   - Para cada extração:
     - Bloco de código (linhas X-Y)
     - Interface de Props necessária
     - Dependências internas (imports que precisam ser atualizados)
     - Barrel export atualizado

4. **Gerar Checklist de Verificação:**
   - [ ] Arquivo original reduzido para ≤ N linhas
   - [ ] Cada componente extraído em arquivo próprio
   - [ ] Build passa sem erros
   - [ ] Comportamento funcional idêntico

### Referências
- `references/decomposition-workflow.md` — Workflow passo a passo detalhado
- `references/phase-example-ui-decomp.md` — Exemplo: decomposição de page.tsx (6641 → 150 linhas)

---

## Modo 3: `audit`

Identifica e cataloga anomalias de regras de negócio sem corrigi-las.

### Workflow

1. **Análise Sistemática:**
   - Procurar filtros que ocultam dados silenciosamente
   - Procurar valores hardcoded que deveriam ser configuráveis
   - Comparar lógica duplicada entre arquivos para diferenças sutis
   - Verificar tipos que não refletem todos os estados possíveis

2. **Para Cada Anomalia, Documentar:**
   ```markdown
   ### Anomalia [N]: [Título Descritivo]
   - **Arquivo / Trecho:** `caminho/do/arquivo.ts:linha`
   - **Descrição do Problema:** [O que está errado ou inconsistente]
   - **Impacto no Usuário:** [Como isso afeta o comportamento visível]
   - **Código Atual:**
     ```typescript
     // trecho do código problemático
     ```
   - **Ação Recomendada:** [O que a equipe deve decidir — NÃO a correção]
   ```

3. **Regra Inviolável:**
   > **NUNCA corrija uma anomalia de regra de negócio unilateralmente.**
   > Apenas documente. A decisão de corrigir é da equipe/usuário.

4. **Salvar Catálogo:**
   - `docs/[feature]/anomalias-regras-de-negocio.md`

### Referências
- `references/anomaly-catalog-example.md` — Exemplo de catálogo com anomalias reais
- `references/solid-checklist.md` — Checklist SOLID para identificar code smells

---

## Regras Gerais (todos os modos)

1. **Preservação de regras de negócio:** Sempre inviolável em refatoração
2. **Fases autônomas:** Cada fase pode ser implementada e testada isoladamente
3. **Referências a código real:** Linhas, nomes, interfaces — nunca placeholders
4. **Quantificação:** Sempre incluir métricas (linhas antes/depois, duplicações eliminadas)
5. **Integração com `design-patterns`:** Consultar patterns aplicáveis em cada fase
6. **Integração com `doc-generator`:** Usar templates de fase e PRD para documentação

---

## Referências

### Templates
- `references/prd-template.md` — Template do PRD
- `references/phase-template.md` — Template das 7 seções

### Exemplos de Fases
- `references/phase-example-types.md` — Fase 01: Tipos e utilitários
- `references/phase-example-data-layer.md` — Fase 02: Repository + Strategy
- `references/phase-example-ui-decomp.md` — Fase 03: Decomposição UI
- `references/phase-example-hooks.md` — Fase 04: Custom hooks + Reducer

### Workflows
- `references/decomposition-workflow.md` — Como decompor monolitos
- `references/anomaly-catalog-example.md` — Catálogo de anomalias

### Checklists
- `references/solid-checklist.md` — SOLID + Clean Code
- `examples/before-after-metrics.md` — Métricas de projetos reais
