---
name: prompt-engineer
description: >
  Transforma input informal/natural em prompts determinísticos e completos para
  desenvolvimento de funcionalidades. Integra-se com design-patterns para injetar
  diretrizes de arquitetura automaticamente. Trigger: /prompt, "gerar prompt",
  "prompt para funcionalidade".
---

# Prompt Engineer — Gerador de Prompts Determinísticos

## Quando Usar

Acione esta skill quando o usuário pedir para:
- Gerar um prompt para uma nova funcionalidade
- Transformar um requisito informal em especificação técnica
- Criar um prompt determinístico passo a passo
- Preparar instrução para outra IA executar com precisão

**Triggers:** `/prompt`, "gerar prompt", "prompt para funcionalidade", "escrever prompt determinístico"

---

## Workflow

### 1. Coletar Contexto do Codebase

Antes de gerar o prompt, investigue:
- Estrutura de pastas do projeto (`ls src/`)
- Stack tecnológica (`package.json`)
- Componentes/arquivos afetados pela demanda
- Variáveis de estado, hooks, props relevantes
- Nomes reais de funções, componentes, variáveis (nunca placeholders)

### 2. Classificar o Tipo de Demanda

| Tipo | Indicadores | Exemplos |
|------|-------------|----------|
| **Frontend Feature** | UI, componente, modal, botão, tooltip, tab | "Adicionar filtro por banco", "Criar modal de confirmação" |
| **Fullstack Feature** | Backend + frontend, banco de dados, server action | "Divisão personalizada de gastos", "Desmembrar lançamentos" |
| **Bugfix / Correção** | Erro de build, type error, fix | "Corrigir TypeScript error na linha X" |
| **Refatoração/Migração** | Mover código, extrair, decompor | "Extrair componente X para arquivo próprio" |

### 3. Consultar Design Patterns (Integração)

Leia o arquivo `../.agents/skills/design-patterns/SKILL.md` e seus `references/` para identificar quais patterns se aplicam à demanda:

| Se a demanda envolve... | Injete no prompt... |
|--------------------------|---------------------|
| Acesso a dados (CRUD, Prisma, API) | **Repository Pattern** — encapsular em repository |
| Lógica alternável (parsers, gateways, cálculos por tipo) | **Strategy Pattern** + **Factory** — interface + implementações + factory |
| Estado complexo de UI (3+ filtros, toggles, múltiplos controles) | **Reducer Pattern** — `useReducer` com `State` + `Action` types |
| Novo componente extraído de monolito | **Composition** — props interface, barrel export |
| Data fetching + loading + error | **Custom Hooks** — `useXxx()` encapsulando fetch + state |
| Novos arquivos em módulo existente | **Barrel Export** — atualizar `index.ts` |

> **Regra:** Se nenhum pattern se aplica (ex: bugfix simples), omita a seção DIRETRIZES DE ARQUITETURA do prompt.

### 4. Gerar o Prompt

Use o template abaixo. As seções marcadas com `[CONDICIONAL]` só devem aparecer quando aplicáveis.

```markdown
# [Título descritivo da funcionalidade]

Atue como um [ROLE — persona técnica apropriada].

CONTEXTO:
[Descreva o estado atual do código: onde vive, quais componentes/arquivos são afetados,
variáveis de estado existentes, dados disponíveis em memória. Use nomes REAIS do código.]

OBJETIVO:
[Resumo claro e direto do que deve ser feito, em 2-3 frases. Inclua o "porquê" do usuário.]

[CONDICIONAL] DIRETRIZES DE ARQUITETURA:
[Patterns injetados do passo 3. Para cada pattern aplicável, especifique:
- O pattern e por quê ele se aplica
- A interface/estrutura esperada
- Onde o código deve ser colocado (caminho de arquivo)]

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. [AÇÃO 1 — ex: IMPORTAÇÃO DE DEPENDÊNCIAS]:
   - [Sub-instrução detalhada com nomes reais de módulos/funções]

2. [AÇÃO 2 — ex: CONTROLE DE ESTADO]:
   - [Declaração exata do useState/useReducer com tipos]

3. [AÇÃO 3 — ex: PROCESSAMENTO DE DADOS]:
   - [Lógica de transformação detalhada com campos reais]

4. [AÇÃO N — ex: RENDERIZAÇÃO / UI]:
   - [Especificações de layout, classes CSS, componentes]

RESTRIÇÕES:
- [Preservação de regras de negócio existentes]
- [Compatibilidade com dark mode / design system]
- [Tipagem TypeScript rigorosa]
- [Não alterar funcionalidades adjacentes]
- [CONDICIONAL: Conformidade com patterns do projeto — ex: "use Repository, não acesse Prisma diretamente"]
```

### 5. Validar o Prompt

Antes de entregar, verifique:
- [ ] Todos os nomes de componentes, variáveis e arquivos são REAIS (não placeholders)
- [ ] Cada passo é independente e testável
- [ ] As restrições impedem efeitos colaterais indesejados
- [ ] Se patterns foram injetados, eles estão aplicados nos passos (não só na seção de diretrizes)
- [ ] O prompt pode ser executado por outra IA sem contexto adicional

---

## Referências

Consulte os arquivos em `references/` para exemplos e templates:

- **`prompt-template.md`** — Template genérico com todas as seções possíveis
- **`example-frontend-feature.md`** — 3 exemplos de prompts para features de UI
- **`example-fullstack-feature.md`** — 3 exemplos de prompts fullstack (DB + UI)
- **`example-bugfix.md`** — Exemplo de prompt para correção de erro
- **`prd-format.md`** — Formato PRD para features complexas/multi-fase
- **`pattern-injection-rules.md`** — Mapa completo: tipo de demanda → patterns a injetar

Consulte `examples/` para pares de input→output:
- **`input-output-pairs.md`** — Demonstra como transformar inputs informais em prompts completos
