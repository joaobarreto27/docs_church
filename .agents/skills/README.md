# Skills Disponíveis

Catálogo de skills customizadas do projeto **smart_finance_tracker**.

Skills são extensões que ampliam as capacidades do agente para tarefas especializadas. Cada skill possui instruções (`SKILL.md`), referências (`references/`) e exemplos (`examples/`).

---

## Skills de Desenvolvimento

| Skill | Descrição | Trigger |
|-------|-----------|---------|
| [`prompt-engineer`](./prompt-engineer/SKILL.md) | Transforma input informal em prompt determinístico e completo | `/prompt` |
| [`design-patterns`](./design-patterns/SKILL.md) | Guia de patterns com exemplos concretos do projeto | `/patterns` |
| [`doc-generator`](./doc-generator/SKILL.md) | Gera PRDs e documentos de fase no formato Staff-level | `/doc` |
| [`refactoring-planner`](./refactoring-planner/SKILL.md) | Plano de refatoração por fases + decomposição + auditoria | `/refactor-plan` |
| [`category-management`](./category-management/SKILL.md) | Análise e migração de categorias de transações | — |

## Skills de Frontend, UI/UX & Arquitetura React 19

| Skill | Descrição | Trigger |
|-------|-----------|---------|
| [`frontend-director`](./frontend-director/SKILL.md) | **Orquestrador Mestre** de UI/UX, Design de Elite e Engenharia React | `/director`, `/frontend` |
| [`vercel-composition-patterns`](./vercel-composition-patterns/SKILL.md) | Padrões de composição React 19, compound components e desacoplamento de estado | — |
| [`web-design-guidelines`](./web-design-guidelines/SKILL.md) | Checklist e auditoria linter de regras de interface web da Vercel | — |
| [`high-end-visual-design`](./high-end-visual-design/SKILL.md) | Superfícies de luxo, Liquid Glass e tokens Apple/grafite | — |
| [`ui-ux-pro-max`](./ui-ux-pro-max/SKILL.md) | Ergonomia tátil, densidade de dados e micro-interações | — |
| [`impeccable`](./impeccable/SKILL.md) | Quality Gate, paridade Dark/Light e craft de agência | — |
| [`design-taste-frontend`](./design-taste-frontend/SKILL.md) | Anti-slop frontend e direção de arte intencional | — |
| [`frontend-design`](./frontend-design/SKILL.md) | Design intencional sem presets genéricos | — |
| [`imagegen-frontend-web`](./imagegen-frontend-web/SKILL.md) | Mockups conceituais web via IA | — |
| [`imagegen-frontend-mobile`](./imagegen-frontend-mobile/SKILL.md) | Mockups conceituais mobile via IA | — |

## Skills Caveman (Compressão de Output)

| Skill | Descrição | Trigger |
|-------|-----------|---------|
| [`caveman`](./caveman/SKILL.md) | Modo de comunicação ultra-comprimido (65% menos tokens) | `/caveman` |
| [`cavecrew`](./cavecrew/SKILL.md) | Delegação para subagentes comprimidos | — |
| [`caveman-commit`](./caveman-commit/SKILL.md) | Commits convencionais comprimidos | `/commit` |
| [`caveman-compress`](./caveman-compress/SKILL.md) | Comprime arquivos de memória | `/caveman-compress` |
| [`caveman-help`](./caveman-help/SKILL.md) | Referência rápida dos comandos caveman | `/caveman-help` |
| [`caveman-review`](./caveman-review/SKILL.md) | Code review ultra-comprimido | `/review` |
| [`caveman-stats`](./caveman-stats/SKILL.md) | Estatísticas de uso de tokens | `/caveman-stats` |

## Skills de Monitoramento

| Skill | Descrição | Trigger |
|-------|-----------|---------|
| [`token-guard`](./token-guard/SKILL.md) | Monitoramento de custos de tokens | — |

---

## Detalhes das Skills de Desenvolvimento

### prompt-engineer

Recebe um input informal (ex: "quero filtrar por banco") e gera um prompt estruturado com **ROLE**, **CONTEXTO**, **OBJETIVO**, **DIRETRIZES DE ARQUITETURA**, **REQUISITOS PASSO A PASSO** e **RESTRIÇÕES** — pronto para execução precisa por IA.

**Integração:** Consulta automaticamente a skill `design-patterns` para injetar os patterns corretos no prompt gerado (Repository, Strategy, Reducer, etc.) com base no tipo da demanda.

**Referências incluídas:**
- Template genérico de prompt
- 3 exemplos categorizados: frontend, fullstack, bugfix
- Formato PRD para features complexas
- Regras de injeção de patterns

---

### design-patterns

Referência de **7 Design Patterns** com implementações concretas para Next.js/TypeScript:

| Pattern | Quando usar |
|---------|-------------|
| **Repository** | Desacoplar acesso a dados (Prisma) das actions |
| **Strategy + Factory** | Lógica que varia por tipo (parsers, gateways) |
| **Reducer** | 3+ useState inter-relacionados |
| **Composition** | Decompor componentes monolíticos |
| **Custom Hooks** | Data fetching + loading/error reutilizável |
| **Barrel Export** | Organizar imports em módulos multi-arquivo |

Cada pattern inclui: **problema**, **solução completa com código**, **antes/depois**, e **quando NÃO usar**.

---

### doc-generator

Gera documentação técnica Staff-level em dois modos:

- **`prd`** — Product Requirements Document com role, restrições críticas, diretrizes de arquitetura, passo a passo, e formato de saída
- **`phase`** — Documento de fase com 7 seções padronizadas (Objetivo → Escopo → Padrões → Passo a Passo → Antes/Depois → Anomalias → Critérios de Aceite)

**Meta de qualidade:** 300-475 linhas por documento, 5+ referências a código real, 2+ pares antes/depois.

---

### refactoring-planner

Analisa codebases e gera planos de refatoração modulares. Três modos:

- **`plan`** — PRD completo + fases sequenciais e autônomas com antes/depois
- **`decompose`** — Analisa e decompõe arquivos monolíticos (1000+ linhas) em módulos menores preservando comportamento
- **`audit`** — Cataloga anomalias de regras de negócio sem corrigi-las, apenas documentando para decisão da equipe

**Referências incluídas:** 4 exemplos completos de fases, workflow de decomposição, catálogo de anomalias, checklist SOLID, e métricas reais.

---

### category-management

Análise e migração de categorias de transações no banco SQLite. Inclui scripts para:
- Analisar padrões de transações (`scripts/deep-analyze.ts`)
- Migrar categorias em lote (`scripts/migrate-categories.ts`)
