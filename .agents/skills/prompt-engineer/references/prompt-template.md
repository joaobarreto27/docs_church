# Template Genérico de Prompt Determinístico

Este template é a estrutura-base para gerar prompts de funcionalidades. Adapte conforme o tipo de demanda.

---

## Estrutura Completa

```markdown
# [Título descritivo — ex: "Filtro de Transações por Banco na Listagem Mensal"]

Atue como um [ROLE].

CONTEXTO:
[Estado atual do código. Inclua:
- Caminho do arquivo principal (ex: `src/app/page.tsx`)
- Nome do componente afetado (ex: `MonthlyView`)
- Variáveis de estado relevantes (ex: `filteredTransactions`, `totalGastoSum`)
- Dados disponíveis em memória e suas estruturas
- Stack do projeto (ex: Next.js, React, TypeScript, Tailwind CSS, Prisma)]

OBJETIVO:
[O que deve ser feito + por quê, em 2-3 frases.]

DIRETRIZES DE ARQUITETURA:
[SEÇÃO CONDICIONAL — só incluir se patterns se aplicam. Formato:]
- **[Pattern Name]:** [Onde e como aplicar neste caso específico]
- **[Pattern Name]:** [...]

REQUISITOS DETERMINÍSTICOS PASSO A PASSO:

1. [CATEGORIA DA AÇÃO — ex: IMPORTAÇÃO DE DEPENDÊNCIAS]:
   - [Instrução específica com nomes reais]

2. [CATEGORIA DA AÇÃO — ex: CONTROLE DE ESTADO]:
   - [Declaração exata do hook com tipos TypeScript]

3. [CATEGORIA DA AÇÃO — ex: PROCESSAMENTO DE DADOS]:
   - [Lógica detalhada: quais campos iterar, como calcular, como ordenar]

4. [CATEGORIA DA AÇÃO — ex: MODIFICAÇÃO DE UI]:
   - [Layout, classes Tailwind, posicionamento, responsividade]

5. [CATEGORIA DA AÇÃO — ex: RENDERIZAÇÃO CONDICIONAL]:
   - [Condição de exibição, estrutura do componente, estilos]

RESTRIÇÕES:
- [Preservação de regras existentes — ex: "NÃO faça chamadas à API"]
- [Design system — ex: "Use classes utilitárias do Tailwind dark:"]
- [TypeScript — ex: "Respeite tipagem, any permitido apenas em X"]
- [Escopo — ex: "Não altere funcionalidades adjacentes"]
- [Patterns — ex: "Acesse dados via Repository, não via Prisma direto"]
```

---

## Roles Comuns

| Tipo de Demanda | Role |
|-----------------|------|
| Feature de UI | `desenvolvedor Frontend especialista em React, TypeScript e Tailwind CSS` |
| Feature Fullstack | `desenvolvedor Fullstack com experiência em Next.js (React, TypeScript), Tailwind CSS e Prisma ORM (SQLite)` |
| Bugfix de TypeScript | Omitir role — ir direto ao problema técnico |
| Refatoração | `Engenheiro de Software Staff e Especialista em UI/UX` |

---

## Categorias de Passos Comuns

Use estas categorias para organizar os requisitos:

1. **IMPORTAÇÃO DE DEPENDÊNCIAS** — ícones, libs, componentes
2. **CONTROLE DE ESTADO** — useState, useReducer, useRef
3. **PROCESSAMENTO DE DADOS** — useMemo, cálculos, agrupamento, ordenação
4. **MODIFICAÇÃO DE COMPONENTE EXISTENTE** — alterar card, botão, header
5. **RENDERIZAÇÃO CONDICIONAL / NOVO COMPONENTE** — modal, tooltip, tabela
6. **VALIDAÇÃO** — regras de validação de formulário, limites
7. **INTEGRAÇÃO COM BACKEND** — server actions, Prisma, API
8. **FLUXO DE AÇÃO** — onClick, submit, interceptação

---

## Regras de Qualidade

- **Nomes reais, nunca placeholders:** Use `MonthlyView`, não `ComponenteX`
- **Linhas específicas quando possível:** "Localize a div por volta da linha 3986"
- **Tipos TypeScript completos:** Declare interfaces e tipos no prompt
- **Tailwind CSS explícito:** Especifique as classes, não "estilize adequadamente"
- **Restrições defensivas:** Sempre inclua pelo menos 3 restrições
